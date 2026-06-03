# Makefile for Superhero Forge (forge-desktop)
# Usage: make <target>
#
# run              Start the app (serves built frontend via Flask)
# dev              Start Flask + Vite dev server together (hot reload)
# build-frontend   Build the React frontend to static/
# run-gui          Start the app in PyWebView desktop mode
# setup            First-time setup: install deps + npm install + build
# vendor           Download vendor JS libraries (legacy)
# test             Run the test suite
# lint             Run Python syntax check on app.py
# clean            Remove generated data (characters, teams, stories)
# nuke             Full reset: clean + remove config.json
# version          Print the current FORGE_VERSION

.PHONY: run run-gui dev build-frontend setup vendor test lint clean nuke version help

PYTHON := python3
APP    := app.py
export PATH := $(HOME)/.local/bin:$(PATH)

# ---------------------------------------------------------------
# Run
# ---------------------------------------------------------------

run:
	@echo "[*] Starting Superhero Forge..."
	@$(PYTHON) $(APP)

run-gui:
	@echo "[*] Starting Superhero Forge (PyWebView)..."
	@$(PYTHON) $(APP)

dev:
	@echo "[*] Starting dev mode (Flask on :5000, Vite on :5173)..."
	@cd client && npm run dev &
	@$(PYTHON) $(APP)

build-frontend:
	@echo "[*] Building React frontend..."
	@cd client && npm run build
	@echo "[+] Frontend built to static/"

# ---------------------------------------------------------------
# Setup
# ---------------------------------------------------------------

setup:
	@echo "[*] Installing Python dependencies..."
	@$(PYTHON) -m pip install -r requirements.txt --quiet
	@echo "[*] Installing npm dependencies..."
	@cd client && npm install
	@$(MAKE) build-frontend
	@$(MAKE) vendor

vendor:
	@echo "[*] Downloading vendor JS libraries..."
	@$(PYTHON) setup.py

# ---------------------------------------------------------------
# Quality
# ---------------------------------------------------------------

test:
	@if [ -d tests ]; then \
		$(PYTHON) -m pytest tests/ -v; \
	else \
		echo "[!] No tests/ directory yet. Create tests/ and add test_app.py."; \
		exit 1; \
	fi

lint:
	@$(PYTHON) -m py_compile $(APP) && echo "[+] $(APP) syntax OK"

# ---------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------

clean:
	@echo "[*] Removing generated data..."
	@rm -f data/characters/*.json data/teams/*.json data/stories/*.json
	@echo "[+] Data cleared."

nuke: clean
	@echo "[!] Removing config, lock, caches..."
	@rm -f config.json .forge.lock
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name '*.pyc' -delete 2>/dev/null || true
	@echo "[+] Full reset complete."

# ---------------------------------------------------------------
# Info
# ---------------------------------------------------------------

version:
	@$(PYTHON) -c "import ast; tree=ast.parse(open('$(APP)').read()); print(next(ast.literal_eval(n.value) for n in ast.walk(tree) if isinstance(n,ast.Assign) and any(t.id=='FORGE_VERSION' for t in n.targets if isinstance(t,ast.Name))));"

help:
	@echo "Superhero Forge targets:"
	@echo ""
	@echo "  run         Start the app"
	@echo "  run-gui     Start the app (alias)"
	@echo "  setup       First-time setup (deps + vendor JS)"
	@echo "  vendor      Download vendor JS libraries"
	@echo "  test        Run pytest"
	@echo "  lint        Syntax check app.py"
	@echo "  clean       Remove generated data files"
	@echo "  nuke        Full reset (clean + config + caches)"
	@echo "  version     Print FORGE_VERSION"
	@echo "  dev         Run Flask + Vite dev server together
  build-frontend  Build React to static/
  help        Show this message"