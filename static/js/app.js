/*
 * Superhero Forge — frontend app (Alpine.js)
 *
 * Single Alpine component owns all state. Templates use x-data, x-show,
 * x-for, x-model etc. No virtual DOM, no build step.
 *
 * Backed by the existing /api/* JSON endpoints — no backend changes needed.
 */

document.addEventListener('alpine:init', () => {
  Alpine.data('forgeApp', () => ({

    // ── Static metadata (injected from a meta tag rendered by Flask) ────
    version: (document.querySelector('meta[name="forge-version"]') || {}).content || '1.2.0',

    // ── UI state ─────────────────────────────────────────────────────────
    activeTab: 'settings',

    // ── Ollama / config state (mirrors /api/status + /api/config) ────────
    ollamaOk: false,
    ollamaUrl: '',
    mode: 'local',            // 'local' or 'remote'
    currentModel: 'llama3.2',
    models: [],
    hasApiKey: false,
    statusLoading: false,
    saving: false,
    pulling: false,

    // ── Form state (settings inputs) ─────────────────────────────────────
    form: {
      ollamaUrl: 'http://localhost:11434',
      ollamaApiKey: '',
    },

    // ── Toast queue ──────────────────────────────────────────────────────
    toasts: [],
    _toastId: 0,

    // ── Lifecycle ────────────────────────────────────────────────────────
    init() {
      this.refreshStatus();
      this.loadConfig();
      // Poll status every 10s
      setInterval(() => this.refreshStatus(), 10000);
    },

    // ── API helpers ──────────────────────────────────────────────────────
    async api(path, opts = {}) {
      const res = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
      });
      if (!res.ok) {
        let detail = '';
        try { detail = (await res.json()).error || ''; } catch (e) {}
        throw new Error(`${res.status} ${res.statusText}${detail ? ': ' + detail : ''}`);
      }
      return res.json();
    },

    // ── Status ───────────────────────────────────────────────────────────
    async refreshStatus() {
      this.statusLoading = true;
      try {
        const d = await this.api('/api/status');
        this.ollamaOk   = d.ollama || d.ollama_running || false;
        this.ollamaUrl  = d.ollama_url || '';
        this.mode       = d.mode || 'local';
        this.currentModel = d.current_model || d.model || 'llama3.2';
        this.models     = d.models || [];
      } catch (e) {
        // Backend unreachable — leave defaults
        this.ollamaOk = false;
      } finally {
        this.statusLoading = false;
      }
    },

    // ── Config ───────────────────────────────────────────────────────────
    async loadConfig() {
      try {
        const c = await this.api('/api/config');
        this.form.ollamaUrl = c.ollama_url || 'http://localhost:11434';
        this.hasApiKey      = !!c.has_api_key;
      } catch (e) {
        this.toast('error', 'Failed to load config: ' + e.message);
      }
    },

    async saveConnection() {
      this.saving = true;
      try {
        const body = { ollama_url: this.form.ollamaUrl };
        if (this.form.ollamaApiKey) body.ollama_api_key = this.form.ollamaApiKey;
        await this.api('/api/config', { method: 'POST', body: JSON.stringify(body) });
        this.toast('success', 'Connection settings saved');
        this.form.ollamaApiKey = '';   // never keep the key in the form
        await this.loadConfig();
        await this.refreshStatus();
      } catch (e) {
        this.toast('error', 'Save failed: ' + e.message);
      } finally {
        this.saving = false;
      }
    },

    async saveModel() {
      try {
        await this.api('/api/config', {
          method: 'POST',
          body: JSON.stringify({ model: this.currentModel }),
        });
        this.toast('success', `Active model set to ${this.currentModel}`);
      } catch (e) {
        this.toast('error', 'Failed to set model: ' + e.message);
        // Revert
        await this.refreshStatus();
      }
    },

    // ── Pull ─────────────────────────────────────────────────────────────
    async pullModel() {
      const target = prompt(
        'Model to pull (e.g. llama3.2, mistral, llama3.1:8b):',
        this.currentModel || 'llama3.2'
      );
      if (!target) return;
      this.pulling = true;
      this.toast('success', `Pulling ${target} in background — this can take a few minutes`);
      try {
        await this.api('/api/pull', {
          method: 'POST',
          body: JSON.stringify({ model: target }),
        });
        await this.refreshStatus();
        this.toast('success', `Pull complete: ${target}`);
      } catch (e) {
        this.toast('error', 'Pull failed: ' + e.message);
      } finally {
        this.pulling = false;
      }
    },

    // ── Toasts ───────────────────────────────────────────────────────────
    toast(kind, message) {
      const id = ++this._toastId;
      this.toasts.push({ id, kind, message });
      setTimeout(() => this.dismissToast(id), 4000);
    },
    dismissToast(id) {
      this.toasts = this.toasts.filter(t => t.id !== id);
    },
  }));
});
