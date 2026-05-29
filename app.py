"""
Nocturnal Inc Superhero Forge — Desktop App
Created by Kareem Carter · Nocturnal Inc
Local AI powered by Ollama + Groq. No subscriptions.
"""

import os, sys, json, threading, time, socket, base64, io, subprocess, shutil, signal, atexit, queue
import urllib.request, urllib.error
from flask import Flask, request, jsonify, send_from_directory, send_file, session, redirect, Response, stream_with_context

BASE       = os.path.dirname(os.path.abspath(__file__))
STATIC     = os.path.join(BASE, "static")
VENDOR     = os.path.join(BASE, "vendor")
CONFIG_FILE  = os.path.join(BASE, "config.json")
IMAGES_DIR   = os.path.join(BASE, "images")
LOCK_FILE    = os.path.join(BASE, ".forge.lock")
STORAGE_FILE = os.path.join(BASE, "forge-data.json")
os.makedirs(IMAGES_DIR, exist_ok=True)

GROQ_KEY = ""
BEACON_WEBHOOK = ""
GROQ_MODELS = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"]
try:
    with open(os.path.join(BASE, ".env")) as _ef:
        for _line in _ef:
            _line = _line.strip()
            if _line.startswith("GROQ_API_KEY="):
                GROQ_KEY = _line.split("=", 1)[1].strip().strip('"').strip("'")
            elif _line.startswith("BEACON_WEBHOOK="):
                BEACON_WEBHOOK = _line.split("=", 1)[1].strip().strip('"').strip("'")
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

# ── Update helpers ────────────────────────────────────────────────────────────
def _git_env():
    """Return an env dict that ensures SSH key auth works outside a terminal session."""
    env = os.environ.copy()
    key = os.path.expanduser("~/.ssh/id_ed25519")
    if os.path.exists(key):
        env["GIT_SSH_COMMAND"] = (
            f"ssh -i {key} -o StrictHostKeyChecking=no "
            "-o BatchMode=yes -o UseKeychain=yes"
        )
    return env

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

# ── Remote access helpers ─────────────────────────────────────────────────────
def start_cloudflared(port):
    global TUNNEL_URL, _TUNNEL_PROC
    import re
    cf = shutil.which("cloudflared")
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
            urllib.request.urlopen(
                f"https://www.duckdns.org/update?domains={domain}&token={token}&ip=",
                timeout=10)
        except Exception:
            pass
        time.sleep(300)

# ── LAN discovery ─────────────────────────────────────────────────────────────
DISCOVERY_PORT = 7433

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def start_discovery_listener(flask_port):
    """Respond to UDP discovery broadcasts so other machines can find us."""
    def _listen():
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind(("", DISCOVERY_PORT))
        except OSError:
            return
        while True:
            try:
                data, addr = sock.recvfrom(64)
                if data == b"forge:discover":
                    ip = get_local_ip()
                    sock.sendto(f"forge:here:{ip}:{flask_port}".encode(), addr)
            except Exception:
                pass
    threading.Thread(target=_listen, daemon=True).start()

