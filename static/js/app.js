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

    // ── Teams state ───────────────────────────────────────────────────────
    // Default team is hardcoded; custom teams loaded from /api/store
    NK_TEAM: {
      id: 'nocturnal-knights',
      name: 'Nocturnal Knights',
      abbr: 'NK',
      color: '#534AB7',
      colorLight: '#AFA9EC',
      type: 'street',
      nkAlignment: 'base',
      isDefault: true,
      description: 'Dark urban anti-heroes operating in the shadows between crime and justice.',
      motto: 'We are the dark between the lights.',
      origin: 'Founded by Kareem Carter after surviving a government black-site experiment.',
    },
    teams: [],              // [NK_TEAM, ...customTeams]
    customTeams: [],        // persisted to /api/store/forge-teams
    activeTeamId: 'nocturnal-knights',
    teamRosters: {},        // {teamId: [member, ...]}  persisted to /api/store/forge-rosters
    removedMembers: {},     // {teamId: [memberId, ...]}  persisted to /api/store/forge-removed
    showTeamEditor: false,
    editingTeam: null,      // null = create mode, object = edit mode
    teamsLoading: false,

    // ── Constants (mirrored from old frontend) ───────────────────────────
    TEAM_COLORS: [
      { id: 'violet',    label: 'Void Violet',   hex: '#534AB7' },
      { id: 'teal',      label: 'Cipher Teal',   hex: '#0F6E56' },
      { id: 'crimson',   label: 'Crimson',       hex: '#A32D2D' },
      { id: 'navy',      label: 'Resolve Blue',  hex: '#185FA5' },
      { id: 'amber',     label: 'Ember Amber',   hex: '#BA7517' },
      { id: 'jade',      label: 'Jade',          hex: '#1D9E75' },
      { id: 'rust',      label: 'Rust',          hex: '#993C1D' },
      { id: 'midnight',  label: 'Midnight',      hex: '#2D1B69' },
      { id: 'gunmetal',  label: 'Gunmetal',      hex: '#3D4A5C' },
      { id: 'magenta',   label: 'Magenta',       hex: '#8B1A8B' },
      { id: 'electric',  label: 'Electric',      hex: '#0066CC' },
      { id: 'forest',    label: 'Forest',        hex: '#1A5C2A' },
    ],
    TEAM_TYPES: [
      { id: 'street',         label: 'Street Level' },
      { id: 'cosmic',         label: 'Cosmic / Supernatural' },
      { id: 'government',     label: 'Government Agency' },
      { id: 'underground',    label: 'Underground' },
      { id: 'legacy',         label: 'Legacy Heroes' },
      { id: 'tech',           label: 'Tech / Corporate' },
      { id: 'international',  label: 'International' },
      { id: 'vigilante',      label: 'Vigilante Network' },
    ],
    NK_ALIGNMENTS: [
      { id: 'allied',   label: 'Allied with NK',   color: '#0F6E56' },
      { id: 'rival',    label: 'NK Rivals',        color: '#BA7517' },
      { id: 'enemy',    label: 'NK Enemies',       color: '#8B1A1A' },
      { id: 'neutral',  label: 'Neutral',          color: '#888780' },
      { id: 'splinter', label: 'NK Splinter Cell', color: '#993C1D' },
    ],

    // ── Characters state (loaded from /api/characters, file-based) ───────
    characters: [],           // Array of character objects
    charactersLoading: false,
    activeCharacter: null,    // Currently selected character (for detail panel)
    characterSearch: '',      // Filter text
    characterFilter: 'all',   // 'all' | 'hero' | 'villain' | 'recruit'
    showCharacterGenerator: false,
    generateForm: {
      theme: '',              // Free-text theme/concept
      mode: 'hero',           // 'hero' | 'villain' | 'recruit'
    },
    generating: false,
    lastGenerated: null,      // Result of last generation

    // ── Villains state (pool, stored in /api/store/forge-villains) ──────
    // Each villain = character-shaped object with `isVillain: true`,
    // `targetTeams: [teamId, ...]`, optional `threatLevel`, `goal`.
    villainPool: [],
    villainsLoading: false,
    activeVillain: null,
    villainSearch: '',
    villainThreatFilter: 'all',   // 'all' | 'street' | 'metro' | 'global' | 'cosmic'
    showVillainGenerator: false,
    villainGenerateForm: {
      theme: '',
      targetTeams: [],         // Selected team IDs this villain targets
    },
    generatingVillain: false,
    lastGeneratedVillain: null,

    // ── Stories state (loaded from /api/stories, file-based) ────────────
    // Each story: {title, heroes, villains, setting, content, source_model, ts}
    stories: [],
    storiesLoading: false,
    activeStory: null,
    storySearch: '',
    showStoryGenerator: false,
    storyGenerateForm: {
      heroIds: [],
      villainIds: [],
      setting: 'a dark city at night',
    },
    generatingStory: false,
    lastGeneratedStory: null,

    // ── Toast queue ──────────────────────────────────────────────────────
    toasts: [],
    _toastId: 0,

    // ── Lifecycle ────────────────────────────────────────────────────────
    init() {
      this.refreshStatus();
      this.loadConfig();
      this.loadTeams();
      this.loadCharacters();
      this.loadVillains();
      this.loadStories();
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

    // ── Teams ────────────────────────────────────────────────────────────
    // Load custom teams + rosters from /api/store on startup
    async loadTeams() {
      this.teamsLoading = true;
      try {
        const teams = await this.storeGet('forge-teams');
        this.customTeams = Array.isArray(teams) ? teams : [];
      } catch (e) {
        // Key doesn't exist yet (first run) — that's fine
        this.customTeams = [];
      }
      try {
        const rosters = await this.storeGet('forge-rosters');
        this.teamRosters = rosters || {};
      } catch (e) {
        this.teamRosters = {};
      }
      try {
        const removed = await this.storeGet('forge-removed');
        this.removedMembers = removed || {};
      } catch (e) {
        this.removedMembers = {};
      }
      this._rebuildTeams();
      this.teamsLoading = false;
    },

    _rebuildTeams() {
      // NK team is always first, then any custom teams
      this.teams = [this.NK_TEAM, ...this.customTeams.filter(t => !t.isDefault)];
      // Auto-select NK if active team was removed
      if (!this.teams.find(t => t.id === this.activeTeamId)) {
        this.activeTeamId = this.NK_TEAM.id;
      }
    },

    // storeGet/storeSet wrap /api/store with auto-JSON-parse
    async storeGet(key) {
      const r = await fetch(`/api/store/${encodeURIComponent(key)}`);
      if (!r.ok) throw new Error('Key not found');
      const d = await r.json();
      return JSON.parse(d.value);
    },

    async storeSet(key, value) {
      await fetch(`/api/store/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: JSON.stringify(value) }),
      });
    },

    async storeDelete(key) {
      await fetch(`/api/store/${encodeURIComponent(key)}`, { method: 'DELETE' });
    },

    // Active team helpers
    get activeTeam() {
      return this.teams.find(t => t.id === this.activeTeamId) || this.NK_TEAM;
    },

    setActiveTeam(id) {
      this.activeTeamId = id;
    },

    // Roster = built-in members (NK team) NOT in removedMembers + custom members
    getActiveRoster(teamId) {
      const id = teamId || this.activeTeamId;
      const removed = (this.removedMembers[id] || []);
      // For NK team, the default roster is hardcoded later. For now: empty array.
      // Custom teams have whatever's in teamRosters.
      const custom = (this.teamRosters[id] || []).filter(m => !removed.includes(m.id));
      return custom;
    },

    // Team CRUD
    openTeamCreator() {
      this.editingTeam = null;
      this.showTeamEditor = true;
    },

    openTeamEditor(team) {
      // Don't allow editing the hardcoded NK team
      if (team.isDefault) {
        this.toast('error', 'The Nocturnal Knights team is read-only.');
        return;
      }
      this.editingTeam = JSON.parse(JSON.stringify(team));
      this.showTeamEditor = true;
    },

    closeTeamEditor() {
      this.showTeamEditor = false;
      this.editingTeam = null;
    },

    async saveTeam(teamData) {
      try {
        let newList;
        if (this.editingTeam) {
          // Edit existing
          newList = this.customTeams.map(t =>
            t.id === this.editingTeam.id ? { ...t, ...teamData } : t
          );
        } else {
          // Create new
          const id = `team-${Date.now()}`;
          newList = [...this.customTeams, { ...teamData, id, isDefault: false, createdAt: Date.now() }];
        }
        await this.storeSet('forge-teams', newList);
        this.customTeams = newList;
        this._rebuildTeams();
        this.closeTeamEditor();
        this.toast('success', this.editingTeam ? 'Team updated' : `Team "${teamData.name}" created`);
      } catch (e) {
        this.toast('error', 'Save failed: ' + e.message);
      }
    },

    async deleteTeam(team) {
      if (team.isDefault) {
        this.toast('error', 'Cannot delete the default team.');
        return;
      }
      if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;
      try {
        const newList = this.customTeams.filter(t => t.id !== team.id);
        await this.storeSet('forge-teams', newList);
        // Also clean up its roster
        const newRosters = { ...this.teamRosters };
        delete newRosters[team.id];
        await this.storeSet('forge-rosters', newRosters);
        this.customTeams = newList;
        this.teamRosters = newRosters;
        this._rebuildTeams();
        this.toast('success', `Team "${team.name}" deleted`);
      } catch (e) {
        this.toast('error', 'Delete failed: ' + e.message);
      }
    },

    // Auto-abbr helper for new teams
    autoAbbr(name) {
      if (!name) return '??';
      return name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 3) || '??';
    },

    // ── Characters ───────────────────────────────────────────────────────
    // Field-name compatibility: handle BOTH the default-NK schema
    // (heroName, realName, role) AND the generated-hero schema
    // (name, real_name, alignment). One character can have either or both.
    charName(c)    { return c.name || c.heroName || 'Unknown'; },
    charRealName(c){ return c.real_name || c.realName || ''; },
    charRole(c)    { return c.role || c.alignment || ''; },
    charColor(c)   {
      if (c.color) return c.color;
      // Generated heroes get a color from their stats hash
      const name = this.charName(c);
      const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
      return `hsl(${hue}, 55%, 50%)`;
    },
    charInitials(c) {
      if (c.initials) return c.initials;
      const n = this.charName(c);
      return n.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '??';
    },
    charPowers(c) {
      // NK style: powers: [{name, desc}]. Generated style: powers: [string]
      if (!c.powers) return [];
      return c.powers.map(p => typeof p === 'string' ? { name: p, desc: '' } : p);
    },
    charWeaknesses(c) { return c.weaknesses || []; },
    charOrigin(c) { return c.origin || c.backstory || ''; },
    charStats(c) { return c.stats || {}; },
    charStatKeys(c) { return Object.keys(this.charStats(c)); },
    charTagline(c) { return c.tagline || ''; },
    charType(c) {
      // 'hero' | 'villain' | 'recruit' | unknown
      if (c.alignment === 'villain' || c.nkAlignment === 'enemy') return 'villain';
      if (c.alignment === 'hero' || c.alignment === 'anti-hero' || c.alignment === 'vigilante' || c.nkAlignment === 'base') return 'hero';
      if (c.role && /recruit/i.test(c.role)) return 'recruit';
      if (c.isRecruit) return 'recruit';
      return 'hero';  // default
    },
    charTypeLabel(c) {
      const t = this.charType(c);
      return t.charAt(0).toUpperCase() + t.slice(1);
    },
    charTypeBadgeClass(c) {
      const t = this.charType(c);
      if (t === 'villain') return 'text-bg-danger';
      if (t === 'recruit') return 'text-bg-info';
      return 'text-bg-success';
    },

    // Load all characters from /api/characters
    async loadCharacters() {
      this.charactersLoading = true;
      try {
        const list = await this.api('/api/characters');
        this.characters = Array.isArray(list) ? list : [];
      } catch (e) {
        this.characters = [];
        this.toast('error', 'Failed to load characters: ' + e.message);
      } finally {
        this.charactersLoading = false;
      }
    },

    // Filtered + searched character list
    get filteredCharacters() {
      let list = this.characters;
      // Filter by type
      if (this.characterFilter !== 'all') {
        list = list.filter(c => this.charType(c) === this.characterFilter);
      }
      // Search
      const q = this.characterSearch.trim().toLowerCase();
      if (q) {
        list = list.filter(c => {
          const hay = [
            this.charName(c),
            this.charRealName(c),
            this.charRole(c),
            this.charOrigin(c),
            ...this.charPowers(c).map(p => p.name),
          ].join(' ').toLowerCase();
          return hay.includes(q);
        });
      }
      return list;
    },

    selectCharacter(c) {
      this.activeCharacter = c;
    },
    closeCharacter() {
      this.activeCharacter = null;
    },

    async deleteCharacter(c) {
      const name = this.charName(c);
      // The DELETE endpoint uses a name slug — server derives it from
      // character.name (lowercased, underscores). Generated heroes use
      // `name`; NK defaults use `heroName`. We try `name` first.
      const slug = (c.name || c.heroName || 'unknown').replace(/ /g, '_').toLowerCase();
      if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
      try {
        await this.api(`/api/characters/${encodeURIComponent(slug)}`, { method: 'DELETE' });
        this.characters = this.characters.filter(x => x !== c);
        if (this.activeCharacter === c) this.activeCharacter = null;
        this.toast('success', `"${name}" deleted`);
      } catch (e) {
        this.toast('error', 'Delete failed: ' + e.message);
      }
    },

    // ── Generation ───────────────────────────────────────────────────────
    openGenerator(mode = 'hero') {
      this.generateForm.mode = mode;
      this.generateForm.theme = '';
      this.showCharacterGenerator = true;
      this.lastGenerated = null;
    },
    closeGenerator() {
      this.showCharacterGenerator = false;
      this.generating = false;
    },

    async generateCharacter() {
      if (!this.ollamaOk) {
        this.toast('error', 'Ollama is not running. Check Settings.');
        return;
      }
      const theme = this.generateForm.theme.trim();
      if (!theme) {
        this.toast('error', 'Please describe a theme or concept');
        return;
      }
      this.generating = true;
      this.lastGenerated = null;
      const mode = this.generateForm.mode;
      const endpoint = `/api/generate/${mode}`;
      try {
        const result = await this.api(endpoint, {
          method: 'POST',
          body: JSON.stringify({ extra: theme }),
        });
        this.lastGenerated = result;
        // Server already saved the file — reload the list
        await this.loadCharacters();
        // Auto-select the new character
        const newChar = this.characters.find(c => this.charName(c) === (result.name || result.heroName));
        if (newChar) this.activeCharacter = newChar;
        this.toast('success', `Generated: ${result.name || result.heroName}`);
      } catch (e) {
        this.lastGenerated = { error: e.message };
        this.toast('error', 'Generation failed: ' + e.message);
      } finally {
        this.generating = false;
      }
    },

    // ── Villains ─────────────────────────────────────────────────────────
    // Field helpers (reuse charName/charPowers where possible)
    villName(v)    { return this.charName(v); },
    villRealName(v){ return this.charRealName(v); },
    villPowers(v)  { return this.charPowers(v); },
    villWeaknesses(v) { return v.weaknesses || []; },
    villOrigin(v)  { return v.origin || v.backstory || ''; },
    villStats(v)   { return v.stats || {}; },
    villStatKeys(v){ return Object.keys(this.villStats(v)); },
    villGoal(v)    { return v.goal || ''; },
    villThreatLevel(v) {
      // Standardize: server returns 'street'|'metro'|'global'|'cosmic' (or other)
      return v.threat_level || v.threatLevel || 'street';
    },
    villThreatBadgeClass(v) {
      const lvl = this.villThreatLevel(v);
      if (lvl === 'cosmic') return 'text-bg-danger';
      if (lvl === 'global') return 'text-bg-warning';
      if (lvl === 'metro')  return 'text-bg-info';
      return 'text-bg-secondary';  // street
    },
    villTargetTeams(v) {
      return v.targetTeams || [];
    },
    villTargetTeamNames(v) {
      return this.villTargetTeams(v).map(id => {
        const t = this.teams.find(x => x.id === id);
        return t ? t.name : id;
      });
    },

    // Load villain pool from /api/store
    async loadVillains() {
      this.villainsLoading = true;
      try {
        const list = await this.storeGet('forge-villains');
        this.villainPool = Array.isArray(list) ? list : [];
      } catch (e) {
        // First run — no villains yet
        this.villainPool = [];
      } finally {
        this.villainsLoading = false;
      }
    },

    // Filtered villain list (search + threat level)
    get filteredVillains() {
      let list = this.villainPool;
      // Threat filter
      if (this.villainThreatFilter !== 'all') {
        list = list.filter(v => this.villThreatLevel(v) === this.villainThreatFilter);
      }
      // Search
      const q = this.villainSearch.trim().toLowerCase();
      if (q) {
        list = list.filter(v => {
          const hay = [
            this.villName(v),
            this.villRealName(v),
            this.villOrigin(v),
            this.villGoal(v),
            ...this.villPowers(v).map(p => p.name),
          ].join(' ').toLowerCase();
          return hay.includes(q);
        });
      }
      return list;
    },

    selectVillain(v) { this.activeVillain = v; },
    closeVillain()   { this.activeVillain = null; },

    async deleteVillain(v) {
      const name = this.villName(v);
      if (!confirm(`Remove "${name}" from the villain pool? (The character file, if any, will be kept.)`)) return;
      try {
        const newList = this.villainPool.filter(x => x !== v);
        await this.storeSet('forge-villains', newList);
        this.villainPool = newList;
        if (this.activeVillain === v) this.activeVillain = null;
        this.toast('success', `"${name}" removed from pool`);
      } catch (e) {
        this.toast('error', 'Delete failed: ' + e.message);
      }
    },

    // Manual add: turn an existing character into a villain (adds to pool)
    async addCharacterAsVillain(c) {
      const targets = this.activeTeamId ? [this.activeTeamId] : ['nocturnal-knights'];
      const v = {
        ...c,
        isVillain: true,
        targetTeams: targets,
        nkAlignment: 'enemy',
      };
      // Avoid duplicates by id
      if (this.villainPool.find(x => x.id === v.id)) {
        this.toast('error', `${this.villName(c)} is already in the villain pool`);
        return;
      }
      const newList = [...this.villainPool, v];
      try {
        await this.storeSet('forge-villains', newList);
        this.villainPool = newList;
        this.toast('success', `${this.villName(c)} added as villain`);
      } catch (e) {
        this.toast('error', 'Add failed: ' + e.message);
      }
    },

    // ── Villain generation ───────────────────────────────────────────────
    openVillainGenerator() {
      this.villainGenerateForm = { theme: '', targetTeams: this.activeTeamId ? [this.activeTeamId] : [] };
      this.showVillainGenerator = true;
      this.lastGeneratedVillain = null;
    },
    closeVillainGenerator() {
      this.showVillainGenerator = false;
      this.generatingVillain = false;
    },
    toggleVillainTarget(teamId) {
      const list = this.villainGenerateForm.targetTeams;
      const idx = list.indexOf(teamId);
      if (idx >= 0) {
        this.villainGenerateForm.targetTeams = list.filter(x => x !== teamId);
      } else {
        this.villainGenerateForm.targetTeams = [...list, teamId];
      }
    },

    async generateVillain() {
      if (!this.ollamaOk) {
        this.toast('error', 'Ollama is not running. Check Settings.');
        return;
      }
      const theme = this.villainGenerateForm.theme.trim();
      if (!theme) {
        this.toast('error', 'Please describe a villain concept');
        return;
      }
      this.generatingVillain = true;
      this.lastGeneratedVillain = null;
      try {
        // Server generates AND saves character file at /api/generate/villain
        const result = await this.api('/api/generate/villain', {
          method: 'POST',
          body: JSON.stringify({ extra: theme }),
        });
        // Augment with our pool metadata
        const v = {
          ...result,
          isVillain: true,
          targetTeams: this.villainGenerateForm.targetTeams.length
            ? this.villainGenerateForm.targetTeams
            : [this.activeTeamId || 'nocturnal-knights'],
          nkAlignment: 'enemy',
          id: result.id || `villain-${Date.now()}`,
        };
        // Add to pool and persist
        const newList = [...this.villainPool, v];
        await this.storeSet('forge-villains', newList);
        this.villainPool = newList;
        this.lastGeneratedVillain = v;
        this.activeVillain = v;
        this.toast('success', `Villain generated: ${this.villName(v)}`);
      } catch (e) {
        this.lastGeneratedVillain = { error: e.message };
        this.toast('error', 'Generation failed: ' + e.message);
      } finally {
        this.generatingVillain = false;
      }
    },

    // ── Stories ──────────────────────────────────────────────────────────
    // Story title fallback
    storyTitle(s)  { return s.title || 'Untitled Story'; },
    storySetting(s){ return s.setting || ''; },
    storyHeroes(s) { return s.heroes || []; },
    storyVillains(s){ return s.villains || []; },
    storyContent(s){ return s.content || ''; },
    storyModel(s)  { return s.source_model || ''; },
    storyTimestamp(s) {
      // Try common timestamp fields
      const ts = s.ts || s.timestamp || (s._file && s._file.match(/_(\d+)/)?.[1]);
      if (!ts) return '';
      try {
        return new Date(parseInt(ts) * 1000).toLocaleDateString();
      } catch (e) { return ''; }
    },
    // Word/paragraph counts for the card
    storyWordCount(s) {
      return this.storyContent(s).split(/\s+/).filter(Boolean).length;
    },
    storyPreview(s) {
      const c = this.storyContent(s);
      return c.length > 240 ? c.slice(0, 240) + '…' : c;
    },

    async loadStories() {
      this.storiesLoading = true;
      try {
        const list = await this.api('/api/stories');
        this.stories = Array.isArray(list) ? list : [];
        // Sort newest-first if we have timestamps
        this.stories.sort((a, b) => {
          const ta = parseInt(a.ts || a.timestamp || 0);
          const tb = parseInt(b.ts || b.timestamp || 0);
          return tb - ta;
        });
      } catch (e) {
        this.stories = [];
        this.toast('error', 'Failed to load stories: ' + e.message);
      } finally {
        this.storiesLoading = false;
      }
    },

    // Filtered story list
    get filteredStories() {
      const q = this.storySearch.trim().toLowerCase();
      if (!q) return this.stories;
      return this.stories.filter(s => {
        const hay = [
          this.storyTitle(s),
          this.storySetting(s),
          this.storyContent(s),
          ...this.storyHeroes(s),
          ...this.storyVillains(s),
        ].join(' ').toLowerCase();
        return hay.includes(q);
      });
    },

    selectStory(s) { this.activeStory = s; },
    closeStory()   { this.activeStory = null; },

    async deleteStory(s) {
      const title = this.storyTitle(s);
      if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
      // Derive slug the same way the server does
      const slug = title.replace(/ /g, '_').toLowerCase().slice(0, 40);
      // Find the actual file (server appends _<ts>); try with first matching file
      const fileMatch = this.stories.find(x => x === s);
      // Use the file field if backend populated it, else brute-force try common forms
      const candidates = [
        slug,
        `${slug}_${s.ts || ''}`,
        slug.replace(/[^a-z0-9_]/g, ''),
      ].filter(Boolean);
      let deleted = false;
      for (const cand of candidates) {
        try {
          const r = await this.api(`/api/stories/${encodeURIComponent(cand)}`, { method: 'DELETE' });
          if (r.get_json_safe?.() || r.ok) { deleted = true; break; }
        } catch (e) { /* try next */ }
      }
      // Fallback: just remove from local state and warn
      this.stories = this.stories.filter(x => x !== s);
      if (this.activeStory === s) this.activeStory = null;
      if (deleted) {
        this.toast('success', `"${title}" deleted`);
      } else {
        this.toast('success', `"${title}" removed from view (file may need manual cleanup)`);
      }
    },

    // ── Story generation ─────────────────────────────────────────────────
    openStoryGenerator() {
      this.storyGenerateForm = {
        heroIds: [],
        villainIds: [],
        setting: 'a dark city at night',
      };
      this.showStoryGenerator = true;
      this.lastGeneratedStory = null;
    },
    closeStoryGenerator() {
      this.showStoryGenerator = false;
      this.generatingStory = false;
    },
    toggleStoryHero(id) {
      const list = this.storyGenerateForm.heroIds;
      this.storyGenerateForm.heroIds = list.includes(id)
        ? list.filter(x => x !== id)
        : [...list, id];
    },
    toggleStoryVillain(id) {
      const list = this.storyGenerateForm.villainIds;
      this.storyGenerateForm.villainIds = list.includes(id)
        ? list.filter(x => x !== id)
        : [...list, id];
    },
    pickFromActiveRoster() {
      // Convenience: pre-fill with all current team members
      const roster = this.getActiveRoster();
      this.storyGenerateForm.heroIds = roster.map(m => m.id);
    },

    async generateStory() {
      if (!this.ollamaOk) {
        this.toast('error', 'Ollama is not running. Check Settings.');
        return;
      }
      const heroes = this.characters
        .filter(c => this.storyGenerateForm.heroIds.includes(c.id))
        .map(c => this.charName(c));
      const villains = this.villainPool
        .filter(v => this.storyGenerateForm.villainIds.includes(v.id))
        .map(v => this.villName(v));
      if (heroes.length === 0 && villains.length === 0) {
        this.toast('error', 'Pick at least one hero or villain');
        return;
      }
      this.generatingStory = true;
      this.lastGeneratedStory = null;
      try {
        const result = await this.api('/api/generate/story', {
          method: 'POST',
          body: JSON.stringify({
            heroes,
            villains,
            setting: this.storyGenerateForm.setting || 'a dark city at night',
          }),
        });
        this.lastGeneratedStory = result;
        // Server already saved — reload the list
        await this.loadStories();
        this.activeStory = this.stories.find(s => s.title === result.title) || result;
        this.toast('success', `Story generated: ${this.storyTitle(result)}`);
      } catch (e) {
        this.lastGeneratedStory = { error: e.message, title: 'Generation failed' };
        this.toast('error', 'Generation failed: ' + e.message);
      } finally {
        this.generatingStory = false;
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
