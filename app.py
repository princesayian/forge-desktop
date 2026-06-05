"""
Superhero Forge — Desktop App
Local AI powered by Ollama. No API keys. No subscriptions.
Nocturnal Knights Character System · Remote & Local modes
"""

import os, sys, json, threading, time, socket, base64, io, subprocess, shutil, signal, atexit
import glob
import requests
from flask import Flask, Response, request, jsonify, send_from_directory, send_file, session, redirect, stream_with_context

# ---------------------------------------------------------------------------
# Paths & Constants
# ---------------------------------------------------------------------------
BASE        = os.path.dirname(os.path.abspath(__file__))
STATIC      = os.path.join(BASE, "static")
VENDOR      = os.path.join(BASE, "vendor")
CONFIG_FILE = os.path.join(BASE, "config.json")
DATA_DIR    = os.path.join(BASE, "data")
CHARACTERS_DIR = os.path.join(DATA_DIR, "characters")
TEAMS_DIR   = os.path.join(DATA_DIR, "teams")
STORIES_DIR = os.path.join(DATA_DIR, "stories")
IMAGES_DIR  = os.path.join(BASE, "images")
LOCK_FILE    = os.path.join(BASE, ".forge.lock")
STORAGE_FILE = os.path.join(BASE, "forge-data.json")

def _compute_version():
    try:
        count = int(subprocess.check_output(
            ["git", "rev-list", "--count", "HEAD"],
            cwd=BASE, stderr=subprocess.DEVNULL, text=True
        ).strip())
        if count < 100:
            return f"1.{count}"
        # At 100 commits roll into 3-part semver: 1.2.1, 1.2.2, ...
        return f"1.2.{count - 99}"
    except Exception:
        return "1.0"

FORGE_VERSION = _compute_version()

GROQ_KEY = ""
GROQ_MODELS = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"]
try:
    with open(os.path.join(BASE, ".env")) as _ef:
        for _line in _ef:
            _line = _line.strip()
            if _line.startswith("GROQ_API_KEY="):
                GROQ_KEY = _line.split("=", 1)[1].strip().strip('"').strip("'")
except FileNotFoundError:
    pass

def _load_store():
    for path in (STORAGE_FILE, STORAGE_FILE + ".tmp"):
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception:
            continue
    return {}

def _save_store(data):
    tmp = STORAGE_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, STORAGE_FILE)

TUNNEL_URL   = None
_TUNNEL_PROC = None
_DUCK_THREAD = None

# ---------------------------------------------------------------------------
# Config helpers
# ---------------------------------------------------------------------------
DEFAULTS = {
    "model": "llama3.2",
    "ollama_url": "http://localhost:11434",
    "ollama_api_key": "",
    "port": 7432,
}

def load_config():
    try:
        with open(CONFIG_FILE) as f:
            cfg = json.load(f)
        for k, v in DEFAULTS.items():
            cfg.setdefault(k, v)
        return cfg
    except Exception:
        return DEFAULTS.copy()

def save_config(data):
    cfg = load_config()
    cfg.update(data)
    with open(CONFIG_FILE, "w") as f:
        json.dump(cfg, f, indent=2)
    config.update(cfg)
    return cfg

config = load_config()

# Persistent secret key for Flask sessions
if "secret_key" not in config:
    config["secret_key"] = base64.b64encode(os.urandom(24)).decode()
    save_config(config)

# ---------------------------------------------------------------------------
# Data directories
# ---------------------------------------------------------------------------
for d in (CHARACTERS_DIR, TEAMS_DIR, STORIES_DIR, IMAGES_DIR):
    os.makedirs(d, exist_ok=True)

# ---------------------------------------------------------------------------
# Mode helpers
# ---------------------------------------------------------------------------
def _is_remote():
    """Return True if an API key is set (remote/OpenAI-compatible mode)."""
    return bool(config.get("ollama_api_key"))

def _headers():
    """Build request headers — include Authorization if API key is set."""
    hdrs = {"Content-Type": "application/json"}
    key = config.get("ollama_api_key", "")
    if key:
        hdrs["Authorization"] = f"Bearer {key}"
    return hdrs

def _safe_name(name: str, ext: str = ".json") -> str:
    """Sanitize a user-supplied filename to prevent path traversal.
    Strips directory components, rejects '..' and path separators,
    and enforces the given extension."""
    name = os.path.basename(name).strip()
    if not name or ".." in name or "/" in name or "\\" in name:
        return ""
    if ext and not name.endswith(ext):
        name += ext
    return name

# ---------------------------------------------------------------------------
# Ollama API helpers
# ---------------------------------------------------------------------------
def ollama_models():
    """Return list of available model names."""
    base = config["ollama_url"].rstrip("/")
    try:
        if _is_remote():
            r = requests.get(f"{base}/v1/models", headers=_headers(), timeout=10)
            r.raise_for_status()
            data = r.json()
            return [m["id"] for m in data.get("data", [])]
        else:
            r = requests.get(f"{base}/api/tags", timeout=5)
            r.raise_for_status()
            return [m["name"] for m in r.json().get("models", [])]
    except Exception:
        return []

def ollama_generate(model: str, prompt: str) -> str:
    """Send a generation request. Routes to Groq, remote OpenAI-compat, or local Ollama."""
    if model in GROQ_MODELS and GROQ_KEY:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {GROQ_KEY}"},
            json={"model": model, "messages": [{"role": "user", "content": prompt}], "max_tokens": 1200},
            timeout=180,
        )
        r.raise_for_status()
        return r.json().get("choices", [{}])[0].get("message", {}).get("content", "")
    base = config["ollama_url"].rstrip("/")
    if _is_remote():
        r = requests.post(
            f"{base}/v1/chat/completions",
            headers=_headers(),
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
            },
            timeout=180,
        )
        r.raise_for_status()
        data = r.json()
        choices = data.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "")
        return data.get("content", "")
    else:
        r = requests.post(
            f"{base}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=180,
        )
        r.raise_for_status()
        return r.json().get("response", "")

def ollama_is_running() -> bool:
    base = config["ollama_url"].rstrip("/")
    try:
        if _is_remote():
            r = requests.get(f"{base}/v1/models", headers=_headers(), timeout=5)
            return r.status_code == 200
        else:
            r = requests.get(f"{base}/api/tags", timeout=3)
            return r.status_code == 200
    except Exception:
        return False

# ---------------------------------------------------------------------------
# Update helpers
# ---------------------------------------------------------------------------
def check_for_updates():
    try:
        env = _git_env()
        r = subprocess.run(["git", "fetch", "origin", "--quiet"],
                           cwd=BASE, capture_output=True, timeout=20, env=env)
        if r.returncode != 0:
            return False, None, None
        local  = subprocess.run(["git", "rev-parse", "HEAD"], cwd=BASE,
                                capture_output=True, text=True).stdout.strip()[:7]
        remote = subprocess.run(["git", "rev-parse", "origin/main"], cwd=BASE,
                                capture_output=True, text=True).stdout.strip()[:7]
        return local != remote, local, remote
    except Exception:
        return False, None, None

