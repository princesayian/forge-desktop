"""
Superhero Forge — Setup Script
Run once before first launch: python setup.py
"""

import os, sys, subprocess, urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
VENDOR = os.path.join(BASE, "vendor")

VENDOR_FILES = [
    ("react.js",     "https://unpkg.com/react@18/umd/react.production.min.js"),
    ("react-dom.js", "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"),
    ("babel.js",     "https://unpkg.com/@babel/standalone/babel.min.js"),
]

def step(msg): print(f"\n  ▸ {msg}")
def ok(msg):   print(f"    ✓ {msg}")
def info(msg): print(f"    · {msg}")

def install_packages():
    step("Installing Python packages...")
    reqs = os.path.join(BASE, "requirements.txt")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", reqs, "--quiet"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        # Try without quiet for better error output
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", reqs])
    ok("Python packages installed")

    # PyWebView has platform-specific extras
    platform = sys.platform
    if platform == "win32":
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "pywebview[winforms]", "--quiet"],
            capture_output=True
        )
        ok("PyWebView Windows backend installed")
    elif platform == "darwin":
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "pywebview", "--quiet"],
            capture_output=True
        )
        ok("PyWebView macOS backend installed")

def download_vendor():
    step("Downloading frontend libraries...")
    os.makedirs(VENDOR, exist_ok=True)

    for filename, url in VENDOR_FILES:
        dest = os.path.join(VENDOR, filename)
        if os.path.exists(dest) and os.path.getsize(dest) > 1000:
            ok(f"{filename} already present, skipping")
            continue
        info(f"Downloading {filename}...")
        try:
            urllib.request.urlretrieve(url, dest)
            size_kb = os.path.getsize(dest) // 1024
            ok(f"{filename} downloaded ({size_kb}KB)")
        except Exception as e:
            print(f"\n  ✗ Failed to download {filename}: {e}")
            print(f"    Download manually from: {url}")
            print(f"    Save to: {dest}")

def check_ollama():
    step("Checking for Ollama...")
    try:
        urllib.request.urlopen("http://localhost:11434/api/tags", timeout=2)
        ok("Ollama is running")
        return True
    except Exception:
        print("""
    ! Ollama not detected. To use AI features:

      1. Download Ollama from https://ollama.com
      2. Install and launch it
      3. Open a terminal and run: ollama pull llama3.2
      4. Then launch Superhero Forge

    The app will still launch without Ollama — AI generation
    just won't work until Ollama is running.
""")
        return False

def create_config():
    import json
    config_path = os.path.join(BASE, "config.json")
    if not os.path.exists(config_path):
        with open(config_path, "w") as f:
            json.dump({"model": "llama3.2", "ollama_url": "http://localhost:11434"}, f, indent=2)
        ok("Created config.json")

if __name__ == "__main__":
    print("\n" + "="*50)
    print("  SUPERHERO FORGE — Setup")
    print("="*50)

    install_packages()
    download_vendor()
    create_config()
    check_ollama()

    print("\n" + "="*50)
    print("  Setup complete!")
    print()
    print("  To launch:")
    print("    Windows:  run.bat  (or: python app.py)")
    print("    Mac/Linux: sh run.sh  (or: python3 app.py)")
    print("="*50 + "\n")
