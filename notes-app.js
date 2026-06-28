(function () {
  /* ── CONSTANTS ─────────────────────────────────────────────── */
  const DOC_KEY = 'mb_notes_doc', META_KEY = 'mb_notes_doc_meta', PIN_KEY = 'mb_notes_pinned',
    TODO_KEY = 'mb_notes_todos', TODO_TS_KEY = 'mb_notes_todos_ts', TODO_PENDING_KEY = 'mb_notes_todos_pending',
    TODO_DELETED_KEY = 'mb_notes_todos_deleted', THEME_KEY = 'mb_theme',
    SWATCH_KEY = 'mb_color_swatches', HL_SWATCH_KEY = 'mb_hl_swatches', PIN_COLOR_KEY = 'mb_pin_color',
    ARCHIVE_KEY = 'mb_archive_doc', ARCHIVE_TS_KEY = 'mb_archive_ts',
    STICKER_KEY = 'mb_notes_stickers';

  // 5 default swatches: mint, blue, purple, pink, orange
  const DEFAULT_SWATCHES = ['#3ecf8e', '#3478f6', '#8944e0', '#e54f8a', '#e87d2f'];
  const DEFAULT_HL_SWATCHES = ['#a8f0c8', '#a0cfff', '#cba8f0', '#f0a8c8', '#ffe0a0'];
  const PIN_COLORS = ['#ffcc00', '#ff9500', '#ff6b6b', '#a8f0c8', '#a0cfff', '#cba8f0', '#f5f5dc', '#d4d4d4'];

  /* ── DOM ────────────────────────────────────────────────────── */
  const $ = id => document.getElementById(id);
  const root = document.documentElement, doc = $('doc'), savedEl = $('savedIndicator'),
    toggle = $('themeToggle'), pinnedBody = $('pinnedBody'), pinnedSection = $('pinnedSection'),
    pinnedHeader = $('pinnedHeader'), todoList = $('todoList'), todoForm = $('todoForm'),
    todoInput = $('todoInput'), todoCount = $('todoCount'), panelNotes = $('panelNotes'),
    panelTodos = $('panelTodos'), docMeta = $('docMeta'), stickerLayer = $('stickerLayer');

  /* ── THEME ──────────────────────────────────────────────────── */
  toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next) } catch (_) { }
  });

  /* ── MOBILE TABS ────────────────────────────────────────────── */
  const tabBtns = document.querySelectorAll('.tab-btn');
  let isMobile = () => window.innerWidth <= 840;
  function applyTab() {
    if (!isMobile()) { panelNotes.classList.remove('hidden-mobile'); panelTodos.classList.remove('hidden-mobile'); return }
    const active = document.querySelector('.tab-btn.active').dataset.tab;
    panelNotes.classList.toggle('hidden-mobile', active !== 'notes');
    panelTodos.classList.toggle('hidden-mobile', active !== 'todos');
  }
  tabBtns.forEach(b => b.addEventListener('click', () => {
    tabBtns.forEach(t => t.classList.remove('active')); b.classList.add('active'); applyTab();
    if (typeof repositionAllStickers === 'function') repositionAllStickers();
  }));
  window.addEventListener('resize', () => {
    applyTab();
    if (typeof updateLastNotesWidth === 'function') updateLastNotesWidth();
  });
  applyTab();
  setTimeout(() => {
    if (typeof updateLastNotesWidth === 'function') updateLastNotesWidth();
  }, 100);

  /* ── SAVE INDICATOR ─────────────────────────────────────────── */
  let flashT = null;
  function flash() {
    savedEl.textContent = 'saved'; savedEl.classList.add('flash');
    clearTimeout(flashT); flashT = setTimeout(() => savedEl.classList.remove('flash'), 600)
  }

  /* ── NOTES: LOAD / SAVE / CLOUD ─────────────────────────────── */
  let initial = localStorage.getItem(DOC_KEY);
  if (initial) doc.innerHTML = initial;
  let initialPin = localStorage.getItem(PIN_KEY);
  if (initialPin) pinnedBody.innerHTML = initialPin;

  /* ── META LINE (last edited) ────────────────────────────────── */
  function fmtDate(ts) {
    const d = new Date(ts), today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
    if (sameDay) return 'today, ' + time;
    const opts = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== today.getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString([], opts) + ', ' + time;
  }
  function refreshMeta() {
    const ts = Number(localStorage.getItem(META_KEY)) || Date.now();
    if (docMeta) docMeta.textContent = 'last edited ' + fmtDate(ts);
  }
  refreshMeta();

  let saveTimer = null;
  let syncing = false; // guard: don't save while loading cloud data
  function persistNotes() {
    if (syncing) return;
    try {
      const ts = Date.now();
      localStorage.setItem(DOC_KEY, doc.innerHTML);
      localStorage.setItem(PIN_KEY, pinnedBody.innerHTML);
      localStorage.setItem(META_KEY, String(ts));
      flash();
      refreshMeta();
      fetch('/api/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: doc.innerHTML, pinned: pinnedBody.innerHTML, stickers: stickers.map(s => ({ id: s.id, src: s.src, x: s.x, y: s.y, w: s.w, h: s.h })), ts })
      }).catch(() => { });
    } catch (_) { savedEl.textContent = 'save failed' }
  }
  function scheduleNoteSave() {
    if (syncing) return;
    savedEl.textContent = 'saving…'; clearTimeout(saveTimer); saveTimer = setTimeout(persistNotes, 400);
  }
  doc.addEventListener('input', scheduleNoteSave);
  pinnedBody.addEventListener('input', scheduleNoteSave);

  /* Initial load: always trust cloud as source of truth.
     localStorage is shown first for speed, then cloud overwrites if available. */
  async function loadNotesCloud(isPolling) {
    try {
      const r = await fetch('/api/notes'); if (!r.ok) return;
      const data = await r.json();
      const localTs = Number(localStorage.getItem(META_KEY)) || 0;
      // On initial load, always use cloud data. On polling, only if cloud is newer.
      const shouldSync = isPolling ? (data.ts && data.ts > localTs) : (data.ts != null);
      if (shouldSync) {
        syncing = true;
        if (data.content != null) { doc.innerHTML = data.content; localStorage.setItem(DOC_KEY, data.content) }
        if (data.pinned != null) { pinnedBody.innerHTML = data.pinned; localStorage.setItem(PIN_KEY, data.pinned) }
        if (Array.isArray(data.stickers)) {
          localStorage.setItem(STICKER_KEY, JSON.stringify(data.stickers));
          stickers = data.stickers;
          let migrated = false;
          stickers.forEach(st => {
            if (st.panel === undefined || st.relX === undefined) {
              initializeStickerPanel(st);
              migrated = true;
            }
          });
          if (migrated) {
            saveStickers();
          }
          renderAllStickers();
        }
        if (data.ts) localStorage.setItem(META_KEY, String(data.ts));
        refreshMeta();
        syncing = false;
      }
    } catch (_) { syncing = false }
  }
  loadNotesCloud(false);

  /* Periodic sync: poll every 30s to pick up changes from other devices */
  setInterval(() => loadNotesCloud(true), 30000);

  window.addEventListener('pagehide', () => { if (saveTimer) { clearTimeout(saveTimer); persistNotes() } });

  /* ── PASTE & AUTO LINK DETECTION (+ IMAGE STICKERS) ────────── */
  function getCaretStickerPos() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const layerRect = stickerLayer.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      // Collapsed caret — try caret position
      const span = document.createElement('span');
      span.textContent = '\u200b';
      range.insertNode(span);
      const spanRect = span.getBoundingClientRect();
      const pos = { x: spanRect.left - layerRect.left, y: spanRect.top - layerRect.top };
      span.remove();
      return pos;
    }
    return { x: rect.left - layerRect.left, y: rect.top - layerRect.top };
  }
  doc.addEventListener('paste', e => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) handleStickerImageFile(file, getCaretStickerPos());
          return;
        }
      }
    }
    const plain = (e.clipboardData || window.clipboardData).getData('text') || '';
    const urlRegex = /((https?:\/\/|www\.)[^\s]+)/gi;
    if (urlRegex.test(plain)) {
      e.preventDefault();
      urlRegex.lastIndex = 0;
      const escaped = plain.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const html = escaped.replace(urlRegex, function (url) {
        const rawUrl = url.replace(/&amp;/g, '&');
        const href = rawUrl.toLowerCase().startsWith('http') ? rawUrl : 'https://' + rawUrl;
        return `<a href="${href}" target="_blank" rel="noopener">${url}</a>`;
      }).replace(/\n/g, '<br>');
      document.execCommand('insertHTML', false, html);
    } else {
      e.preventDefault();
      document.execCommand('insertText', false, plain);
    }
  });

  /* Also intercept paste on the pinned body for sticker images */
  pinnedBody.addEventListener('paste', e => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) handleStickerImageFile(file, getCaretStickerPos());
          return;
        }
      }
    }
  });

  /* Also intercept paste on the panel itself for cases where user isn't focused on doc */
  panelNotes.addEventListener('paste', e => {
    if (e.target === doc || doc.contains(e.target) || e.target === pinnedBody || pinnedBody.contains(e.target)) return;
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) handleStickerImageFile(file, getCaretStickerPos());
          return;
        }
      }
    }
  });

  // Open links in editable area on click
  doc.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (a && doc.contains(a)) {
      e.preventDefault();
      window.open(a.href, '_blank');
    }
  });

  /* ══════════════════════════════════════════════════════════════
     FLOATING STICKER IMAGES
     ══════════════════════════════════════════════════════════════ */
  let stickers = [];
  let stickerIdCounter = Date.now();
  let lastNotesWidth = 700;

  function updateLastNotesWidth() {
    if (panelNotes && panelNotes.offsetWidth > 100 && !isMobile()) {
      lastNotesWidth = panelNotes.offsetWidth;
    }
  }

  function initializeStickerPanel(s) {
    if (!s.panel) {
      updateLastNotesWidth();
      s.panel = s.x < lastNotesWidth ? 'notes' : 'todos';
    }
    if (s.relX === undefined) {
      updateLastNotesWidth();
      s.relX = s.panel === 'notes' ? s.x : s.x - lastNotesWidth;
    }
  }

  function loadStickers() {
    try { const s = JSON.parse(localStorage.getItem(STICKER_KEY)); if (Array.isArray(s)) return s } catch (_) { }
    return [];
  }
  function saveStickers() {
    try {
      const data = stickers.map(s => ({ id: s.id, src: s.src, x: s.x, y: s.y, w: s.w, h: s.h, panel: s.panel, relX: s.relX }));
      localStorage.setItem(STICKER_KEY, JSON.stringify(data));
      flash();
      // sync to cloud alongside notes
      const ts = Date.now();
      localStorage.setItem(META_KEY, String(ts));
      refreshMeta();
      fetch('/api/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: doc.innerHTML, pinned: pinnedBody.innerHTML, stickers: data, ts })
      }).catch(() => { });
    } catch (_) { }
  }

  function handleStickerImageFile(file, pos) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      const dataUrl = ev.target.result;
      // determine default position: center of the panel viewport
      const layerRect = stickerLayer.getBoundingClientRect();
      const x = pos ? pos.x : Math.max(20, layerRect.width / 2 - 100);
      const y = pos ? pos.y : Math.max(80, window.scrollY - layerRect.top + layerRect.height / 2 - 100);
      const id = 'stk_' + (stickerIdCounter++);
      const s = { id, src: dataUrl, x, y, w: 200, h: 0 }; // h:0 = auto aspect ratio

      let notesWidth = panelNotes.offsetWidth || lastNotesWidth;
      if (isMobile()) {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'notes';
        s.panel = activeTab;
        s.relX = x;
        s.x = s.panel === 'notes' ? x : x + notesWidth;
      } else {
        s.panel = x < notesWidth ? 'notes' : 'todos';
        s.relX = s.panel === 'notes' ? x : x - notesWidth;
      }

      // Determine natural aspect ratio
      const img = new Image();
      img.onload = function () {
        const aspect = img.naturalHeight / img.naturalWidth;
        s.h = Math.round(200 * aspect);
        stickers.push(s);
        createStickerEl(s);
        saveStickers();
      };
      img.onerror = function () {
        s.h = 200;
        stickers.push(s);
        createStickerEl(s);
        saveStickers();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function createStickerEl(s) {
    const wrap = document.createElement('div');
    wrap.className = 'sticker-img';
    wrap.dataset.stickerId = s.id;
    wrap.setAttribute('tabindex', '-1');
    applyStickerLayout(wrap, s);

    const img = document.createElement('img');
    img.src = s.src;
    img.draggable = false;
    img.alt = 'pasted image';

    const del = document.createElement('button');
    del.className = 'sticker-delete';
    del.innerHTML = '×';
    del.title = 'remove';
    del.type = 'button';
    del.addEventListener('click', e => { e.stopPropagation(); deleteSticker(s.id) });
    del.addEventListener('touchend', e => { e.preventDefault(); e.stopPropagation(); deleteSticker(s.id) });

    // resize handles — only bottom-right for simplicity, but all 4 corners
    ['br', 'bl', 'tr', 'tl'].forEach(corner => {
      const handle = document.createElement('div');
      handle.className = 'sticker-resize ' + corner;
      handle.addEventListener('mousedown', e => startResize(e, s.id, corner));
      handle.addEventListener('touchstart', e => startResize(e, s.id, corner), { passive: false });
      wrap.appendChild(handle);
    });

    wrap.append(img, del);
    // double-click/double-tap to activate (enable drag + show controls)
    wrap.addEventListener('dblclick', e => {
      e.preventDefault();
      e.stopPropagation();
      // deactivate all others first
      stickerLayer.querySelectorAll('.sticker-img.active').forEach(el => el.classList.remove('active'));
      wrap.classList.add('active');
    });
    // double-tap detection for touch
    let lastTap = 0;
    wrap.addEventListener('touchend', e => {
      if (e.target.classList.contains('sticker-resize') || e.target.classList.contains('sticker-delete')) return;
      const now = Date.now();
      if (now - lastTap < 350) {
        e.preventDefault();
        stickerLayer.querySelectorAll('.sticker-img.active').forEach(el => el.classList.remove('active'));
        wrap.classList.add('active');
      }
      lastTap = now;
    });
    // drag only when active
    wrap.addEventListener('mousedown', e => {
      if (!wrap.classList.contains('active')) return;
      if (e.target.classList.contains('sticker-resize') || e.target.classList.contains('sticker-delete')) return;
      startDrag(e, s.id);
    });
    wrap.addEventListener('touchstart', e => {
      if (!wrap.classList.contains('active')) return;
      if (e.target.classList.contains('sticker-resize') || e.target.classList.contains('sticker-delete')) return;
      startDrag(e, s.id);
    }, { passive: false });

    stickerLayer.appendChild(wrap);
  }

  function deleteSticker(id) {
    stickers = stickers.filter(s => s.id !== id);
    const el = stickerLayer.querySelector(`[data-sticker-id="${id}"]`);
    if (el) el.remove();
    saveStickers();
  }

  /* ── DRAG ────────────────────────────────────────────────── */
  function startDrag(e, id) {
    e.preventDefault();
    const stickerData = stickers.find(s => s.id === id);
    if (!stickerData) return;
    const el = stickerLayer.querySelector(`[data-sticker-id="${id}"]`);
    if (!el) return;

    el.classList.add('dragging', 'active');
    const isTouch = e.type === 'touchstart';
    const startPt = isTouch ? e.touches[0] : { clientX: e.clientX, clientY: e.clientY };
    const origX = stickerData.x, origY = stickerData.y;
    const startXVal = isMobile() ? stickerData.relX : stickerData.x;

    function onMove(ev) {
      ev.preventDefault();
      const pt = ev.touches ? ev.touches[0] : ev;
      const dx = pt.clientX - startPt.clientX;
      const dy = pt.clientY - startPt.clientY;
      const newX = Math.max(0, startXVal + dx);
      stickerData.y = Math.max(0, origY + dy);

      if (isMobile()) {
        stickerData.relX = newX;
        let notesWidth = panelNotes.offsetWidth || lastNotesWidth;
        stickerData.x = stickerData.panel === 'notes' ? newX : newX + notesWidth;
        el.style.left = newX + 'px';
      } else {
        stickerData.x = newX;
        let notesWidth = panelNotes.offsetWidth || lastNotesWidth;
        stickerData.panel = newX < notesWidth ? 'notes' : 'todos';
        stickerData.relX = stickerData.panel === 'notes' ? newX : newX - notesWidth;
        el.style.left = newX + 'px';
      }
      el.style.top = stickerData.y + 'px';
    }
    function onUp() {
      el.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      saveStickers();
    }
    document.addEventListener(isTouch ? 'touchmove' : 'mousemove', onMove, { passive: false });
    document.addEventListener(isTouch ? 'touchend' : 'mouseup', onUp);
  }

  /* ── RESIZE ─────────────────────────────────────────────── */
  function startResize(e, id, corner) {
    e.preventDefault();
    e.stopPropagation();
    const stickerData = stickers.find(s => s.id === id);
    if (!stickerData) return;
    const el = stickerLayer.querySelector(`[data-sticker-id="${id}"]`);
    if (!el) return;

    el.classList.add('active');
    const isTouch = e.type === 'touchstart';
    const startPt = isTouch ? e.touches[0] : { clientX: e.clientX, clientY: e.clientY };
    const origW = stickerData.w, origH = stickerData.h;
    const origX = stickerData.x, origY = stickerData.y;
    const origRelX = stickerData.relX;
    const aspect = origH / origW;
    const notesWidth = panelNotes.offsetWidth || lastNotesWidth;

    function onMove(ev) {
      ev.preventDefault();
      const pt = ev.touches ? ev.touches[0] : ev;
      const dx = pt.clientX - startPt.clientX;
      const dy = pt.clientY - startPt.clientY;

      let newW, newH, newX, newY;
      if (corner === 'br') {
        newW = Math.max(40, origW + dx);
        newH = Math.round(newW * aspect);
        newX = isMobile() ? origRelX : origX; newY = origY;
      } else if (corner === 'bl') {
        newW = Math.max(40, origW - dx);
        newH = Math.round(newW * aspect);
        newX = (isMobile() ? origRelX : origX) + (origW - newW); newY = origY;
      } else if (corner === 'tr') {
        newW = Math.max(40, origW + dx);
        newH = Math.round(newW * aspect);
        newX = isMobile() ? origRelX : origX; newY = origY + (origH - newH);
      } else { // tl
        newW = Math.max(40, origW - dx);
        newH = Math.round(newW * aspect);
        newX = (isMobile() ? origRelX : origX) + (origW - newW); newY = origY + (origH - newH);
      }

      stickerData.w = newW; stickerData.h = newH;
      stickerData.y = Math.max(0, newY);

      if (isMobile()) {
        stickerData.relX = Math.max(0, newX);
        stickerData.x = stickerData.panel === 'notes' ? stickerData.relX : stickerData.relX + notesWidth;
        el.style.left = stickerData.relX + 'px';
      } else {
        stickerData.x = Math.max(0, newX);
        stickerData.panel = stickerData.x < notesWidth ? 'notes' : 'todos';
        stickerData.relX = stickerData.panel === 'notes' ? stickerData.x : stickerData.x - notesWidth;
        el.style.left = stickerData.x + 'px';
      }

      el.style.width = newW + 'px'; el.style.height = newH + 'px';
      el.style.top = stickerData.y + 'px';
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      saveStickers();
    }
    document.addEventListener(isTouch ? 'touchmove' : 'mousemove', onMove, { passive: false });
    document.addEventListener(isTouch ? 'touchend' : 'mouseup', onUp);
  }

  /* ── LOAD STICKERS ON INIT ──────────────────────────────── */
  function renderAllStickers() {
    // remove existing sticker elements
    stickerLayer.querySelectorAll('.sticker-img').forEach(el => el.remove());
    stickers.forEach(s => createStickerEl(s));
  }
  stickers = loadStickers();

  // Migrate / initialize panel fields on load
  let migrated = false;
  stickers.forEach(s => {
    if (s.panel === undefined || s.relX === undefined) {
      initializeStickerPanel(s);
      migrated = true;
    }
  });
  if (migrated) {
    saveStickers();
  }

  renderAllStickers();

  /* ── RESPONSIVE STICKER LAYOUT ──────────────────────────── */
  // On mobile, stickers placed in the desktop todo-panel area (large x) would
  // be off-screen. This helper clamps the visual position & size so stickers
  // always fit within the viewport, without changing the saved data model.
  function applyStickerLayout(el, s) {
    initializeStickerPanel(s);
    const vw = window.innerWidth;
    if (vw <= 840) {
      const active = document.querySelector('.tab-btn.active')?.dataset.tab || 'notes';
      if (s.panel !== active) {
        el.style.display = 'none';
        return;
      } else {
        el.style.display = '';
      }

      // clamp width to fit screen (with 16px margin each side)
      const maxW = vw - 32;
      const visW = Math.min(s.w, maxW);
      const scale = visW / s.w;
      const visH = Math.round(s.h * scale);
      const visX = Math.min(s.relX, vw - visW - 16);
      el.style.left = Math.max(0, visX) + 'px';
      el.style.top = s.y + 'px';
      el.style.width = visW + 'px';
      el.style.height = visH + 'px';
    } else {
      el.style.display = '';
      let visLeft = s.x;
      if (s.panel === 'todos') {
        const notesWidth = panelNotes.offsetWidth || lastNotesWidth;
        visLeft = notesWidth + s.relX;
      }
      el.style.left = visLeft + 'px';
      el.style.top = s.y + 'px';
      el.style.width = s.w + 'px';
      el.style.height = s.h + 'px';
    }
  }
  function repositionAllStickers() {
    stickerLayer.querySelectorAll('.sticker-img').forEach(el => {
      const s = stickers.find(st => st.id === el.dataset.stickerId);
      if (s) applyStickerLayout(el, s);
    });
  }
  window.addEventListener('resize', repositionAllStickers);

  /* ── DEACTIVATE sticker on outside click ────────────────── */
  document.addEventListener('click', e => {
    if (!e.target.closest('.sticker-img')) {
      stickerLayer.querySelectorAll('.sticker-img.active').forEach(el => el.classList.remove('active'));
    }
  });

  /* ── AUTO BULLET LIST (type "* " at line start → bullet) ────── */
  doc.addEventListener('input', e => {
    // Only process insertText type inputs
    if (e.inputType !== 'insertText' || e.data !== ' ') return;
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const node = sel.anchorNode;
    if (!node || node.nodeType !== 3) return;
    const text = node.textContent;
    const offset = sel.anchorOffset;
    // Check if the text right before cursor is "* " at beginning of text node
    // (offset should be 2 after typing the space, text starts with "* ")
    if (offset === 2 && text.startsWith('* ')) {
      // Verify this text node is at the start of a block
      const block = node.parentElement;
      if (!block) return;
      // Only trigger if the text node is the first meaningful content
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
      const firstText = walker.nextNode();
      if (firstText !== node) return;
      // Remove the "* " prefix
      e.preventDefault && false; // can't preventDefault on input, so we manually fix
      const remaining = text.slice(2);
      node.textContent = remaining;
      // Place cursor at start of the remaining text
      const range = document.createRange();
      range.setStart(node, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      // Convert block to unordered list
      document.execCommand('insertUnorderedList', false, null);
      scheduleNoteSave();
    }
  });

  /* ── PINNED TOGGLE ──────────────────────────────────────────── */
  let pinCollapsed = localStorage.getItem('mb_pin_collapsed') === '1';
  if (pinCollapsed) pinnedSection.classList.add('collapsed');
  pinnedHeader.addEventListener('click', e => {
    // don't toggle if clicking the color button area
    if (e.target.closest('.pinned-color-btn') || e.target.closest('.pin-color-popup')) return;
    pinCollapsed = !pinCollapsed; pinnedSection.classList.toggle('collapsed', pinCollapsed);
    localStorage.setItem('mb_pin_collapsed', pinCollapsed ? '1' : '0');
  });

  /* ── PINNED COLOR PICKER ────────────────────────────────────── */
  const pinColorBtn = $('pinColorBtn'), pinColorPopup = $('pinColorPopup');
  let currentPinColor = localStorage.getItem(PIN_COLOR_KEY) || '#ffcc00';
  function applyPinColor(hex) {
    currentPinColor = hex;
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    pinnedSection.style.background = `rgba(${r},${g},${b},.08)`;
    pinnedSection.style.borderColor = `rgba(${r},${g},${b},.25)`;
    pinColorBtn.style.background = hex;
    localStorage.setItem(PIN_COLOR_KEY, hex);
  }
  applyPinColor(currentPinColor);

  // build pin color popup
  PIN_COLORS.forEach(c => {
    const s = document.createElement('button'); s.type = 'button'; s.className = 'pin-color-swatch';
    s.style.background = c;
    s.addEventListener('click', e => {
      e.stopPropagation(); applyPinColor(c); pinColorPopup.classList.remove('open');
      pinColorPopup.querySelectorAll('.pin-color-swatch').forEach(el => el.classList.toggle('selected', el.style.background === s.style.background))
    });
    pinColorPopup.appendChild(s);
  });
  const pinHex = document.createElement('input'); pinHex.type = 'text'; pinHex.className = 'pin-hex-input';
  pinHex.placeholder = '#hex'; pinHex.maxLength = 7;
  pinHex.addEventListener('click', e => e.stopPropagation());
  pinHex.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      const v = pinHex.value.trim(); if (/^#[0-9a-fA-F]{6}$/.test(v)) { applyPinColor(v); pinColorPopup.classList.remove('open') }
    }
  });
  pinColorPopup.appendChild(pinHex);

  pinColorBtn.addEventListener('click', e => { e.stopPropagation(); pinColorPopup.classList.toggle('open') });

  /* ── TOOLBAR: FORMAT BUTTONS ────────────────────────────────── */
  document.querySelectorAll('.tb-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault(); doc.focus();
      document.execCommand(btn.dataset.cmd, false, null); scheduleNoteSave()
    });
  });

  /* ── TOOLBAR: PARAGRAPH STYLE ───────────────────────────────── */
  $('tbParagraph').addEventListener('change', function () {
    doc.focus(); document.execCommand('formatBlock', false, this.value); scheduleNoteSave()
  });

  /* ── TOOLBAR: FONT FAMILY ───────────────────────────────────── */
  $('tbFont').addEventListener('change', function () {
    doc.focus();
    if (this.value) {
      document.execCommand('fontName', false, this.value);
    } else {
      // "Default" — remove font override by applying the body's default font
      document.execCommand('fontName', false, "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif");
    }
    scheduleNoteSave();
  });

  /* ── TOOLBAR: FONT SIZE ─────────────────────────────────────── */
  $('tbSize').addEventListener('change', function () {
    doc.focus(); document.execCommand('fontSize', false, this.value); scheduleNoteSave()
  });

  /* ── COLOR PICKER (5 customizable swatches + hex) ──────────── */
  function loadSwatches(key, defaults) {
    try { const s = JSON.parse(localStorage.getItem(key)); if (Array.isArray(s) && s.length === 5) return s } catch (_) { }
    return [...defaults];
  }
  function saveSwatches(key, arr) { try { localStorage.setItem(key, JSON.stringify(arr)) } catch (_) { } }

  function buildColorPicker(opts) {
    const { popupEl, swatchesEl, hexInput, applyBtn, dotEl, key, defaults, command } = opts;
    let swatches = loadSwatches(key, defaults);
    let selectedIdx = 0;

    function renderSwatches() {
      swatchesEl.innerHTML = '';
      swatches.forEach((c, i) => {
        const s = document.createElement('button'); s.type = 'button'; s.className = 'color-swatch' + (i === selectedIdx ? ' selected' : '');
        s.style.background = c;
        s.addEventListener('click', e => {
          e.stopPropagation(); selectedIdx = i;
          doc.focus(); document.execCommand(command, false, c);
          dotEl.style.background = c; scheduleNoteSave();
          swatchesEl.querySelectorAll('.color-swatch').forEach((el, j) => el.classList.toggle('selected', j === i));
        });
        // right-click to start editing this swatch
        s.addEventListener('contextmenu', e => {
          e.preventDefault(); e.stopPropagation();
          selectedIdx = i; hexInput.value = c; hexInput.focus();
          swatchesEl.querySelectorAll('.color-swatch').forEach((el, j) => el.classList.toggle('selected', j === i));
        });
        swatchesEl.appendChild(s);
      });
    }
    renderSwatches();

    applyBtn.addEventListener('click', e => {
      e.stopPropagation();
      const v = hexInput.value.trim(); if (!/^#[0-9a-fA-F]{6}$/.test(v)) return;
      swatches[selectedIdx] = v; saveSwatches(key, swatches); renderSwatches();
      doc.focus(); document.execCommand(command, false, v); dotEl.style.background = v;
      scheduleNoteSave(); popupEl.classList.remove('open');
    });
    hexInput.addEventListener('click', e => e.stopPropagation());
    hexInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applyBtn.click() } });
  }

  // Text color picker
  const colorPopup = $('colorPopup'), colorBtn = $('tbColorBtn'), colorDot = $('tbColorDot');
  buildColorPicker({
    popupEl: colorPopup, swatchesEl: $('colorSwatches'), hexInput: $('colorHexInput'),
    applyBtn: $('colorHexApply'), dotEl: colorDot, key: SWATCH_KEY, defaults: DEFAULT_SWATCHES, command: 'foreColor'
  });
  colorBtn.addEventListener('click', e => {
    e.stopPropagation(); colorPopup.classList.toggle('open');
    $('highlightPopup').classList.remove('open')
  });

  // Highlight picker
  const hlPopup = $('highlightPopup'), hlBtn = $('tbHighlightBtn'), hlDot = $('tbHighlightDot');
  buildColorPicker({
    popupEl: hlPopup, swatchesEl: $('highlightSwatches'), hexInput: $('highlightHexInput'),
    applyBtn: $('highlightHexApply'), dotEl: hlDot, key: HL_SWATCH_KEY, defaults: DEFAULT_HL_SWATCHES, command: 'hiliteColor'
  });
  hlBtn.addEventListener('click', e => {
    e.stopPropagation(); hlPopup.classList.toggle('open');
    colorPopup.classList.remove('open')
  });

  /* close all popups on outside click */
  document.addEventListener('click', () => {
    colorPopup.classList.remove('open'); hlPopup.classList.remove('open'); pinColorPopup.classList.remove('open')
  });

  /* ── KEYBOARD SHORTCUTS ─────────────────────────────────────── */
  doc.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.shiftKey && e.key.toLowerCase() === 'x') { e.preventDefault(); document.execCommand('strikeThrough'); scheduleNoteSave() }
    if (mod && e.shiftKey && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      const hl = loadSwatches(HL_SWATCH_KEY, DEFAULT_HL_SWATCHES);
      document.execCommand('hiliteColor', false, hl[0]); scheduleNoteSave()
    }
    if (mod && e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); colorPopup.classList.toggle('open'); hlPopup.classList.remove('open') }

    /* TAB INDENT / OUTDENT in doc (Google Docs style) */
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        document.execCommand('outdent', false, null);
      } else {
        document.execCommand('indent', false, null);
      }
      scheduleNoteSave();
    }

    /* ARCHIVE selected text: Ctrl+Shift+- */
    if (mod && e.shiftKey && (e.key === '-' || e.key === '_')) {
      e.preventDefault();
      archiveSelection();
    }
  });

  /* ── COLLAPSIBLE BLOCKS (inline arrow, no block styling) ────── */
  // Undo stack for collapse operations (stores doc innerHTML snapshots)
  const collapseUndoStack = [];
  const MAX_COLLAPSE_UNDO = 20;

  function saveCollapseSnapshot() {
    collapseUndoStack.push(doc.innerHTML);
    if (collapseUndoStack.length > MAX_COLLAPSE_UNDO) collapseUndoStack.shift();
  }

  function undoCollapse() {
    if (!collapseUndoStack.length) return;
    doc.innerHTML = collapseUndoStack.pop();
    scheduleNoteSave();
  }

  function wrapSelectionInCollapseBlock() {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    saveCollapseSnapshot();
    const range = sel.getRangeAt(0);
    const fragment = range.extractContents();

    // Extract title from first bold text in the selection
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment.cloneNode(true));
    let title = '';
    const boldEl = tempDiv.querySelector('b,strong');
    if (boldEl) title = boldEl.textContent.trim();
    if (!title) {
      // Fallback: first 30 chars of plain text
      const plain = tempDiv.textContent.trim();
      title = plain.length > 30 ? plain.slice(0, 30) + '\u2026' : plain;
    }
    if (title.length > 40) title = title.slice(0, 40) + '\u2026';

    const wrap = document.createElement('span');
    wrap.className = 'collapse-wrap';

    const arrow = document.createElement('span');
    arrow.className = 'collapse-arrow';
    arrow.setAttribute('contenteditable', 'false');
    arrow.textContent = '\u25be';

    // Label shown when collapsed
    const label = document.createElement('span');
    label.className = 'collapse-label';
    label.setAttribute('contenteditable', 'false');
    label.textContent = title || 'collapsed';

    const inner = document.createElement('span');
    inner.className = 'collapse-inner';
    inner.appendChild(fragment);

    wrap.append(arrow, label, inner);
    range.insertNode(wrap);
    sel.removeAllRanges();
    scheduleNoteSave();
  }

  /* Single delegated mousedown on doc handles ALL collapse arrows.
     No MutationObserver, no per-element listeners, no rehydration needed. */
  doc.addEventListener('mousedown', e => {
    const arrow = e.target.closest('.collapse-arrow');
    if (!arrow) return;
    e.preventDefault();
    e.stopPropagation();
    const wrap = arrow.closest('.collapse-wrap');
    if (!wrap) return;
    const collapsed = !wrap.classList.contains('collapsed');
    wrap.classList.toggle('collapsed', collapsed);
    arrow.textContent = collapsed ? '\u25b8' : '\u25be';
    scheduleNoteSave();
  });

  // On load, set correct arrow text for any existing collapse blocks
  setTimeout(() => {
    doc.querySelectorAll('.collapse-wrap').forEach(wrap => {
      const arrow = wrap.querySelector('.collapse-arrow');
      if (arrow) {
        arrow.setAttribute('contenteditable', 'false');
        arrow.textContent = wrap.classList.contains('collapsed') ? '\u25b8' : '\u25be';
      }
    });
  }, 60);

  // Wire up toolbar button
  const collapseBtn = $('tbCollapseBtn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', e => {
      e.preventDefault();
      doc.focus();
      wrapSelectionInCollapseBlock();
    });
  }

  // Wire up archive toolbar button
  const archiveBtn = $('tbArchiveBtn');
  if (archiveBtn) {
    archiveBtn.addEventListener('click', e => {
      e.preventDefault();
      doc.focus();
      archiveSelection();
    });
  }

  // Undo collapse with Ctrl+Z when stack has items
  doc.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.shiftKey && e.key === 'z' && collapseUndoStack.length) {
      e.preventDefault();
      undoCollapse();
    }
  });

  /* ── ARCHIVE FEATURE ─────────────────────────────────────── */
  function archiveSelection() {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);

    // Get the HTML content of selection
    const cloned = range.cloneContents();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(cloned);
    const html = tempDiv.innerHTML;
    if (!html.trim()) return;

    // Add to archive with timestamp separator
    const ts = Date.now();
    const dateStr = new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    const separator = '<div style="font-size:11px;color:var(--fg2);opacity:.5;margin:12px 0 4px;border-top:1px solid var(--border);padding-top:6px">archived ' + dateStr + '</div>';

    // Load existing archive
    let existing = localStorage.getItem(ARCHIVE_KEY) || '';
    existing = separator + html + existing;
    localStorage.setItem(ARCHIVE_KEY, existing);
    localStorage.setItem(ARCHIVE_TS_KEY, String(ts));

    // Sync to cloud
    fetch('/api/archive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: existing, ts })
    }).catch(() => { });

    // Delete from notes
    range.deleteContents();
    sel.removeAllRanges();
    scheduleNoteSave();

    // Flash indicator
    savedEl.textContent = 'archived';
    savedEl.classList.add('flash');
    clearTimeout(flashT);
    flashT = setTimeout(() => savedEl.classList.remove('flash'), 800);
  }

  // Expose for mobile button
  window._archiveSelection = archiveSelection;

  /* ── FOCUS DOC ON LOAD ──────────────────────────────────────── */
  setTimeout(() => {
    doc.focus(); try {
      const r = document.createRange(); r.selectNodeContents(doc);
      r.collapse(false); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r)
    } catch (_) { }
  }, 50);

  /* ══════════════════════════════════════════════════════════════
     TODO LIST
     ══════════════════════════════════════════════════════════════ */
  const undoStack = [], redoStack = [], MAX_UNDO = 40;
  let focusedTodoIdx = null;

  function normalizeTodoText(text) {
    return String(text || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }
  function loadDeletedTodos() { try { return JSON.parse(localStorage.getItem(TODO_DELETED_KEY) || '[]') } catch (_) { return [] } }
  function saveDeletedTodos(deleted) {
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
    const next = deleted.filter(t => t && t.ts > cutoff).slice(-200);
    localStorage.setItem(TODO_DELETED_KEY, JSON.stringify(next));
    return next;
  }
  function rememberDeletedTodo(todo) {
    if (!todo) return;
    const deleted = saveDeletedTodos(loadDeletedTodos());
    deleted.push({
      id: todo.id || '',
      text: todo.type === 'divider' ? '' : normalizeTodoText(todo.text),
      done: !!todo.done,
      ts: Date.now()
    });
    saveDeletedTodos(deleted);
  }
  function sanitizeTodos(items) {
    if (!Array.isArray(items)) return { items: [], changed: true };
    const deleted = saveDeletedTodos(loadDeletedTodos());
    const deletedIds = new Set(deleted.map(t => t.id).filter(Boolean));
    const deletedDoneText = new Set(deleted.filter(t => t.done && t.text).map(t => t.text));
    const doneTextCounts = new Map();

    items.forEach(t => {
      if (t && t.type !== 'divider' && t.done) {
        const text = normalizeTodoText(t.text);
        if (text) doneTextCounts.set(text, (doneTextCounts.get(text) || 0) + 1);
      }
    });
    const corruptDoneText = new Set(
      Array.from(doneTextCounts.entries()).filter(([, count]) => count >= 3).map(([text]) => text)
    );

    const clean = items.filter(t => {
      if (!t || deletedIds.has(t.id)) return false;
      if (t.type !== 'divider' && t.done) {
        const text = normalizeTodoText(t.text);
        if (text && (deletedDoneText.has(text) || corruptDoneText.has(text))) return false;
      }
      return true;
    });
    return { items: clean, changed: clean.length !== items.length };
  }
  function loadTodosRaw() { try { return JSON.parse(localStorage.getItem(TODO_KEY) || '[]') } catch (_) { return [] } }
  function loadTodos() { return sanitizeTodos(loadTodosRaw()).items }
  function repairLocalTodos() {
    const clean = sanitizeTodos(loadTodosRaw());
    if (!clean.changed) return;
    const ts = Date.now();
    localStorage.setItem(TODO_KEY, JSON.stringify(clean.items));
    localStorage.setItem(TODO_TS_KEY, String(ts));
    queueTodoCloudSave(clean.items, ts);
  }
  function loadPendingTodoSave() { try { return JSON.parse(localStorage.getItem(TODO_PENDING_KEY) || 'null') } catch (_) { return null } }
  async function writeTodosCloud(items, ts) {
    try {
      const r = await fetch('/api/todos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, ts })
      });
      if (!r.ok) throw new Error('todo save failed');
      const pending = loadPendingTodoSave();
      if (pending && pending.ts === ts) localStorage.removeItem(TODO_PENDING_KEY);
      return true;
    } catch (_) {
      return false;
    }
  }
  function queueTodoCloudSave(items, ts) {
    localStorage.setItem(TODO_PENDING_KEY, JSON.stringify({ items, ts }));
    writeTodosCloud(items, ts);
  }
  function retryPendingTodoSave() {
    const pending = loadPendingTodoSave();
    if (pending && Array.isArray(pending.items) && pending.ts) {
      const clean = sanitizeTodos(pending.items);
      if (clean.changed) {
        pending.items = clean.items;
        localStorage.setItem(TODO_PENDING_KEY, JSON.stringify(pending));
      }
      writeTodosCloud(pending.items, pending.ts);
    }
    return pending;
  }
  function saveTodos(items, push) {
    items = sanitizeTodos(items).items;
    if (push !== false) {
      const prev = localStorage.getItem(TODO_KEY) || '[]'; undoStack.push(prev);
      if (undoStack.length > MAX_UNDO) undoStack.shift(); redoStack.length = 0
    }
    const ts = Date.now();
    localStorage.setItem(TODO_KEY, JSON.stringify(items));
    localStorage.setItem(TODO_TS_KEY, String(ts));
    flash();
    queueTodoCloudSave(items, ts);
  }

  function todoUndo() {
    if (!undoStack.length) return;
    redoStack.push(localStorage.getItem(TODO_KEY) || '[]');
    const prev = JSON.parse(undoStack.pop());
    saveTodos(prev, false); renderTodos()
  }
  function todoRedo() {
    if (!redoStack.length) return;
    undoStack.push(localStorage.getItem(TODO_KEY) || '[]');
    const next = JSON.parse(redoStack.pop());
    saveTodos(next, false); renderTodos()
  }

  /* ── SORT ────────────────────────────────────────────────────────
     If all tasks under a divider are completed, the divider +
     its tasks move to the completed section at the bottom.
     When a task is unchecked, origIdx puts it back in place.      */
  function sortedTodos(items) {
    const sections = [];
    let cur = { divider: null, tasks: [] };
    items.forEach(t => {
      if (t.type === 'divider') {
        if (cur.divider !== null || cur.tasks.length > 0) sections.push(cur);
        cur = { divider: t, tasks: [] };
      } else {
        cur.tasks.push(t);
      }
    });
    if (cur.divider !== null || cur.tasks.length > 0) sections.push(cur);

    const active = [], completed = [];
    sections.forEach(sec => {
      const allDone = sec.divider !== null && sec.tasks.length > 0 && sec.tasks.every(t => t.done);
      if (allDone) {
        completed.push({ ...sec.divider, done: true });
        sec.tasks.forEach(t => completed.push(t));
      } else {
        if (sec.divider !== null) active.push({ ...sec.divider, done: false });
        sec.tasks.forEach(t => { if (!t.done) active.push(t); else completed.push(t); });
      }
    });
    return [...active, ...completed];
  }

  /* Toggle done: stamp origIdx so we can restore on uncheck */
  function toggleTodoDone(id) {
    const first = snapshotRows();
    const items = loadTodos();
    const idx = items.findIndex(t => t.id === id);
    if (idx === -1) return;
    const t = items[idx];
    if (!t.done) {
      triggerTodoCompleteHaptic();
      // marking done — remember where it was
      t.done = true;
      t.origIdx = idx;
    } else {
      // un-marking — restore to original position
      t.done = false;
      const target = t.origIdx != null ? t.origIdx : idx;
      delete t.origIdx;
      items.splice(idx, 1);
      const clampedTarget = Math.min(target, items.length);
      items.splice(clampedTarget, 0, t);
      saveTodos(items);
      renderTodos();
      animateRowChanges(first);
      animateTodoStateChange(id);
      return;
    }
    saveTodos(sortedTodos(items));
    renderTodos();
    animateRowChanges(first);
    animateTodoStateChange(id);
  }

  /* ── DRAG-TO-REORDER ─────────────────────────────────────────── */
  let dragState = null;
  panelTodos.tabIndex = -1;
  const pendingTodoEnterIds = new Set();
  const pendingTodoStateIds = new Set();
  const TODO_LONG_PRESS_MS = 320;
  const TODO_LONG_PRESS_CANCEL_PX = 22;
  const TODO_STRIKETHROUGH_SPEED = 5 / .75; // duration multiplier; larger is slower
  const TODO_MULTILINE_STRIKETHROUGH_SPEED = 3.25 * .75;

  function getItemEls() {
    return Array.from(todoList.children).filter(el =>
      el.classList.contains('todo-item') || el.classList.contains('todo-divider'));
  }

  /* Get the data-id of a rendered row element */
  function getElId(el) {
    return el.dataset.todoId || null;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function isTodoDragBlockedTarget(target) {
    return !!target.closest?.('.todo-check,.todo-x,.todo-divider-x');
  }

  function isTouchTodoPointer(e) {
    return e.pointerType === 'touch' || e.pointerType === 'pen' ||
      window.matchMedia?.('(hover: none), (pointer: coarse)').matches;
  }

  function triggerTodoHaptic(kind) {
    try {
      if (kind === 'complete') {
        if (window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred) { window.Telegram.WebApp.HapticFeedback.notificationOccurred('success'); return }
        if (window.Capacitor?.Plugins?.Haptics?.notification) { window.Capacitor.Plugins.Haptics.notification({ type: 'SUCCESS' }); return }
        if (window.Haptics?.notification) { window.Haptics.notification('success'); return }
        if (window.Tactus?.notification) { window.Tactus.notification('success'); return }
        if (window.WebHaptics?.notification) { window.WebHaptics.notification('success'); return }
        if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) { window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); return }
        if (window.Capacitor?.Plugins?.Haptics?.impact) { window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' }); return }
        if (window.Haptics?.impact) { window.Haptics.impact('light'); return }
        if (window.Tactus?.impact) { window.Tactus.impact('light'); return }
        if (window.WebHaptics?.impact) { window.WebHaptics.impact('light'); return }
        if (window.Telegram?.WebApp?.HapticFeedback?.selectionChanged) { window.Telegram.WebApp.HapticFeedback.selectionChanged(); return }
        if (window.Capacitor?.Plugins?.Haptics?.selectionChanged) { window.Capacitor.Plugins.Haptics.selectionChanged(); return }
        if (window.Haptics?.selectionChanged) { window.Haptics.selectionChanged(); return }
        if (window.Tactus?.selection) { window.Tactus.selection(); return }
        if (window.WebHaptics?.selection) { window.WebHaptics.selection(); return }
        if (window.webkit?.messageHandlers?.hapticFeedback?.postMessage) { window.webkit.messageHandlers.hapticFeedback.postMessage('selection'); return }
        if (navigator.vibrate) navigator.vibrate([8, 24, 8]);
        return;
      }
      if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) { window.Telegram.WebApp.HapticFeedback.impactOccurred('medium'); return }
      if (window.Capacitor?.Plugins?.Haptics?.impact) { window.Capacitor.Plugins.Haptics.impact({ style: 'MEDIUM' }); return }
      if (window.Haptics?.impact) { window.Haptics.impact('medium'); return }
      if (window.Tactus?.impact) { window.Tactus.impact('medium'); return }
      if (window.WebHaptics?.impact) { window.WebHaptics.impact('medium'); return }
      if (window.Tactus?.selection) { window.Tactus.selection(); return }
      if (window.WebHaptics?.selection) { window.WebHaptics.selection(); return }
      if (navigator.vibrate) navigator.vibrate(14);
    } catch (_) { }
  }

  let lastTodoCompleteHaptic = 0;
  function triggerTodoCompleteHaptic(e) {
    if (e && !isTouchTodoPointer(e)) return;
    const now = Date.now();
    if (now - lastTodoCompleteHaptic < 220) return;
    lastTodoCompleteHaptic = now;
    triggerTodoHaptic('complete');
  }

  function lockTodoEditable(row) {
    const editableEls = Array.from(row.querySelectorAll('.todo-text,.todo-divider-label'));
    const prev = editableEls.map(el => [el, el.getAttribute('contenteditable')]);
    row.classList.add('todo-hold-pending');
    editableEls.forEach(el => el.setAttribute('contenteditable', 'false'));
    return () => {
      row.classList.remove('todo-hold-pending');
      prev.forEach(([el, value]) => {
        if (value == null) el.removeAttribute('contenteditable');
        else el.setAttribute('contenteditable', value);
      });
    };
  }

  function clearTodoSelection(row) {
    const active = document.activeElement;
    if (active && row.contains(active) && active.blur) active.blur();
    const selection = window.getSelection?.();
    if (selection?.removeAllRanges) selection.removeAllRanges();
  }

  function focusTodoEditableAtEnd(el) {
    if (!el || !document.body.contains(el)) return;
    el.focus({ preventScroll: true });
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (_) { }
  }

  function bindTodoHoldDrag(sourceEl) {
    sourceEl.addEventListener('pointerdown', e => {
      if (!isTouchTodoPointer(e) || e.button > 0 || isTodoDragBlockedTarget(e.target)) return;
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY;
      let lastX = startX, lastY = startY;
      const editableTarget = e.target.closest?.('.todo-text,.todo-divider-label');
      let timer = null, started = false;
      let moved = false;
      let unlocked = false;
      let unlockEditable = null;
      let pointerCaptured = false;

      sourceEl.classList.add('todo-hold-pending');
      try {
        sourceEl.setPointerCapture(e.pointerId);
        pointerCaptured = true;
      } catch (_) { }

      const unlock = () => {
        if (unlocked) return;
        unlocked = true;
        unlockEditable?.();
        sourceEl.classList.remove('todo-hold-pending');
      };

      const releasePointer = () => {
        if (!pointerCaptured) return;
        pointerCaptured = false;
        try { sourceEl.releasePointerCapture(e.pointerId) } catch (_) { }
      };

      const cleanup = opts => {
        const restoreEditable = opts?.restoreEditable !== false;
        const keepPending = opts?.keepPending === true;
        const release = opts?.releasePointer !== false;
        window.clearTimeout(timer);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onCancel);
        document.removeEventListener('pointercancel', onCancel);
        if (release) releasePointer();
        if (restoreEditable) unlock();
        else if (!keepPending) sourceEl.classList.remove('todo-hold-pending');
      };
      const onCancel = () => {
        const shouldFocusEditable = !started && !moved && editableTarget && sourceEl.contains(editableTarget);
        cleanup();
        if (shouldFocusEditable) requestAnimationFrame(() => focusTodoEditableAtEnd(editableTarget));
      };
      const onMove = ev => {
        if (ev.cancelable) ev.preventDefault();
        lastX = ev.clientX;
        lastY = ev.clientY;
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        if (Math.hypot(dx, dy) > TODO_LONG_PRESS_CANCEL_PX) {
          moved = true;
          cleanup();
        }
      };

      timer = window.setTimeout(() => {
        if (started || !document.body.contains(sourceEl)) return;
        started = true;
        unlockEditable = lockTodoEditable(sourceEl);
        clearTodoSelection(sourceEl);
        cleanup({ restoreEditable: false, keepPending: true, releasePointer: false });
        const dragStartEvent = {
          clientX: lastX,
          clientY: lastY,
          pointerId: e.pointerId,
          pointerType: e.pointerType,
          button: e.button,
          target: e.target,
          preventDefault: () => { try { e.preventDefault() } catch (_) { } }
        };
        const didStart = startTodoDrag(dragStartEvent, sourceEl, {
          haptic: 'drag',
          onDone: () => {
            releasePointer();
            unlock();
          }
        });
        if (!didStart) {
          releasePointer();
          unlock();
        }
      }, TODO_LONG_PRESS_MS);

      document.addEventListener('pointermove', onMove, { passive: false });
      document.addEventListener('pointerup', onCancel);
      document.addEventListener('pointercancel', onCancel);
    }, { passive: false });
  }

  function snapshotRows() {
    const m = new Map();
    getItemEls().forEach(el => m.set(getElId(el), el.getBoundingClientRect()));
    return m;
  }

  function animateRowChanges(first) {
    getItemEls().forEach(el => {
      if (el === dragState?.sourceEl) return;
      const prev = first.get(getElId(el));
      if (!prev) return;
      const next = el.getBoundingClientRect();
      const dy = prev.top - next.top;
      if (!dy) return;
      el.style.transition = 'none';
      el.style.transform = `translate3d(0,${dy}px,0)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform .18s cubic-bezier(.2,.8,.2,1)';
        el.style.transform = '';
        window.setTimeout(() => { el.style.transition = ''; }, 210);
      });
    });
  }

  function animateElementIn(el) {
    const inner = el.querySelector('.todo-item-inner, .todo-divider-inner');
    if (!inner) return;

    el.style.overflow = 'hidden';
    el.style.height = '0px';
    el.style.opacity = '0';

    inner.style.opacity = '0';
    inner.style.transform = 'translateY(-8px) scale(0.98)';
    inner.style.filter = 'blur(4px)';
    inner.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out, filter 0.15s ease-out';

    el.offsetHeight;

    const targetHeight = el.scrollHeight;

    el.style.transition = 'height 0.2s ease-out, opacity 0.2s ease-out';
    el.style.height = targetHeight + 'px';
    el.style.opacity = '1';

    inner.style.opacity = '1';
    inner.style.transform = 'translateY(0) scale(1)';
    inner.style.filter = 'blur(0px)';

    setTimeout(() => {
      el.style.height = '';
      el.style.overflow = '';
      el.style.opacity = '';
      el.style.transition = '';
      inner.style.transition = '';
    }, 200);
  }

  function clearTodoStrike(row) {
    row.querySelector('.todo-strike-layer')?.replaceChildren();
  }

  function renderTodoStrike(row, animate) {
    const text = row.querySelector('.todo-text');
    const layer = row.querySelector('.todo-strike-layer');
    if (!text || !layer) return;

    layer.replaceChildren();
    if (!row.classList.contains('done') || !text.textContent.trim()) return;

    const range = document.createRange();
    range.selectNodeContents(text);
    const textRect = text.getBoundingClientRect();
    const rects = Array.from(range.getClientRects()).filter(rect => rect.width > 1 && rect.height > 1);
    range.detach?.();

    const speed = rects.length > 1 ? TODO_MULTILINE_STRIKETHROUGH_SPEED : TODO_STRIKETHROUGH_SPEED;
    let delay = 0;
    rects.forEach(rect => {
      const strike = document.createElement('span');
      strike.className = 'todo-strikethrough';
      strike.style.left = (rect.left - textRect.left) + 'px';
      strike.style.top = (rect.top - textRect.top + rect.height * .56) + 'px';
      strike.style.width = rect.width + 'px';
      if (animate) {
        const duration = Math.max(170, Math.min(340, rect.width * 3.1)) * speed;
        strike.style.transform = 'scaleX(0)';
        strike.style.transition = `transform ${duration}ms cubic-bezier(.16,1,.3,1) ${delay}ms`;
        delay += Math.max(120, duration * .72);
        requestAnimationFrame(() => { strike.style.transform = 'scaleX(1)' });
      }
      layer.appendChild(strike);
    });
  }

  function layoutTodoStrikes(animateId) {
    getItemEls().forEach(row => {
      if (!row.classList.contains('todo-item')) return;
      renderTodoStrike(row, animateId && getElId(row) === animateId);
    });
  }

  function animateTodoStateChange(id) {
    pendingTodoStateIds.add(id);
    requestAnimationFrame(() => {
      const row = getItemEls().find(el => getElId(el) === id);
      if (!row || !pendingTodoStateIds.delete(id)) return;
      const text = row.querySelector('.todo-text');
      row.animate?.([
        { opacity: .72, filter: 'blur(1px)' },
        { opacity: 1, filter: 'blur(0px)' }
      ], { duration: 180, easing: 'ease-out' });
      if (text) {
        text.animate?.([
          { opacity: .45 },
          { opacity: 1 }
        ], { duration: 180, easing: 'ease-out' });
      }
      if (row.classList.contains('done')) renderTodoStrike(row, true);
      else clearTodoStrike(row);
    });
  }

  function deleteTodoById(id, row) {
    const runDelete = () => {
      const cur = loadTodos();
      const idx = cur.findIndex(t => t.id === id);
      if (idx === -1) return;
      rememberDeletedTodo(cur[idx]);
      cur.splice(idx, 1);
      saveTodos(cur);
      renderTodos();
    };
    if (!row) { runDelete(); return }
    const h = row.getBoundingClientRect().height;
    row.style.overflow = 'hidden';
    row.style.height = h + 'px';
    row.style.transition = 'height .18s ease-out, opacity .15s ease-out, transform .15s ease-out';
    requestAnimationFrame(() => {
      row.style.height = '0px';
      row.style.opacity = '0';
      row.style.transform = 'translate3d(0,8px,0) scale(.98)';
    });
    window.setTimeout(runDelete, 190);
  }

  function commitRenderedOrder() {
    const orderIds = getItemEls().map(getElId).filter(Boolean);
    const items = loadTodos();
    const byId = new Map(items.map(t => [t.id, t]));
    const next = orderIds.map(id => byId.get(id)).filter(Boolean);
    items.forEach(t => { if (!orderIds.includes(t.id)) next.push(t) });
    if (JSON.stringify(items) === JSON.stringify(next)) return false;
    saveTodos(next);
    return true;
  }

  /* Create a floating ghost element that follows the cursor/finger */
  function createGhost(sourceEl) {
    const rect = sourceEl.getBoundingClientRect();
    const ghost = sourceEl.cloneNode(true);
    ghost.id = 'todo-drag-ghost';
    ghost.classList.add('todo-drag-ghost');
    ghost.style.cssText = `
      position:fixed;left:${rect.left}px;top:${rect.top}px;
      width:${rect.width}px;pointer-events:none;z-index:9999;
      background:var(--paper);border:1px solid var(--accent);
      border-radius:6px;box-shadow:0 8px 28px rgba(0,0,0,.18);
      opacity:.95;transition:none;list-style:none;box-sizing:border-box;
    `;
    document.body.appendChild(ghost);
    return ghost;
  }

  function startTodoDrag(e, sourceEl, opts) {
    // Don't start drag from text/input
    if (!isTouchTodoPointer(e) && e.target.closest?.('.todo-text,.todo-divider-label')) return false;
    if (isTodoDragBlockedTarget(e.target)) return false;

    e.preventDefault();

    const allRows = getItemEls();
    const sourceIdx = allRows.indexOf(sourceEl);
    if (allRows.length < 2 || sourceIdx === -1) return false;
    const rect = sourceEl.getBoundingClientRect();
    const sourceH = rect.height;
    const listRect = todoList.getBoundingClientRect();
    const origMidY = allRows.map(el => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    const offY = e.clientY - rect.top;
    let currentInsertIdx = sourceIdx;

    sourceEl.classList.add('dragging-source');
    const ghost = createGhost(sourceEl);
    ghost.style.left = listRect.left + 'px';
    ghost.style.width = rect.width + 'px';
    sourceEl.style.opacity = '0';
    allRows.forEach(el => {
      if (el !== sourceEl) el.style.transition = 'transform 160ms cubic-bezier(.25,.8,.25,1)';
    });
    dragState = { sourceEl, ghost };
    if (opts?.haptic) triggerTodoHaptic(opts.haptic);
    try { sourceEl.setPointerCapture(e.pointerId) } catch (_) { }

    function computeInsertIdx(cy) {
      for (let i = 0; i < allRows.length; i++) {
        if (i === sourceIdx) continue;
        if (cy <= origMidY[i]) return i;
      }
      return allRows.length;
    }

    function applyShifts(insertIdx) {
      allRows.forEach((el, i) => {
        if (el === sourceEl) { el.style.transform = ''; return }
        let shift = 0;
        if (insertIdx <= sourceIdx) {
          if (i >= insertIdx && i < sourceIdx) shift = sourceH;
        } else {
          if (i > sourceIdx && i < insertIdx) shift = -sourceH;
        }
        el.style.transform = shift ? `translateY(${shift}px)` : '';
      });
    }

    applyShifts(currentInsertIdx);

    function moveTo(cy) {
      const rawTop = cy - offY;
      const clampedTop = clamp(rawTop, listRect.top, listRect.bottom - sourceH);
      ghost.style.left = listRect.left + 'px';
      ghost.style.top = clampedTop + 'px';
      const atTopEdge = clampedTop <= listRect.top + 1;
      const atBottomEdge = clampedTop >= listRect.bottom - sourceH - 1;
      const newIdx = atTopEdge ? 0 : atBottomEdge ? allRows.length : computeInsertIdx(clampedTop + sourceH / 2);
      if (newIdx !== currentInsertIdx) {
        currentInsertIdx = newIdx;
        applyShifts(currentInsertIdx);
      }
    }

    function onMove(ev) {
      ev.preventDefault();
      moveTo(ev.clientY);
    }

    function onUp(ev) {
      ev.preventDefault();
      try { sourceEl.releasePointerCapture(e.pointerId) } catch (_) { }
      allRows.forEach(el => {
        el.style.transition = '';
        el.style.transform = '';
      });
      sourceEl.style.opacity = '';
      sourceEl.classList.remove('dragging-source');
      ghost.remove();
      const noChange = currentInsertIdx === sourceIdx || currentInsertIdx === sourceIdx + 1;
      let changed = false;
      if (!noChange) {
        const beforeEl = currentInsertIdx >= allRows.length ? null : allRows[currentInsertIdx];
        if (beforeEl) todoList.insertBefore(sourceEl, beforeEl);
        else todoList.appendChild(sourceEl);
        changed = commitRenderedOrder();
      }
      dragState = null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      if (changed) renderTodos();
      panelTodos.focus({ preventScroll: true });
      opts?.onDone?.();
    }

    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return true;
  }

  /* ── RENDER ───────────────────────────────────────────────────── */
  function renderTodos() {
    let items = loadTodos();
    items.forEach(t => {
      if (t.type === 'divider') { if (!t.id) t.id = Math.random().toString(36).slice(2, 9); return }
      if (!t.id) t.id = Math.random().toString(36).slice(2, 9);
    });
    const sorted = sortedTodos(items);
    const activeCount = sorted.filter(t => t.type !== 'divider' && !t.done).length;
    const totalTasks = items.filter(t => t.type !== 'divider').length;
    todoCount.textContent = totalTasks ? activeCount + '/' + totalTasks : '0';
    todoList.innerHTML = '';
    if (!items.length) {
      const e = document.createElement('li'); e.className = 'todo-empty';
      e.textContent = 'no tasks yet — add one above'; todoList.appendChild(e); return
    }
    let shownDoneSep = false;

    sorted.forEach((it) => {
      const realIdx = items.findIndex(t => t.id === it.id);

      // ── DIVIDER ──
      if (it.type === 'divider') {
        if (it.done && !shownDoneSep) {
          shownDoneSep = true;
          const sep = document.createElement('div'); sep.className = 'todo-separator';
          sep.textContent = 'completed'; todoList.appendChild(sep)
        }

        const div = document.createElement('div');
        div.className = 'todo-divider' + (it.done ? ' done' : '');
        div.dataset.todoId = it.id;
        const inner = document.createElement('div');
        inner.className = 'todo-divider-inner';

        const grip = document.createElement('span'); grip.className = 'todo-drag-handle';
        grip.textContent = '⠿'; grip.title = 'drag to reorder';
        grip.addEventListener('pointerdown', e => startTodoDrag(e, div));

        const label = document.createElement('span'); label.className = 'todo-divider-label';
        label.contentEditable = 'true'; label.spellcheck = false; label.textContent = it.label || '';
        label.addEventListener('blur', () => {
          const cur = loadTodos();
          if (cur[realIdx] && label.textContent.trim() !== cur[realIdx].label) {
            cur[realIdx].label = label.textContent.trim(); saveTodos(cur);
          }
        });
        label.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); label.blur() } });

        const x = document.createElement('button'); x.type = 'button'; x.className = 'todo-divider-x';
        x.textContent = '×'; x.title = 'delete section';
        x.addEventListener('click', () => deleteTodoById(it.id, div));

        inner.append(grip, label, x);
        div.appendChild(inner);
        bindTodoHoldDrag(div);
        todoList.appendChild(div);
        if (pendingTodoEnterIds.delete(it.id)) animateElementIn(div);
        return;
      }

      // ── TASK ──
      if (it.done && !shownDoneSep) {
        shownDoneSep = true;
        const sep = document.createElement('div'); sep.className = 'todo-separator';
        sep.textContent = 'completed'; todoList.appendChild(sep)
      }

      const li = document.createElement('li');
      li.className = 'todo-item' + (it.done ? ' done' : '');
      li.dataset.idx = realIdx;
      li.dataset.todoId = it.id;
      const inner = document.createElement('div');
      inner.className = 'todo-item-inner';

      const grip = document.createElement('span'); grip.className = 'todo-drag-handle';
      grip.textContent = '⠿'; grip.title = 'drag to reorder';
      grip.addEventListener('pointerdown', e => startTodoDrag(e, li));

      const check = document.createElement('button'); check.type = 'button'; check.className = 'todo-check';
      check.setAttribute('aria-label', it.done ? 'mark incomplete' : 'mark complete');
      check.addEventListener('pointerdown', triggerTodoCompleteHaptic);
      check.addEventListener('click', e => {
        triggerTodoCompleteHaptic(e);
        toggleTodoDone(it.id);
      });

      const textWrap = document.createElement('span'); textWrap.className = 'todo-text-wrap';
      const text = document.createElement('span'); text.className = 'todo-text';
      text.contentEditable = 'true'; text.spellcheck = true; text.textContent = it.text;
      text.addEventListener('focus', () => { focusedTodoIdx = realIdx });
      text.addEventListener('blur', () => {
        const cur = loadTodos();
        if (cur[realIdx] && text.textContent.trim() !== cur[realIdx].text) {
          cur[realIdx].text = text.textContent.trim(); saveTodos(cur)
        }
        requestAnimationFrame(() => renderTodoStrike(li, false));
        focusedTodoIdx = null
      });
      text.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); text.blur() }
      });
      const strikeLayer = document.createElement('span'); strikeLayer.className = 'todo-strike-layer';
      textWrap.append(text, strikeLayer);

      const x = document.createElement('button'); x.type = 'button'; x.className = 'todo-x';
      x.textContent = '×'; x.title = 'delete';
      x.addEventListener('click', () => deleteTodoById(it.id, li));

      inner.append(grip, check, textWrap, x);
      li.appendChild(inner);
      bindTodoHoldDrag(li);
      todoList.appendChild(li);
      if (pendingTodoEnterIds.delete(it.id)) animateElementIn(li);
    });
    requestAnimationFrame(() => layoutTodoStrikes(false));
  }

  /* Add task */
  todoForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = todoInput.value.trim(); if (!text) return;
    const items = loadTodos();
    const newTask = { id: Math.random().toString(36).slice(2, 9), text, done: false, ts: Date.now() };
    let insertIdx = items.findIndex((t, idx) => idx > 0 && t.type === 'divider');
    if (insertIdx === -1) insertIdx = items.findIndex(t => t.done);
    if (insertIdx === -1) items.push(newTask);
    else items.splice(insertIdx, 0, newTask);
    pendingTodoEnterIds.add(newTask.id);
    saveTodos(items); todoInput.value = ''; renderTodos()
  });

  /* ── DIVIDERS ─────────────────────────────────────────────── */
  const dividerInput = $('dividerInput');
  const dividerAddBtn = $('dividerAddBtn');
  const dividerTomorrowBtn = $('dividerTomorrowBtn');

  function addDivider(label) {
    if (!label) return;
    const items = loadTodos();
    const divider = { id: Math.random().toString(36).slice(2, 9), type: 'divider', label };
    items.unshift(divider);
    pendingTodoEnterIds.add(divider.id);
    saveTodos(items); renderTodos();
  }

  function getNextDayLabel() {
    const now = new Date();
    const hour = now.getHours();
    const target = new Date(now);
    if (hour >= 7 || hour < 1) { target.setDate(target.getDate() + 1); }
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return days[target.getDay()] + ' ' + months[target.getMonth()] + ' ' + target.getDate();
  }

  dividerAddBtn.addEventListener('click', () => {
    const label = dividerInput.value.trim();
    if (label) { addDivider(label); dividerInput.value = '' }
  });
  dividerInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const label = dividerInput.value.trim();
      if (label) { addDivider(label); dividerInput.value = '' }
    }
  });
  dividerTomorrowBtn.addEventListener('click', () => { addDivider(getNextDayLabel()); });

  /* Undo button (mobile) */
  $('todoUndoBtn').addEventListener('click', todoUndo);

  let todoStrikeResizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(todoStrikeResizeFrame);
    todoStrikeResizeFrame = requestAnimationFrame(() => layoutTodoStrikes(false));
  });

  /* Ctrl+Z / Ctrl+Y in todo panel */
  panelTodos.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      if (e.shiftKey) { e.preventDefault(); todoRedo() }
      else { e.preventDefault(); todoUndo() }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); todoRedo() }
  });

  /* Cloud sync for todos */
  async function loadTodosCloud(isPolling) {
    const pending = retryPendingTodoSave();
    try {
      const r = await fetch('/api/todos'); if (!r.ok) return;
      const data = await r.json();
      const localTs = Number(localStorage.getItem(TODO_TS_KEY)) || 0;
      const cloudTs = Number(data.ts) || 0;
      if (pending && pending.ts >= cloudTs) return;
      const cloud = sanitizeTodos(data.items);
      if (cloud.changed) {
        const ts = Date.now();
        localStorage.setItem(TODO_KEY, JSON.stringify(cloud.items));
        localStorage.setItem(TODO_TS_KEY, String(ts));
        renderTodos();
        queueTodoCloudSave(cloud.items, ts);
        return;
      }
      if (data.items != null && cloudTs > localTs) {
        localStorage.setItem(TODO_KEY, JSON.stringify(cloud.items));
        localStorage.setItem(TODO_TS_KEY, String(cloudTs));
        renderTodos();
      } else if (!isPolling && localTs > cloudTs) {
        writeTodosCloud(loadTodos(), localTs);
      }
    } catch (_) { }
  }

  repairLocalTodos();
  renderTodos();
  loadTodosCloud(false);
  setInterval(() => loadTodosCloud(true), 30000);
})();