def pull_update():
    try:
        r = subprocess.run(["git", "pull", "origin", "main", "--rebase"],
                           cwd=BASE, capture_output=True, text=True, timeout=60,
                           env=_git_env())
        return r.returncode == 0, (r.stdout + r.stderr).strip()
    except Exception as e:
        return False, str(e)

# ---------------------------------------------------------------------------
# Remote access helpers
# ---------------------------------------------------------------------------
def _find_cloudflared():
    cf = shutil.which("cloudflared")
    if cf:
        return cf
    for p in ("/usr/local/bin/cloudflared", "/opt/homebrew/bin/cloudflared",
              "/opt/homebrew/sbin/cloudflared", "/usr/bin/cloudflared"):
        if os.path.isfile(p) and os.access(p, os.X_OK):
            return p
    return None

def start_cloudflared(port):
    global TUNNEL_URL, _TUNNEL_PROC
    import re
    cf = _find_cloudflared()
    if not cf:
        return None
    _TUNNEL_PROC = subprocess.Popen(
        [cf, "tunnel", "--url", f"http://localhost:{port}"],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    for _ in range(120):
        line = _TUNNEL_PROC.stdout.readline()
        if not line:
            break
        m = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', line)
        if m:
            TUNNEL_URL = m.group(0)
            return TUNNEL_URL
    return None

def duckdns_loop(token, domain):
    while True:
        try:
            requests.get(
                f"https://www.duckdns.org/update?domains={domain}&token={token}&ip=",
                timeout=10)
        except Exception:
            pass
        time.sleep(300)

# ---------------------------------------------------------------------------
# Single-instance lock
# ---------------------------------------------------------------------------
def _existing_instance():
    if not os.path.exists(LOCK_FILE):
        return None
    try:
        with open(LOCK_FILE) as f:
            pid = int(f.read().strip())
        os.kill(pid, 0)
        return pid
    except (ValueError, ProcessLookupError, PermissionError):
        _remove_lock()
        return None

def _write_lock():
    with open(LOCK_FILE, "w") as f:
        f.write(str(os.getpid()))

def find_network_instance():
    return None

def _remove_lock():
    """Remove the lock file only if it holds our PID."""
    if not os.path.exists(LOCK_FILE):
        return
    try:
        with open(LOCK_FILE, "r") as f:
            pid = int(f.read().strip())
        if pid != os.getpid():
            return  # don't remove another process's lock
    except (ValueError, OSError):
        pass
    try:
        os.remove(LOCK_FILE)
    except OSError:
        pass

def ensure_ollama():
    """Check if Ollama is reachable; if not (and local mode), try to start it."""
    if _is_remote():
        return True
    if ollama_is_running():
        return True
    ollama_bin = shutil.which("ollama")
    if not ollama_bin:
        return False
    try:
        subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
    except Exception:
        return False
    for _ in range(30):
        time.sleep(0.5)
        if ollama_is_running():
            return True
    return False

atexit.register(_remove_lock)

# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------
HERO_PROMPT = """You are a creative superhero character designer.
Generate a unique superhero character. Return ONLY valid JSON, no markdown.

Theme and concept: {extra}

Use the theme above as creative inspiration — it is NOT a name. Invent an original codename, real name, powers, appearance, backstory, and personality that embody this theme. Be creative and varied — avoid dark/shadow/night defaults unless the theme calls for it.

Return JSON with these fields:
- name: string (invent an original hero codename — do NOT use the theme as the name)
- real_name: string
- alignment: string (hero/anti-hero/vigilante)
- powers: array of strings (3-5 powers that fit the theme)
- weaknesses: array of strings (1-3 weaknesses)
- backstory: string (2-3 sentences)
- personality: string (2-3 adjectives)
- stats: object with keys strength, speed, durability, intelligence, energy (each 1-10)
- appearance: string (brief visual description fitting the theme)

Return ONLY the JSON object, no other text."""

VILLAIN_PROMPT = """You are a creative supervillain character designer.
Generate a unique supervillain character. Return ONLY valid JSON, no markdown.

Theme and concept: {extra}

Use the theme above as creative inspiration — it is NOT a name. Invent an original codename, real name, powers, appearance, backstory, and personality that embody this theme. Be creative and varied — avoid dark/shadow/night defaults unless the theme calls for it. Explore different genres, elements, and motivations.

Return JSON with these fields:
- name: string (invent an original villain codename — do NOT use the theme as the name)
- real_name: string
- alignment: string (villain/supervillain/mastermind)
- powers: array of strings (2-4 powers that fit the theme)
- weaknesses: array of strings (1-2 weaknesses)
- backstory: string (2-3 sentences)
- personality: string (2-3 adjectives)
- threat_level: string (street/metro/global/cosmic)
- goal: string (primary objective)
- stats: object with keys strength, speed, durability, intelligence, energy (each 1-10)
- appearance: string (brief visual description fitting the theme)

Return ONLY the JSON object, no other text."""

STORY_PROMPT = """You are a creative writer for a superhero universe.
Write a short story scene featuring the following characters:

Heroes: {heroes}
Villains: {villains}
Setting: {setting}

Write 3-5 paragraphs of vivid, action-packed narrative. Include dialogue and dramatic tension.
Return plain text only, no markdown formatting."""

RECRUIT_PROMPT = """You are a superhero recruiter.
Based on the current team composition, suggest a new hero that would complement the team.

Current team: {team}

Return ONLY valid JSON describing the new recruit:
- name: string
- real_name: string
- role: string (what role they fill on the team)
- powers: array of strings
- personality: string
- why_recruit: string (why they'd be valuable)

Return ONLY the JSON object, no other text."""

# ---------------------------------------------------------------------------
# JSON extraction helper
# ---------------------------------------------------------------------------
def extract_json(text: str) -> dict:
    """Extract JSON object from possibly markdown-wrapped text."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    # Try to find first { ... } block
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = text[start:end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    return {"error": "Could not parse JSON from model output", "raw": text}

# ---------------------------------------------------------------------------
# Flask app
# ---------------------------------------------------------------------------
app = Flask(__name__, static_folder=STATIC, static_url_path="")
app.config["JSON_SORT_KEYS"] = False
app.secret_key = base64.b64decode(config.get("secret_key", base64.b64encode(os.urandom(24)).decode()))

@app.after_request
def _cache_headers(response):
    p = request.path
    # Vite assets have content-hash filenames — safe to cache for 1 year
    if p.startswith("/assets/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    # Character/team images — cache 1 hour; re-upload replaces the file
    elif p.startswith("/api/images/") and request.method == "GET" and response.status_code == 200:
        response.headers["Cache-Control"] = "public, max-age=3600"
    # index.html and API — never cache
    elif p == "/" or p.endswith(".html") or p.startswith("/api/"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers.pop("Expires", None)
    return response

@app.before_request
def _auth_guard():
    cfg = load_config()
    if not cfg.get("remote_enabled") or not (cfg.get("remote_username") and cfg.get("remote_password_hash")):
        return
    if request.remote_addr in ("127.0.0.1", "::1"):
        return
    if session.get("authenticated"):
        return
    if request.path in ("/forge-login", "/api/login", "/api/logout") or \
       request.path.startswith(("/vendor/", "/api/images/")) or \
       request.path == "/api/images":
        return
    if request.path.startswith("/api/"):
        return jsonify({"error": "auth_required"}), 401
    return redirect("/forge-login")

@app.route("/forge-login")
def login_page():
    import random
    a = random.randint(2, 9)
    b = random.randint(1, 9)
    session["captcha_answer"] = str(a + b)
    captcha_q = f"{a} + {b} = ?"
    login_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Forge — Sign In</title>
<style>*{{box-sizing:border-box;margin:0;padding:0;}}body{{background:#09090F;color:#F0EAD6;font-family:'Courier New',monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;}}
.box{{width:320px;text-align:center;}}.title{{font-size:18px;font-weight:bold;letter-spacing:.1em;color:#D4AF37;margin-bottom:6px;}}
.sub{{font-size:11px;color:#888;margin-bottom:28px;}}input{{width:100%;padding:12px;background:#111;border:1px solid #333;border-radius:8px;color:#F0EAD6;font-size:14px;text-align:left;margin-bottom:10px;outline:none;}}
input:focus{{border-color:#D4AF37;}}
.cap-row{{display:flex;align-items:center;gap:10px;margin-bottom:10px;}}
.cap-q{{font-size:13px;color:#D4AF37;background:#1a1a2e;border:1px solid #D4AF3750;border-radius:8px;padding:10px 14px;white-space:nowrap;flex-shrink:0;}}
.cap-row input{{margin-bottom:0;flex:1;}}
button{{width:100%;padding:12px;background:#D4AF3720;border:1px solid #D4AF37;border-radius:8px;color:#D4AF37;font-size:12px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;}}
.err{{color:#e74c3c;font-size:11px;margin-top:8px;min-height:16px;}}</style></head>
<body><div class="box"><div class="title">SUPERHERO FORGE</div><div class="sub">Remote access — sign in to continue</div>
<input type="text" id="u" placeholder="Username" autocomplete="username" autofocus onkeydown="if(event.key==='Enter')document.getElementById('p').focus()"/>
<input type="password" id="p" placeholder="Password" autocomplete="current-password" onkeydown="if(event.key==='Enter')document.getElementById('c').focus()"/>
<div class="cap-row"><div class="cap-q">{captcha_q}</div><input type="text" id="c" placeholder="Answer" autocomplete="off" inputmode="numeric" onkeydown="if(event.key==='Enter')login()"/></div>
<button onclick="login()">Sign In</button><div class="err" id="e"></div></div>
<script>async function login(){{document.getElementById('e').textContent='';const d=await fetch('/api/login',{{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{username:document.getElementById('u').value,password:document.getElementById('p').value,captcha:document.getElementById('c').value}})}}).then(r=>r.json());if(d.ok){{location.href='/';}}else if(d.captcha){{document.getElementById('e').textContent='Wrong answer — check your math.';setTimeout(()=>location.reload(),1000);}}else{{document.getElementById('e').textContent='Incorrect username or password.';setTimeout(()=>location.reload(),1200);}}}}</script></body></html>"""
    return login_html

@app.route("/api/login", methods=["POST"])
def api_login():
    from werkzeug.security import check_password_hash
    cfg = load_config()
    data = request.get_json() or {}
    stored_user = cfg.get("remote_username", "")
    stored_hash = cfg.get("remote_password_hash", "")
    if not stored_user or not stored_hash:
        session["authenticated"] = True
        return jsonify({"ok": True})
    expected = session.pop("captcha_answer", None)
    if not expected or data.get("captcha", "").strip() != expected:
        return jsonify({"ok": False, "captcha": True}), 401
    if data.get("username") == stored_user and check_password_hash(stored_hash, data.get("password", "")):
        session["authenticated"] = True
        return jsonify({"ok": True})
    return jsonify({"ok": False}), 401

@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.pop("authenticated", None)
    return jsonify({"ok": True})

# ---------------------------------------------------------------------------
# Static routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return send_from_directory(STATIC, "index.html")

@app.route("/vendor/<path:filename>")
def vendor(filename):
    return send_from_directory(VENDOR, filename)

# ---------------------------------------------------------------------------
# API: Update check/pull
# ---------------------------------------------------------------------------
@app.route("/api/update/check")
def api_update_check():
    has_update, local, remote = check_for_updates()
    return jsonify({"has_update": has_update, "local": local, "remote": remote})

@app.route("/api/update/pull", methods=["POST"])
def api_update_pull():
    ok, output = pull_update()
    return jsonify({"ok": ok, "output": output})

# ---------------------------------------------------------------------------
# API: Remote access
# ---------------------------------------------------------------------------
@app.route("/api/remote")
def api_remote():
    cfg = load_config()
    return jsonify({
        "enabled": cfg.get("remote_enabled", False),
        "url": TUNNEL_URL,
        "duck_domain": cfg.get("duck_domain", ""),
        "auth_set": bool(cfg.get("remote_username") and cfg.get("remote_password_hash")),
        "username": cfg.get("remote_username", ""),
        "cloudflared": bool(_find_cloudflared())
    })

# ---------------------------------------------------------------------------
# API: Config (GET redacts API key)
# ---------------------------------------------------------------------------
@app.route("/api/config", methods=["GET"])
def get_config():
    safe = {k: v for k, v in config.items() if k not in ("ollama_api_key", "secret_key", "remote_password_hash", "remote_pin")}
    safe["has_api_key"] = bool(config.get("ollama_api_key"))
    safe["mode"] = "remote" if _is_remote() else "local"
    return jsonify(safe)

@app.route("/api/config", methods=["POST"])
def update_config():
    global _DUCK_THREAD
    data = request.get_json() or {}
    was_remote = bool(config.get("remote_enabled"))
    if "model" in data:
        config["model"] = data["model"]
    if "ollama_url" in data:
        config["ollama_url"] = data["ollama_url"].rstrip("/")
    if "ollama_api_key" in data:
        config["ollama_api_key"] = data["ollama_api_key"]
    if "remote_password" in data and data["remote_password"]:
        from werkzeug.security import generate_password_hash
        config["remote_password_hash"] = generate_password_hash(data.pop("remote_password"))
    else:
        data.pop("remote_password", None)
    for k, v in data.items():
        if k not in ("model", "ollama_url", "ollama_api_key"):
            config[k] = v
    save_config(config)

    # Start DuckDNS loop immediately if credentials are now available
    if config.get("remote_enabled") and config.get("duck_token") and config.get("duck_domain"):
        if _DUCK_THREAD is None or not _DUCK_THREAD.is_alive():
            _DUCK_THREAD = threading.Thread(
                target=duckdns_loop,
                args=(config["duck_token"], config["duck_domain"]),
                daemon=True
            )
            _DUCK_THREAD.start()

    # Remote was just enabled — Flask needs to rebind to 0.0.0.0 (requires restart)
    needs_restart = not was_remote and bool(config.get("remote_enabled"))
    return jsonify({"ok": True, "mode": "remote" if _is_remote() else "local", "needs_restart": needs_restart})

# ---------------------------------------------------------------------------
# API: Status & Models
# ---------------------------------------------------------------------------
@app.route("/api/status")
def status():
    running = ollama_is_running()
    model = config.get("model", "llama3.2")
    models = ollama_models()
    ollama_url = config.get("ollama_url", "http://localhost:11434")
    groq_enabled = bool(config.get("groq_api_key") or GROQ_KEY)
    return jsonify({
        "ollama": running,
        "ollama_running": running,
        "models": models,
        "current_model": model,
        "model": model,
        "ollama_url": ollama_url,
        "mode": "remote" if _is_remote() else "local",
        "version": FORGE_VERSION,
        "groq": groq_enabled,
    })

@app.route("/api/models")
def list_models():
    return jsonify(ollama_models())

# ---------------------------------------------------------------------------
# API: Characters CRUD
# ---------------------------------------------------------------------------
@app.route("/api/characters", methods=["GET"])
def list_characters():
    chars = []
    for fname in os.listdir(CHARACTERS_DIR):
        if fname.endswith(".json"):
            with open(os.path.join(CHARACTERS_DIR, fname)) as f:
                chars.append(json.load(f))
    return jsonify(chars)

@app.route("/api/characters", methods=["POST"])
def save_character():
    char = request.json
    name = char.get("name", "unknown").replace(" ", "_").lower()
    safe = _safe_name(name)
    if not safe:
        return jsonify({"ok": False, "error": "invalid name"}), 400
    path = os.path.join(CHARACTERS_DIR, safe)
    with open(path, "w") as f:
        json.dump(char, f, indent=2)
    return jsonify({"ok": True})

@app.route("/api/characters/<name>", methods=["DELETE"])
def delete_character(name):
    safe = _safe_name(name)
    if not safe:
        return jsonify({"ok": False, "error": "invalid name"}), 400
    path = os.path.join(CHARACTERS_DIR, safe)
    if os.path.exists(path):
        os.remove(path)
        return jsonify({"ok": True})
    return jsonify({"ok": False, "error": "not found"}), 404

# ---------------------------------------------------------------------------
# API: Teams CRUD
# ---------------------------------------------------------------------------
@app.route("/api/teams", methods=["GET"])
def list_teams():
    teams = []
    for fname in os.listdir(TEAMS_DIR):
        if fname.endswith(".json"):
            with open(os.path.join(TEAMS_DIR, fname)) as f:
                teams.append(json.load(f))
    return jsonify(teams)

@app.route("/api/teams", methods=["POST"])
def save_team():
    team = request.json
    name = team.get("name", "unknown").replace(" ", "_").lower()
    safe = _safe_name(name)
    if not safe:
        return jsonify({"ok": False, "error": "invalid name"}), 400
    path = os.path.join(TEAMS_DIR, safe)
    with open(path, "w") as f:
        json.dump(team, f, indent=2)
    return jsonify({"ok": True})

@app.route("/api/teams/<name>", methods=["DELETE"])
def delete_team(name):
    safe = _safe_name(name)
    if not safe:
        return jsonify({"ok": False, "error": "invalid name"}), 400
    path = os.path.join(TEAMS_DIR, safe)
    if os.path.exists(path):
        os.remove(path)
        return jsonify({"ok": True})
    return jsonify({"ok": False, "error": "not found"}), 404

# ---------------------------------------------------------------------------
# API: Stories CRUD
# ---------------------------------------------------------------------------
@app.route("/api/stories", methods=["GET"])
def list_stories():
    stories = []
    for fname in os.listdir(STORIES_DIR):
        if fname.endswith(".json"):
            with open(os.path.join(STORIES_DIR, fname)) as f:
                stories.append(json.load(f))
    return jsonify(stories)

@app.route("/api/stories", methods=["POST"])
def save_story():
    story = request.json
    name = story.get("title", "untitled").replace(" ", "_").lower()
    ts = int(time.time())
    safe = _safe_name(f"{name}_{ts}")
    if not safe:
        return jsonify({"ok": False, "error": "invalid title"}), 400
    path = os.path.join(STORIES_DIR, safe)
    with open(path, "w") as f:
        json.dump(story, f, indent=2)
    return jsonify({"ok": True})

@app.route("/api/stories/<name>", methods=["DELETE"])
def delete_story(name):
    safe = _safe_name(name)
    if not safe:
        return jsonify({"ok": False, "error": "invalid name"}), 400
    path = os.path.join(STORIES_DIR, safe)
    if os.path.exists(path):
        os.remove(path)
        return jsonify({"ok": True})
    return jsonify({"ok": False, "error": "not found"}), 404

# ---------------------------------------------------------------------------
# API: Model pull
# ---------------------------------------------------------------------------
@app.route("/api/pull", methods=["POST"])
def pull_model():
    data = request.get_json() or {}
    model = data.get("model", "")
    if not model:
        model = config.get("model", "llama3.2")
    if _is_remote():
        return jsonify({"error": "Pull not available for remote API"}), 400

    def do_pull():
        base = config["ollama_url"].rstrip("/")
        try:
            requests.post(
                f"{base}/api/pull",
                json={"name": model, "stream": False},
                timeout=600,
            )
        except Exception as e:
            print(f"Pull failed for {model}: {e}")

    threading.Thread(target=do_pull, daemon=True).start()
    return jsonify({"ok": True, "model": model})

# ---------------------------------------------------------------------------
# API: Images
# ---------------------------------------------------------------------------
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".gif", ".webp")