def find_network_instance():
    """Broadcast on the LAN to find a running Forge. Returns URL string or None."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        sock.settimeout(1.5)
        for addr in ("<broadcast>", "255.255.255.255"):
            try:
                sock.sendto(b"forge:discover", (addr, DISCOVERY_PORT))
            except Exception:
                pass
        data, _ = sock.recvfrom(128)
        sock.close()
        parts = data.decode().split(":")
        if len(parts) == 4 and parts[0] == "forge" and parts[1] == "here":
            return f"http://{parts[2]}:{parts[3]}"
    except socket.timeout:
        pass
    except Exception:
        pass
    return None

def _existing_instance():
    if not os.path.exists(LOCK_FILE):
        return None
    try:
        with open(LOCK_FILE) as f:
            pid = int(f.read().strip())
        os.kill(pid, 0)
        return pid
    except Exception:
        return None

def _write_lock():
    with open(LOCK_FILE, "w") as f:
        f.write(str(os.getpid()))

def _remove_lock():
    try:
        with open(LOCK_FILE) as f:
            if int(f.read().strip()) == os.getpid():
                os.remove(LOCK_FILE)
    except Exception:
        pass

DEFAULTS = {"model": "llama3.2", "ollama_url": "http://localhost:11434", "port": 7432}

def load_config():
    try:
        with open(CONFIG_FILE) as f:
            return {**DEFAULTS, **json.load(f)}
    except Exception:
        return DEFAULTS.copy()

def save_config(data):
    cfg = load_config(); cfg.update(data)
    with open(CONFIG_FILE, "w") as f:
        json.dump(cfg, f, indent=2)
    return cfg

def ensure_ollama():
    cfg = load_config()
    try:
        urllib.request.urlopen(f"{cfg['ollama_url']}/api/tags", timeout=2)
        return True
    except Exception:
        pass
    ollama_bin = shutil.which("ollama")
    if not ollama_bin:
        if sys.platform == "win32":
            win_path = os.path.expanduser(r"~\AppData\Local\Programs\Ollama\ollama.exe")
            if os.path.exists(win_path):
                ollama_bin = win_path
        else:
            if os.path.exists("/usr/local/bin/ollama"):
                ollama_bin = "/usr/local/bin/ollama"
    if not ollama_bin:
        return False
    kwargs = {"stdout": subprocess.DEVNULL, "stderr": subprocess.DEVNULL}
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs["start_new_session"] = True
    subprocess.Popen([ollama_bin, "serve"], **kwargs)
    for _ in range(40):
        time.sleep(0.5)
        try:
            urllib.request.urlopen(f"{cfg['ollama_url']}/api/tags", timeout=1)
            return True
        except Exception:
            pass
    return False

def _beacon():
    if not BEACON_WEBHOOK:
        return
    try:
        import uuid as _uuid, datetime as _dt

        # Persistent instance ID — lives in webview-data (gitignored)
        id_dir = os.path.join(BASE, "webview-data")
        os.makedirs(id_dir, exist_ok=True)
        id_file = os.path.join(id_dir, ".instance_id")
        if os.path.exists(id_file):
            with open(id_file) as f:
                instance_id = f.read().strip()
        else:
            instance_id = str(_uuid.uuid4())[:8].upper()
            with open(id_file, "w") as f:
                f.write(instance_id)

        # Attribution canary — check both source files
        try:
            with open(__file__) as f:
                app_src = f.read()
            with open(os.path.join(STATIC, "index.html")) as f:
                html_src = f.read()
            attr_ok = "Nocturnal Inc" in app_src and "Nocturnal Inc" in html_src
        except Exception:
            attr_ok = False

        # Git remote reveals forks or different origins
        git_remote = "unknown"
        try:
            r = subprocess.run(["git", "remote", "get-url", "origin"],
                               cwd=BASE, capture_output=True, text=True, timeout=5)
            git_remote = r.stdout.strip() or "none"
        except Exception:
            pass

        color  = 0x00C851 if attr_ok else 0xFF4444
        status = "✅ Intact" if attr_ok else "⚠️ **Possibly stripped — check this one**"
        payload = {
            "embeds": [{
                "title": "Superhero Forge — Instance Online",
                "color": color,
                "fields": [
                    {"name": "Instance",     "value": f"`{instance_id}`",  "inline": True},
                    {"name": "Version",      "value": f"`v{FORGE_VERSION}`", "inline": True},
                    {"name": "Attribution",  "value": status,               "inline": True},
                    {"name": "Git Remote",   "value": f"`{git_remote}`",    "inline": False},
                ],
                "footer": {"text": "Nocturnal Inc Superhero Forge · call-home beacon"},
                "timestamp": _dt.datetime.utcnow().isoformat() + "Z",
            }]
        }
        req = urllib.request.Request(
            BEACON_WEBHOOK,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=8)
    except Exception:
        pass

def send_beacon():
    threading.Thread(target=_beacon, daemon=True).start()

def _compute_version():
    try:
        count = subprocess.check_output(
            ["git", "rev-list", "--count", "HEAD"],
            cwd=BASE, stderr=subprocess.DEVNULL, text=True
        ).strip()
        return f"1.{count}"
    except Exception:
        return "1.0"

FORGE_VERSION = _compute_version()

app = Flask(__name__, static_folder=STATIC)
app.config["JSON_SORT_KEYS"] = False
app.secret_key = os.urandom(24)  # replaced with persistent key at startup

@app.before_request
def _pin_guard():
    cfg = load_config()
    if not cfg.get("remote_enabled") or not cfg.get("remote_pin"):
        return
    if request.remote_addr in ("127.0.0.1", "::1"):
        return
    if session.get("pin_ok"):
        return
    if request.path in ("/forge-pin", "/api/verify-pin") or \
       request.path.startswith(("/vendor/", "/api/images/")):
        return
    if request.path.startswith("/api/"):
        return jsonify({"error": "pin_required"}), 401
    return redirect("/forge-pin")

@app.route("/forge-pin")
def pin_page():
    pin_html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Forge — Enter PIN</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#09090F;color:#F0EAD6;font-family:'Courier New',monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;}
.box{width:320px;text-align:center;}.title{font-size:18px;font-weight:bold;letter-spacing:.1em;color:#D4AF37;margin-bottom:6px;}
.sub{font-size:11px;color:#888;margin-bottom:28px;}input{width:100%;padding:12px;background:#111;border:1px solid #333;border-radius:8px;color:#F0EAD6;font-size:20px;letter-spacing:.3em;text-align:center;margin-bottom:12px;}
button{width:100%;padding:12px;background:#D4AF3720;border:1px solid #D4AF37;border-radius:8px;color:#D4AF37;font-size:12px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;}
.err{color:#e74c3c;font-size:11px;margin-top:8px;}</style></head>
<body><div class="box"><div class="title">SUPERHERO FORGE</div><div class="sub">Remote access — enter PIN to continue</div>
<input type="password" id="p" placeholder="PIN" autofocus onkeydown="if(event.key==='Enter')submit()"/>
<button onclick="submit()">Unlock</button><div class="err" id="e"></div></div>
<script>async function submit(){const r=await fetch('/api/verify-pin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:document.getElementById('p').value})});if((await r.json()).ok){location.href='/';}else{document.getElementById('e').textContent='Incorrect PIN.';}}</script></body></html>"""
    return pin_html

