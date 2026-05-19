# Superhero Forge — Desktop App
### Nocturnal Knights Character System
### Powered by Ollama · Local or Remote API · Runs 100% locally

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

## First Time Setup (do this once)

### Step 1 — Install Ollama (local mode only)

1. Go to **https://ollama.com** and download the installer for your OS
2. Install and launch Ollama (it runs as a background service)
3. Open a terminal/command prompt and run:
   ```
   ollama pull llama3.2
   ```
   This downloads the default AI model (~2GB). Wait for it to finish.

### Step 2 — Set up the app

**Windows:**
```
python setup.py
```

**Mac:**
```
python3 setup.py
```

This installs Python packages and downloads the frontend libraries (React + ReactDOM). Takes about a minute.

---

## Launching the App

**Windows:** Double-click `run.bat`

**Mac:** Open Terminal in the folder and run:
```
sh run.sh
```

Or on either platform:
```
python app.py        (Windows)
python3 app.py       (Mac)
```

The app opens in its own window via PyWebView. If PyWebView isn't installed, it falls back to your default browser automatically.

---

## Remote API (Ollama Cloud, OpenAI, etc.)

Instead of running a local model, you can connect to a remote API:

1. Open the **Settings** tab in the app
2. Change the **Ollama API URL** to your remote endpoint (e.g. `https://api.ollama.ai`)
3. Enter your **API Key** in the password field
4. Click **Save Settings**

The app automatically switches to OpenAI-compatible `/v1/chat/completions` mode when an API key is set. Generation endpoints use `/v1/chat/completions` for remote and `/api/generate` for local.

---

## Running on Your Plex Server (Windows)

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
- Config persisted in `config.json` (includes model, API settings, secrets)

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
├── app.py              ← Main application (Flask server + all API endpoints)
├── setup.py            ← Run once to set up
├── requirements.txt    ← Python dependencies
├── config.json         ← Created on first run (model, API, tunnel settings)
├── CHANGELOG.md        ← Version history
├── run.bat             ← Windows launcher
├── run.sh              ← Mac/Linux launcher
├── data/
│   ├── characters/     ← Saved hero/villain JSON files
│   ├── teams/          ← Saved team JSON files
│   └── stories/        ← Saved story JSON files
├── images/             ← Uploaded character portraits
├── static/
│   └── index.html      ← The full Superhero Forge UI (React createElement)
└── vendor/             ← Created by setup.py
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