@app.route("/api/store", methods=["GET"])
def store_list():
    store = _load_store()
    prefix = request.args.get("prefix", "")
    keys = [k for k in store if k.startswith(prefix)] if prefix else list(store.keys())
    return jsonify({"keys": keys})

@app.route("/api/store/<key>", methods=["GET"])
def store_get(key):
    store = _load_store()
    if key not in store:
        return jsonify({"error": "not found"}), 404
    return jsonify({"key": key, "value": store[key]})

@app.route("/api/store/<key>", methods=["POST"])
def store_set(key):
    body = request.get_json(silent=True) or {}
    value = body.get("value", "")
    store = _load_store()
    store[key] = value
    _save_store(store)
    return jsonify({"key": key, "value": value})

@app.route("/api/store/<key>", methods=["DELETE"])
def store_delete(key):
    store = _load_store()
    store.pop(key, None)
    _save_store(store)
    return jsonify({"key": key, "deleted": True})

@app.route("/api/images", methods=["GET"])
def list_images():
    ids = set()
    for f in glob.glob(os.path.join(IMAGES_DIR, "*")):
        name = os.path.basename(f)
        root, ext = os.path.splitext(name)
        if ext.lower() in IMAGE_EXTENSIONS:
            ids.add(root)
    return jsonify(sorted(ids))

