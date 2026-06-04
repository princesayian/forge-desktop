#!/usr/bin/env python3
"""
Superhero Forge — Universal Setup Script
Works on Windows, macOS, and Linux
Run once: python install.py
"""

import os
import sys
import subprocess
import urllib.request
import platform
import json

BASE = os.path.dirname(os.path.abspath(__file__))
VENDOR = os.path.join(BASE, "vendor")
DATA = os.path.join(BASE, "data")
CHARACTERS_DIR = os.path.join(DATA, "characters")
TEAMS_DIR = os.path.join(DATA, "teams")
STORIES_DIR = os.path.join(DATA, "stories")

VENDOR_FILES = [
    ("react.js", "https://unpkg.com/react@18/umd/react.production.min.js"),
    ("react-dom.js", "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"),
    ("babel.js", "https://unpkg.com/@babel/standalone/babel.min.js"),
]

SYSTEM = platform.system()
IS_WINDOWS = SYSTEM == "Windows"
IS_MAC = SYSTEM == "Darwin"
IS_LINUX = SYSTEM == "Linux"


def step(msg):
    print(f"\n  ▸ {msg}")


def ok(msg):
    print(f"    ✓ {msg}")


def info(msg):
    print(f"    · {msg}")


def warn(msg):
    print(f"    ! {msg}")


def error(msg):
    print(f"    ✗ {msg}")
    sys.exit(1)


def detect_python():
    """Detect Python version and warn if not 3.9+"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        warn(f"Python {version.major}.{version.minor} detected")
        warn("Superhero Forge requires Python 3.9 or higher")
        sys.exit(1)
    ok(f"Python {version.major}.{version.minor} {version.releaselevel}")


def create_data_dirs():
    """Create data directories if they don't exist"""
    step("Setting up data directories...")
    for d in [DATA, CHARACTERS_DIR, TEAMS_DIR, STORIES_DIR]:
        os.makedirs(d, exist_ok=True)
    ok("Data directories ready")


def install_packages():
    """Install Python dependencies"""
    step("Installing Python packages...")
    reqs = os.path.join(BASE, "requirements.txt")
    
    # First pass: quiet mode
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", reqs, "--quiet"],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        # If quiet failed, retry with verbose output for debugging
        warn("Quiet install failed, trying again with output...")
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", reqs]
        )
        if result.returncode != 0:
            error("Failed to install Python packages")
    
    ok("Python packages installed")

    # Platform-specific PyWebView extras
    step("Installing platform-specific dependencies...")
    if IS_WINDOWS:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "pywebview[winforms]", "--quiet"],
            capture_output=True
        )
        ok("PyWebView Windows backend installed")
    elif IS_MAC:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "pywebview", "--quiet"],
            capture_output=True
        )
        ok("PyWebView macOS backend installed")
    elif IS_LINUX:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "pywebview", "--quiet"],
            capture_output=True
        )
        ok("PyWebView Linux backend installed")


def download_vendor():
    """Download frontend libraries"""
    step("Downloading frontend libraries...")
    os.makedirs(VENDOR, exist_ok=True)

    for filename, url in VENDOR_FILES:
        dest = os.path.join(VENDOR, filename)
        
        # Skip if already exists and is valid
        if os.path.exists(dest) and os.path.getsize(dest) > 1000:
            ok(f"{filename} (already present)")
            continue
        
        info(f"Downloading {filename}...")
        try:
            urllib.request.urlretrieve(url, dest)
            size_kb = os.path.getsize(dest) // 1024
            ok(f"{filename} ({size_kb}KB)")
        except Exception as e:
            error(f"Failed to download {filename}: {e}\n"
                  f"  Download manually from: {url}\n"
                  f"  Save to: {dest}")


def create_config():
    """Create default configuration"""
    config_path = os.path.join(BASE, "config.json")
    if os.path.exists(config_path):
        ok("config.json already exists")
        return
    
    step("Creating configuration...")
    config = {
        "model": "llama3.2",
        "ollama_url": "http://localhost:11434",
        "api_key": "",
    }
    
    try:
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)
        ok("config.json created")
    except Exception as e:
        error(f"Failed to create config.json: {e}")


def check_ollama():
    """Check if Ollama is running (local mode)"""
    step("Checking for Ollama...")
    try:
        urllib.request.urlopen("http://localhost:11434/api/tags", timeout=2)
        ok("Ollama is running")
        return True
    except Exception:
        warn("Ollama not detected (required for local AI mode)")
        print("""
    To use AI generation locally:

    1. Download Ollama from https://ollama.com
    2. Install and launch Ollama
    3. Pull a model: ollama pull llama3.2
    4. Then launch Superhero Forge

    You can also use remote APIs (OpenAI, etc.) from Settings.
""")
        return False


def detect_client_build():
    """Check if client frontend needs building"""
    client_dir = os.path.join(BASE, "client")
    static_dir = os.path.join(BASE, "static")
    
    if not os.path.exists(client_dir):
        return False
    
    if not os.path.exists(os.path.join(static_dir, "assets")):
        return True
    
    return False


def print_summary():
    """Print setup summary and next steps"""
    print("\n" + "=" * 60)
    print("  SUPERHERO FORGE — Setup Complete!")
    print("=" * 60)
    
    print("\n  Next Steps:")
    print("")
    
    if IS_WINDOWS:
        print("  1. (Optional) Install Ollama:")
        print("     → https://ollama.com")
        print("     → ollama pull llama3.2")
        print("")
        print("  2. Launch the app:")
        print("     → Double-click:  run.bat")
        print("     → Or type:       python app.py")
    
    elif IS_MAC:
        print("  1. (Optional) Install Ollama:")
        print("     → https://ollama.com")
        print("     → ollama pull llama3.2")
        print("")
        print("  2. Launch the app:")
        print("     → Run in terminal:  sh run.sh")
        print("     → Or type:          python3 app.py")
    
    elif IS_LINUX:
        print("  1. (Optional) Install Ollama:")
        print("     → https://ollama.com")
        print("     → ollama pull llama3.2")
        print("")
        print("  2. Launch the app:")
        print("     → Run in terminal:  sh run.sh")
        print("     → Or type:          python3 app.py")
    
    print("")
    print("  Questions? See README.md for troubleshooting.")
    print("=" * 60 + "\n")


def main():
    print("\n" + "=" * 60)
    print("  SUPERHERO FORGE — Universal Setup")
    print("=" * 60)
    
    print(f"\n  System: {SYSTEM}")
    
    detect_python()
    create_data_dirs()
    install_packages()
    download_vendor()
    create_config()
    check_ollama()
    print_summary()


if __name__ == "__main__":
    main()
