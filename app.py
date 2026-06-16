"""
Nocturnal Innovations's Superhero Forge â€” Desktop App
Local AI powered by Ollama. No API keys. No subscriptions.
"""

import os, sys, json, threading, time, socket, base64, io, subprocess, shutil, signal, atexit, sqlite3
import glob
from contextlib import contextmanager
_STORE_LOCK = threading.Lock()
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
DB_FILE      = os.path.join(BASE, "forge.db")

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

# ---------------------------------------------------------------------------
# SQLite KV store â€” replaces forge-data.json
# ---------------------------------------------------------------------------
@contextmanager
def _db():
    conn = sqlite3.connect(DB_FILE, timeout=15)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def _init_db():
    """Create kv_store table and migrate from forge-data.json if the DB is empty."""
    with _db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS kv_store (
                key        TEXT PRIMARY KEY,
                value      TEXT NOT NULL DEFAULT '""',
                updated_at REAL DEFAULT (unixepoch())
            )
        """)
    # One-time migration from JSON file
    with _db() as conn:
        count = conn.execute("SELECT COUNT(*) FROM kv_store").fetchone()[0]
        if count == 0 and os.path.exists(STORAGE_FILE):
            try:
                with open(STORAGE_FILE) as f:
                    legacy = json.load(f)
                conn.executemany(
                    "INSERT OR IGNORE INTO kv_store (key, value) VALUES (?, ?)",
                    [(k, v if isinstance(v, str) else json.dumps(v)) for k, v in legacy.items()]
                )
                print(f"[forge] Migrated {len(legacy)} keys from forge-data.json â†’ forge.db")
            except Exception as e:
                print(f"[forge] Migration warning: {e}")

def _get_kv_raw(key):
    """Return the stored JSON string for *key*, or None."""
    with _db() as conn:
        row = conn.execute("SELECT value FROM kv_store WHERE key = ?", (key,)).fetchone()
    return row[0] if row else None

def _get_kv(key):
    """Return the parsed Python value for *key*, or None."""
    raw = _get_kv_raw(key)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return raw

def _set_kv(key, raw_value):
    """Store *raw_value* (a JSON string) under *key*."""
    with _STORE_LOCK:
        with _db() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, unixepoch())",
                (key, raw_value),
            )

def _del_kv(key):
    with _STORE_LOCK:
        with _db() as conn:
            conn.execute("DELETE FROM kv_store WHERE key = ?", (key,))

def _list_kv(prefix=""):
    with _db() as conn:
        if prefix:
            rows = conn.execute(
                "SELECT key FROM kv_store WHERE key LIKE ?", (prefix + "%",)
            ).fetchall()
        else:
            rows = conn.execute("SELECT key FROM kv_store").fetchall()
    return [r[0] for r in rows]

def _collect_all_names():
    """Return {char_id: heroName} reflecting the *effective* name for every character."""
    names = {}
    rosters = _get_kv("forge-rosters") or {}
    if isinstance(rosters, dict):
        for members in rosters.values():
            for m in (members or []):
                if isinstance(m, dict) and m.get("id") and m.get("heroName"):
                    names[m["id"]] = m["heroName"]
    for h in (_get_kv("forge-solo-heroes") or []):
        if isinstance(h, dict) and h.get("id") and h.get("heroName"):
            names[h["id"]] = h["heroName"]
    for v in (_get_kv("forge-villains") or []):
        if isinstance(v, dict) and v.get("id") and v.get("heroName"):
            names[v["id"]] = v["heroName"]
    # sharedEdits (forge-edits) override base names
    edits = _get_kv("forge-edits") or {}
    if isinstance(edits, dict):
        for cid, ed in edits.items():
            if isinstance(ed, dict) and ed.get("heroName"):
                names[cid] = ed["heroName"]
    return names

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
    """Build request headers â€” include Authorization if API key is set."""
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


def ollama_stream(model: str, prompt: str):
    """Yield raw text tokens from Groq, remote OpenAI-compat, or local Ollama (streaming mode)."""
    if model in GROQ_MODELS and GROQ_KEY:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {GROQ_KEY}"},
            json={"model": model, "messages": [{"role": "user", "content": prompt}],
                  "max_tokens": 1200, "stream": True},
            timeout=180, stream=True,
        )
        r.raise_for_status()
        for line in r.iter_lines():
            if not line:
                continue
            if line.startswith(b"data: "):
                data = line[6:]
                if data == b"[DONE]":
                    break
                try:
                    chunk = json.loads(data)
                    text = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if text:
                        yield text
                except Exception:
                    pass
        return

    base = config["ollama_url"].rstrip("/")
    if _is_remote():
        r = requests.post(
            f"{base}/v1/chat/completions",
            headers=_headers(),
            json={"model": model, "messages": [{"role": "user", "content": prompt}],
                  "stream": True},
            timeout=180, stream=True,
        )
        r.raise_for_status()
        for line in r.iter_lines():
            if not line:
                continue
            if line.startswith(b"data: "):
                data = line[6:]
                if data == b"[DONE]":
                    break
                try:
                    chunk = json.loads(data)
                    text = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if text:
                        yield text
                except Exception:
                    pass
    else:
        r = requests.post(
            f"{base}/api/generate",
            json={"model": model, "prompt": prompt, "stream": True},
            timeout=180, stream=True,
        )
        r.raise_for_status()
        for line in r.iter_lines():
            if not line:
                continue
            try:
                chunk = json.loads(line)
                text = chunk.get("response", "")
                if text:
                    yield text
                if chunk.get("done"):
                    break
            except Exception:
                pass

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
    candidates = [
        "/usr/local/bin/cloudflared", "/opt/homebrew/bin/cloudflared",
        "/opt/homebrew/sbin/cloudflared", "/usr/bin/cloudflared",
        r"C:\Program Files (x86)\cloudflare\cloudflared\cloudflared.exe",
        r"C:\Program Files\cloudflare\cloudflared\cloudflared.exe",
        r"C:\ProgramData\cloudflare\cloudflared.exe",
    ]
    for p in candidates:
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
    except (ValueError, ProcessLookupError, PermissionError, OSError):
        _remove_lock()
        return None

def _write_lock():
    with open(LOCK_FILE, "w") as f:
        f.write(str(os.getpid()))

def get_lan_ip():
    """Return this machine's primary LAN IP (the address other devices on the network reach)."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None

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

def _find_ollama():
    """Find the ollama binary, checking common macOS install locations beyond PATH."""
    found = shutil.which("ollama")
    if found:
        return found
    for p in (
        "/usr/local/bin/ollama",
        "/opt/homebrew/bin/ollama",
        "/opt/homebrew/sbin/ollama",
        "/usr/bin/ollama",
        os.path.expanduser("~/.ollama/ollama"),
    ):
        if os.path.isfile(p) and os.access(p, os.X_OK):
            return p
    return None