@app.route("/api/images/<img_id>", methods=["GET"])
def get_image(img_id):
    safe_id = os.path.basename(img_id)
    for ext in IMAGE_EXTENSIONS:
        path = os.path.join(IMAGES_DIR, f"{safe_id}{ext}")
        if os.path.exists(path):
            mtime = int(os.path.getmtime(path))
            etag = f'"{safe_id}-{mtime}"'
            if request.headers.get("If-None-Match") == etag:
                return Response(status=304)
            resp = send_file(path)
            resp.headers["ETag"] = etag
            return resp
    return jsonify({"error": "not found"}), 404

@app.route("/api/images/<img_id>", methods=["POST"])
def save_image(img_id):
    safe_id = os.path.basename(img_id)
    data = request.json or {}
    b64_data = data.get("data", "")
    if not b64_data:
        return jsonify({"error": "data is required"}), 400

    # Detect extension from data URI prefix
    ext = ".png"  # default
    if b64_data.startswith("data:image/jpeg") or b64_data.startswith("data:image/jpg"):
        ext = ".jpg"
    elif b64_data.startswith("data:image/png"):
        ext = ".png"
    elif b64_data.startswith("data:image/gif"):
        ext = ".gif"
    elif b64_data.startswith("data:image/webp"):
        ext = ".webp"

    # Strip data URI prefix if present
    if ";base64," in b64_data:
        b64_data = b64_data.split(";base64,", 1)[1]

    # Remove old file with different extension
    for old_ext in IMAGE_EXTENSIONS:
        old_path = os.path.join(IMAGES_DIR, f"{safe_id}{old_ext}")
        if os.path.exists(old_path):
            os.remove(old_path)

    path = os.path.join(IMAGES_DIR, f"{safe_id}{ext}")
    with open(path, "wb") as f:
        f.write(base64.b64decode(b64_data))
    return jsonify({"ok": True, "id": safe_id, "ext": ext})

