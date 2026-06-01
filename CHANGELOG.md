# Changelog

All notable changes to Superhero Forge will be documented here.

## [1.2.1] - 2025-05-19

### Security
- **Path traversal fix** — all CRUD endpoints (characters, teams, stories) now sanitize filenames via `_safe_name()`, preventing `../` attacks that could read/write/delete arbitrary files
- **PIN guard bypass fix** — `/api/images` (no trailing slash) was not exempted from remote PIN lock; now correctly whitelisted alongside `/api/images/`
- **`.gitignore` encoding fix** — file was UTF-16 LE with BOM, making git unable to read patterns; converted to UTF-8. Added `data/`, `images/`, `.claude/`
- **`config.json` removed from git tracking** — contained live `secret_key`; now excluded via `.gitignore`. Added `config.json.example` as safe template

### Changed
- **Unified `model`/`default_model`** — removed confusing dual-key sync logic. Single `model` key with `llama3.2` default. All fallback chains simplified to `config.get("model", "llama3.2")`
- **Version bumped** — `FORGE_VERSION` 1.1 → 1.2.0
- **`save_character`/`save_team`/`save_story`** no longer return `path` in response (was leaking server paths)

### Added
- **Makefile** — common dev targets: `make run`, `make setup`, `make vendor`, `make test`, `make lint`, `make clean`, `make nuke`, `make version`, `make help`

### Fixed
- `/api/status` and `/health` now use consistent `config.get("model", "llama3.2")` fallback

## [1.2.0] - 2025-05-19

### Added
- **Babel removal** — all JSX converted to `React.createElement`; no more 3MB client-side transpiler, instant page loads
- **Backend merge from superheroforge v2.0**:
  - `requests` library for all Ollama/remote API calls (replaces `urllib`)
  - Remote/local mode detection (`_is_remote()`, `_headers()`) — auto-switches between native Ollama and OpenAI-compatible `/v1/` endpoints
  - `ollama_models()`, `ollama_generate()`, `ollama_is_running()` — mode-aware helpers
  - Generate endpoints: `POST /api/generate/hero`, `/villain`, `/recruit`, `/story` with proper error handling (401/503/504/422)
  - Prompt templates with "Theme and concept" framing — prevents model from using theme as literal name
  - `extract_json()` — robust JSON extraction from model output (handles markdown fences, partial output)
  - Characters/Teams/Stories CRUD (`/api/characters`, `/api/teams`, `/api/stories`) with file persistence in `data/` directories
  - `/api/models` endpoint — separate from `/api/status`, returns available model list
  - Mode-aware chat endpoint — local uses `/api/chat`, remote uses `/v1/chat/completions` with Bearer auth
  - Config GET redacts API key — returns `has_api_key: bool` instead of the key value
  - Improved image upload — detects extension from data URI prefix, strips `;base64,` properly
  - Model pull blocks remote mode — returns 400 with clear error message
  - PID-safe `_remove_lock()` — only removes lock file if PID matches current process
  - `ensure_ollama()` skips auto-start in remote mode
  - Data directories auto-created at startup (`data/characters/`, `data/teams/`, `data/stories/`)

### Changed
- Dropped `vendor/babel.js` (3.1MB) and `superhero-forge.jsx` (unused ES module copy)
- `setup.py` no longer downloads Babel
- `index.html` script tag changed from `type="text/babel"` to plain `<script>`

### Fixed
- Generate endpoints use proper `raw` variable handling — parse failures no longer cause 500s
- ConnectionError messages are mode-aware — suggests starting Ollama in local mode, shows auth hint in remote mode
- HTTP 401 from remote API returns proper error messages
- JSON parse failures return 422 with raw output for debugging

## [1.1.0] - 2025-05-18

### Added
- Multi-team system with roster, team dynamics, villain, story, battle, arc, tiers, and universe tabs
- Cloudflared tunnel support for remote access
- DuckDNS update loop for custom domain routing
- PIN guard for remote access (`/forge-pin`, `/api/verify-pin`)
- Auto-update check and pull (`/api/update/check`, `/api/update/pull`)
- Remote access status endpoint (`/api/remote`)
- App restart endpoint (`/api/restart`)
- PyWebView native window launcher with tkinter dialog for existing instances
- PDF export endpoint with reportlab (roster dossiers with covers, stats, powers, origin, DNA, appearance, character images)
- Image management API — base64 upload, serve, delete
- Chat API with auto system prompt and JSON format detection
- Model pull endpoint — triggers `ollama pull` in background thread
- Health endpoint — returns `{status, model, version}`
- Auto-start Ollama, free port finder, single-instance lock
- Persistent `secret_key` for session continuity across restarts

## [1.0.0] - 2025-05-13

### Added
- Initial Superhero Forge desktop app
- React-based UI with createElement (no build tooling)
- Ollama-powered character generation
- Local-first design, no API keys required