@app.route("/api/verify-pin", methods=["POST"])
def verify_pin():
    cfg = load_config()
    pin = cfg.get("remote_pin", "")
    if not pin or (request.get_json() or {}).get("pin") == pin:
        session["pin_ok"] = True
        return jsonify({"ok": True})
    return jsonify({"ok": False}), 401

@app.route("/api/update/check")
def api_update_check():
    has_update, local, remote = check_for_updates()
    return jsonify({"has_update": has_update, "local": local, "remote": remote})

@app.route("/api/update/pull", methods=["POST"])
def api_update_pull():
    ok, output = pull_update()
    return jsonify({"ok": ok, "output": output})

@app.route("/api/remote")
def api_remote():
    cfg = load_config()
    return jsonify({
        "enabled": cfg.get("remote_enabled", False),
        "url": TUNNEL_URL,
        "duck_domain": cfg.get("duck_domain", ""),
        "pin_set": bool(cfg.get("remote_pin", "")),
        "cloudflared": bool(shutil.which("cloudflared"))
    })

@app.route("/")
def index():
    return send_from_directory(STATIC, "index.html")

@app.route("/vendor/<path:filename>")
def vendor(filename):
    return send_from_directory(VENDOR, filename)

@app.route("/api/status")
def status():
    cfg = load_config()
    if GROQ_KEY:
        model = cfg.get("model", "llama-3.1-8b-instant")
        if model not in GROQ_MODELS:
            model = "llama-3.1-8b-instant"
        return jsonify({"ollama": True, "groq": True, "models": GROQ_MODELS,
                        "current_model": model, "version": FORGE_VERSION})
    try:
        with urllib.request.urlopen(f"{cfg['ollama_url']}/api/tags", timeout=2) as resp:
            data = json.loads(resp.read())
        models = [m["name"] for m in data.get("models", [])]
        return jsonify({"ollama": True, "groq": False, "models": models,
                        "current_model": cfg["model"], "ollama_url": cfg["ollama_url"],
                        "version": FORGE_VERSION})
    except Exception:
        return jsonify({"ollama": False, "groq": False, "models": [],
                        "current_model": cfg["model"], "ollama_url": cfg["ollama_url"],
                        "version": FORGE_VERSION})

@app.route("/api/config", methods=["GET", "POST"])
def config_route():
    if request.method == "POST":
        return jsonify(save_config(request.get_json() or {}))
    return jsonify(load_config())

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
    import glob
    ids = [os.path.splitext(os.path.basename(f))[0]
           for f in glob.glob(os.path.join(IMAGES_DIR, "*"))]
    return jsonify(ids)

@app.route("/api/images/<img_id>", methods=["GET", "POST", "DELETE"])
def manage_image(img_id):
    img_id = os.path.basename(img_id)  # sanitize
    EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

    if request.method == "GET":
        for ext in EXTS:
            path = os.path.join(IMAGES_DIR, img_id + ext)
            if os.path.exists(path):
                return send_file(path)
        return jsonify({"error": "not found"}), 404

    elif request.method == "POST":
        b64 = (request.get_json() or {}).get("data", "")
        ext = ".jpg"
        if "," in b64:
            header, b64 = b64.split(",", 1)
            if "png" in header: ext = ".png"
            elif "gif" in header: ext = ".gif"
            elif "webp" in header: ext = ".webp"
        for old_ext in EXTS:
            old = os.path.join(IMAGES_DIR, img_id + old_ext)
            if os.path.exists(old): os.remove(old)
        with open(os.path.join(IMAGES_DIR, img_id + ext), "wb") as f:
            f.write(base64.b64decode(b64))
        return jsonify({"ok": True})

    elif request.method == "DELETE":
        for ext in EXTS:
            path = os.path.join(IMAGES_DIR, img_id + ext)
            if os.path.exists(path): os.remove(path)
        return jsonify({"ok": True})