@app.route("/api/images/<img_id>", methods=["DELETE"])
def delete_image(img_id):
    safe_id = os.path.basename(img_id)
    for ext in IMAGE_EXTENSIONS:
        path = os.path.join(IMAGES_DIR, f"{safe_id}{ext}")
        if os.path.exists(path):
            os.remove(path)
            return jsonify({"ok": True})
    return jsonify({"ok": False, "error": "not found"}), 404

# ---------------------------------------------------------------------------
# API: AI Generation endpoints
# ---------------------------------------------------------------------------
def _get_model(data):
    """Resolve model from request data or config."""
    return data.get("model") or config.get("model", "llama3.2")

@app.route("/api/generate/hero", methods=["POST"])
def generate_hero():
    data = request.json or {}
    model = _get_model(data)
    extra = data.get("extra", "") or "Surprise me with a creative, varied hero archetype."
    prompt = HERO_PROMPT.format(extra=extra)
    raw = ""
    try:
        raw = ollama_generate(model, prompt)
        char = extract_json(raw)
        if "error" in char and "name" not in char:
            return jsonify({"error": char["error"], "raw": char.get("raw", raw)}), 422
        char["source_model"] = model
        name = char.get("name", "unknown").replace(" ", "_").lower()
        safe = _safe_name(name) or _safe_name("unknown")
        path = os.path.join(CHARACTERS_DIR, safe)
        with open(path, "w") as f:
            json.dump(char, f, indent=2)
        return jsonify(char)
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 401:
            return jsonify({"error": "Authentication failed. Check your API key."}), 401
        return jsonify({"error": str(e)}), e.response.status_code if e.response else 500
    except requests.exceptions.ConnectionError:
        mode = "remote" if _is_remote() else "local"
        if mode == "remote":
            return jsonify({"error": "Cannot reach remote API. Check the URL and API key."}), 503
        return jsonify({"error": "Ollama is not running. Start it with: ollama serve"}), 503
    except requests.exceptions.Timeout:
        return jsonify({"error": f"Model {model} timed out. Try a smaller model or check your connection."}), 504
    except Exception as e:
        return jsonify({"error": str(e), "raw": raw[:500] if raw else ""}), 500


@app.route("/api/generate/villain", methods=["POST"])
def generate_villain():
    data = request.json or {}
    model = _get_model(data)
    extra = data.get("extra", "") or "Surprise me with a creative, varied villain archetype."
    prompt = VILLAIN_PROMPT.format(extra=extra)
    raw = ""
    try:
        raw = ollama_generate(model, prompt)
        char = extract_json(raw)
        if "error" in char and "name" not in char:
            return jsonify({"error": char["error"], "raw": char.get("raw", raw)}), 422
        char["source_model"] = model
        name = char.get("name", "unknown").replace(" ", "_").lower()
        safe = _safe_name(name) or _safe_name("unknown")
        path = os.path.join(CHARACTERS_DIR, safe)
        with open(path, "w") as f:
            json.dump(char, f, indent=2)
        return jsonify(char)
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 401:
            return jsonify({"error": "Authentication failed. Check your API key."}), 401
        return jsonify({"error": str(e)}), e.response.status_code if e.response else 500
    except requests.exceptions.ConnectionError:
        mode = "remote" if _is_remote() else "local"
        if mode == "remote":
            return jsonify({"error": "Cannot reach remote API. Check the URL and API key."}), 503
        return jsonify({"error": "Ollama is not running. Start it with: ollama serve"}), 503
    except requests.exceptions.Timeout:
        return jsonify({"error": f"Model {model} timed out. Try a smaller model or check your connection."}), 504
    except Exception as e:
        return jsonify({"error": str(e), "raw": raw[:500] if raw else ""}), 500


@app.route("/api/generate/recruit", methods=["POST"])
def generate_recruit():
    data = request.json or {}
    model = _get_model(data)
    team = data.get("team", [])
    prompt = RECRUIT_PROMPT.format(team=", ".join(team) if isinstance(team, list) else str(team))
    raw = ""
    try:
        raw = ollama_generate(model, prompt)
        recruit = extract_json(raw)
        if "error" in recruit and "name" not in recruit:
            return jsonify({"error": recruit["error"], "raw": recruit.get("raw", raw)}), 422
        recruit["source_model"] = model
        return jsonify(recruit)
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 401:
            return jsonify({"error": "Authentication failed. Check your API key."}), 401
        return jsonify({"error": str(e)}), e.response.status_code if e.response else 500
    except requests.exceptions.ConnectionError:
        mode = "remote" if _is_remote() else "local"
        if mode == "remote":
            return jsonify({"error": "Cannot reach remote API. Check the URL and API key."}), 503
        return jsonify({"error": "Ollama is not running. Start it with: ollama serve"}), 503
    except requests.exceptions.Timeout:
        return jsonify({"error": f"Model {model} timed out. Try a smaller model or check your connection."}), 504
    except Exception as e:
        return jsonify({"error": str(e), "raw": raw[:500] if raw else ""}), 500


