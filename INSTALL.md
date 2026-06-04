# Superhero Forge — Installation Guide

## ⚡ Quick Start (30 seconds)

### Windows
1. Double-click **`launcher.bat`**
2. Setup runs automatically on first launch
3. App opens in a desktop window

### macOS / Linux
1. Open Terminal in this folder
2. Run: `sh launcher.sh`
3. Setup runs automatically on first launch
4. App opens in a desktop window

---

## 📋 System Requirements

- **Python 3.9 or higher** (check: `python --version` or `python3 --version`)
- **2GB free disk space** (for AI models if using local Ollama)
- Internet connection (first-time setup only, or for remote APIs)

### Install Python (if needed)

**Windows:** Download from https://www.python.org/downloads
- Check **"Add Python to PATH"** during installation

**macOS:** Install via Homebrew
```bash
brew install python3
```

**Linux:** Use your package manager
```bash
# Ubuntu/Debian
sudo apt install python3 python3-pip

# Fedora
sudo dnf install python3 python3-pip

# Arch
sudo pacman -S python
```

---

## 🚀 Installation Options

### Option 1: Automatic Setup (Recommended)

The launcher automatically runs setup on first launch:

**Windows:** Double-click `launcher.bat`
**macOS/Linux:** Run `sh launcher.sh`

### Option 2: Manual Setup

If you want to run setup separately:

**Windows:**
```cmd
install.bat
```

**macOS/Linux:**
```bash
sh install.sh
```

Then launch:
- Windows: `launcher.bat` or `run.bat`
- macOS/Linux: `sh launcher.sh` or `sh run.sh`

### Option 3: Direct Python (if setup already complete)

```bash
# Windows
python app.py

# macOS/Linux
python3 app.py
```

---

## 🤖 Optional: Local AI with Ollama (Recommended)

For the best experience with AI generation, install Ollama:

### Install Ollama

1. Download from **https://ollama.com**
2. Install and run it (starts as a background service)
3. Download a model:
   ```bash
   ollama pull llama3.2
   ```

### Using Ollama

Once installed, Superhero Forge automatically detects Ollama running on `http://localhost:11434`

**Recommended models:**
- `llama3.2` (default, 3.8GB, good balance)
- `llama3.1:8b` (8.5GB, better quality, needs 8GB+ RAM)
- `mistral` (4.8GB, best creative writing)
- `llama3.2:1b` (1.3GB, fastest, lower quality)

Pull a model:
```bash
ollama pull llama3.1:8b
```

---

## 🔑 Remote APIs (OpenAI, Groq, etc.)

Don't have Ollama? Use a cloud API instead:

1. Launch the app
2. Go to **Settings** tab
3. Change **API URL** to your remote endpoint
4. Enter your **API Key**
5. Click **Save Settings**

The app automatically switches to the right API format when a key is present.

**Supported providers:**
- OpenAI (`https://api.openai.com/v1`)
- Groq (set `GROQ_API_KEY` in `.env` file)
- Any OpenAI-compatible API

---

## 🆘 Troubleshooting

### "Python not found"
- Windows: Install Python from https://www.python.org/downloads (check "Add Python to PATH")
- macOS: `brew install python3`
- Linux: `sudo apt install python3 python3-pip`

### "Ollama not detected" banner in app
- Install Ollama from https://ollama.com
- Run: `ollama pull llama3.2`
- Restart the app
- Or use a remote API via Settings

### "Port 7432 already in use"
- The app auto-finds a free port, no action needed

### App opens in browser instead of a window
- Install PyWebView: `pip install pywebview[winforms]` (Windows) or `pip install pywebview` (macOS/Linux)
- Restart the app

### Build/Dependency errors on first launch
- Delete `config.json` and try again: `rm config.json` (macOS/Linux) or `del config.json` (Windows)
- Re-run setup: `sh launcher.sh` or `launcher.bat`

---

## 📦 Building Standalone Installers (Advanced)

To create Windows .exe and macOS .app packages:

1. Install PyInstaller:
   ```bash
   pip install pyinstaller
   ```

2. Build for your platform:
   ```bash
   python build-installer.py
   ```

3. Find your installer in the `dist/` folder:
   - Windows: `dist/SuperheroForge.exe`
   - macOS: `dist/SuperheroForge.app`

---

## 📚 More Info

- See **README.md** for features, API docs, and configuration
- See **CHANGELOG.md** for version history

---

## 🎮 First Time in the App?

1. Select a hero (or click **Recruit** to generate one)
2. Try **Story** to generate a narrative scene
3. Check **Settings** to configure AI model or remote API
4. Go to **Team** to build a full roster
5. Export **PDF** dossiers of your team

Enjoy! 🦸