@app.route("/api/pull", methods=["POST"])
def pull_model():
    cfg = load_config()
    model = (request.get_json() or {}).get("model", cfg["model"])
    def do_pull():
        body = json.dumps({"name": model, "stream": False}).encode()
        req = urllib.request.Request(f"{cfg['ollama_url']}/api/pull", data=body,
            headers={"Content-Type": "application/json"}, method="POST")
        try: urllib.request.urlopen(req, timeout=300)
        except Exception: pass
    threading.Thread(target=do_pull, daemon=True).start()
    return jsonify({"ok": True})

@app.route("/api/chat", methods=["POST"])
def chat():
    cfg = load_config()
    body = request.get_json() or {}
    messages = body.get("messages", [])

    if not any(m.get("role") == "system" for m in messages):
        messages = [{"role": "system", "content": (
            "You are a creative writing assistant specializing in superhero fiction. "
            "When asked to return JSON, return ONLY valid JSON — no markdown fences, "
            "no preamble, no explanation. The JSON must be complete and parseable."
        )}] + messages

    def generate():
        if GROQ_KEY:
            # ── Groq path ─────────────────────────────────────────────────────
            model = body.get("model", cfg.get("model", "llama-3.1-8b-instant"))
            if model not in GROQ_MODELS:
                model = "llama-3.1-8b-instant"
            groq_body = json.dumps({
                "model": model,
                "messages": messages,
                "max_tokens": body.get("max_tokens", 1200),
                "temperature": 0.8,
                "stream": False,
            }).encode()
            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=groq_body,
                headers={"Content-Type": "application/json",
                         "Authorization": f"Bearer {GROQ_KEY}",
                         "User-Agent": "SuperheroForge/1.0"},
                method="POST",
            )
            yield json.dumps({"hb": 1}) + "\n"
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = json.loads(resp.read())
                text = data["choices"][0]["message"]["content"]
                yield json.dumps({"t": text, "d": False}) + "\n"
                yield json.dumps({"t": "", "d": True}) + "\n"
            except Exception as ex:
                yield json.dumps({"e": str(ex)}) + "\n"
            return

        # ── Ollama fallback ───────────────────────────────────────────────────
        ollama_body = {
            "model": cfg["model"], "messages": messages, "stream": True,
            "options": {"temperature": 0.8, "num_predict": body.get("max_tokens", 1200),
                        "top_p": 0.9, "num_ctx": 4096}
        }
        token_queue = queue.Queue()

        def ollama_worker():
            try:
                data = json.dumps(ollama_body).encode()
                req = urllib.request.Request(f"{cfg['ollama_url']}/api/chat", data=data,
                    headers={"Content-Type": "application/json"}, method="POST")
                with urllib.request.urlopen(req, timeout=None) as resp:
                    for line in resp:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            chunk = json.loads(line)
                        except Exception:
                            continue
                        token = chunk.get("message", {}).get("content", "")
                        done  = chunk.get("done", False)
                        token_queue.put({"t": token, "d": done})
                        if done:
                            break
            except urllib.error.URLError:
                token_queue.put({"e": "Ollama is not running. Start Ollama and try again."})
            except Exception as ex:
                token_queue.put({"e": str(ex)})
            finally:
                token_queue.put(None)

        threading.Thread(target=ollama_worker, daemon=True).start()

        yield json.dumps({"hb": 1}) + "\n"
        while True:
            try:
                item = token_queue.get(timeout=3)
            except queue.Empty:
                yield json.dumps({"hb": 1}) + "\n"
                continue
            if item is None:
                break
            yield json.dumps(item) + "\n"
            if item.get("d") or "e" in item:
                break

    return Response(stream_with_context(generate()),
                    mimetype="application/x-ndjson",
                    headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"})

# ── PDF Export ────────────────────────────────────────────────────────────────
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

    # ── Cover ────────────────────────────────────────────────────────────────
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

    # ── Member pages ──────────────────────────────────────────────────────────
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
        nk_align   = member.get("nkAlignment", "neutral")
        affiliations = member.get("affiliations", [])
        shared_villains = member.get("sharedVillains", [])

        align_color = ALIGN_COLORS.get(nk_align, "#888780")
        align_label = ALIGN_LABELS.get(nk_align, "Neutral")
        ALIGN_C = rcolor(align_color)
        MTEAM_C = rcolor(m_team_c)

        # Header band
        hdr_txt = "— CLASSIFIED THREAT —" if is_v else f"{m_team.upper()} · {num}"
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
            info_parts.append(Paragraph(f'<i>"{tag}"</i>', sty("tg", 10, colors.Color(0.8,0.8,0.75), False, TA_LEFT, 14)))
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

        # DNA
        if dna:
            story.append(Paragraph("DNA: " + " · ".join(dna), sty("dt", 8, GOLD)))
            story.append(Spacer(1, 0.08*inch))

        # Affiliations
        if affiliations:
            story.append(Paragraph("AFFILIATIONS", sty("afl", 7, MUTED)))
            story.append(Spacer(1, 3))
            aff_text = "  ·  ".join([f"{a.get('teamName','')} ({a.get('role','')})" for a in affiliations])
            story.append(Paragraph(aff_text, sty("afv", 8, GOLD)))
            story.append(Spacer(1, 0.08*inch))

        # Shared villain threat
        if shared_villains:
            story.append(HRFlowable(width="100%", thickness=0.5, color=RED))
            story.append(Spacer(1, 3))
            story.append(Paragraph("⚠ SHARED THREAT: " + " · ".join(shared_villains), sty("sv2", 8, colors.Color(0.8, 0.2, 0.2), True)))
            story.append(Spacer(1, 0.06*inch))

        # Footer
        story.append(Spacer(1, 0.1*inch))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.Color(*[x*0.22 for x in hex2rgb(acc)])))
        story.append(Spacer(1, 3))
        ft2 = Table([[
            Paragraph(f"{m_team.upper()} · CLASSIFIED", sty("ft", 7, colors.Color(0.3,0.3,0.3))),
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

@app.route("/api/restart", methods=["POST"])
def restart():
    def do_restart():
        time.sleep(0.5)
        _remove_lock()
        subprocess.Popen([sys.executable] + sys.argv, cwd=BASE,
                         creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0)
        os._exit(0)
    threading.Thread(target=do_restart, daemon=True).start()
    return jsonify({"ok": True})

@app.route("/health")
def health():
    return jsonify({"status": "ok", "model": load_config()["model"], "version": FORGE_VERSION})

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

    # Persistent secret key for sessions
    cfg = load_config()
    if not cfg.get("secret_key"):
        save_config({"secret_key": base64.b64encode(os.urandom(24)).decode()})
        cfg = load_config()
    app.secret_key = base64.b64decode(cfg["secret_key"])

    if GROQ_KEY:
        print("\n  Groq API key loaded — using Groq for AI generation.")
    else:
        print("\n  Starting Ollama...")
        ollama_ok = ensure_ollama()
        print(f"  Ollama {'ready' if ollama_ok else 'not found — AI features disabled'}")

    port = find_free_port()
    url  = f"http://127.0.0.1:{port}"
    flask_thread = threading.Thread(target=run_flask, args=(port, "0.0.0.0"), daemon=True)
    flask_thread.start()
    for _ in range(20):
        try: urllib.request.urlopen(f"{url}/health", timeout=1); break
        except Exception: time.sleep(0.3)
    send_beacon()
    lan_ip  = get_local_ip()
    lan_url = f"http://{lan_ip}:{port}"
    print(f"\n  Superhero Forge v{FORGE_VERSION} ready")
    print(f"  Local:   {url}")
    print(f"  Network: {lan_url}  ← open from any device on this network")

    start_discovery_listener(port)

    # Auto-update check (background)
    def _bg_update_check():
        has_update, local, remote = check_for_updates()
        if has_update:
            print(f"  Update available: {local} → {remote} (open app to update)")
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
    try:
        import webview
        import webbrowser
        print("  Opening native window (minimized) + browser tab...\n")
        _storage = os.path.join(BASE, "webview-data")
        os.makedirs(_storage, exist_ok=True)
        _win = webview.create_window("Superhero Forge", url, width=1280, height=900,
            min_size=(960, 680), background_color="#09090F")
        def _on_started():
            try: _win.minimize()
            except Exception: pass
            webbrowser.open(url)
        webview.start(debug=False, private_mode=False, storage_path=_storage, func=_on_started)
    except ImportError:
        import webbrowser
        print("  PyWebView not found — opening in browser.\n")
        webbrowser.open(url)
        try:
            while True: time.sleep(1)
        except KeyboardInterrupt:
            print("\n  Shutting down.")