@app.route("/api/generate/story", methods=["POST"])
def generate_story():
    data = request.json or {}
    model = _get_model(data)
    heroes = data.get("heroes", [])
    villains = data.get("villains", [])
    setting = data.get("setting", "a dark city at night")
    prompt = STORY_PROMPT.format(
        heroes=", ".join(heroes) if isinstance(heroes, list) else str(heroes),
        villains=", ".join(villains) if isinstance(villains, list) else str(villains),
        setting=setting,
    )
    raw = ""
    try:
        raw = ollama_generate(model, prompt)
        story = {
            "title": f"{', '.join(heroes[:2])} vs {', '.join(villains[:2])}",
            "heroes": heroes,
            "villains": villains,
            "setting": setting,
            "content": raw,
            "source_model": model,
        }
        # Auto-save
        ts = int(time.time())
        safe_title = story["title"].replace(" ", "_").lower()[:40]
        safe = _safe_name(f"{safe_title}_{ts}") or _safe_name(f"story_{ts}")
        path = os.path.join(STORIES_DIR, safe)
        with open(path, "w") as f:
            json.dump(story, f, indent=2)
        return jsonify(story)
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 401:
            return jsonify({"error": "Authentication failed. Check your API key."}), 401
        return jsonify({"error": str(e)}), e.response.status_code if e.response else 500
    except requests.exceptions.ConnectionError:
        mode = "remote" if _is_remote() else "local"
        if mode == "remote":
            return jsonify({"error": "Cannot reach remote API. Check the URL and API key."}), 503
        return jsonify({"error": "Ollama is not running. Start it with: ollama serve"}), 503
    except requests.exceptions.Timeout:
        return jsonify({"error": f"Model {model} timed out. Try a smaller model or check your connection."}), 504
    except Exception as e:
        return jsonify({"error": str(e), "raw": raw[:500] if raw else ""}), 500

# ---------------------------------------------------------------------------
# API: Chat (with remote support)
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = "You are a creative writing assistant specializing in superhero fiction. When asked to return JSON, return ONLY valid JSON — no markdown fences, no preamble, no explanation. The JSON must be complete and parseable."

def _ndjson_text(text):
    """Return a streaming NDJSON response with a single {t} chunk — matches callAI's parser."""
    def _gen():
        yield json.dumps({"t": text}) + "\n"
    return Response(stream_with_context(_gen()), mimetype="application/x-ndjson")

def _ndjson_error(msg, status=500):
    """Return a streaming NDJSON response with an {e} error chunk."""
    def _gen():
        yield json.dumps({"e": msg}) + "\n"
    return Response(stream_with_context(_gen()), mimetype="application/x-ndjson", status=status)

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json or {}
    messages = data.get("messages", [])
    max_tokens = data.get("max_tokens", 1200)
    model = _get_model(data)

    # If no system message, prepend one
    if not messages or messages[0].get("role") != "system":
        messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

    # Detect JSON-only mode (for local Ollama format hint)
    use_json_format = any(
        any(kw in msg.get("content", "") for kw in ("JSON only", '"prompt"', "keys:"))
        for msg in messages
    )

    try:
        use_groq = model in GROQ_MODELS and bool(GROQ_KEY)
        if use_groq:
            r = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {GROQ_KEY}"},
                json={"model": model, "messages": messages, "max_tokens": max_tokens},
                timeout=180,
            )
            r.raise_for_status()
            text = r.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        elif _is_remote():
            base = config["ollama_url"].rstrip("/")
            r = requests.post(
                f"{base}/v1/chat/completions",
                headers=_headers(),
                json={"model": model, "messages": messages, "max_tokens": max_tokens},
                timeout=180,
            )
            if r.status_code == 401:
                return _ndjson_error("Authentication failed. Check your API key.", 401)
            r.raise_for_status()
            text = r.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        else:
            base = config["ollama_url"].rstrip("/")
            payload = {
                "model": model,
                "messages": messages,
                "stream": False,
                "options": {"temperature": 0.8, "num_predict": max_tokens, "top_p": 0.9},
            }
            if use_json_format:
                payload["format"] = "json"
            r = requests.post(f"{base}/api/chat", json=payload, timeout=180)
            r.raise_for_status()
            text = r.json().get("message", {}).get("content", "")

        return _ndjson_text(text)

    except requests.exceptions.ConnectionError:
        if model in GROQ_MODELS and GROQ_KEY:
            return _ndjson_error("Cannot reach Groq API. Check your internet connection.", 503)
        if _is_remote():
            return _ndjson_error("Cannot reach remote API. Check the URL and API key.", 503)
        return _ndjson_error("Ollama is not running. Start it with: ollama serve", 503)
    except requests.exceptions.Timeout:
        return _ndjson_error(f"Model {model} timed out.", 504)
    except requests.exceptions.HTTPError as e:
        code = e.response.status_code if e.response is not None else 500
        if code == 401:
            return _ndjson_error("Authentication failed. Check your API key.", 401)
        return _ndjson_error(str(e), code)
    except Exception as e:
        return _ndjson_error(str(e), 500)

