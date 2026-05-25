# Changelog

All notable changes to Forge Desktop are documented here.

---

## [Unreleased] — 2026-05-24

### Changed
- Data sync update (`forge-data.json`)

---

## 2026-05-22 — Windows Support, Randomizer & Server-Side Storage

### Added
- **Windows setup script** (`setup_windows.bat`): one-run installer that sets up pip dependencies and creates a no-console Desktop launcher (pythonw.exe shortcut or VBScript fallback)
- **Randomizer**: random hero stat/build generation from the character editor
- **Server-side storage**: `/api/store/*` REST routes backed by `forge-data.json` — team and roster data now persists across app restarts
- **Version badge**: `/api/status` now returns the app version so the header badge populates correctly

### Changed
- **Cross-platform Ollama support**: `ensure_ollama()` now detects and launches Ollama on Windows using the correct path and `DETACHED_PROCESS` flags
- **Storage layer migrated from localStorage to server-side**: `window.storage` now calls `/api/store/*` REST endpoints; auto-migrates existing localStorage data on first load

---

## 2026-05-20 — Character Rebrand, PWA & Team Saves

### Added
- **PWA support**: app can now be installed as a Progressive Web App
- **Team saves**: team roster data persists via the backend
- **Doc generation script** (`generate_docs.py`)

### Changed
- **Character rebrand**: hero names updated to Wakháŋ, Null/Void, Catalix, and Bastion Prime (internal IDs unchanged)
- **Name and power editing**: heroes' display names and power values are now editable in the UI
- **NK roster edits**: Nocturnal Knights character attributes and layout updated

---

## 2026-05-16 — UI Fixes & Navigation

### Fixed
- **Blank page bug**: resolved a render issue that caused the app to load an empty screen
- **Restart/reload**: added app restart and hard reload controls to `app.py` and the UI

### Added
- **Team roster quick-jump**: navigation shortcut to jump directly to the team roster view

### Changed
- **Gender-neutral UI**: updated pronoun/label copy throughout the interface
- README updated

---

## 2026-05-15 — Initial Build

### Added
- **Initial Superhero Forge build**: Flask backend (`app.py`) + React frontend (`static/index.html`) with vendored React/Babel
- **Hero roster**: four Nocturnal Knights characters with stats, colors, and roles
- **Hero images**: added portraits for Wakháŋ, Null/Void, Catalix, and Bastion Prime
- **Image storage**: Flask routes for uploading and serving hero images
- **Forge lock system**: `.forge.lock` tracks app state between sessions
- **Battle mode**: hero vs. hero battle simulation
- **Versioning**: version tracking in `config.json` and displayed in the UI
- **Cross-platform launchers**: `run.sh`, `run.bat`, `setup.py`
- **Requirements**: `requirements.txt` for pip dependencies
