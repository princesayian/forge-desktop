# Superhero Forge — Desktop App
### v1.2.0 · Powered by Ollama · Local or Remote API · Runs 100% locally

---

## What You Get

- Full Superhero Forge running as a native desktop window
- All tabs: Roster, Team, Recruit, Villain, Story, and more
- AI generation powered by local Ollama or any remote OpenAI-compatible API
- API key support for Ollama Cloud, OpenAI, and compatible providers
- Character data saved locally between sessions
- Characters, teams, and stories persisted as JSON files
- PDF export for styled roster dossiers
- Image upload and management for character portraits
- Remote access via Cloudflared tunnel with PIN protection
- Auto-update from Git repository
- Works offline with local Ollama, or connect to a remote endpoint

---

## Requirements

- **Python 3.9 or higher**
- **Ollama** (free, from ollama.com) for local AI — or a remote API endpoint
- ~2GB disk space for the default AI model
- Internet connection for first-time setup only (or remote API)

---

## Installation & First Launch

### Option 1: Quick Start (Recommended)

**Windows:**
1. Double-click `launcher.bat`
   - Setup runs automatically on first launch
   - App opens in a desktop window

**macOS/Linux:**
1. Open Terminal in the app folder
2. Run: `sh launcher.sh`
   - Setup runs automatically on first launch
   - App opens in a desktop window

### Option 2: Manual Setup Then Launch

If you prefer to run setup separately:

**Windows:**
```
install.bat
```
Then launch with: `launcher.bat` (or `run.bat`)

**macOS/Linux:**
```
sh install.sh
```
Then launch with: `sh launcher.sh` (or `sh run.sh`)

### Option 3: Direct Python Launch

If you already have Python dependencies installed:

**Windows:** `python app.py`

**macOS/Linux:** `python3 app.py`

---

## Optional: Install Ollama for Local AI (Recommended)

For the best experience with AI generation, install Ollama:

1. Download from **https://ollama.com**
2. Install and launch it (runs as a background service)
3. Open terminal/command prompt and run:
   ```
   ollama pull llama3.2
   ```
   This downloads the AI model (~2GB).

**Note:** The app works without Ollama — you can use remote APIs (OpenAI, etc.) instead via Settings.

---

## Remote API (Ollama Cloud, OpenAI, etc.)

Instead of running a local model, you can connect to a remote API:

1. Open the **Settings** tab in the app
2. Change the **Ollama API URL** to your remote endpoint (e.g. `https://api.ollama.ai`)
3. Enter your **API Key** in the password field
4. Click **Save Settings**

The app automatically switches to OpenAI-compatible `/v1/chat/completions` mode when an API key is set. Generation endpoints use `/v1/chat/completions` for remote and `/api/generate` for local.

---

## Running as a Windows Background Service

To have it start automatically with Windows using NSSM:

```batch
nssm install SuperheroForge python "C:\Path\To\forge-desktop\app.py"
nssm set SuperheroForge AppDirectory "C:\Path\To\forge-desktop"
nssm set SuperheroForge Start SERVICE_AUTO_START
nssm start SuperheroForge
```

Then access from any device on your network at:
```
http://YOUR-SERVER-IP:7432
```

---

## Changing the AI Model

Select a model from the dropdown in the app header, or visit the Settings tab.

### Local Ollama (default)

Better quality (needs more RAM):
```
ollama pull llama3.1:8b
```

Fastest (lower quality):
```
ollama pull llama3.2:1b
```

Best creative writing quality:
```
ollama pull mistral
```

---

## Features

### AI Generation
- **Hero Generator** — creates complete superhero profiles with stats, powers, backstory
- **Villain Generator** — creates antagonists connected to your team
- **Recruit Generator** — suggests new team members based on quiz answers
- **Story Generator** — writes narrative scenes from cast and scenario selections
- All prompts use "Theme and concept" framing to prevent literal name reuse

### Data Persistence
- Characters, teams, and stories saved as JSON in `data/` directories
- Image uploads stored in `images/`
- Config persisted in `config.json` (auto-created on first run, excluded from git)

