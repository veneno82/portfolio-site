// Shared site features: command-palette terminal (ctrl/cmd+enter)
// and a properly animated favicon (works in Chrome via ImageDecoder).
(function () {
  'use strict';

  // ── Terminal command palette ──────────────────────────────────────────────
  // Inject styles once
  if (!document.getElementById('site-terminal-styles')) {
    const s = document.createElement('style');
    s.id = 'site-terminal-styles';
    s.textContent = `
      #terminal-overlay {
        display: none;
        position: fixed;
        bottom: 12vh;
        left: 50%;
        transform: translateX(-50%);
        width: min(480px, calc(100% - 32px));
        max-height: 50vh;
        background: #0a0a0a;
        z-index: 9999;
        font-family: 'Courier New', Courier, monospace;
        padding: 14px 16px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
        color: #c8c8c8;
      }
      #terminal-overlay.open { display: flex; flex-direction: column; }
      #term-output {
        font-size: 12px;
        line-height: 1.6;
        white-space: pre-wrap;
        max-height: 200px;
        overflow-y: auto;
        color: #9a9a9a;
      }
      #term-output:not(:empty) { margin-bottom: 8px; }
      #term-input-row { display: flex; align-items: center; gap: 8px; }
      #term-prompt { color: #5a5; font-size: 13px; }
      #term-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: #c8c8c8;
        font-family: inherit;
        font-size: 13px;
        caret-color: #5a5;
      }
      @media (max-width: 520px) {
        #terminal-overlay { bottom: 8vh; }
      }
    `;
    document.head.appendChild(s);
  }

  function buildTerminal() {
    if (document.getElementById('terminal-overlay')) return;
    const t = document.createElement('div');
    t.id = 'terminal-overlay';
    t.innerHTML =
      '<div id="term-output"></div>' +
      '<div id="term-input-row">' +
        '<span id="term-prompt">$</span>' +
        '<input id="term-input" type="text" autocomplete="off" spellcheck="false" placeholder="type a command — try \'help\'">' +
      '</div>';
    document.body.appendChild(t);
  }

  function initTerminal() {
    buildTerminal();
    const term = document.getElementById('terminal-overlay');
    const out = document.getElementById('term-output');
    const inp = document.getElementById('term-input');

    function open() {
      term.classList.add('open');
      inp.value = '';
      out.textContent = '';
      setTimeout(() => inp.focus(), 0);
    }
    function close() { term.classList.remove('open'); }

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); open(); }
      if (e.key === 'Escape') close();
    });
    document.addEventListener('mousedown', e => {
      if (term.classList.contains('open') && !term.contains(e.target)) close();
    });

    const COMMANDS = {
      help: () => 'commands:\n  home   — back to portfolio\n  notes  — open notes\n  github — open github\n  clear  — clear output\n  close  — close palette',
      home:  () => { window.location.href = '/'; return ''; },
      notes: () => { window.location.href = '/notes'; return ''; },
      github: () => { window.open('https://github.com/britomauro', '_blank'); return ''; },
      clear: () => { out.textContent = ''; return ''; },
      close: () => { close(); return ''; }
    };

    inp.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const cmd = inp.value.trim().toLowerCase();
      inp.value = '';
      if (!cmd) return;
      const result = COMMANDS[cmd] ? COMMANDS[cmd]() : 'command not found: ' + cmd;
      if (result) out.textContent = result;
    });
  }

  // ── Animated favicon ──────────────────────────────────────────────────────
  // Chrome rasterizes GIF favicons to a single frame, so we manually decode
  // the GIF with ImageDecoder and update the <link rel="icon"> with each frame.
  // Firefox/Safari: the bare GIF link still animates natively as a fallback.
  async function initFavicon() {
    let favLink = document.querySelector('link[rel="icon"]');
    if (!favLink) {
      favLink = document.createElement('link');
      favLink.rel = 'icon';
      document.head.appendChild(favLink);
    }
    favLink.href = '/asterikgif.gif';
    favLink.type = 'image/gif';

    if (typeof window.ImageDecoder === 'undefined') return;

    try {
      const res = await fetch('/asterikgif.gif');
      if (!res.ok) return;
      const buf = await res.arrayBuffer();
      const decoder = new ImageDecoder({ data: buf, type: 'image/gif' });
      await decoder.completed;

      const track = decoder.tracks.selectedTrack;
      if (!track || track.frameCount < 2) return;
      const total = track.frameCount;

      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d');

      let idx = 0;
      let alive = true;
      async function tick() {
        if (!alive) return;
        try {
          const r = await decoder.decode({ frameIndex: idx });
          ctx.clearRect(0, 0, 64, 64);
          ctx.drawImage(r.image, 0, 0, 64, 64);
          favLink.href = canvas.toDataURL('image/png');
          const ms = (r.image.duration ? r.image.duration / 1000 : 100);
          idx = (idx + 1) % total;
          setTimeout(tick, Math.max(60, ms));
        } catch (_) {
          alive = false;
        }
      }
      tick();
    } catch (_) { /* network/decode failure: keep the static GIF link */ }
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initTerminal(); initFavicon(); });
  } else {
    initTerminal();
    initFavicon();
  }
})();
