// Tekphreak Thread Styler
// Restyles selected text in the Threads composer using real Unicode
// characters (Mathematical Alphanumeric Symbols / IPA phonetic letters)
// so styled text renders natively in the feed. No network access, no
// data collection.

(function () {
  'use strict';

  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const DIGITS = '0123456789';

  function buildMap(upperStart, lowerStart, digitStart, exceptions) {
    const map = {};
    for (let i = 0; i < UPPER.length; i++) {
      const ch = UPPER[i];
      map[ch] = (exceptions && exceptions[ch]) || String.fromCodePoint(upperStart + i);
    }
    for (let i = 0; i < LOWER.length; i++) {
      const ch = LOWER[i];
      map[ch] = (exceptions && exceptions[ch]) || String.fromCodePoint(lowerStart + i);
    }
    if (digitStart !== null) {
      for (let i = 0; i < DIGITS.length; i++) {
        const ch = DIGITS[i];
        map[ch] = (exceptions && exceptions[ch]) || String.fromCodePoint(digitStart + i);
      }
    }
    return map;
  }

  // Mathematical Alphanumeric Symbols (U+1D400-U+1D7FF)
  const MONOSPACE = buildMap(0x1d670, 0x1d68a, 0x1d7f6);
  const ITALIC = buildMap(0x1d434, 0x1d44e, null, { h: 'ℎ' }); // italic h has no math slot
  const BOLD_ITALIC = buildMap(0x1d468, 0x1d482, null);
  const SANS_BOLD = buildMap(0x1d5d4, 0x1d5ee, 0x1d7ec);

  // IPA Extensions / Phonetic Extensions small-caps letters
  const SMALL_CAPS = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ',
    f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ',
    k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ',
    p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's',       t: 'ᴛ',
    u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x',       y: 'ʏ',
    z: 'ᴢ'
  };

  const STYLE_MAPS = {
    monospace: MONOSPACE,
    italic: ITALIC,
    boldItalic: BOLD_ITALIC,
    sansBold: SANS_BOLD,
    smallCaps: SMALL_CAPS
  };

  // Reverse lookup so "Normal" can undo any of the above.
  const REVERSE_MAP = {};
  for (const styleName in STYLE_MAPS) {
    const map = STYLE_MAPS[styleName];
    for (const key in map) {
      const styled = map[key];
      if (!(styled in REVERSE_MAP)) REVERSE_MAP[styled] = key;
    }
  }

  function applyStyle(text, styleName) {
    const map = STYLE_MAPS[styleName];
    let out = '';
    for (const ch of text) {
      const lookup = styleName === 'smallCaps' ? ch.toLowerCase() : ch;
      out += map[lookup] !== undefined ? map[lookup] : ch;
    }
    return out;
  }

  function normalizeText(text) {
    let out = '';
    for (const ch of text) {
      out += REVERSE_MAP[ch] !== undefined ? REVERSE_MAP[ch] : ch;
    }
    return out;
  }

  const STYLE_BUTTONS = [
    { key: 'normal', label: 'Normal' },
    { key: 'monospace', label: 'Mono' },
    { key: 'italic', label: 'Italic' },
    { key: 'smallCaps', label: 'ᴀᴄᴏ' },
    { key: 'boldItalic', label: 'Bold It' },
    { key: 'sansBold', label: 'Sans B' }
  ];

  let toolbarEl = null;
  let savedRange = null;

  function isEditable(node) {
    let el = node && node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    while (el) {
      if (el.isContentEditable) return el;
      el = el.parentElement;
    }
    return null;
  }

  function removeToolbar() {
    if (toolbarEl) {
      toolbarEl.remove();
      toolbarEl = null;
    }
  }

  function positionToolbar(rect) {
    const top = window.scrollY + rect.top - toolbarEl.offsetHeight - 8;
    const left = window.scrollX + rect.left;
    toolbarEl.style.top = `${Math.max(top, window.scrollY + 4)}px`;
    toolbarEl.style.left = `${Math.max(left, window.scrollX + 4)}px`;
  }

  function showToolbar(rect) {
    removeToolbar();
    toolbarEl = document.createElement('div');
    toolbarEl.className = 'tts-toolbar';

    STYLE_BUTTONS.forEach((s) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tts-btn';
      btn.textContent = s.label;
      btn.addEventListener('mousedown', (e) => {
        // Prevent the button from stealing focus/selection from the composer.
        e.preventDefault();
        e.stopPropagation();
        applyStyleToSelection(s.key);
      });
      toolbarEl.appendChild(btn);
    });

    document.body.appendChild(toolbarEl);
    positionToolbar(rect);
  }

  function applyStyleToSelection(styleKey) {
    if (!savedRange) return;

    const editableEl = isEditable(savedRange.commonAncestorContainer);
    if (editableEl) editableEl.focus({ preventScroll: true });

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);

    const text = selection.toString();
    if (!text) return;

    const newText = styleKey === 'normal' ? normalizeText(text) : applyStyle(text, styleKey);

    document.execCommand('insertText', false, newText);
    removeToolbar();
  }

  function handleSelection() {
    // Defer so the browser has finished updating the selection.
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        removeToolbar();
        return;
      }
      const text = selection.toString();
      if (!text.trim()) {
        removeToolbar();
        return;
      }
      const range = selection.getRangeAt(0);
      if (!isEditable(range.commonAncestorContainer)) {
        removeToolbar();
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        removeToolbar();
        return;
      }
      savedRange = range.cloneRange();
      showToolbar(rect);
    }, 0);
  }

  // Capture phase: Threads attaches its own mouseup/keyup handlers directly
  // on the composer (e.g. for its "Mark as spoiler" selection popup) and
  // calls stopPropagation() there so the event never reaches a bubble-phase
  // listener on document. Listening during capture runs us first, before the
  // page gets a chance to stop the event.
  document.addEventListener('mouseup', handleSelection, true);
  document.addEventListener('keyup', handleSelection, true);
  document.addEventListener(
    'mousedown',
    (e) => {
      if (toolbarEl && !toolbarEl.contains(e.target)) removeToolbar();
    },
    true
  );
  window.addEventListener('scroll', removeToolbar, true);
  window.addEventListener('resize', removeToolbar);
})();