# ---------------------------------------------------------------------------
# PDF Export
# ---------------------------------------------------------------------------
@app.route("/api/export-pdf", methods=["POST"])
def export_pdf():
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.lib.units import inch
        from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                        Table, TableStyle, HRFlowable, PageBreak)
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
        from reportlab.platypus import Image as RLImage
    except ImportError:
        return jsonify({"error": "reportlab not installed. Run: pip install reportlab"}), 500

    data     = request.get_json() or {}
    members  = data.get("members", [])
    images   = data.get("images", {})
    team_name  = data.get("teamName", "Hero Roster")
    team_color = data.get("teamColor", "#534AB7")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter,
        rightMargin=0.6*inch, leftMargin=0.6*inch,
        topMargin=0.6*inch, bottomMargin=0.6*inch)

    def hex2rgb(h):
        h = h.lstrip("#")
        return tuple(int(h[i:i+2], 16)/255 for i in (0, 2, 4))

    def rcolor(h):
        try: return colors.Color(*hex2rgb(h))
        except: return colors.Color(0.33, 0.29, 0.72)

    VOID  = colors.Color(0.04, 0.04, 0.08)
    LIGHT = colors.Color(0.94, 0.92, 0.85)
    MUTED = colors.Color(0.55, 0.54, 0.50)
    GOLD  = colors.Color(0.83, 0.69, 0.22)
    RED   = colors.Color(0.55, 0.10, 0.10)

    ALIGN_COLORS = {
        "base":    "#534AB7", "member":  "#534AB7",
        "allied":  "#0F6E56", "rival":   "#BA7517",
        "enemy":   "#8B1A1A", "neutral": "#888780",
        "splinter":"#993C1D",
    }
    ALIGN_LABELS = {
        "base": "NK Member", "member": "NK Member",
        "allied": "Allied with NK", "rival": "NK Rival",
        "enemy": "NK Enemy", "neutral": "Neutral",
        "splinter": "NK Splinter",
    }

    def sty(name, size=10, color=LIGHT, bold=False, align=TA_LEFT, leading=None):
        return ParagraphStyle(name, fontSize=size, textColor=color,
            fontName="Helvetica-Bold" if bold else "Helvetica",
            alignment=align, leading=leading or size*1.35)

    story = []

    # -- Cover -----------------------------------------------------------------
    TEAM_C = rcolor(team_color)
    story.append(Spacer(1, 1.6*inch))
    story.append(Paragraph(team_name.upper(), sty("ct", 26, GOLD, True, TA_CENTER)))
    story.append(Spacer(1, 0.12*inch))
    story.append(HRFlowable(width="55%", thickness=1, color=TEAM_C, hAlign="CENTER"))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("CLASSIFIED DOSSIER", sty("cs", 11, MUTED, False, TA_CENTER)))
    story.append(Spacer(1, 0.08*inch))
    story.append(Paragraph(f"{len(members)} registered members", sty("cc", 10, MUTED, False, TA_CENTER)))
    story.append(Spacer(1, 2.4*inch))
    story.append(Paragraph("FOR INTERNAL USE ONLY", sty("cw", 8, colors.Color(0.4,0.4,0.4), False, TA_CENTER)))

    # -- Member pages ----------------------------------------------------------
    for member in members:
        story.append(PageBreak())

        acc   = member.get("color", team_color)
        ACC   = rcolor(acc)
        num   = member.get("number", "")
        name  = member.get("heroName", "Unknown")
        real  = member.get("realName", "")
        role  = member.get("role", "")
        tag   = member.get("tagline", "")
        orig  = member.get("origin", "")
        stats = member.get("stats", {})
        pows  = member.get("powers", [])
        dna   = member.get("dna", [])
        is_v  = member.get("isVillain", False)
        m_team     = member.get("teamName", team_name)
        m_team_c   = member.get("teamColor", team_color)
        nk_alignment = member.get("nkAlignment", "neutral")
        affiliations = member.get("affiliations", [])
        shared_villains = member.get("sharedVillains", [])
        appearance   = member.get("appearance", "")

        align_color = ALIGN_COLORS.get(nk_alignment, "#888780")
        align_label = ALIGN_LABELS.get(nk_alignment, "Neutral")
        ALIGN_C = rcolor(align_color)
        MTEAM_C = rcolor(m_team_c)

        # Header band
        hdr_txt = "\u2014 CLASSIFIED THREAT \u2014" if is_v else f"{m_team.upper()} \u00b7 {num}"
        hd = Table([[
            Paragraph(hdr_txt, sty("h1", 7, rcolor(acc), False, TA_LEFT)),
            Paragraph(role, sty("h2", 7, MUTED, False, TA_RIGHT))
        ]], colWidths=["60%","40%"])
        hd.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1), colors.Color(*[x*0.18 for x in hex2rgb(acc)])),
            ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
            ("LEFTPADDING",(0,0),(0,-1),8),("RIGHTPADDING",(-1,0),(-1,-1),8),
            ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ]))
        story.append(hd)
        story.append(Spacer(1, 0.1*inch))

        # Image + info columns
        img_cell = Spacer(1, 1)
        img_b64 = images.get(member.get("id",""))
        if img_b64:
            try:
                if "," in img_b64:
                    img_b64 = img_b64.split(",",1)[1]
                img_bytes = base64.b64decode(img_b64)
                img_buf = io.BytesIO(img_bytes)
                rl_img = RLImage(img_buf, width=2.1*inch, height=3.0*inch)
                rl_img.hAlign = "LEFT"
                img_cell = rl_img
            except Exception:
                pass

        info_parts = []
        info_parts.append(Paragraph(name, sty("n", 22, LIGHT, True)))
        if real:
            info_parts.append(Paragraph(real, sty("r", 10, MUTED)))
        if role:
            info_parts.append(Paragraph(role.upper(), sty("ro", 8, GOLD, False, TA_LEFT, 12)))
        info_parts.append(Spacer(1, 5))

        # NK Alignment badge
        align_data = [[
            Paragraph("NK ALIGNMENT", sty("al", 7, MUTED)),
            Paragraph(align_label, sty("alv", 8, ALIGN_C, True, TA_RIGHT))
        ]]
        at = Table(align_data, colWidths=["50%","50%"])
        at.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1), colors.Color(*[x*0.12 for x in hex2rgb(align_color)])),
            ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
            ("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
            ("ROUNDEDCORNERS",(0,0),(-1,-1),3),
        ]))
        info_parts.append(at)
        info_parts.append(Spacer(1, 6))

        if tag:
            info_parts.append(HRFlowable(width="100%", thickness=0.5, color=ACC))
            info_parts.append(Spacer(1, 3))
            info_parts.append(Paragraph(f'<i>\u201c{tag}\u201d</i>', sty("tg", 10, colors.Color(0.8,0.8,0.75), False, TA_LEFT, 14)))
            info_parts.append(Spacer(1, 7))

        # Stats
        if stats:
            info_parts.append(Paragraph("COMBAT STATS", sty("sl", 7, MUTED)))
            info_parts.append(Spacer(1, 3))
            for stat_name, stat_val in stats.items():
                rt = Table([[Paragraph(stat_name.upper(), sty("sn", 8, MUTED)), Paragraph(str(stat_val), sty("sv", 8, LIGHT, True, TA_RIGHT))]], colWidths=["60%","40%"])
                rt.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),1),("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
                info_parts.append(rt)
                bar_w = 3.0 * inch
                filled = max(bar_w * (stat_val / 100), 0.01)
                bt = Table([[""]], colWidths=[bar_w], rowHeights=[3])
                bt.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.Color(0.12,0.12,0.18)),("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
                info_parts.append(bt)
                ft = Table([[""]], colWidths=[filled], rowHeights=[3])
                ft.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),ACC),("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
                info_parts.append(Spacer(1,-3))
                info_parts.append(ft)
                info_parts.append(Spacer(1,3))

        main_t = Table([[img_cell, info_parts]], colWidths=[2.3*inch, 4.8*inch])
        main_t.setStyle(TableStyle([
            ("VALIGN",(0,0),(-1,-1),"TOP"),
            ("LEFTPADDING",(0,0),(0,-1),0),("RIGHTPADDING",(0,0),(0,-1),10),
            ("LEFTPADDING",(1,0),(1,-1),0),("RIGHTPADDING",(1,0),(1,-1),0),
            ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
        ]))
        story.append(main_t)
        story.append(Spacer(1, 0.14*inch))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.Color(*[x*0.35 for x in hex2rgb(acc)])))
        story.append(Spacer(1, 0.1*inch))

        # Powers
        if pows:
            story.append(Paragraph("ABILITIES", sty("pl", 7, MUTED)))
            story.append(Spacer(1, 5))
            pr = [[Paragraph(p.get("name",""), sty("pn", 10, LIGHT, True)), Paragraph(p.get("desc",""), sty("pd", 9, MUTED, False, TA_LEFT, 13))] for p in pows]
            pt = Table(pr, colWidths=[1.8*inch, 5.3*inch])
            pt.setStyle(TableStyle([
                ("VALIGN",(0,0),(-1,-1),"TOP"),
                ("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3),
                ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
                ("LINEBELOW",(0,0),(-1,-2),0.25,colors.Color(0.15,0.15,0.2)),
            ]))
            story.append(pt)
            story.append(Spacer(1, 0.1*inch))

        # Origin
        if orig:
            story.append(Paragraph("ORIGIN", sty("ol2", 7, MUTED)))
            story.append(Spacer(1, 3))
            story.append(Paragraph(orig, sty("ot", 9, MUTED, False, TA_LEFT, 14)))
            story.append(Spacer(1, 0.08*inch))

        # Appearance
        if appearance:
            story.append(Paragraph("APPEARANCE", sty("apl", 7, MUTED)))
            story.append(Spacer(1, 3))
            story.append(Paragraph(appearance, sty("apt", 9, MUTED, False, TA_LEFT, 14)))
            story.append(Spacer(1, 0.08*inch))

        # DNA
        if dna:
            story.append(Paragraph("DNA: " + " \u00b7 ".join(dna), sty("dt", 8, GOLD)))
            story.append(Spacer(1, 0.08*inch))

        # Affiliations
        if affiliations:
            story.append(Paragraph("AFFILIATIONS", sty("afl", 7, MUTED)))
            story.append(Spacer(1, 3))
            aff_text = "  \u00b7  ".join([f"{a.get('teamName','')} ({a.get('role','')})" for a in affiliations])
            story.append(Paragraph(aff_text, sty("afv", 8, GOLD)))
            story.append(Spacer(1, 0.08*inch))

        # Shared villain threat
        if shared_villains:
            story.append(HRFlowable(width="100%", thickness=0.5, color=RED))
            story.append(Spacer(1, 3))
            story.append(Paragraph("\u26a0 SHARED THREAT: " + " \u00b7 ".join(shared_villains), sty("sv2", 8, colors.Color(0.8, 0.2, 0.2), True)))
            story.append(Spacer(1, 0.06*inch))

        # Footer
        story.append(Spacer(1, 0.1*inch))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.Color(*[x*0.22 for x in hex2rgb(acc)])))
        story.append(Spacer(1, 3))
        ft2 = Table([[
            Paragraph(f"{m_team.upper()} \u00b7 CLASSIFIED", sty("ft", 7, colors.Color(0.3,0.3,0.3))),
            Paragraph(num, sty("fn", 16, colors.Color(*[x*0.25 for x in hex2rgb(acc)]), True, TA_RIGHT))
        ]], colWidths=["85%","15%"])
        ft2.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
        story.append(ft2)

    def bg(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(VOID)
        canvas.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
        canvas.restoreState()

    doc.build(story, onFirstPage=bg, onLaterPages=bg)
    buf.seek(0)
    return send_file(buf, mimetype="application/pdf",
        as_attachment=True, download_name=f"{team_name.lower().replace(' ','-')}-roster.pdf")

# ---------------------------------------------------------------------------
# API: Restart
# ---------------------------------------------------------------------------
@app.route("/api/restart", methods=["POST"])
def restart():
    def do_restart():
        time.sleep(0.5)
        _remove_lock()
        subprocess.Popen([sys.executable] + sys.argv, cwd=BASE,
                         creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0)
        os._exit(0)
    threading.Thread(target=do_restart, daemon=True).start()
    return jsonify({"ok": True})

# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------
@app.route("/health")
def health():
    model = config.get("model", "llama3.2")
    return jsonify({"status": "ok", "model": model, "version": FORGE_VERSION})

# ---------------------------------------------------------------------------
# Port & Flask helpers
# ---------------------------------------------------------------------------
def find_free_port(preferred=7432):
    s = socket.socket()
    try:
        s.bind(("127.0.0.1", preferred)); s.close(); return preferred
    except OSError:
        s.close(); s = socket.socket(); s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]; s.close(); return port

