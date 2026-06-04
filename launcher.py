#!/usr/bin/env python3
"""
Superhero Forge — Universal Launcher
Auto-runs setup if needed, then launches the app
"""

import os
import sys
import subprocess
import platform

BASE = os.path.dirname(os.path.abspath(__file__))
VENDOR = os.path.join(BASE, "vendor")
CONFIG = os.path.join(BASE, "config.json")

SYSTEM = platform.system()
IS_WINDOWS = SYSTEM == "Windows"


def info(msg):
    print(f"  · {msg}")


def ok(msg):
    print(f"  ✓ {msg}")


def needs_setup():
    """Check if initial setup is needed"""
    # Setup needed if vendor files or config missing
    if not os.path.exists(os.path.join(VENDOR, "react.js")):
        return True
    if not os.path.exists(CONFIG):
        return True
    return False


def run_setup():
    """Run the setup script"""
    print("\n  First-time setup required...")
    print("")
    
    setup_script = os.path.join(BASE, "install.py")
    
    try:
        subprocess.run([sys.executable, setup_script], check=True)
        ok("Setup complete!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n  Setup failed with code {e.returncode}")
        return False
    except Exception as e:
        print(f"\n  Error during setup: {e}")
        return False


def launch_app():
    """Launch the Flask app"""
    app_script = os.path.join(BASE, "app.py")
    
    try:
        if IS_WINDOWS:
            # On Windows, use subprocess to keep window open
            subprocess.run([sys.executable, app_script])
        else:
            # On macOS/Linux, exec replaces the process
            os.execvp(sys.executable, [sys.executable, app_script])
    except KeyboardInterrupt:
        print("\n\n  Superhero Forge closed.")
        sys.exit(0)
    except Exception as e:
        print(f"\n  Error launching app: {e}")
        sys.exit(1)


def main():
    print("\n  Superhero Forge")
    print("")
    
    # Check and run setup if needed
    if needs_setup():
        if not run_setup():
            sys.exit(1)
        print("")
    
    # Launch the app
    info("Launching Superhero Forge...")
    print("")
    launch_app()


if __name__ == "__main__":
    main()
