#!/usr/bin/env python3
"""
PyInstaller Build Script for Superhero Forge
Creates standalone executables for Windows and macOS

Usage:
  python build-installer.py  (builds for current platform)
  python build-installer.py --all  (builds for all platforms)
  python build-installer.py --help
"""

import os
import sys
import subprocess
import platform
import argparse
import shutil

BASE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(BASE, "dist")
BUILD = os.path.join(BASE, "build")

SYSTEM = platform.system()
IS_WINDOWS = SYSTEM == "Windows"
IS_MAC = SYSTEM == "Darwin"
IS_LINUX = SYSTEM == "Linux"


def step(msg):
    print(f"\n  ▸ {msg}")


def ok(msg):
    print(f"    ✓ {msg}")


def error(msg):
    print(f"    ✗ {msg}")
    sys.exit(1)


def check_pyinstaller():
    """Check if PyInstaller is installed"""
    try:
        import PyInstaller
        ok(f"PyInstaller {PyInstaller.__version__} found")
        return True
    except ImportError:
        error("PyInstaller not installed. Run: pip install pyinstaller")


def build_windows():
    """Build Windows .exe"""
    step("Building Windows executable...")
    
    cmd = [
        "pyinstaller",
        "--onefile",
        "--windowed",
        "--name=SuperheroForge",
        "--icon=images/icon.ico" if os.path.exists("images/icon.ico") else "",
        "--add-data=static:static",
        "--add-data=vendor:vendor",
        "--add-data=requirements.txt:.",
        "--hidden-import=flask",
        "--hidden-import=pywebview",
        "launcher.py"
    ]
    
    # Remove empty strings
    cmd = [c for c in cmd if c]
    
    result = subprocess.run(cmd, cwd=BASE)
    
    if result.returncode == 0:
        exe_path = os.path.join(DIST, "SuperheroForge.exe")
        ok(f"Windows executable created: {exe_path}")
        print(f"\n    Size: {os.path.getsize(exe_path) / (1024*1024):.1f} MB")
    else:
        error("Windows build failed")


def build_mac():
    """Build macOS .app"""
    step("Building macOS application...")
    
    cmd = [
        "pyinstaller",
        "--onedir",
        "--name=SuperheroForge",
        "--icon=images/icon.icns" if os.path.exists("images/icon.icns") else "",
        "--add-data=static:static",
        "--add-data=vendor:vendor",
        "--add-data=requirements.txt:.",
        "--hidden-import=flask",
        "--hidden-import=pywebview",
        "--osx-bundle-identifier=com.nocturnal-knights.superhero-forge",
        "launcher.py"
    ]
    
    # Remove empty strings
    cmd = [c for c in cmd if c]
    
    result = subprocess.run(cmd, cwd=BASE)
    
    if result.returncode == 0:
        app_path = os.path.join(DIST, "SuperheroForge.app")
        ok(f"macOS app created: {app_path}")
        print(f"\n    To distribute: create a .dmg file")
        print(f"    $ hdiutil create -volname SuperheroForge -srcfolder {DIST}/SuperheroForge.app -ov -format UDZO superhero-forge.dmg")
    else:
        error("macOS build failed")


def build_linux():
    """Build Linux AppImage"""
    step("Building Linux AppImage...")
    
    cmd = [
        "pyinstaller",
        "--onedir",
        "--name=superhero-forge",
        "--add-data=static:static",
        "--add-data=vendor:vendor",
        "--add-data=requirements.txt:.",
        "--hidden-import=flask",
        "--hidden-import=pywebview",
        "launcher.py"
    ]
    
    result = subprocess.run(cmd, cwd=BASE)
    
    if result.returncode == 0:
        app_dir = os.path.join(DIST, "superhero-forge")
        ok(f"Linux binary created: {app_dir}")
    else:
        error("Linux build failed")


def clean():
    """Clean build artifacts"""
    step("Cleaning build artifacts...")
    for d in [BUILD, DIST, "__pycache__", "*.egg-info"]:
        if os.path.exists(d):
            shutil.rmtree(d, ignore_errors=True)
    ok("Cleaned")


def main():
    parser = argparse.ArgumentParser(
        description="Build Superhero Forge installers"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Build for all platforms (requires PyInstaller on each OS)"
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Clean build artifacts"
    )
    parser.add_argument(
        "--windows",
        action="store_true",
        help="Build Windows .exe"
    )
    parser.add_argument(
        "--mac",
        action="store_true",
        help="Build macOS .app"
    )
    parser.add_argument(
        "--linux",
        action="store_true",
        help="Build Linux AppImage"
    )
    
    args = parser.parse_args()
    
    print("\n" + "=" * 60)
    print("  SUPERHERO FORGE — Installer Builder")
    print("=" * 60)
    
    print(f"\n  Current Platform: {SYSTEM}")
    
    check_pyinstaller()
    
    if args.clean:
        clean()
        return
    
    # Determine what to build
    build_windows_flag = args.windows or (not args.mac and not args.linux and IS_WINDOWS)
    build_mac_flag = args.mac or (not args.windows and not args.linux and IS_MAC)
    build_linux_flag = args.linux or (not args.windows and not args.mac and IS_LINUX)
    
    if args.all:
        print("\n  Building for ALL platforms...")
        if IS_WINDOWS or args.all:
            build_windows()
        if IS_MAC or args.all:
            build_mac()
        if IS_LINUX or args.all:
            build_linux()
    else:
        if build_windows_flag:
            build_windows()
        if build_mac_flag:
            build_mac()
        if build_linux_flag:
            build_linux()
    
    print("\n" + "=" * 60)
    print("  Build complete!")
    print("  Executables in:", DIST)
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
