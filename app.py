"""
Superhero Forge — Desktop App
Local AI powered by Ollama. No API keys. No subscriptions.
"""

import os, sys, json, threading, time, socket, base64, io, subprocess, shutil
import urllib.request, urllib.error
from flask import Flask, request, jsonify, send_from_directory, send_file

BASE       = os.path.dirname(os.path.abspath(__file__))
STATIC     = os.path.join(BASE, "static")
VENDOR     = os.path.join(BASE, "vendor")
CONFIG_FILE= os.path.join(BASE, "config.json")
IMAGES_DIR = os.path.join(BASE, "images")
os.makedirs(IMAGES_DIR, exist_ok=True)

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
    ollama_bin = shutil.which("ollama") or "/usr/local/bin/ollama"
    if not os.path.exists(ollama_bin):
        return False
    subprocess.Popen([ollama_bin, "serve"],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                     start_new_session=True)
    for _ in range(40):
        time.sleep(0.5)
        try:
            urllib.request.urlopen(f"{cfg['ollama_url']}/api/tags", timeout=1)
            return True
        except Exception:
            pass
    return False

app = Flask(__name__, static_folder=STATIC)
app.config["JSON_SORT_KEYS"] = False

@app.route("/")
def index():
    return send_from_directory(STATIC, "index.html")

@app.route("/vendor/<path:filename>")
def vendor(filename):
    return send_from_directory(VENDOR, filename)

@app.route("/api/status")
def status():
    cfg = load_config()
    try:
        with urllib.request.urlopen(f"{cfg['ollama_url']}/api/tags", timeout=2) as resp:
            data = json.loads(resp.read())
        models = [m["name"] for m in data.get("models", [])]
        return jsonify({"ollama": True, "models": models, "current_model": cfg["model"], "ollama_url": cfg["ollama_url"]})
    except Exception:
        return jsonify({"ollama": False, "models": [], "current_model": cfg["model"], "ollama_url": cfg["ollama_url"]})

@app.route("/api/config", methods=["GET", "POST"])
def config_route():
    if request.method == "POST":
        return jsonify(save_config(request.get_json() or {}))
    return jsonify(load_config())

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
    all_content = " ".join(str(m.get("content","")) for m in messages if isinstance(m.get("content"), str))
    needs_json = "JSON only" in all_content or '"prompt"' in all_content or "keys:" in all_content

    if not any(m.get("role") == "system" for m in messages):
        messages = [{"role": "system", "content": (
            "You are a creative writing assistant specializing in superhero fiction. "
            "When asked to return JSON, return ONLY valid JSON — no markdown fences, "
            "no preamble, no explanation. The JSON must be complete and parseable."
        )}] + messages

    ollama_body = {
        "model": cfg["model"], "messages": messages, "stream": False,
        "options": {"temperature": 0.8, "num_predict": body.get("max_tokens", 1200), "top_p": 0.9}
    }
    if needs_json:
        ollama_body["format"] = "json"

    try:
        data = json.dumps(ollama_body).encode()
        req = urllib.request.Request(f"{cfg['ollama_url']}/api/chat", data=data,
            headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
        text = result.get("message", {}).get("content", "")
        return jsonify({"content": [{"type": "text", "text": text}]})
    except urllib.error.URLError:
        return jsonify({"error": {"type": "connection_error",
            "message": "Ollama is not running. Start Ollama and try again."}}), 503
    except Exception as e:
        return jsonify({"error": {"type": "error", "message": str(e)}}), 500

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

@app.route("/health")
def health():
    return jsonify({"status": "ok", "model": load_config()["model"]})

def find_free_port(preferred=7432):
    s = socket.socket()
    try:
        s.bind(("127.0.0.1", preferred)); s.close(); return preferred
    except OSError:
        s.close(); s = socket.socket(); s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]; s.close(); return port

def run_flask(port):
    import logging
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False, threaded=True)

if __name__ == "__main__":
    print("\n  Starting Ollama...")
    ollama_ok = ensure_ollama()
    print(f"  Ollama {'ready' if ollama_ok else 'not found — AI features disabled'}")

    port = find_free_port()
    url  = f"http://127.0.0.1:{port}"
    flask_thread = threading.Thread(target=run_flask, args=(port,), daemon=True)
    flask_thread.start()
    for _ in range(20):
        try: urllib.request.urlopen(f"{url}/health", timeout=1); break
        except Exception: time.sleep(0.3)
    print(f"\n  Superhero Forge ready at {url}")
    try:
        import webview
        print("  Opening native window...\n")
        webview.create_window("Superhero Forge", url, width=1280, height=900,
            min_size=(960, 680), background_color="#09090F")
        webview.start(debug=False)
    except ImportError:
        import webbrowser
        print("  PyWebView not found — opening in browser.\n")
        webbrowser.open(url)
        try:
            while True: time.sleep(1)
        except KeyboardInterrupt:
            print("\n  Shutting down.")
