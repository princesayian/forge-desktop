# Makefile for Superhero Forge (forge-desktop)
# Usage: make <target>
#
# Dep management: Poetry (pyproject.toml). The Makefile auto-creates the
# virtualenv and installs deps on first run.
#
# run          Start the app (browser fallback if no PyWebView)
# run-gui      Start the app in PyWebView desktop mode
# setup        First-time setup: create venv + install deps
# install      Install/refresh dependencies (idempotent)
# test         Run the test suite
# lint         Run Python syntax check on app.py
# clean        Remove generated data (characters, teams, stories)
# nuke         Full reset: clean + remove config.json + remove venv
# version      Print the current FORGE_VERSION
# help         Show available targets

.PHONY: run run-gui setup install test lint clean nuke version help

# -----------------------------------------------------------------------
# Tooling
# -----------------------------------------------------------------------
POETRY     := $(shell command -v poetry 2>/dev/null)
PYTHON     := python3
APP        := app.py
VENV_DIR   := .venv
POETRY_ENV := $(shell cd $(CURDIR) 2>/dev/null && $(POETRY) env info -p 2>/dev/null)

# Detect host OS for the right PyWebView extra
UNAME_S    := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
    PLATFORM_EXTRA := macos
else ifeq ($(UNAME_S),Linux)
    PLATFORM_EXTRA := linux
else ifeq ($(OS),Windows_NT)
    PLATFORM_EXTRA := windows
else
    PLATFORM_EXTRA :=
endif

# Guard: if poetry is missing, fail fast with install instructions
ifeq ($(POETRY),)
$(error "Poetry is required. Install: https://python-poetry.org/docs/#installation")
endif

# Detect whether the Poetry env exists; if not, force `make install` first
# Use poetry env info (handles both in-project and cached venvs)
NEED_INSTALL := $(shell $(POETRY) env info -p >/dev/null 2>&1 && echo "no" || echo "yes")

# -----------------------------------------------------------------------
# Run
# -----------------------------------------------------------------------
run:
	@echo "[*] Starting Superhero Forge..."
	@$(POETRY) run $(PYTHON) $(APP)

run-gui:
	@echo "[*] Starting Superhero Forge (PyWebView)..."
	@$(POETRY) run $(PYTHON) $(APP)

# -----------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------
# Idempotent first-time setup. Safe to run multiple times.
setup: install
	@echo "[+] Setup complete."
	@echo ""
	@echo "    To launch:    make run"
	@echo "    To test:      make test"
	@echo "    To see all:   make help"

# Install deps via Poetry. Creates venv on first run.
install:
ifeq ($(NEED_INSTALL),yes)
	@echo "[*] No virtualenv found — running 'poetry install' to create $(VENV_DIR)/"
	@echo "[*] Detected platform: $(PLATFORM_EXTRA) (or empty if unknown)"
	@$(POETRY) install --extras "$(PLATFORM_EXTRA)" --extras "dev"
else
	@echo "[*] Virtualenv present — syncing deps via 'poetry install --sync'"
	@$(POETRY) install --extras "$(PLATFORM_EXTRA)" --extras "dev" --sync
endif

# -----------------------------------------------------------------------
# Quality
# -----------------------------------------------------------------------
test: install
	@if [ -d tests ]; then \
		$(POETRY) run $(PYTHON) -m pytest tests/; \
	else \
		echo "[!] No tests/ directory yet. Create tests/ and add test_app.py."; \
		exit 1; \
	fi

# Run tests with coverage report
test-cov: install
	@$(POETRY) run $(PYTHON) -m pytest tests/ --cov --cov-report=term-missing

lint: install
	@$(POETRY) run $(PYTHON) -m py_compile $(APP) && echo "[+] $(APP) syntax OK"
	@$(POETRY) run $(PYTHON) -m flake8 $(APP) --max-line-length=100 || true

# Format code
format: install
	@$(POETRY) run $(PYTHON) -m black $(APP) tests/

# Type-check
typecheck: install
	@$(POETRY) run $(PYTHON) -m mypy $(APP)

# -----------------------------------------------------------------------
# Cleanup
# -----------------------------------------------------------------------
clean:
	@echo "[*] Removing generated data..."
	@rm -f data/characters/*.json data/teams/*.json data/stories/*.json 2>/dev/null || true
	@echo "[+] Data cleared."

# Full reset: data + config + venv + poetry lock
nuke: clean
	@echo "[!] Removing config, lock, caches, and Poetry virtualenv..."
	@rm -f config.json .forge.lock
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name '*.pyc' -delete 2>/dev/null || true
	@rm -rf $(VENV_DIR) poetry.lock
	@-$(POETRY) env remove --all 2>/dev/null || true
	@echo "[+] Full reset complete. Run 'make setup' to rebuild."

# -----------------------------------------------------------------------
# Info
# -----------------------------------------------------------------------
version:
	@$(POETRY) run $(PYTHON) -c "import ast; tree=ast.parse(open('$(APP)').read()); print(next(ast.literal_eval(n.value) for n in ast.walk(tree) if isinstance(n,ast.Assign) and any(t.id=='FORGE_VERSION' for t in n.targets if isinstance(t,ast.Name))));"

# Show Poetry env location
env:
	@$(POETRY) env info

help:
	@echo "Superhero Forge targets:"
	@echo ""
	@echo "  run          Start the app"
	@echo "  run-gui      Start the app (alias for run)"
	@echo "  setup        First-time setup: install Python deps"
	@echo "  install      Install/refresh Python deps via Poetry"
	@echo "  test         Run pytest"
	@echo "  test-cov     Run pytest with coverage report"
	@echo "  lint         Syntax check + flake8 on app.py"
	@echo "  format       Auto-format with black"
	@echo "  typecheck    Run mypy type checker"
	@echo "  clean        Remove generated data files"
	@echo "  nuke         Full reset (data + config + venv)"
	@echo "  env          Show Poetry env info"
	@echo "  version      Print FORGE_VERSION"
	@echo "  help         Show this message"