def run_flask(port, host="127.0.0.1"):
    import logging
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    app.run(host=host, port=port, debug=False, use_reloader=False, threaded=True)

# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # ── Same-machine instance check ───────────────────────────────────────────
    existing = _existing_instance()
    if existing:
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk(); root.withdraw()
        proceed = messagebox.askyesno(
            "Superhero Forge Already Running",
            f"Superhero Forge is already open (PID {existing}).\n\nClose it and launch a new instance?",
            icon="warning"
        )
        root.destroy()
        if proceed:
            try:
                os.kill(existing, signal.SIGTERM)
                time.sleep(1.2)
                try: os.kill(existing, signal.SIGKILL)
                except ProcessLookupError: pass
            except Exception: pass
        else:
            sys.exit(0)

    # ── Network instance check (LAN) ──────────────────────────────────────────
    network_url = find_network_instance()
    if network_url:
        import tkinter as tk
        from tkinter import messagebox
        import webbrowser as _wb
        root = tk.Tk(); root.withdraw()
        open_it = messagebox.askyesno(
            "Superhero Forge Already Running on Network",
            f"Superhero Forge is already running on your network:\n\n"
            f"  {network_url}\n\n"
            f"Open it in your browser? (No = launch a new instance here)",
            icon="warning"
        )
        root.destroy()
        if open_it:
            _wb.open(network_url)
            sys.exit(0)

    _write_lock()
    atexit.register(_remove_lock)

    # Bind host based on remote_enabled
    cfg = load_config()
    flask_host = "0.0.0.0" if cfg.get("remote_enabled") else "127.0.0.1"

    print("\n  Starting Ollama...")
    ollama_ok = ensure_ollama()
    print(f"  Ollama {'ready' if ollama_ok else 'not found — AI features disabled'}")

    port = find_free_port()
    url  = f"http://127.0.0.1:{port}"
    flask_thread = threading.Thread(target=run_flask, args=(port, "0.0.0.0"), daemon=True)
    flask_thread.start()
    for _ in range(20):
        try:
            requests.get(f"{url}/health", timeout=1)
            break
        except Exception:
            time.sleep(0.3)
    print(f"\n  Superhero Forge v{FORGE_VERSION} ready at {url}")

    # Auto-update check (background)
    def _bg_update_check():
        has_update, local, remote = check_for_updates()
        if has_update:
            print(f"  Update available: {local} \u2192 {remote} (open app to update)")
    threading.Thread(target=_bg_update_check, daemon=True).start()

    # Remote access
    if cfg.get("remote_enabled"):
        def _start_remote():
            tunnel = start_cloudflared(port)
            if tunnel:
                print(f"  Remote (cloudflared): {tunnel}")
            elif cfg.get("duck_domain"):
                print(f"  Remote (DuckDNS): {cfg['duck_domain']}.duckdns.org:{port}")
            if cfg.get("duck_token") and cfg.get("duck_domain"):
                duckdns_loop(cfg["duck_token"], cfg["duck_domain"])
        threading.Thread(target=_start_remote, daemon=True).start()
    def _open_browser(target_url):
        """Open the browser using the most reliable method for the platform."""
        import sys as _sys
        if _sys.platform == "darwin":
            # Use 'open' directly — avoids AppleScript permission issues
            subprocess.Popen(["open", target_url],
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif _sys.platform == "win32":
            os.startfile(target_url)
        else:
            import webbrowser as _wb
            _wb.open(target_url)

    try:
        import webview
        print("  Opening native window (minimized) + browser tab...\n", flush=True)
        _storage = os.path.join(BASE, "webview-data")
        os.makedirs(_storage, exist_ok=True)
        _win = webview.create_window("Superhero Forge", url, width=1280, height=900,
            min_size=(960, 680), background_color="#09090F")
        def _on_started():
            time.sleep(0.5)  # wait for native window to be ready
            try: _win.minimize()
            except Exception: pass
            _open_browser(url)
        webview.start(debug=False, private_mode=False, storage_path=_storage, func=_on_started)
    except ImportError:
        print("  PyWebView not found — opening in browser.\n", flush=True)
        _open_browser(url)
        try:
            while True: time.sleep(1)
        except KeyboardInterrupt:
            print("\n  Shutting down.")