def ensure_ollama():
    """Check if Ollama is reachable; if not (and local mode), try to start it."""
    if _is_remote():
        return True
    if ollama_is_running():
        return True
    ollama_bin = _find_ollama()
    if not ollama_bin:
        # Last resort: try launching Ollama.app (macOS GUI install)
        ollama_app = "/Applications/Ollama.app"
        if os.path.isdir(ollama_app):
            try:
                subprocess.Popen(["open", "-a", "Ollama"], start_new_session=True)
                for _ in range(40):
                    time.sleep(0.5)
                    if ollama_is_running():
                        return True
            except Exception:
                pass
        return False
    try:
        subprocess.Popen(
            [ollama_bin, "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
    except Exception:
        return False
    for _ in range(40):
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

Use the theme above as creative inspiration â€” it is NOT a name. Invent an original codename, real name, powers, appearance, backstory, and personality that embody this theme. Be creative and varied â€” avoid dark/shadow/night defaults unless the theme calls for it.

Return JSON with these fields:
- name: string (invent an original hero codename â€” do NOT use the theme as the name)
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

Use the theme above as creative inspiration â€” it is NOT a name. Invent an original codename, real name, powers, appearance, backstory, and personality that embody this theme. Be creative and varied â€” avoid dark/shadow/night defaults unless the theme calls for it. Explore different genres, elements, and motivations.

Return JSON with these fields:
- name: string (invent an original villain codename â€” do NOT use the theme as the name)
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

# Nonce-keyed captcha store â€” avoids relying on session cookies
_CAPTCHA_STORE: dict = {}  # nonce -> {"answer": str, "exp": float}

@app.after_request
def _cache_headers(response):
    p = request.path
    # Vite assets have content-hash filenames â€” safe to cache for 1 year
    if p.startswith("/assets/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    # Character/team images â€” cache 1 hour; re-upload replaces the file
    elif p.startswith("/api/images/") and request.method == "GET" and response.status_code == 200:
        response.headers["Cache-Control"] = "public, max-age=3600"
    # index.html and API â€” never cache
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
    import random, time
    a = random.randint(2, 9)
    b = random.randint(1, 9)
    answer = str(a + b)
    nonce = base64.urlsafe_b64encode(os.urandom(18)).decode()
    # Purge expired entries then store this one (5-minute window)
    now = time.time()
    expired = [k for k, v in _CAPTCHA_STORE.items() if v["exp"] < now]
    for k in expired:
        _CAPTCHA_STORE.pop(k, None)
    _CAPTCHA_STORE[nonce] = {"answer": answer, "exp": now + 300}
    captcha_q = f"{a} + {b} = ?"
    login_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Forge â€” Sign In</title>
<style>*{{box-sizing:border-box;margin:0;padding:0;}}body{{background:#09090F;color:#F0EAD6;font-family:'Courier New',monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;}}
.box{{width:320px;text-align:center;}}.title{{font-size:18px;font-weight:bold;letter-spacing:.1em;color:#D4AF37;margin-bottom:6px;}}
.sub{{font-size:11px;color:#888;margin-bottom:28px;}}input{{width:100%;padding:12px;background:#111;border:1px solid #333;border-radius:8px;color:#F0EAD6;font-size:14px;text-align:left;margin-bottom:10px;outline:none;}}
input:focus{{border-color:#D4AF37;}}
.cap-row{{display:flex;align-items:center;gap:10px;margin-bottom:10px;}}
.cap-q{{font-size:13px;color:#D4AF37;background:#1a1a2e;border:1px solid #D4AF3750;border-radius:8px;padding:10px 14px;white-space:nowrap;flex-shrink:0;}}
.cap-row input{{margin-bottom:0;flex:1;}}
button{{width:100%;padding:12px;background:#D4AF3720;border:1px solid #D4AF37;border-radius:8px;color:#D4AF37;font-size:12px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;}}
.err{{color:#e74c3c;font-size:11px;margin-top:8px;min-height:16px;}}</style></head>
<body><div class="box"><div class="title">SUPERHERO FORGE</div><div class="sub">Remote access â€” sign in to continue</div>
<input type="text" id="u" placeholder="Username" autocomplete="username" autofocus onkeydown="if(event.key==='Enter')document.getElementById('p').focus()"/>
<input type="password" id="p" placeholder="Password" autocomplete="current-password" onkeydown="if(event.key==='Enter')document.getElementById('c').focus()"/>
<div class="cap-row"><div class="cap-q">{captcha_q}</div><input type="text" id="c" placeholder="Answer" autocomplete="off" inputmode="numeric" onkeydown="if(event.key==='Enter')login()"/></div>
<button onclick="login()">Sign In</button><div class="err" id="e"></div></div>
<script>const _cn='{nonce}';async function login(){{document.getElementById('e').textContent='';const d=await fetch('/api/login',{{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{username:document.getElementById('u').value,password:document.getElementById('p').value,captcha:document.getElementById('c').value,captcha_nonce:_cn}})}}).then(r=>r.json());if(d.ok){{location.href='/';}}else if(d.captcha){{document.getElementById('e').textContent='Wrong answer â€” check your math.';setTimeout(()=>location.reload(),1000);}}else{{document.getElementById('e').textContent='Incorrect username or password.';setTimeout(()=>location.reload(),1200);}}}}</script></body></html>"""
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
    import time
    nonce = data.get("captcha_nonce", "")
    entry = _CAPTCHA_STORE.pop(nonce, None)
    if not entry or entry["exp"] < time.time() or data.get("captcha", "").strip() != entry["answer"]:
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
    lan = get_lan_ip()
    try:
        port = int(request.host.split(":")[-1]) if ":" in request.host else 7432
    except Exception:
        port = 7432
    lan_url = f"http://{lan}:{port}" if lan and lan != "127.0.0.1" else None
    return jsonify({
        "enabled": cfg.get("remote_enabled", False),
        "url": TUNNEL_URL,
        "duck_domain": cfg.get("duck_domain", ""),
        "auth_set": bool(cfg.get("remote_username") and cfg.get("remote_password_hash")),
        "username": cfg.get("remote_username", ""),
        "cloudflared": bool(_find_cloudflared()),
        "lan_ip": lan,
        "lan_url": lan_url,
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

    # Remote was just enabled â€” Flask needs to rebind to 0.0.0.0 (requires restart)
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
    prefix = request.args.get("prefix", "")
    return jsonify({"keys": _list_kv(prefix)})

@app.route("/api/store/<key>", methods=["GET"])
def store_get(key):
    raw = _get_kv_raw(key)
    if raw is None:
        return jsonify({"error": "not found"}), 404
    return jsonify({"key": key, "value": raw})

@app.route("/api/store/<key>", methods=["POST"])
def store_set(key):
    body = request.get_json(silent=True) or {}
    raw = body.get("value", "")
    _set_kv(key, raw)
    return jsonify({"key": key, "value": raw})

@app.route("/api/store/<key>", methods=["DELETE"])
def store_delete(key):
    _del_kv(key)
    return jsonify({"key": key, "deleted": True})

@app.route("/api/validate-name", methods=["POST"])
def validate_name():
    body    = request.get_json(silent=True) or {}
    name    = (body.get("name") or "").strip()
    char_id = (body.get("char_id") or "").strip()
    if not name:
        return jsonify({"available": True})
    name_lower = name.lower()
    all_names  = _collect_all_names()
    for cid, cname in all_names.items():
        if cid == char_id:
            continue
        if (cname or "").strip().lower() == name_lower:
            return jsonify({"available": False, "taken_by": cname})
    return jsonify({"available": True})

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

    def _stream():
        raw_parts = []
        try:
            for token in ollama_stream(model, prompt):
                raw_parts.append(token)
                yield json.dumps({"t": token}) + "\n"
            raw = "".join(raw_parts)
            char = extract_json(raw)
            if "error" in char and "name" not in char:
                yield json.dumps({"error": char["error"], "raw": char.get("raw", raw[:300])}) + "\n"
                return
            char["source_model"] = model
            name = char.get("name", "unknown").replace(" ", "_").lower()
            safe = _safe_name(name) or _safe_name("unknown")
            with open(os.path.join(CHARACTERS_DIR, safe), "w") as f:
                json.dump(char, f, indent=2)
            yield json.dumps({"done": True, "result": char}) + "\n"
        except requests.exceptions.HTTPError as e:
            code = e.response.status_code if e.response is not None else 500
            msg = "Authentication failed. Check your API key." if code == 401 else str(e)
            yield json.dumps({"error": msg}) + "\n"
        except requests.exceptions.ConnectionError:
            msg = "Cannot reach remote API." if _is_remote() else "Ollama is not running."
            yield json.dumps({"error": msg}) + "\n"
        except requests.exceptions.Timeout:
            yield json.dumps({"error": f"Model {model} timed out."}) + "\n"
        except Exception as e:
            yield json.dumps({"error": str(e)}) + "\n"

    return Response(stream_with_context(_stream()), mimetype="application/x-ndjson")


@app.route("/api/generate/villain", methods=["POST"])
def generate_villain():
    data = request.json or {}
    model = _get_model(data)
    extra = data.get("extra", "") or "Surprise me with a creative, varied villain archetype."
    prompt = VILLAIN_PROMPT.format(extra=extra)

    def _stream():
        raw_parts = []
        try:
            for token in ollama_stream(model, prompt):
                raw_parts.append(token)
                yield json.dumps({"t": token}) + "\n"
            raw = "".join(raw_parts)
            char = extract_json(raw)
            if "error" in char and "name" not in char:
                yield json.dumps({"error": char["error"], "raw": char.get("raw", raw[:300])}) + "\n"
                return
            char["source_model"] = model
            name = char.get("name", "unknown").replace(" ", "_").lower()
            safe = _safe_name(name) or _safe_name("unknown")
            with open(os.path.join(CHARACTERS_DIR, safe), "w") as f:
                json.dump(char, f, indent=2)
            yield json.dumps({"done": True, "result": char}) + "\n"
        except requests.exceptions.HTTPError as e:
            code = e.response.status_code if e.response is not None else 500
            msg = "Authentication failed. Check your API key." if code == 401 else str(e)
            yield json.dumps({"error": msg}) + "\n"
        except requests.exceptions.ConnectionError:
            msg = "Cannot reach remote API." if _is_remote() else "Ollama is not running."
            yield json.dumps({"error": msg}) + "\n"
        except requests.exceptions.Timeout:
            yield json.dumps({"error": f"Model {model} timed out."}) + "\n"
        except Exception as e:
            yield json.dumps({"error": str(e)}) + "\n"

    return Response(stream_with_context(_stream()), mimetype="application/x-ndjson")


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
SYSTEM_PROMPT = "You are a creative writing assistant specializing in superhero fiction. When asked to return JSON, return ONLY valid JSON â€” no markdown fences, no preamble, no explanation. The JSON must be complete and parseable."

def _ndjson_text(text):
    """Return a streaming NDJSON response with a single {t} chunk â€” matches callAI's parser."""
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
# API: Universe Timeline
# ---------------------------------------------------------------------------
@app.route("/api/timeline", methods=["GET"])
def get_timeline():
    events = _get_kv("forge-timeline") or []
    if not isinstance(events, list):
        events = []
    return jsonify(events)

@app.route("/api/timeline", methods=["POST"])
def add_timeline_event():
    data = request.get_json() or {}
    events = _get_kv("forge-timeline") or []
    if not isinstance(events, list):
        events = []
    event = {
        "id": str(int(time.time() * 1000)),
        "year": (data.get("year") or "").strip(),
        "title": (data.get("title") or "").strip(),
        "description": (data.get("description") or "").strip(),
        "type": data.get("type", "other"),
    }
    if not event["title"]:
        return jsonify({"error": "title is required"}), 400
    events.append(event)
    events.sort(key=lambda e: e.get("year", "") or "")
    _set_kv("forge-timeline", json.dumps(events))
    return jsonify(event), 201

@app.route("/api/timeline/<event_id>", methods=["DELETE"])
def delete_timeline_event(event_id):
    events = _get_kv("forge-timeline") or []
    if not isinstance(events, list):
        events = []
    events = [e for e in events if e.get("id") != event_id]
    _set_kv("forge-timeline", json.dumps(events))
    return jsonify({"deleted": event_id})

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
# API: Universe Dossier â€” all teams, solo heroes, villains, relations
# ---------------------------------------------------------------------------
@app.route("/api/export-all-pdf", methods=["POST"])
def export_all_pdf():
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

    data        = request.get_json() or {}
    sections    = data.get("sections", [])
    images      = data.get("images", {})
    family_links = data.get("familyLinks", [])
    hero_assocs  = data.get("heroAssocs", [])
    all_chars    = data.get("allChars", [])

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
    BLUE  = colors.Color(0.37, 0.64, 1.00)

    ALIGN_COLORS = {
        "base":"#534AB7","member":"#534AB7","allied":"#0F6E56",
        "rival":"#BA7517","enemy":"#8B1A1A","neutral":"#888780","splinter":"#993C1D",
    }
    ALIGN_LABELS = {
        "base":"NK Member","member":"NK Member","allied":"Allied with NK",
        "rival":"NK Rival","enemy":"NK Enemy","neutral":"Neutral","splinter":"NK Splinter",
    }

    _style_cache = {}
    def sty(name, size=10, color=LIGHT, bold=False, align=TA_LEFT, leading=None):
        key = (name, size, color, bold, align, leading)
        if key not in _style_cache:
            _style_cache[key] = ParagraphStyle(name, fontSize=size, textColor=color,
                fontName="Helvetica-Bold" if bold else "Helvetica",
                alignment=align, leading=leading or size*1.35)
        return _style_cache[key]

    char_name = {c["id"]: c.get("heroName","Unknown") for c in all_chars}

    story = []

    # â”€â”€ Universe cover â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    total = sum(len(s.get("members",[])) for s in sections)
    story.append(Spacer(1, 1.4*inch))
    story.append(Paragraph("NOCTURNAL KNIGHTS", sty("ucv_title", 28, GOLD, True, TA_CENTER)))
    story.append(Spacer(1, 0.06*inch))
    story.append(HRFlowable(width="60%", thickness=1, color=GOLD, hAlign="CENTER"))
    story.append(Spacer(1, 0.08*inch))
    story.append(Paragraph("UNIVERSE DOSSIER", sty("ucv_sub", 14, LIGHT, False, TA_CENTER)))
    story.append(Spacer(1, 0.22*inch))
    story.append(Paragraph("COMPLETE CHARACTER REGISTRY", sty("ucv_note", 9, MUTED, False, TA_CENTER)))
    story.append(Spacer(1, 0.18*inch))

    if sections:
        rows = []
        for s in sections:
            sc = rcolor(s.get("color","#888780"))
            rows.append([
                Paragraph(s.get("name","").upper(), sty("ucv_sl", 9, sc, True)),
                Paragraph(f"{len(s.get('members',[]))} characters", sty("ucv_sc", 9, MUTED, False, TA_RIGHT)),
            ])
        rows.append([
            Paragraph("TOTAL", sty("ucv_tot", 9, GOLD, True)),
            Paragraph(f"{total} characters", sty("ucv_totn", 9, GOLD, True, TA_RIGHT)),
        ])
        tbl = Table(rows, colWidths=["70%","30%"])
        tbl.setStyle(TableStyle([
            ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
            ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
            ("LINEBELOW",(0,0),(-1,-2),0.25,colors.Color(0.18,0.18,0.22)),
        ]))
        story.append(tbl)

    story.append(Spacer(1, 1.8*inch))
    story.append(Paragraph("FOR INTERNAL USE ONLY  Â·  CLASSIFIED", sty("ucv_warn", 8, colors.Color(0.4,0.4,0.4), False, TA_CENTER)))

    # â”€â”€ Member dossier helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    def add_member(member, sec_name, sec_color, idx):
        story.append(PageBreak())
        acc   = member.get("color", sec_color)
        ACC   = rcolor(acc)
        num   = member.get("number","")
        name  = member.get("heroName","Unknown")
        real  = member.get("realName","")
        role  = member.get("role","")
        tag   = member.get("tagline","")
        orig  = member.get("origin","")
        stats = member.get("stats",{})
        pows  = member.get("powers",[])
        dna   = member.get("dna",[])
        is_v  = member.get("isVillain",False)
        m_team     = member.get("teamName", sec_name)
        m_team_c   = member.get("teamColor", sec_color)
        nk_aln     = member.get("nkAlignment","neutral")
        affiliations    = member.get("affiliations",[])
        shared_villains = member.get("sharedVillains",[])
        appearance      = member.get("appearance","")

        align_color = ALIGN_COLORS.get(nk_aln,"#888780")
        align_label = ALIGN_LABELS.get(nk_aln,"Neutral")
        ALIGN_C = rcolor(align_color)

        p = f"m{idx}"
        hdr_txt = "â€” CLASSIFIED THREAT â€”" if is_v else f"{m_team.upper()} Â· {num}"
        hd = Table([[
            Paragraph(hdr_txt, sty(f"{p}h1", 7, rcolor(acc), False, TA_LEFT)),
            Paragraph(role,    sty(f"{p}h2", 7, MUTED,       False, TA_RIGHT)),
        ]], colWidths=["60%","40%"])
        hd.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1), colors.Color(*[x*0.18 for x in hex2rgb(acc)])),
            ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
            ("LEFTPADDING",(0,0),(0,-1),8),("RIGHTPADDING",(-1,0),(-1,-1),8),
            ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ]))
        story.append(hd)
        story.append(Spacer(1, 0.1*inch))

        img_cell = Spacer(1,1)
        img_b64  = images.get(member.get("id",""))
        if img_b64:
            try:
                if "," in img_b64: img_b64 = img_b64.split(",",1)[1]
                rl_img = RLImage(io.BytesIO(base64.b64decode(img_b64)), width=2.1*inch, height=3.0*inch)
                rl_img.hAlign = "LEFT"
                img_cell = rl_img
            except Exception: pass

        info = []
        info.append(Paragraph(name, sty(f"{p}n", 22, LIGHT, True)))
        if real:  info.append(Paragraph(real, sty(f"{p}r", 10, MUTED)))
        if role:  info.append(Paragraph(role.upper(), sty(f"{p}ro", 8, GOLD, False, TA_LEFT, 12)))
        info.append(Spacer(1,5))
        at = Table([[
            Paragraph("NK ALIGNMENT", sty(f"{p}al", 7, MUTED)),
            Paragraph(align_label, sty(f"{p}alv", 8, ALIGN_C, True, TA_RIGHT)),
        ]], colWidths=["50%","50%"])
        at.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1), colors.Color(*[x*0.12 for x in hex2rgb(align_color)])),
            ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
            ("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
        ]))
        info.append(at)
        info.append(Spacer(1,6))
        if tag:
            info.append(HRFlowable(width="100%", thickness=0.5, color=ACC))
            info.append(Spacer(1,3))
            info.append(Paragraph(f'<i>â€œ{tag}â€</i>', sty(f"{p}tg", 10, colors.Color(0.8,0.8,0.75), False, TA_LEFT, 14)))
            info.append(Spacer(1,7))
        if stats:
            info.append(Paragraph("COMBAT STATS", sty(f"{p}sl", 7, MUTED)))
            info.append(Spacer(1,3))
            for sn, sv in stats.items():
                rt = Table([[Paragraph(sn.upper(), sty(f"{p}sn{sn}",8,MUTED)), Paragraph(str(sv), sty(f"{p}sv{sn}",8,LIGHT,True,TA_RIGHT))]], colWidths=["60%","40%"])
                rt.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),1),("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
                info.append(rt)
                bw = 3.0*inch
                fw = max(bw*(sv/100), 0.01)
                bt = Table([[""]], colWidths=[bw], rowHeights=[3])
                bt.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.Color(0.12,0.12,0.18)),("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
                ft = Table([[""]], colWidths=[fw], rowHeights=[3])
                ft.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),ACC),("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
                info.append(bt)
                info.append(Spacer(1,-3))
                info.append(ft)
                info.append(Spacer(1,3))

        mt = Table([[img_cell, info]], colWidths=[2.3*inch, 4.8*inch])
        mt.setStyle(TableStyle([
            ("VALIGN",(0,0),(-1,-1),"TOP"),
            ("LEFTPADDING",(0,0),(0,-1),0),("RIGHTPADDING",(0,0),(0,-1),10),
            ("LEFTPADDING",(1,0),(1,-1),0),("RIGHTPADDING",(1,0),(1,-1),0),
            ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
        ]))
        story.append(mt)
        story.append(Spacer(1, 0.14*inch))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.Color(*[x*0.35 for x in hex2rgb(acc)])))
        story.append(Spacer(1, 0.1*inch))

        if pows:
            story.append(Paragraph("ABILITIES", sty(f"{p}pl",7,MUTED)))
            story.append(Spacer(1,5))
            pr = [[Paragraph(pw.get("name",""), sty(f"{p}pn{i}",10,LIGHT,True)), Paragraph(pw.get("desc",""), sty(f"{p}pd{i}",9,MUTED,False,TA_LEFT,13))] for i,pw in enumerate(pows)]
            pt = Table(pr, colWidths=[1.8*inch,5.3*inch])
            pt.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3),("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),("LINEBELOW",(0,0),(-1,-2),0.25,colors.Color(0.15,0.15,0.2))]))
            story.append(pt)
            story.append(Spacer(1, 0.1*inch))
        if orig:
            story.append(Paragraph("ORIGIN", sty(f"{p}ol",7,MUTED)))
            story.append(Spacer(1,3))
            story.append(Paragraph(orig, sty(f"{p}ot",9,MUTED,False,TA_LEFT,14)))
            story.append(Spacer(1, 0.08*inch))
        if appearance:
            story.append(Paragraph("APPEARANCE", sty(f"{p}ap",7,MUTED)))
            story.append(Spacer(1,3))
            story.append(Paragraph(appearance, sty(f"{p}apt",9,MUTED,False,TA_LEFT,14)))
            story.append(Spacer(1, 0.08*inch))
        if dna:
            story.append(Paragraph("DNA: " + " Â· ".join(dna), sty(f"{p}dt",8,GOLD)))
            story.append(Spacer(1, 0.08*inch))
        if affiliations:
            story.append(Paragraph("AFFILIATIONS", sty(f"{p}afl",7,MUTED)))
            story.append(Spacer(1,3))
            story.append(Paragraph("  Â·  ".join([f"{a.get('teamName','')} ({a.get('role','')})" for a in affiliations]), sty(f"{p}afv",8,GOLD)))
            story.append(Spacer(1, 0.08*inch))
        if shared_villains:
            story.append(HRFlowable(width="100%", thickness=0.5, color=RED))
            story.append(Spacer(1,3))
            story.append(Paragraph("âš  SHARED THREAT: " + " Â· ".join(shared_villains), sty(f"{p}sv",8,colors.Color(0.8,0.2,0.2),True)))
            story.append(Spacer(1, 0.06*inch))

        story.append(Spacer(1, 0.1*inch))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.Color(*[x*0.22 for x in hex2rgb(acc)])))
        story.append(Spacer(1,3))
        ftr = Table([[
            Paragraph(f"{m_team.upper()} Â· CLASSIFIED", sty(f"{p}ft",7,colors.Color(0.3,0.3,0.3))),
            Paragraph(num, sty(f"{p}fn",16,colors.Color(*[x*0.25 for x in hex2rgb(acc)]),True,TA_RIGHT)),
        ]], colWidths=["85%","15%"])
        ftr.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
        story.append(ftr)

    # â”€â”€ Section cover + member pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    global_idx = 0
    for si, section in enumerate(sections):
        sec_type  = section.get("type","team")
        sec_name  = section.get("name","Section")
        sec_color = section.get("color","#888780")
        members   = section.get("members",[])
        SEC_C     = rcolor(sec_color)

        story.append(PageBreak())
        story.append(Spacer(1, 1.8*inch))

        if sec_type == "villains":
            story.append(Paragraph("THREAT REGISTRY", sty(f"sc{si}t", 24, RED, True, TA_CENTER)))
            story.append(Spacer(1, 0.1*inch))
            story.append(HRFlowable(width="50%", thickness=1, color=RED, hAlign="CENTER"))
            story.append(Spacer(1, 0.1*inch))
            story.append(Paragraph(f"{len(members)} CLASSIFIED HOSTILE SUBJECTS", sty(f"sc{si}s", 9, MUTED, False, TA_CENTER)))
        elif sec_type == "solo":
            story.append(Paragraph("INDEPENDENT OPERATIVES", sty(f"sc{si}t", 22, LIGHT, True, TA_CENTER)))
            story.append(Spacer(1, 0.1*inch))
            story.append(HRFlowable(width="50%", thickness=1, color=SEC_C, hAlign="CENTER"))
            story.append(Spacer(1, 0.1*inch))
            story.append(Paragraph(f"{len(members)} SOLO OPERATIVES  Â·  NO TEAM AFFILIATION", sty(f"sc{si}s", 9, MUTED, False, TA_CENTER)))
        else:
            story.append(Paragraph(sec_name.upper(), sty(f"sc{si}t", 26, GOLD, True, TA_CENTER)))
            story.append(Spacer(1, 0.1*inch))
            story.append(HRFlowable(width="50%", thickness=1, color=SEC_C, hAlign="CENTER"))
            story.append(Spacer(1, 0.1*inch))
            story.append(Paragraph(f"{len(members)} REGISTERED MEMBERS", sty(f"sc{si}s", 9, MUTED, False, TA_CENTER)))

        story.append(Spacer(1, 2.4*inch))
        story.append(Paragraph(f"SECTION {si+1} OF {len(sections)}", sty(f"sc{si}n", 7, colors.Color(0.3,0.3,0.3), False, TA_CENTER)))

        for member in members:
            add_member(member, sec_name, sec_color, global_idx)
            global_idx += 1

    # â”€â”€ Relations appendix â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if family_links or hero_assocs:
        story.append(PageBreak())
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph("RELATIONS REGISTRY", sty("rap_t", 22, GOLD, True, TA_CENTER)))
        story.append(Spacer(1, 0.08*inch))
        story.append(HRFlowable(width="55%", thickness=1, color=GOLD, hAlign="CENTER"))
        story.append(Spacer(1, 0.28*inch))

        if family_links:
            story.append(Paragraph("FAMILY BONDS", sty("rap_fh", 9, MUTED, True)))
            story.append(Spacer(1, 8))
            rows = []
            for lk in family_links:
                an = char_name.get(lk.get("a",""), lk.get("a","?"))
                bn = char_name.get(lk.get("b",""), lk.get("b","?"))
                lid = lk.get("id","")
                rows.append([
                    Paragraph(an, sty(f"fla{lid}", 9, LIGHT, True)),
                    Paragraph(f"{lk.get('aRelation','')}  /  {lk.get('bRelation','')}", sty(f"flr{lid}", 8, GOLD, False, TA_CENTER)),
                    Paragraph(bn, sty(f"flb{lid}", 9, LIGHT, True, TA_RIGHT)),
                ])
            ft = Table(rows, colWidths=["35%","30%","35%"])
            ft.setStyle(TableStyle([
                ("ALIGN",(0,0),(0,-1),"LEFT"),("ALIGN",(2,0),(2,-1),"RIGHT"),
                ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
                ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
                ("LEFTPADDING",(0,0),(-1,-1),4),("RIGHTPADDING",(0,0),(-1,-1),4),
                ("LINEBELOW",(0,0),(-1,-2),0.25,colors.Color(0.18,0.18,0.22)),
            ]))
            story.append(ft)
            story.append(Spacer(1, 0.3*inch))

        if hero_assocs:
            story.append(Paragraph("HERO ASSOCIATIONS", sty("rap_hah", 9, MUTED, True)))
            story.append(Spacer(1, 8))
            rows2 = []
            for ha in hero_assocs:
                an = char_name.get(ha.get("a",""), ha.get("a","?"))
                bn = char_name.get(ha.get("b",""), ha.get("b","?"))
                hid = ha.get("id","")
                rows2.append([
                    Paragraph(an, sty(f"haa{hid}", 9, LIGHT, True)),
                    Paragraph(f"{ha.get('aRelation','')}  /  {ha.get('bRelation','')}", sty(f"har{hid}", 8, BLUE, False, TA_CENTER)),
                    Paragraph(bn, sty(f"hab{hid}", 9, LIGHT, True, TA_RIGHT)),
                ])
            ht = Table(rows2, colWidths=["35%","30%","35%"])
            ht.setStyle(TableStyle([
                ("ALIGN",(0,0),(0,-1),"LEFT"),("ALIGN",(2,0),(2,-1),"RIGHT"),
                ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
                ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
                ("LEFTPADDING",(0,0),(-1,-1),4),("RIGHTPADDING",(0,0),(-1,-1),4),
                ("LINEBELOW",(0,0),(-1,-2),0.25,colors.Color(0.18,0.18,0.22)),
            ]))
            story.append(ht)

    def bg(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(VOID)
        canvas.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
        canvas.restoreState()

    doc.build(story, onFirstPage=bg, onLaterPages=bg)
    buf.seek(0)
    return send_file(buf, mimetype="application/pdf",
        as_attachment=True, download_name="forge-universe-dossier.pdf")

# ---------------------------------------------------------------------------
# API: Encyclopedia PDF Export
# ---------------------------------------------------------------------------
@app.route("/api/export-encyclopedia", methods=["POST"])
def export_encyclopedia():
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

    data          = request.get_json() or {}
    sections      = data.get("sections", [])
    images        = data.get("images", {})
    family_links  = data.get("familyLinks", [])
    hero_assocs   = data.get("heroAssocs", [])
    all_chars     = data.get("allChars", [])
    universe_data = data.get("universeData", {}) or {}
    universe_name = universe_data.get("universeName") or "NOCTURNAL KNIGHTS"

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter,
        rightMargin=0.55*inch, leftMargin=0.55*inch,
        topMargin=0.5*inch, bottomMargin=0.5*inch)

    def hex2rgb(h):
        h = h.lstrip("#")
        return tuple(int(h[i:i+2], 16)/255 for i in (0, 2, 4))
    def rcolor(h):
        try: return colors.Color(*hex2rgb(h))
        except: return colors.Color(0.33, 0.29, 0.72)
    def safe(text, fallback=""):
        if not text: return fallback
        return str(text).replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")

    INK   = colors.Color(0.04, 0.04, 0.08)
    PAPER = colors.Color(0.94, 0.92, 0.86)
    GOLD  = colors.Color(0.83, 0.69, 0.22)
    MUTED = colors.Color(0.50, 0.48, 0.44)
    RED   = colors.Color(0.55, 0.10, 0.10)
    BLUE  = colors.Color(0.37, 0.64, 1.00)

    ALIGN_LABELS = {
        "base":"NK Member","member":"NK Member","allied":"Allied",
        "rival":"NK Rival","enemy":"Enemy","neutral":"Neutral","splinter":"Splinter",
    }
    POWER_TYPE_LABELS = {"powers":"Powers","equipment":"Arsenal","skills":"Skills"}
    HERO_TYPE_LABELS  = {"hero":"Hero","anti-hero":"Anti-Hero","reluctant":"Reluctant Hero"}

    RACE_MAP = {
        "human":"Human","a_gene_mutate":"A-Gene Mutant","auranthi":"Auranthi",
        "zyrenian":"Zyrenian","dravosi":"Dravosi","human_mutate":"Mutate",
        "android":"Android","cyborg":"Cyborg","alien_other":"Alien","symbiote":"Symbiote",
    }
    def race_lbl(race):
        if not race: return ""
        if isinstance(race, dict):
            parts = [RACE_MAP.get(race.get("main",""),str(race.get("main","")).replace("_"," ").title())]
            if race.get("sub"): parts.append(RACE_MAP.get(race["sub"],str(race["sub"]).replace("_"," ").title()))
            return " / ".join(p for p in parts if p)
        return RACE_MAP.get(str(race), str(race).replace("_"," ").title())

    _sc = {}
    def sty(name, size=10, color=PAPER, bold=False, align=TA_LEFT, leading=None, italic=False):
        key = (name, size, id(color), bold, align, leading, italic)
        if key not in _sc:
            if bold and italic: fn = "Helvetica-BoldOblique"
            elif bold:          fn = "Helvetica-Bold"
            elif italic:        fn = "Helvetica-Oblique"
            else:               fn = "Helvetica"
            _sc[key] = ParagraphStyle(name, fontSize=size, textColor=color,
                fontName=fn, alignment=align, leading=leading or size*1.4,
                spaceAfter=0, spaceBefore=0)
        return _sc[key]

    char_name = {c["id"]: c.get("heroName","?") for c in all_chars}
    alpha_index = []   # (heroName, realName, teamName, isVillain, color)
    story = []

    # â”€â”€ Cover â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    total_chars = sum(len(s.get("members",[])) for s in sections)
    story.append(Spacer(1, 1.1*inch))
    story.append(Paragraph(universe_name.upper(), sty("cv_u", 9, GOLD, False, TA_CENTER)))
    story.append(Spacer(1, 0.1*inch))
    story.append(HRFlowable(width="38%", thickness=0.5, color=GOLD, hAlign="CENTER"))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("CHARACTER ENCYCLOPEDIA", sty("cv_t", 30, PAPER, True, TA_CENTER, 36)))
    story.append(Spacer(1, 0.12*inch))
    story.append(HRFlowable(width="80%", thickness=1.5, color=GOLD, hAlign="CENTER"))
    story.append(Spacer(1, 0.12*inch))
    story.append(Paragraph("Complete Universe Reference Guide", sty("cv_s", 12, MUTED, False, TA_CENTER, 18)))
    story.append(Spacer(1, 0.36*inch))

    if sections:
        cv_rows = []
        for sec in sections:
            sc_c = rcolor(sec.get("color","#888780"))
            stype = sec.get("type","team")
            label = ("THREAT REGISTRY" if stype=="villains"
                     else ("INDEPENDENT OPERATIVES" if stype=="solo"
                           else sec.get("name","").upper()))
            cv_rows.append([
                Paragraph(label, sty(f"cl_{label}", 9, sc_c, True)),
                Paragraph(f"{len(sec.get('members',[]))} entries", sty(f"clc_{label}", 8, MUTED, False, TA_RIGHT)),
            ])
        cv_rows.append([
            Paragraph("TOTAL ENTRIES", sty("cl_tot", 9, GOLD, True)),
            Paragraph(str(total_chars), sty("clc_tot", 9, GOLD, True, TA_RIGHT)),
        ])
        cv_tbl = Table(cv_rows, colWidths=["70%","30%"])
        cv_tbl.setStyle(TableStyle([
            ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
            ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
            ("LINEBELOW",(0,0),(-1,-2),0.25,colors.Color(0.18,0.18,0.22)),
        ]))
        story.append(cv_tbl)

    story.append(Spacer(1, 1.4*inch))
    story.append(Paragraph(f"Forge Reference  Â·  {total_chars} Entries", sty("cv_ft", 8, MUTED, False, TA_CENTER)))

    # â”€â”€ Character entries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    global_idx = 0
    for si, section in enumerate(sections):
        sec_type   = section.get("type","team")
        sec_name   = section.get("name","Section")
        sec_color  = section.get("color","#888780")
        members    = section.get("members",[])
        SEC_C      = rcolor(sec_color)
        is_villain_section = sec_type == "villains"

        # Section divider
        story.append(PageBreak())
        story.append(Spacer(1, 1.8*inch))
        if is_villain_section:
            story.append(Paragraph("THREAT REGISTRY", sty(f"sd{si}t", 26, RED, True, TA_CENTER)))
        elif sec_type == "solo":
            story.append(Paragraph("INDEPENDENT OPERATIVES", sty(f"sd{si}t", 22, PAPER, True, TA_CENTER)))
        else:
            story.append(Paragraph(sec_name.upper(), sty(f"sd{si}t", 28, GOLD, True, TA_CENTER)))
        story.append(Spacer(1, 0.1*inch))
        story.append(HRFlowable(width="55%", thickness=1.5, color=SEC_C, hAlign="CENTER"))
        story.append(Spacer(1, 0.12*inch))
        story.append(Paragraph(f"{len(members)} {'CLASSIFIED ENTRIES' if is_villain_section else 'ENTRIES'}", sty(f"sd{si}s", 9, MUTED, False, TA_CENTER)))
        story.append(Spacer(1, 2.0*inch))
        story.append(HRFlowable(width="28%", thickness=0.5, color=colors.Color(0.18,0.18,0.24), hAlign="CENTER"))
        story.append(Spacer(1, 0.08*inch))
        story.append(Paragraph(f"VOL. {si+1}  Â·  {universe_name.upper()}", sty(f"sd{si}v", 7, MUTED, False, TA_CENTER)))

        for member in members:
            alpha_index.append((
                member.get("heroName","Unknown"),
                member.get("realName",""),
                sec_name,
                is_villain_section,
                member.get("color", sec_color),
            ))
            story.append(PageBreak())
            p = f"e{global_idx}"
            acc   = member.get("color", sec_color)
            ACC   = rcolor(acc)
            name  = safe(member.get("heroName","Unknown"))
            real  = safe(member.get("realName",""))
            role  = safe(member.get("role",""))
            tag   = safe(member.get("tagline",""))
            orig  = safe(member.get("origin",""))
            apptx = safe(member.get("appearance",""))
            stats = member.get("stats",{})
            pows  = member.get("powers",[])
            is_v  = member.get("isVillain",False)
            num   = safe(member.get("number",""))
            gender     = safe(member.get("gender",""))
            birth_year = safe(member.get("birthYear",""))
            age        = safe(member.get("age",""))
            hometown   = safe(member.get("hometown",""))
            base_ops   = safe(member.get("baseOfOps",""))
            race_str   = safe(race_lbl(member.get("race")))
            hero_type  = HERO_TYPE_LABELS.get(member.get("heroType","hero"), "Hero")
            power_type = POWER_TYPE_LABELS.get(member.get("powerType","powers"), "Powers")
            nk_aln     = member.get("nkAlignment","neutral")
            m_team     = safe(member.get("teamName", sec_name))
            insps      = [str(x).strip() for x in (member.get("inspirations") or []) if x and str(x).strip()]
            dna        = member.get("dna",[])
            shared_v   = member.get("sharedVillains",[])

            # Header banner
            hdr_left  = "â€” CLASSIFIED THREAT â€”" if is_v else m_team.upper()
            hdr_right = f"#{num}" if num else role.upper()
            hdr = Table([[
                Paragraph(hdr_left,  sty(f"{p}hl", 7, ACC, False)),
                Paragraph(hdr_right, sty(f"{p}hr", 7, MUTED, False, TA_RIGHT)),
            ]], colWidths=["70%","30%"])
            hdr.setStyle(TableStyle([
                ("BACKGROUND",(0,0),(-1,-1), colors.Color(*[x*0.15 for x in hex2rgb(acc)])),
                ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
                ("LEFTPADDING",(0,0),(0,-1),8),("RIGHTPADDING",(-1,0),(-1,-1),8),
                ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
            ]))
            story.append(hdr)
            story.append(Spacer(1, 0.1*inch))

            # Name block
            story.append(Paragraph(name, sty(f"{p}nm", 26, PAPER, True, TA_LEFT, 30)))
            if real: story.append(Paragraph(real, sty(f"{p}rn", 10, MUTED)))
            if tag:
                story.append(Spacer(1, 4))
                story.append(Paragraph(f'"{tag}"', sty(f"{p}tg", 10, colors.Color(0.76,0.74,0.68), False, TA_LEFT, 14, italic=True)))
            story.append(Spacer(1, 0.1*inch))
            story.append(HRFlowable(width="100%", thickness=1, color=ACC))
            story.append(Spacer(1, 0.1*inch))

            # Image
            img_cell = Spacer(1, 1)
            img_b64  = images.get(member.get("id",""))
            if img_b64:
                try:
                    if "," in img_b64: img_b64 = img_b64.split(",",1)[1]
                    rl_img = RLImage(io.BytesIO(base64.b64decode(img_b64)), width=2.1*inch, height=2.9*inch)
                    rl_img.hAlign = "LEFT"
                    img_cell = rl_img
                except Exception: pass

            # Data file key-value pairs
            def dr(label, value):
                if not value: return None
                return [
                    Paragraph(label, sty(f"{p}dl{label}", 7.5, ACC, True)),
                    Paragraph(value, sty(f"{p}dv{label}", 8.5, PAPER, False, TA_LEFT, 12)),
                ]
            age_display = age or (f"b. {birth_year}" if birth_year else "")
            type_display = f"{hero_type} Â· {power_type}" if not is_v else None
            align_display = ALIGN_LABELS.get(nk_aln, nk_aln.title()) if not is_v else "HOSTILE THREAT"
            data_rows = [r for r in [
                dr("REAL NAME",          real),
                dr("ROLE",               role),
                dr("TEAM",               m_team if not is_v else None),
                dr("SPECIES / RACE",     race_str),
                dr("GENDER",             gender),
                dr("AGE",                age_display),
                dr("HOMETOWN",           hometown),
                dr("BASE OF OPERATIONS", base_ops),
                dr("TYPE",               type_display),
                dr("ALIGNMENT",          align_display),
                dr("DNA",                " Â· ".join(dna) if dna else None),
                dr("INSPIRED BY",        " Â· ".join(insps) if insps else None),
            ] if r is not None]

            df_content = []
            if data_rows:
                df_tbl = Table(data_rows, colWidths=[1.3*inch, 3.1*inch])
                df_tbl.setStyle(TableStyle([
                    ("VALIGN",(0,0),(-1,-1),"TOP"),
                    ("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3),
                    ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
                    ("LINEBELOW",(0,0),(-1,-2),0.25,colors.Color(0.14,0.14,0.20)),
                ]))
                df_content = [df_tbl]

            body = Table([[img_cell, df_content]], colWidths=[2.2*inch, 4.6*inch])
            body.setStyle(TableStyle([
                ("VALIGN",(0,0),(-1,-1),"TOP"),
                ("LEFTPADDING",(0,0),(0,-1),0),("RIGHTPADDING",(0,0),(0,-1),12),
                ("LEFTPADDING",(1,0),(1,-1),0),("RIGHTPADDING",(1,0),(1,-1),0),
                ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
            ]))
            story.append(body)
            story.append(Spacer(1, 0.12*inch))

            # Stats â€” compact horizontal row
            if stats:
                stat_items = list(stats.items())
                stat_cells = [Paragraph(
                    f'{sn.upper()}<br/><font size="11"><b>{sv}</b></font>',
                    sty(f"{p}st{sn}", 7, MUTED, False, TA_CENTER, 12)
                ) for sn, sv in stat_items]
                while len(stat_cells) < 5: stat_cells.append(Spacer(1,1))
                st = Table([stat_cells[:5]], colWidths=[1.38*inch]*5)
                st.setStyle(TableStyle([
                    ("ALIGN",(0,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"MIDDLE"),
                    ("BACKGROUND",(0,0),(-1,-1), colors.Color(*[x*0.12 for x in hex2rgb(acc)])),
                    ("BOX",(0,0),(-1,-1),0.5, colors.Color(*[x*0.4 for x in hex2rgb(acc)])),
                    ("INNERGRID",(0,0),(-1,-1),0.25, colors.Color(0.12,0.12,0.18)),
                    ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
                    ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
                ]))
                story.append(Paragraph("STATS", sty(f"{p}stlbl", 7, MUTED)))
                story.append(Spacer(1, 3))
                story.append(st)
                story.append(Spacer(1, 0.1*inch))

            # Powers / Arsenal / Skills
            if pows:
                story.append(HRFlowable(width="100%", thickness=0.5, color=colors.Color(0.15,0.15,0.22)))
                story.append(Spacer(1, 0.08*inch))
                pow_lbl = "ARSENAL" if power_type=="Arsenal" else ("SKILLS & ABILITIES" if power_type=="Skills" else "POWERS & ABILITIES")
                story.append(Paragraph(pow_lbl, sty(f"{p}powlbl", 7, MUTED)))
                story.append(Spacer(1, 4))
                pow_rows = [
                    [Paragraph(safe(pw.get("name","")), sty(f"{p}pn{i}", 9.5, PAPER, True)),
                     Paragraph(safe(pw.get("desc","")), sty(f"{p}pd{i}", 9, MUTED, False, TA_LEFT, 13))]
                    for i, pw in enumerate(pows)
                ]
                pow_tbl = Table(pow_rows, colWidths=[1.8*inch, 5.1*inch])
                pow_tbl.setStyle(TableStyle([
                    ("VALIGN",(0,0),(-1,-1),"TOP"),
                    ("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3),
                    ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
                    ("LINEBELOW",(0,0),(-1,-2),0.25,colors.Color(0.14,0.14,0.20)),
                ]))
                story.append(pow_tbl)
                story.append(Spacer(1, 0.1*inch))

            # Origin
            if orig:
                story.append(HRFlowable(width="100%", thickness=0.5, color=colors.Color(0.15,0.15,0.22)))
                story.append(Spacer(1, 0.08*inch))
                story.append(Paragraph("ORIGIN", sty(f"{p}orlbl", 7, MUTED)))
                story.append(Spacer(1, 3))
                story.append(Paragraph(orig, sty(f"{p}or", 9.5, MUTED, False, TA_LEFT, 15)))
                story.append(Spacer(1, 0.08*inch))

            # Appearance
            if apptx:
                story.append(Paragraph("APPEARANCE", sty(f"{p}aplbl", 7, MUTED)))
                story.append(Spacer(1, 3))
                story.append(Paragraph(apptx, sty(f"{p}ap", 9.5, MUTED, False, TA_LEFT, 15)))
                story.append(Spacer(1, 0.08*inch))

            # Shared threats
            if shared_v:
                story.append(HRFlowable(width="100%", thickness=0.5, color=RED))
                story.append(Spacer(1, 4))
                story.append(Paragraph("&#9888; SHARED THREAT: " + " Â· ".join(shared_v), sty(f"{p}sv", 8, colors.Color(0.8,0.2,0.2), True)))
                story.append(Spacer(1, 0.06*inch))

            # Footer
            story.append(Spacer(1, 0.08*inch))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.Color(*[x*0.22 for x in hex2rgb(acc)])))
            story.append(Spacer(1, 3))
            foot = Table([[
                Paragraph(f"{m_team.upper()}  Â·  {universe_name.upper()}", sty(f"{p}ft", 7, MUTED)),
                Paragraph(num, sty(f"{p}fn", 14, colors.Color(*[x*0.3 for x in hex2rgb(acc)]), True, TA_RIGHT)),
            ]], colWidths=["88%","12%"])
            foot.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
            story.append(foot)
            global_idx += 1

    # â”€â”€ Alphabetical Index â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if alpha_index:
        story.append(PageBreak())
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph("CHARACTER INDEX", sty("idx_t", 20, GOLD, True, TA_CENTER)))
        story.append(Spacer(1, 0.06*inch))
        story.append(HRFlowable(width="50%", thickness=1, color=GOLD, hAlign="CENTER"))
        story.append(Spacer(1, 0.08*inch))
        story.append(Paragraph("Alphabetical by hero name", sty("idx_sub", 8, MUTED, False, TA_CENTER)))
        story.append(Spacer(1, 0.22*inch))

        sorted_idx = sorted(alpha_index, key=lambda x: x[0].upper())
        current_letter = ""
        pending_rows   = []

        def flush_rows(rows):
            if not rows: return
            t = Table(rows, colWidths=[2.9*inch, 2.0*inch, 1.9*inch])
            t.setStyle(TableStyle([
                ("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3),
                ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),4),
                ("LINEBELOW",(0,0),(-1,-2),0.25,colors.Color(0.14,0.14,0.20)),
            ]))
            story.append(t)

        for (hero_nm, real_nm, team_nm, villain_flag, char_color) in sorted_idx:
            first = hero_nm[0].upper() if hero_nm else "?"
            if first != current_letter:
                flush_rows(pending_rows); pending_rows = []
                if current_letter: story.append(Spacer(1, 6))
                story.append(Paragraph(first, sty(f"idxl{first}", 14, GOLD, True)))
                story.append(Spacer(1, 2))
                current_letter = first
            acc_c = rcolor(char_color)
            pending_rows.append([
                Paragraph(safe(hero_nm), sty(f"idxn{hero_nm}", 9, PAPER, True)),
                Paragraph(safe(real_nm), sty(f"idxr{hero_nm}", 8.5, MUTED)),
                Paragraph(("&#9888; " if villain_flag else "") + safe(team_nm),
                          sty(f"idxt{hero_nm}", 8, colors.Color(0.7,0.2,0.2) if villain_flag else MUTED)),
            ])
        flush_rows(pending_rows)

    # â”€â”€ Relations appendix â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if family_links or hero_assocs:
        story.append(PageBreak())
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph("RELATIONS INDEX", sty("ri_t", 18, GOLD, True, TA_CENTER)))
        story.append(Spacer(1, 0.06*inch))
        story.append(HRFlowable(width="40%", thickness=1, color=GOLD, hAlign="CENTER"))
        story.append(Spacer(1, 0.22*inch))

        if family_links:
            story.append(Paragraph("FAMILY BONDS", sty("ri_fh", 9, MUTED, True)))
            story.append(Spacer(1, 6))
            fl_rows = []
            for lk in family_links:
                an = safe(char_name.get(lk.get("a",""), lk.get("a","?")))
                bn = safe(char_name.get(lk.get("b",""), lk.get("b","?")))
                lid = lk.get("id","")
                fl_rows.append([
                    Paragraph(an, sty(f"fla{lid}", 9, PAPER, True)),
                    Paragraph(f"{safe(lk.get('aRelation',''))}  /  {safe(lk.get('bRelation',''))}", sty(f"flr{lid}", 8, GOLD, False, TA_CENTER)),
                    Paragraph(bn, sty(f"flb{lid}", 9, PAPER, True, TA_RIGHT)),
                ])
            fl_tbl = Table(fl_rows, colWidths=["38%","24%","38%"])
            fl_tbl.setStyle(TableStyle([
                ("ALIGN",(0,0),(0,-1),"LEFT"),("ALIGN",(2,0),(2,-1),"RIGHT"),
                ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
                ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
                ("LEFTPADDING",(0,0),(-1,-1),4),("RIGHTPADDING",(0,0),(-1,-1),4),
                ("LINEBELOW",(0,0),(-1,-2),0.25,colors.Color(0.18,0.18,0.22)),
            ]))
            story.append(fl_tbl)
            story.append(Spacer(1, 0.25*inch))

        if hero_assocs:
            story.append(Paragraph("HERO ASSOCIATIONS", sty("ri_hah", 9, MUTED, True)))
            story.append(Spacer(1, 6))
            ha_rows = []
            for ha in hero_assocs:
                an  = safe(char_name.get(ha.get("a",""), ha.get("a","?")))
                bn  = safe(char_name.get(ha.get("b",""), ha.get("b","?")))
                hid = ha.get("id","")
                ha_rows.append([
                    Paragraph(an, sty(f"haa{hid}", 9, PAPER, True)),
                    Paragraph(f"{safe(ha.get('aRelation',''))}  /  {safe(ha.get('bRelation',''))}", sty(f"har{hid}", 8, BLUE, False, TA_CENTER)),
                    Paragraph(bn, sty(f"hab{hid}", 9, PAPER, True, TA_RIGHT)),
                ])
            ha_tbl = Table(ha_rows, colWidths=["38%","24%","38%"])
            ha_tbl.setStyle(TableStyle([
                ("ALIGN",(0,0),(0,-1),"LEFT"),("ALIGN",(2,0),(2,-1),"RIGHT"),
                ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
                ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
                ("LEFTPADDING",(0,0),(-1,-1),4),("RIGHTPADDING",(0,0),(-1,-1),4),
                ("LINEBELOW",(0,0),(-1,-2),0.25,colors.Color(0.18,0.18,0.22)),
            ]))
            story.append(ha_tbl)

    def bg(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(INK)
        canvas.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
        canvas.restoreState()

    doc.build(story, onFirstPage=bg, onLaterPages=bg)
    buf.seek(0)
    return send_file(buf, mimetype="application/pdf",
        as_attachment=True, download_name="forge-encyclopedia.pdf")

# ---------------------------------------------------------------------------
# API: Comic PDF Export
# ---------------------------------------------------------------------------
@app.route("/api/export-comic-pdf", methods=["POST"])
def export_comic_pdf():
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.pdfgen import canvas as rl_canvas
        from reportlab.lib.utils import ImageReader
    except ImportError:
        return jsonify({"error": "reportlab not installed. Run: pip install reportlab"}), 500

    data = request.get_json() or {}
    comic = data.get("comic", {})
    cast_chars = data.get("castChars", [])
    tone = data.get("tone", "action")

    title = comic.get("title", "Untitled Comic")
    tagline = comic.get("tagline", "")
    pages_data = comic.get("pages", [])

    buf = io.BytesIO()
    PW, PH = letter   # 612 x 792 pts
    c = rl_canvas.Canvas(buf, pagesize=letter)

    MARGIN = 28
    PANEL_GAP = 4
    PANEL_BORDER = 2

    YELLOW = colors.HexColor("#FFD700")
    BLACK = colors.black
    WHITE = colors.white
    DARK = colors.HexColor("#0d0d1a")
    GRAY = colors.HexColor("#6B7280")
    CAP_BG = colors.HexColor("#FFFDE7")
    CAP_FG = colors.HexColor("#111111")

    def get_panel_image(panel_id):
        safe_id = os.path.basename(panel_id)
        for ext in IMAGE_EXTENSIONS:
            path = os.path.join(IMAGES_DIR, f"{safe_id}{ext}")
            if os.path.exists(path):
                return path
        return None

    def wrap_text(text, max_chars):
        if not text:
            return []
        words = text.split()
        lines, cur = [], ""
        for w in words:
            if len(cur) + len(w) + 1 <= max_chars:
                cur = (cur + " " + w).strip()
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    def build_rows(panels):
        rows, i = [], 0
        while i < len(panels):
            p = panels[i]
            if p.get("layout") == "wide":
                rows.append([p]); i += 1
            else:
                row = [p]; i += 1
                if i < len(panels) and panels[i].get("layout") != "wide":
                    row.append(panels[i]); i += 1
                rows.append(row)
        return rows

    def draw_panel(canvas, x, y, w, h, panel):
        caption = panel.get("caption", "")
        dialogue = panel.get("dialogue", [])
        sfx = panel.get("sfx", "")
        desc = panel.get("description", "")

        # Outer black border
        canvas.setFillColor(BLACK)
        canvas.rect(x, y, w, h, fill=1, stroke=0)

        ix, iy, iw, ih = x + PANEL_BORDER, y + PANEL_BORDER, w - 2*PANEL_BORDER, h - 2*PANEL_BORDER

        img_path = get_panel_image(panel.get("id", ""))
        if img_path:
            try:
                canvas.drawImage(ImageReader(img_path), ix, iy, iw, ih,
                                 preserveAspectRatio=False, mask='auto')
            except Exception:
                canvas.setFillColor(DARK); canvas.rect(ix, iy, iw, ih, fill=1, stroke=0)
        else:
            canvas.setFillColor(DARK); canvas.rect(ix, iy, iw, ih, fill=1, stroke=0)
            if desc:
                canvas.setFillColor(GRAY)
                fs = max(5, min(8, int(iw / 25)))
                canvas.setFont("Helvetica", fs)
                max_c = max(10, int(iw / (fs * 0.58)))
                lines = wrap_text(desc, max_c)[:5]
                ty = iy + ih/2 + len(lines) * (fs + 2) / 2
                for line in lines:
                    canvas.drawCentredString(ix + iw/2, ty, line); ty -= fs + 2

        # Caption bar at top
        if caption:
            cfs = max(5.5, min(7, int(iw / 30)))
            cap_lines = wrap_text(caption, max(10, int(iw / (cfs * 0.58))))[:2]
            cap_h = len(cap_lines) * (cfs + 2) + 6
            cap_y = iy + ih - cap_h
            canvas.setFillColor(CAP_BG); canvas.setStrokeColor(BLACK); canvas.setLineWidth(0.5)
            canvas.rect(ix + 2, cap_y, iw - 4, cap_h, fill=1, stroke=1)
            canvas.setFillColor(CAP_FG); canvas.setFont("Helvetica", cfs)
            ly = cap_y + cap_h - cfs - 3
            for line in cap_lines:
                canvas.drawCentredString(ix + iw/2, ly, line); ly -= cfs + 2

        # Dialogue bubbles at bottom
        by = iy + 4
        for d in dialogue[:2]:
            char = d.get("character", ""); text = d.get("text", "")
            if not text: continue
            bfs = max(5, min(7, int(iw / 30)))
            full = f"{char}: {text}" if char else text
            bub_lines = wrap_text(full, max(8, int((iw - 16) / (bfs * 0.58))))[:3]
            bh = len(bub_lines) * (bfs + 2) + 6
            bw = min(iw - 8, iw * 0.88)
            if by + bh > iy + ih - 20: break
            canvas.setFillColor(WHITE); canvas.setStrokeColor(BLACK); canvas.setLineWidth(0.5)
            canvas.roundRect(ix + 4, by, bw, bh, 3, fill=1, stroke=1)
            canvas.setFillColor(CAP_FG); canvas.setFont("Helvetica", bfs)
            ly2 = by + bh - bfs - 2.5
            for line in bub_lines:
                canvas.drawString(ix + 8, ly2, line); ly2 -= bfs + 2
            by += bh + 3

        # SFX
        if sfx:
            sfs = max(10, min(22, int(min(iw, ih) / 5)))
            canvas.setFillColor(YELLOW); canvas.setFont("Helvetica-Bold", sfs)
            canvas.drawString(ix + 6, iy + ih/2 - sfs/2, sfx[:12])

    # â”€â”€ Cover page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    c.setFillColor(BLACK); c.rect(0, 0, PW, PH, fill=1, stroke=0)

    title_upper = title.upper()
    ts = max(18, min(54, int(480 / max(len(title_upper), 1))))
    c.setFillColor(YELLOW); c.setFont("Helvetica-Bold", ts)
    c.drawCentredString(PW/2, PH * 0.58, title_upper)

    c.setStrokeColor(YELLOW); c.setLineWidth(1.5)
    c.line(PW * 0.2, PH * 0.53, PW * 0.8, PH * 0.53)

    if tagline:
        c.setFillColor(WHITE); c.setFont("Helvetica", 12)
        c.drawCentredString(PW/2, PH * 0.48, tagline)

    if cast_chars:
        c.setFillColor(colors.HexColor("#888888")); c.setFont("Helvetica", 8)
        c.drawCentredString(PW/2, PH * 0.42,
                            "  Â·  ".join(m.get("heroName", "") for m in cast_chars[:6]))

    c.setFillColor(colors.HexColor("#444444")); c.setFont("Helvetica", 7)
    c.drawString(MARGIN, PH - MARGIN + 8, "NOCTURNAL INNOVATIONS'S SUPERHERO FORGE")
    c.drawRightString(PW - MARGIN, PH - MARGIN + 8, tone.upper())

    c.setFillColor(colors.HexColor("#282828")); c.rect(0, 0, PW, 18, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#666666")); c.setFont("Helvetica", 6.5)
    c.drawCentredString(PW/2, 5, "NOCTURNAL INNOVATIONS'S SUPERHERO FORGE")
    c.showPage()

    # â”€â”€ Comic pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    inner_w = PW - 2 * MARGIN
    inner_h = PH - 2 * MARGIN

    for pg_data in pages_data:
        panels = pg_data.get("panels", [])
        if not panels: continue
        page_num = pg_data.get("pageNum", "?")

        c.setFillColor(WHITE); c.rect(0, 0, PW, PH, fill=1, stroke=0)

        rows = build_rows(panels)
        n_rows = len(rows)
        row_h = (inner_h - PANEL_GAP * (n_rows - 1)) / n_rows if n_rows else inner_h

        for ri, row_panels in enumerate(rows):
            y_off = MARGIN + inner_h - (ri + 1) * row_h - ri * PANEL_GAP
            n_cols = len(row_panels)
            col_w = (inner_w - PANEL_GAP * (n_cols - 1)) / n_cols if n_cols else inner_w
            for ci, panel in enumerate(row_panels):
                draw_panel(c, MARGIN + ci * (col_w + PANEL_GAP), y_off, col_w, row_h, panel)

        c.setFillColor(GRAY); c.setFont("Helvetica", 7)
        c.drawCentredString(PW/2, MARGIN/2, str(page_num))
        c.showPage()

    c.save()
    buf.seek(0)
    safe = "".join(ch for ch in title if ch.isalnum() or ch in " -_")[:40].strip().replace(" ", "_")
    return send_file(buf, mimetype="application/pdf",
                     as_attachment=True, download_name=f"{safe or 'comic'}.pdf")

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
def find_free_port(preferred=7432, retries=10, delay=0.4):
    for attempt in range(retries):
        s = socket.socket()
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(("127.0.0.1", preferred)); s.close(); return preferred
        except OSError:
            s.close()
            if attempt < retries - 1:
                time.sleep(delay)
    # Preferred port genuinely occupied â€” fall back to OS-assigned
    s = socket.socket(); s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]; s.close(); return port

def run_flask(port, host="0.0.0.0"):
    import logging
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    _init_db()
    app.run(host=host, port=port, debug=False, use_reloader=False, threaded=True)

# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # â”€â”€ Same-machine instance check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
                time.sleep(1.0)  # give OS time to release port 7432
            except Exception: pass
        else:
            sys.exit(0)

    # â”€â”€ Network instance check (LAN) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    print(f"  Ollama {'ready' if ollama_ok else 'not found â€” AI features disabled'}")

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
    lan_ip = get_lan_ip()
    print(f"\n  Superhero Forge v{FORGE_VERSION} ready at {url}")
    if lan_ip and lan_ip != "127.0.0.1":
        print(f"  Local network:  http://{lan_ip}:{port}  -- share this with devices on your Wi-Fi")

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
            # Use 'open' directly â€” avoids AppleScript permission issues
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
        print("  PyWebView not found â€” opening in browser.\n", flush=True)
        _open_browser(url)
        try:
            while True: time.sleep(1)
        except KeyboardInterrupt:
            print("\n  Shutting down.")