### Security
- Path traversal protection on all CRUD endpoints (filenames sanitized via `_safe_name()`)
- Remote API keys redacted from `/api/config` responses
- Flask `secret_key` auto-generated and stored in `config.json` (never committed)
- PIN guard for remote access with session-based verification
- Single-instance lock (`.forge.lock`) with PID-safe cleanup

### PDF Export
- Generate styled dossier PDFs with covers, stats, powers, origins, DNA, and character images
- Supports multi-team exports with team-specific coloring and NK alignment badges

### Remote Access
- **Cloudflared tunnel** — one-click temporary public URL
- **DuckDNS** — custom domain routing for persistent access
- **PIN guard** — require a PIN to access the app from remote networks
- Configurable from the Settings tab

### Auto-Update
- Checks for Git updates on launch
- Pull and restart from within the app

---

## File Structure

```
forge-desktop/
├── app.py                ← Main application (Flask server + all API endpoints)
├── setup.py              ← Run once to set up
├── requirements.txt      ← Python dependencies
├── config.json.example   ← Template for config (config.json auto-created, gitignored)
├── CHANGELOG.md          ← Version history
├── run.bat               ← Windows launcher
├── run.sh                ← Mac/Linux launcher
├── data/
│   ├── characters/       ← Saved hero/villain JSON files
│   ├── teams/             ← Saved team JSON files
│   └── stories/           ← Saved story JSON files
├── images/               ← Uploaded character portraits
├── static/
│   └── index.html          ← The full Superhero Forge UI (React createElement)
└── vendor/               ← Created by setup.py
    ├── react.js
    └── react-dom.js
```

---

## Troubleshooting

**"Ollama Not Running" banner in the app**
- Local mode: Make sure Ollama is installed and running — open a terminal and run: `ollama serve`
- Remote mode: Check your API URL and key in the Settings tab
- Click the ↻ refresh button in the app header

**"Authentication failed" error**
- Check your API key in the Settings tab
- Make sure the key hasn't expired or been revoked

**App opens in browser instead of a window**
- Install PyWebView: `pip install pywebview`
- On Windows specifically: `pip install pywebview[winforms]`

**AI generation returns errors or bad JSON**
- Local models are less reliable than cloud models for structured output
- Try regenerating — usually works on a second attempt
- Switch to `mistral` model for better JSON compliance
- Error responses now include raw model output for debugging (422 status)

**Port 7432 already in use**
- The app auto-finds a free port if 7432 is taken

**Multiple instances warning**
- Only one Forge instance can run at a time (enforced by `.forge.lock`)

---

## Notes on AI Quality

Local models (Llama, Mistral) produce good creative results but are less
precise than cloud models like Claude Sonnet. Hero names, backstories, and
power descriptions will be solid but may occasionally need a regeneration.
The app is built to handle this gracefully — just hit Regenerate.

For best results: use `mistral` or `llama3.1:8b` if your machine has 8GB+ RAM.
On a machine with 4GB RAM: stick with `llama3.2` (3B).

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (status, model, version) |
| `/api/status` | GET | Ollama status and model list |
| `/api/models` | GET | Available models |
| `/api/config` | GET/POST | Get or update configuration |
| `/api/chat` | POST | Chat completions (local or remote) |
| `/api/generate/hero` | POST | Generate a hero character |
| `/api/generate/villain` | POST | Generate a villain |
| `/api/generate/recruit` | POST | Generate a team recruit |
| `/api/generate/story` | POST | Generate a story scene |
| `/api/characters` | GET/POST | List or save characters |
| `/api/characters/<name>` | DELETE | Delete a character |
| `/api/teams` | GET/POST | List or save teams |
| `/api/teams/<name>` | DELETE | Delete a team |
| `/api/stories` | GET/POST | List or save stories |
| `/api/stories/<name>` | DELETE | Delete a story |
| `/api/images` | GET | List image IDs |
| `/api/images/<id>` | GET/POST/DELETE | Serve, upload, or delete an image |
| `/api/pull` | POST | Pull a model (local only) |
| `/api/export-pdf` | POST | Export roster as PDF |
| `/api/update/check` | GET | Check for Git updates |
| `/api/update/pull` | POST | Pull and apply updates |
| `/api/remote` | GET | Remote access status |
| `/api/verify-pin` | POST | Verify PIN for remote access |
| `/api/restart` | POST | Restart the server |