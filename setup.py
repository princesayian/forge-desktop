"""
Superhero Forge — Setup Script
Run once before first launch: poetry install --extras <platform> --extras dev
Or just: make install

This file is kept only for the helper functions (check_ollama, create_config)
that the Makefile still uses. The Python deps are now managed by Poetry.
"""

import os, sys, urllib.request, json, subprocess

BASE = os.path.dirname(os.path.abspath(__file__))

def step(msg): print(f"\n  ▸ {msg}")
def ok(msg):   print(f"    ✓ {msg}")
def info(msg): print(f"    · {msg}")

def install_packages():
    """No-op when Poetry is the package manager. Kept for compatibility."""
    step("Python packages managed by Poetry")
    info("Run: make install   (or: poetry install --extras <platform> --extras dev)")
    ok("Skipped (Poetry is the package manager now)")

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
    create_config()
    check_ollama()

    print("\n" + "="*50)
    print("  Setup complete!")
    print()
    print("  To launch:")
    print("    poetry run python app.py")
    print("    (or: make run)")
    print("="*50 + "\n")
