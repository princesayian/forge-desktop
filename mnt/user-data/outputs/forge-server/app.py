"""
Superhero Forge — Flask Server
Run: python app.py
Then open: http://localhost:5000
"""

import os
import json
import base64
from flask import Flask, request, jsonify, send_from_directory
import urllib.request
import urllib.error

app = Flask(__name__, static_folder="static")

# ── Load API key ────────────────────────────────────────────────────────────────
API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
if not API_KEY:
    try:
        with open(".env") as f:
            for line in f:
                line = line.strip()
                if line.startswith("ANTHROPIC_API_KEY="):
                    API_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")
    except FileNotFoundError:
        pass

# ── API proxy ───────────────────────────────────────────────────────────────────
@app.route("/api/chat", methods=["POST"])
def chat():
    if not API_KEY:
        return jsonify({"error": "ANTHROPIC_API_KEY not set. Add it to .env file."}), 500

    body = request.get_json()

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return jsonify(data)
    except urllib.error.HTTPError as e:
        err = json.loads(e.read().decode("utf-8"))
        return jsonify(err), e.code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Serve static files ──────────────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory("static", path)

# ── Health check ────────────────────────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "api_key_set": bool(API_KEY),
        "port": int(os.environ.get("PORT", 5000))
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n  Superhero Forge running at http://localhost:{port}")
    print(f"  API key loaded: {'YES' if API_KEY else 'NO — add to .env'}\n")
    app.run(host="0.0.0.0", port=port, debug=False)
