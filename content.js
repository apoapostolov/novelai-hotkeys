(() => {
  'use strict';

  if (window.__naiHotkeysLoaded) return;
  window.__naiHotkeysLoaded = true;

  const api = globalThis.browser || globalThis.chrome;

  const DEFAULTS = {
    enabled: true,
    ignoreTyping: true,
    showToasts: true,
    saveAs: false,
    generateSelector: '',
    imageSelector: '',
    promptSelector: '',
    bindings: {
      focus: {
        code: 'KeyC', label: 'C', enabled: true,
        mods: { ctrl: false, alt: false, shift: false, meta: false }
      },
      generate: {
        code: 'KeyZ', label: 'Z', enabled: true,
        mods: { ctrl: false, alt: false, shift: false, meta: false }
      },
      save: {
        code: 'KeyX', label: 'X', enabled: true,
        mods: { ctrl: false, alt: false, shift: false, meta: false }
      },
      saveAll: {
        code: '', label: '', enabled: false,
        mods: { ctrl: false, alt: false, shift: false, meta: false }
      }
    }
  };

  let settings = clone(DEFAULTS);
  let ready = false;
  let toastTimer = null;
  const observedImages = [];

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

  function isEditable(el) {
    if (!el) return false;
    const tag = el.tagName ? el.tagName.toUpperCase() : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return !!(el.closest && el.closest('[contenteditable="true"], [role="textbox"]'));
  }

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    if (rect && (rect.width === 0 || rect.height === 0)) return false;
    const view = el.ownerDocument && el.ownerDocument.defaultView;
    const style = view && view.getComputedStyle ? view.getComputedStyle(el) : null;
    if (style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')) return false;
    return true;
  }

  function modsMatch(ev, mods) {
    return !!ev.ctrlKey === !!mods.ctrl &&
      !!ev.altKey === !!mods.alt &&
      !!ev.shiftKey === !!mods.shift &&
      !!ev.metaKey === !!mods.meta;
  }

  function matchesBinding(binding, ev) {
    if (!binding || !binding.enabled || !binding.code) return false;
    if (!modsMatch(ev, binding.mods || {})) return false;
    if (ev.code && ev.code === binding.code) return true;
    const label = (binding.label || '').toLowerCase();
    return !!(label && ev.key && ev.key.toLowerCase() === label);
  }

  function toast(message, isError) {
    if (!settings.showToasts) return;
    let box = document.getElementById('nai-hk-toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'nai-hk-toast';
      box.className = 'nai-hk-toast';
      (document.body || document.documentElement).appendChild(box);
    }
    box.textContent = message;
    box.classList.toggle('is-error', !!isError);
    box.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      box.classList.remove('is-visible');
    }, 2200);
  }

  function findGenerateButton() {
    const custom = (settings.generateSelector || '').trim();
    if (custom) {
      try {
        const el = document.querySelector(custom);
        if (el && isVisible(el) && !el.disabled) return el;
      } catch (err) {
        // An invalid custom selector falls through to auto-detection.
      }
    }

    const nodes = Array.from(document.querySelectorAll('button, [role="button"], a[role="button"]'));
    const scored = [];
    for (const el of nodes) {
      if (!isVisible(el) || el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
      const text = String(el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
      if (!/\bgenerate\b/i.test(text)) continue;

      let score = 1;
      if (/^generate\s+\d+\s+image/i.test(text)) score += 5;
      else if (/^generate\b/i.test(text)) score += 3;
      if (/\bimage/i.test(text)) score += 1;
      if (el.tagName === 'BUTTON') score += 1;
      scored.push({ el, score });
    }
    if (!scored.length) return null;
    scored.sort((a, b) => b.score - a.score);
    return scored[0].el;
  }

  function doGenerate() {
    const button = findGenerateButton();
    if (!button) {
      toast('Generate button not found. Set a custom selector in the popup.', true);
      return false;
    }
    button.click();
    toast('Generating...');
    return true;
  }

  function findPromptField() {
    const custom = (settings.promptSelector || '').trim();
    if (custom) {
      try {
        const el = document.querySelector(custom);
        if (el && isVisible(el) && typeof el.focus === 'function') return el;
      } catch (err) {
        // An invalid custom selector falls through to auto-detection.
      }
    }

    const nodes = Array.from(document.querySelectorAll(
      'textarea, input[type="text"], [contenteditable="true"], [role="textbox"]'
    ));
    const scored = [];
    for (const el of nodes) {
      if (!isVisible(el) || el.disabled || el.getAttribute('aria-disabled') === 'true') continue;

      const hint = [
        el.getAttribute('aria-label') || '',
        el.getAttribute('placeholder') || '',
        el.getAttribute('name') || '',
        el.id || ''
      ].join(' ').toLowerCase();

      let score = 0;
      if (/\bprompt\b/.test(hint)) score += 8;
      if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') score += 3;
      if (el.isContentEditable) score += 2;

      const labels = el.labels ? Array.from(el.labels) : [];
      for (const label of labels) {
        if (/\bprompt\b/i.test(String(label.textContent || ''))) score += 6;
      }

      const parentText = el.parentElement ? String(el.parentElement.textContent || '').slice(0, 120) : '';
      if (/^\s*prompt\b/i.test(parentText)) score += 4;

      const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      if (rect && rect.height >= 60) score += 2;

      scored.push({ el, score });
    }
    if (!scored.length) return null;
    scored.sort((a, b) => b.score - a.score);
    return scored[0].el;
  }

  function doFocus() {
    const field = findPromptField();
    if (!field) {
      toast('Prompt field not found. Set a custom selector in the popup.', true);
      return false;
    }
    field.focus();
    if (typeof field.scrollIntoView === 'function') {
      field.scrollIntoView({ block: 'nearest' });
    }
    toast('Prompt focused');
    return true;
  }

  function isGeneratedImageSrc(src) {
    if (!src) return false;
    if (/^data:image\/(png|jpe?g|webp)/i.test(src)) return true;
    if (/^blob:/i.test(src)) return true;
    if (/^https?:\/\//i.test(src)) {
      if (/\.svg(\?|$)/i.test(src) || /\/icons?\//i.test(src)) return false;
      return /novelai/i.test(src);
    }
    return false;
  }

  function rememberImage(img) {
    const src = img.currentSrc || img.src || '';
    if (!src || !isGeneratedImageSrc(src)) return;
    if (observedImages.some((item) => item.src === src)) return;
    observedImages.push({ el: img, src, ts: Date.now() });
    if (observedImages.length > 40) observedImages.shift();
  }

  function collectImages() {
    const custom = (settings.imageSelector || '').trim();
    let elements = [];
    if (custom) {
      try {
        elements = Array.from(document.querySelectorAll(custom));
      } catch (err) {
        elements = [];
      }
    }
    if (!elements.length) elements = Array.from(document.querySelectorAll('img'));

    const local = [];
    const localSeen = new Set();
    for (const img of elements) {
      const src = img.currentSrc || img.src || '';
      if (!src || localSeen.has(src) || !isGeneratedImageSrc(src)) continue;
      localSeen.add(src);
      local.push({ el: img, src });
    }

    const observed = observedImages.filter((item) =>
      item.el && item.el.isConnected !== false && isGeneratedImageSrc(item.src)
    );

    const merged = [];
    const keys = new Set();
    for (const item of observed.concat(local)) {
      if (keys.has(item.src)) continue;
      keys.add(item.src);
      merged.push(item);
    }
    return merged;
  }

  function getLatestImage() {
    const all = collectImages();
    if (!all.length) return null;
    const candidates = all.slice(-8);
    let best = candidates[candidates.length - 1];
    for (const item of candidates) {
      if ((item.el.naturalWidth || 0) > (best.el.naturalWidth || 0)) best = item;
    }
    return best;
  }

  function extensionFor(src) {
    let match = src.match(/^data:image\/(png|jpe?g|webp)/i);
    if (!match) match = src.match(/\.(png|jpe?g|webp)(?:\?|$)/i);
    if (!match) return 'png';
    const kind = match[1].toLowerCase();
    return kind === 'jpeg' ? 'jpg' : kind;
  }

  function timestamp() {
    const date = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-` +
      `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  function downloadItem(item, index) {
    const filename = `novelai-${timestamp()}${index === null ? '' : `-${index + 1}`}.${extensionFor(item.src)}`;

    if (/^(data:|blob:)/i.test(item.src)) {
      const anchor = document.createElement('a');
      anchor.href = item.src;
      anchor.download = filename;
      anchor.style.display = 'none';
      (document.body || document.documentElement).appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        try { anchor.remove(); } catch (err) { /* already gone */ }
      }, 1000);
      return Promise.resolve({ ok: true, filename });
    }

    if (!api || !api.runtime || !api.runtime.sendMessage) {
      return Promise.resolve({ ok: false, error: 'No runtime bridge available' });
    }
    return api.runtime.sendMessage({
      type: 'nai-download',
      url: item.src,
      filename,
      saveAs: !!settings.saveAs
    }).then((result) => result || { ok: true, filename })
      .catch((err) => ({ ok: false, error: String(err) }));
  }

  function doSave(saveAll) {
    const items = saveAll
      ? collectImages().slice(-4)
      : [getLatestImage()].filter(Boolean);

    if (!items.length) {
      toast('No generated image found on the page.', true);
      return Promise.resolve(false);
    }

    let chain = Promise.resolve(true);
    items.forEach((item, index) => {
      chain = chain
        .then(() => downloadItem(item, saveAll ? index : null))
        .then((result) => {
          if (result && result.ok) {
            toast(saveAll ? `Downloaded ${index + 1}/${items.length}` : `Downloaded ${result.filename}`);
          } else {
            toast(`Download failed: ${result && result.error ? result.error : 'unknown error'}`, true);
          }
          return !!(result && result.ok);
        });
    });
    return chain;
  }

  function onKeyDown(ev) {
    if (!ready || !settings.enabled) return;
    if (settings.ignoreTyping && isEditable(ev.target)) return;
    if (ev.isComposing || ev.repeat) return;

    if (matchesBinding(settings.bindings.focus, ev)) {
      ev.preventDefault();
      ev.stopPropagation();
      doFocus();
      return;
    }
    if (matchesBinding(settings.bindings.generate, ev)) {
      ev.preventDefault();
      ev.stopPropagation();
      doGenerate();
      return;
    }
    if (matchesBinding(settings.bindings.save, ev)) {
      ev.preventDefault();
      ev.stopPropagation();
      doSave(false);
      return;
    }
    if (matchesBinding(settings.bindings.saveAll, ev)) {
      ev.preventDefault();
      ev.stopPropagation();
      doSave(true);
    }
  }

  function init() {
    if (api && api.storage && api.storage.onChanged && api.storage.onChanged.addListener) {
      api.storage.onChanged.addListener((changes) => {
        if (changes.settings) settings = normalize(changes.settings.newValue);
        ready = true;
      });
    }

    const store = api && api.storage && api.storage.local;
    const loading = store && store.get
      ? store.get('settings')
      : Promise.resolve({});

    Promise.resolve(loading)
      .then((result) => {
        settings = normalize(result && result.settings);
        ready = true;
      })
      .catch(() => {
        ready = true;
      });

    window.addEventListener('keydown', onKeyDown, true);

    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.nodeType !== 1) continue;
            if (node.tagName === 'IMG') rememberImage(node);
            if (node.querySelectorAll) {
              Array.from(node.querySelectorAll('img')).forEach(rememberImage);
            }
          }
        }
      });
      observer.observe(document.documentElement || document, { childList: true, subtree: true });
    }
  }

  init();
})();
