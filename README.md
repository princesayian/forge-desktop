# Superhero Forge — Desktop App
### Nocturnal Knights Character System
### Powered by Ollama · No API keys · No subscriptions · Runs 100% locally

---

## What You Get

- Full Superhero Forge running as a native desktop window
- All 5 tabs: Roster, Team, Recruit, Villain, Story
- AI generation powered by a local model on your machine
- Character data saved locally between sessions
- Works completely offline after initial setup

---

## Requirements

- **Python 3.9 or higher** (you have 3.13 — perfect)
- **Ollama** (free, from ollama.com)
- ~2GB disk space for the default AI model
- Internet connection for first-time setup only

---

## First Time Setup (do this once)

### Step 1 — Install Ollama

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

This installs Python packages and downloads the frontend libraries. Takes about a minute.

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

The app opens in its own window. If PyWebView isn't installed, it falls back to your default browser automatically.

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

After pulling a new model, select it from the dropdown in the app header.

---

## File Structure

```
forge-desktop/
├── app.py              ← Main application
├── setup.py            ← Run once to set up
├── requirements.txt    ← Python dependencies
├── config.json         ← Created on first run (model settings)
├── run.bat             ← Windows launcher
├── run.sh              ← Mac/Linux launcher
├── static/
│   └── index.html      ← The full Superhero Forge UI
└── vendor/             ← Created by setup.py
    ├── react.js
    ├── react-dom.js
    └── babel.js
```

---

## Troubleshooting

**"Ollama Not Running" banner in the app**
- Make sure Ollama is installed and running
- Open a terminal and run: `ollama serve`
- Click the ↻ refresh button in the app header

**App opens in browser instead of a window**
- Install PyWebView: `pip install pywebview`
- On Windows specifically: `pip install pywebview[winforms]`

**AI generation returns errors or bad JSON**
- Local models are less reliable than cloud models for structured output
- Try regenerating — usually works on a second attempt
- Switch to `mistral` model for better JSON compliance

**Port 7432 already in use**
- The app auto-finds a free port if 7432 is taken

---

## Notes on AI Quality

Local models (Llama, Mistral) produce good creative results but are less
precise than Claude Sonnet. Hero names, backstories, and power descriptions
will be solid but may occasionally need a regeneration. The app is built
to handle this gracefully — just hit Regenerate.

For best results: use `mistral` or `llama3.1:8b` if your machine has 8GB+ RAM.
On a machine with 4GB RAM: stick with `llama3.2` (3B).
