(() => {
  'use strict';

  const api = globalThis.browser || globalThis.chrome;
  const store = api && api.storage && api.storage.local ? api.storage.local : null;

  const DEFAULTS = {
    enabled: true,
    ignoreTyping: true,
    showToasts: true,
    saveAs: false,
    generateSelector: '',
    imageSelector: '',
    promptSelector: '',
    bindings: {
      focus: { code: 'KeyC', label: 'C', enabled: true, mods: { ctrl: false, alt: false, shift: false, meta: false } },
      generate: { code: 'KeyZ', label: 'Z', enabled: true, mods: { ctrl: false, alt: false, shift: false, meta: false } },
      save: { code: 'KeyX', label: 'X', enabled: true, mods: { ctrl: false, alt: false, shift: false, meta: false } },
      saveAll: { code: '', label: '', enabled: false, mods: { ctrl: false, alt: false, shift: false, meta: false } }
    }
  };

  const ACTIONS = [
    ['focus', 'Focus prompt field'],
    ['generate', 'Generate next image'],
    ['save', 'Download latest image'],
    ['saveAll', 'Download whole batch']
  ];

  let settings = clone(DEFAULTS);
  let capturing = null;
  let statusTimer = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalize(raw) {
    const out = clone(DEFAULTS);
    if (!raw || typeof raw !== 'object') return out;
    for (const key of ['enabled', 'ignoreTyping', 'showToasts', 'saveAs', 'generateSelector', 'imageSelector', 'promptSelector']) {
      if (typeof raw[key] === typeof out[key]) out[key] = raw[key];
    }
    if (raw.bindings && typeof raw.bindings === 'object') {
      for (const name of Object.keys(out.bindings)) {
        const incoming = raw.bindings[name];
        if (!incoming || typeof incoming !== 'object') continue;
        out.bindings[name] = {
          code: typeof incoming.code === 'string' ? incoming.code : '',
          label: typeof incoming.label === 'string' ? incoming.label : '',
          enabled: incoming.enabled !== false,
          mods: {
            ctrl: !!(incoming.mods && incoming.mods.ctrl),
            alt: !!(incoming.mods && incoming.mods.alt),
            shift: !!(incoming.mods && incoming.mods.shift),
            meta: !!(incoming.mods && incoming.mods.meta)
          }
        };
      }
    }
    return out;
  }

  function prettyCode(code) {
    return String(code || '')
      .replace(/^Key/, '')
      .replace(/^Digit/, '')
      .replace(/^Numpad/, 'Num ')
      .replace(/^Arrow/, '');
  }

  function keyLabel(ev) {
    if (ev.key === ' ') return 'Space';
    if (ev.key && ev.key.length === 1) return ev.key.toUpperCase();
    return prettyCode(ev.code);
  }

  function labelFor(binding) {
    if (!binding || !binding.enabled || !binding.code) return 'Off';
    const mods = binding.mods || {};
    const parts = [];
    if (mods.ctrl) parts.push('Ctrl');
    if (mods.alt) parts.push('Alt');
    if (mods.shift) parts.push('Shift');
    if (mods.meta) parts.push('Meta');
    parts.push(binding.label || prettyCode(binding.code));
    return parts.join('+');
  }

  function flash(text) {
    const status = document.getElementById('status');
    if (!status) return;
    status.textContent = text;
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, 1600);
  }

  function persist() {
    if (!store) {
      flash('Storage unavailable');
      return;
    }
    try {
      Promise.resolve(store.set({ settings }))
        .then(() => flash('Saved'))
        .catch(() => flash('Save failed'));
    } catch (err) {
      flash('Save failed');
    }
  }

  function renderBindings() {
    const host = document.getElementById('bindings');
    if (!host) return;
    host.textContent = '';

    for (const [name, title] of ACTIONS) {
      const row = document.createElement('div');
      row.className = 'binding-row';

      const label = document.createElement('span');
      label.className = 'binding-label';
      label.textContent = title;

      const key = document.createElement('button');
      key.type = 'button';
      key.className = 'keybox' + (capturing === name ? ' capturing' : '');
      key.textContent = capturing === name ? 'Press a key...' : labelFor(settings.bindings[name]);
      key.addEventListener('click', () => {
        capturing = name;
        renderBindings();
      });

      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'clear';
      clear.textContent = '×';
      clear.title = 'Disable this shortcut';
      clear.addEventListener('click', () => {
        settings.bindings[name] = {
          code: '', label: '', enabled: false,
          mods: { ctrl: false, alt: false, shift: false, meta: false }
        };
        capturing = null;
        renderBindings();
        persist();
      });

      row.appendChild(label);
      row.appendChild(key);
      row.appendChild(clear);
      host.appendChild(row);
    }
  }

  function render() {
    for (const id of ['enabled', 'ignoreTyping', 'showToasts', 'saveAs']) {
      const input = document.getElementById(id);
      if (input) input.checked = !!settings[id];
    }
    for (const id of ['generateSelector', 'imageSelector', 'promptSelector']) {
      const input = document.getElementById(id);
      if (input) input.value = settings[id] || '';
    }
    renderBindings();
  }

  document.addEventListener('keydown', (ev) => {
    if (!capturing) return;
    ev.preventDefault();
    ev.stopPropagation();
    const name = capturing;
    capturing = null;

    if (ev.key === 'Escape') {
      settings.bindings[name] = {
        code: '', label: '', enabled: false,
        mods: { ctrl: false, alt: false, shift: false, meta: false }
      };
    } else {
      settings.bindings[name] = {
        code: ev.code || '',
        label: keyLabel(ev),
        enabled: true,
        mods: {
          ctrl: !!ev.ctrlKey,
          alt: !!ev.altKey,
          shift: !!ev.shiftKey,
          meta: !!ev.metaKey
        }
      };
    }
    renderBindings();
    persist();
  }, true);

  for (const id of ['enabled', 'ignoreTyping', 'showToasts', 'saveAs']) {
    const input = document.getElementById(id);
    if (!input) continue;
    input.addEventListener('change', () => {
      settings[id] = input.checked;
      persist();
    });
  }

  for (const id of ['generateSelector', 'imageSelector', 'promptSelector']) {
    const input = document.getElementById(id);
    if (!input) continue;
    input.addEventListener('change', () => {
      settings[id] = input.value.trim();
      persist();
    });
  }

  const reset = document.getElementById('reset');
  if (reset) {
    reset.addEventListener('click', () => {
      settings = clone(DEFAULTS);
      capturing = null;
      render();
      persist();
    });
  }

  if (store) {
    try {
      Promise.resolve(store.get('settings'))
        .then((result) => {
          settings = normalize(result && result.settings);
          render();
        })
        .catch(() => render());
    } catch (err) {
      render();
    }
  } else {
    render();
  }
})();
