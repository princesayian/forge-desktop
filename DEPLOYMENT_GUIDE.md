# Superhero  Deployment & Distribution GuideForge 

## Overview

The Forge Desktop app now has a **unified, system-agnostic installer** that provides a modern app-like installation experience on Windows, macOS, and Linux.

---

## Distribution Options

### Option 1: Source Distribution (Easiest)

Users download and run directly:

**Windows:**
```
SuperheroForge.zip
 launcher. Users double-click thisbat         
 install.bat
 install.py
 app.py
 requirements.txt
 ... (other files)
```

**macOS/Linux:**
```
SuperheroForge.tar.gz
 launcher. Users run: sh launcher.shsh          
 install.sh
 install.py
 app.py
 requirements.txt
 ... (other files)
```

**Pros:** Simple, all users, minimal file size
**Cons:** Requires Python 3.9+ installed

---

### Option 2: Standalone Executables (Best)

Users download and run like any app:

**Windows:**
```
SuperheroForge-installer. One file, double-click to installexe    
```

**macOS:**
```
SuperheroForge. Drag to Applications folderdmg              
```

**Linux:**
```
superhero- chmod +x && ./superhero-forgeforge                 
```

**Pros:** No Python required, professional installer
**Cons:** Larger file size (100-200 MB per platform)

---

## Building Standalone Installers

### Prerequisites

1. Install PyInstaller:
   ```bash
   pip install pyinstaller
   ```

2. Have platform-specific requirements:
   - **Windows:** PyInstaller on Windows (or use Wine/MSYS2)
   - **macOS:** PyInstaller on macOS (for .app signing)
   - **Linux:** PyInstaller on Linux (or AppImage tools)

### Building for Your Platform

```bash
# Build for current platform (Windows or macOS)
python build-installer.py

# Or explicitly:
python build-installer.py --windows    # Build .exe
python build-installer.py --mac        # Build .app
python build-installer.py --linux      # Build AppImage
```

Output: `dist/SuperheroForge.exe` or `dist/SuperheroForge.app`

---

## Release Checklist

### Before Release

- [ ] Update version in `app.py` (`FORGE_VERSION`)
- [ ] Update `CHANGELOG.md` with release notes
- [ ] Test on fresh Windows machine
- [ ] Test on fresh macOS machine
- [ ] Test on fresh Linux machine
- [ ] Test setup flow (new user)
- [ ] Test upgrade flow (existing user)

### Creating Distribution Packages

**For GitHub Releases:**

1. Build all platforms:
   ```bash
   python build-installer.py --windows
   python build-installer.py --mac
   python build-installer.py --linux
   ```

2. Create releases:
   - **Windows:** Upload `dist/SuperheroForge.exe`
   - **macOS:** Create DMG and upload
     ```bash
     hdiutil create -volname SuperheroForge -srcfolder dist/SuperheroForge.app superhero-forge.dmg
     ```
   - **Linux:** Upload `dist/superhero-forge`

3. Include in release notes:
   ```markdown
   ## Installation

   ### Windows
   - Download SuperheroForge.exe
   - Double-click to install

   ### macOS
   - Download superhero-forge.dmg
   - Drag SuperheroForge.app to Applications folder

   ### Linux
   - Download superhero-forge
   - Run: chmod +x superhero-forge && ./superhero-forge
   ```

---

## User Experience

### New User (Windows)

1. Download `SuperheroForge.exe`
2. Double-click
3. Windows: Installer appears
4. Click "Install"
5. App launches automatically
6. Setup runs (downloads dependencies)
7. App ready to use

### New User (macOS)

1. Download `superhero-forge.dmg`
2. Double-click to open
3. Drag app to Applications
4. Double-click the app in Applications
5. Setup runs automatically (first launch)
6. App ready to use

### New User (Linux)

1. Download `superhero-forge`
2. Open terminal: `chmod +x superhero-forge && ./superhero-forge`
3. Setup runs automatically (first launch)
4. App ready to use

### New User (Source, no pre-built)

1. Download source zip/tar
2. Extract
3. Windows: Double-click `launcher.bat`
4. macOS/Linux: Run `sh launcher.sh`
5. Setup runs automatically
6. App ready to use

---

## Version Updates

### Auto-Update (Built-in)

The app has built-in Git-based updates (for source distributions):

```
 Pull Latest
```

This works if the repo is cloned (`.git` exists). For standalone exes, users must:
- Download a new version
- Run the installer again
- Or manually check GitHub releases

---

## Configuration & Data

### Where Data Lives

**Windows:**
```
C:\Users\[user]\AppData\Local\SuperheroForge\
 config. User settingsjson          
 data/
 characters/    
 teams/    
 stories/    
```

**macOS:**
```
~/Library/Application Support/SuperheroForge/
 config.json
 data/
 characters/    
 teams/    
 stories/    
```

**Linux:**
```
~/.local/share/superhero-forge/
 config.json
 data/
 characters/    
 teams/    
 stories/    
```

For source distributions, data is in `./data/` relative to app folder.

---

## Troubleshooting Deployments

### Issue: "Python not found" on Windows

**Fix:** Ensure installer includes Python detection in `install.bat`:
```batch
python --version >nul 2>&1
if errorlevel 1 (
    REM Show error, direct to python.org
)
```

### Issue: Missing dependencies after standalone build

**Fix:** Ensure PyInstaller has all hidden imports in `build-installer.py`:
```python
--hidden-import=flask
--hidden-import=pywebview
--hidden-import=requests
--hidden-import=reportlab
```

### Issue: macOS: "Cannot open app" (code signature)

**Fix:** Sign the app after building:
```bash
codesign --deep --force --verify --verbose --sign - dist/SuperheroForge.app
```

### Issue: Ollama path not found on startup

**Fix:** Ensure `check_ollama()` in `install.py` handles timeouts gracefully

---

## File Size Reference

- **Source distribution (zip):** ~10-15 MB
- **Windows .exe (PyInstaller):** ~120-150 MB
- **macOS .app (PyInstaller):** ~150-180 MB
- **Linux AppImage:** ~140-170 MB

---

## Next Release Plan

### v1.2.1
- [ ] Add standalone installers to releases
- [ ] Update README with installer links
- [ ] Test on 3 platforms
- [ ] Create DMG for macOS
- [ ] Add code signing (optional)

### v1.3.0
- [ ] Add auto-update to standalone (check releases.github.com)
- [ ] Create Windows installer (MSI)
- [ ] Add macOS installer (PKG)
- [ ] Publish on app stores (optional)

---

## Questions?

See:
- **INSTALL. User installation guidemd** 
- **INSTALLER_SUMMARY. Technical overviewmd** 
- **README. Feature documentationmd** 
- **CHANGELOG. Version historymd** 
