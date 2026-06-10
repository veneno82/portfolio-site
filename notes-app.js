(function(){
  /* ── CONSTANTS ─────────────────────────────────────────────── */
  const DOC_KEY='mb_notes_doc', META_KEY='mb_notes_doc_meta', PIN_KEY='mb_notes_pinned',
        TODO_KEY='mb_notes_todos', TODO_TS_KEY='mb_notes_todos_ts', THEME_KEY='mb_theme',
        SWATCH_KEY='mb_color_swatches', HL_SWATCH_KEY='mb_hl_swatches', PIN_COLOR_KEY='mb_pin_color',
        ARCHIVE_KEY='mb_archive_doc', ARCHIVE_TS_KEY='mb_archive_ts';

  // 5 default swatches: mint, blue, purple, pink, orange
  const DEFAULT_SWATCHES=['#3ecf8e','#3478f6','#8944e0','#e54f8a','#e87d2f'];
  const DEFAULT_HL_SWATCHES=['#a8f0c8','#a0cfff','#cba8f0','#f0a8c8','#ffe0a0'];
  const PIN_COLORS=['#ffcc00','#ff9500','#ff6b6b','#a8f0c8','#a0cfff','#cba8f0','#f5f5dc','#d4d4d4'];

  /* ── DOM ────────────────────────────────────────────────────── */
  const $=id=>document.getElementById(id);
  const root=document.documentElement, doc=$('doc'), savedEl=$('savedIndicator'),
        toggle=$('themeToggle'), pinnedBody=$('pinnedBody'), pinnedSection=$('pinnedSection'),
        pinnedHeader=$('pinnedHeader'), todoList=$('todoList'), todoForm=$('todoForm'),
        todoInput=$('todoInput'), todoCount=$('todoCount'), panelNotes=$('panelNotes'),
        panelTodos=$('panelTodos'), docMeta=$('docMeta');

  /* ── THEME ──────────────────────────────────────────────────── */
  toggle.addEventListener('click',()=>{
    const next=root.getAttribute('data-theme')==='dark'?'light':'dark';
    root.setAttribute('data-theme',next);
    try{localStorage.setItem(THEME_KEY,next)}catch(_){}
  });

  /* ── MOBILE TABS ────────────────────────────────────────────── */
  const tabBtns=document.querySelectorAll('.tab-btn');
  let isMobile=()=>window.innerWidth<=840;
  function applyTab(){
    if(!isMobile()){panelNotes.classList.remove('hidden-mobile');panelTodos.classList.remove('hidden-mobile');return}
    const active=document.querySelector('.tab-btn.active').dataset.tab;
    panelNotes.classList.toggle('hidden-mobile',active!=='notes');
    panelTodos.classList.toggle('hidden-mobile',active!=='todos');
  }
  tabBtns.forEach(b=>b.addEventListener('click',()=>{
    tabBtns.forEach(t=>t.classList.remove('active'));b.classList.add('active');applyTab();
  }));
  window.addEventListener('resize',applyTab);applyTab();

  /* ── SAVE INDICATOR ─────────────────────────────────────────── */
  let flashT=null;
  function flash(){savedEl.textContent='saved';savedEl.classList.add('flash');
    clearTimeout(flashT);flashT=setTimeout(()=>savedEl.classList.remove('flash'),600)}

  /* ── NOTES: LOAD / SAVE / CLOUD ─────────────────────────────── */
  let initial=localStorage.getItem(DOC_KEY);
  if(initial)doc.innerHTML=initial;
  let initialPin=localStorage.getItem(PIN_KEY);
  if(initialPin)pinnedBody.innerHTML=initialPin;

  /* ── META LINE (last edited) ────────────────────────────────── */
  function fmtDate(ts){
    const d=new Date(ts),today=new Date();
    const sameDay=d.toDateString()===today.toDateString();
    const time=d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}).toLowerCase();
    if(sameDay)return'today, '+time;
    const opts={month:'short',day:'numeric'};
    if(d.getFullYear()!==today.getFullYear())opts.year='numeric';
    return d.toLocaleDateString([],opts)+', '+time;
  }
  function refreshMeta(){
    const ts=Number(localStorage.getItem(META_KEY))||Date.now();
    if(docMeta)docMeta.textContent='last edited '+fmtDate(ts);
  }
  refreshMeta();

  let saveTimer=null;
  function persistNotes(){
    try{
      const ts=Date.now();
      localStorage.setItem(DOC_KEY,doc.innerHTML);
      localStorage.setItem(PIN_KEY,pinnedBody.innerHTML);
      localStorage.setItem(META_KEY,String(ts));
      flash();
      refreshMeta();
      fetch('/api/notes',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({content:doc.innerHTML,pinned:pinnedBody.innerHTML,ts})}).catch(()=>{});
    }catch(_){savedEl.textContent='save failed'}
  }
  function scheduleNoteSave(){savedEl.textContent='saving…';clearTimeout(saveTimer);saveTimer=setTimeout(persistNotes,400)}
  doc.addEventListener('input',scheduleNoteSave);
  pinnedBody.addEventListener('input',scheduleNoteSave);

  async function loadNotesCloud(){
    try{
      const r=await fetch('/api/notes');if(!r.ok)return;
      const data=await r.json();
      const localTs=Number(localStorage.getItem(META_KEY))||0;
      if(data.ts>localTs){
        if(data.content){doc.innerHTML=data.content;localStorage.setItem(DOC_KEY,data.content)}
        if(data.pinned!==undefined){pinnedBody.innerHTML=data.pinned;localStorage.setItem(PIN_KEY,data.pinned)}
        localStorage.setItem(META_KEY,String(data.ts));
        refreshMeta();
      }
    }catch(_){}
  }
  loadNotesCloud();
  window.addEventListener('pagehide',()=>{if(saveTimer){clearTimeout(saveTimer);persistNotes()}});

  /* ── PASTE PLAIN TEXT ───────────────────────────────────────── */
  doc.addEventListener('paste',e=>{e.preventDefault();
    document.execCommand('insertText',false,(e.clipboardData||window.clipboardData).getData('text'))});

  /* ── AUTO BULLET LIST (type "* " at line start → bullet) ────── */
  doc.addEventListener('input',e=>{
    // Only process insertText type inputs
    if(e.inputType!=='insertText' || e.data!==' ') return;
    const sel=window.getSelection();
    if(!sel.rangeCount) return;
    const node=sel.anchorNode;
    if(!node||node.nodeType!==3) return;
    const text=node.textContent;
    const offset=sel.anchorOffset;
    // Check if the text right before cursor is "* " at beginning of text node
    // (offset should be 2 after typing the space, text starts with "* ")
    if(offset===2 && text.startsWith('* ')){
      // Verify this text node is at the start of a block
      const block=node.parentElement;
      if(!block) return;
      // Only trigger if the text node is the first meaningful content
      const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT,null);
      const firstText=walker.nextNode();
      if(firstText!==node) return;
      // Remove the "* " prefix
      e.preventDefault && false; // can't preventDefault on input, so we manually fix
      const remaining=text.slice(2);
      node.textContent=remaining;
      // Place cursor at start of the remaining text
      const range=document.createRange();
      range.setStart(node,0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      // Convert block to unordered list
      document.execCommand('insertUnorderedList',false,null);
      scheduleNoteSave();
    }
  });

  /* ── PINNED TOGGLE ──────────────────────────────────────────── */
  let pinCollapsed=localStorage.getItem('mb_pin_collapsed')==='1';
  if(pinCollapsed)pinnedSection.classList.add('collapsed');
  pinnedHeader.addEventListener('click',e=>{
    // don't toggle if clicking the color button area
    if(e.target.closest('.pinned-color-btn')||e.target.closest('.pin-color-popup'))return;
    pinCollapsed=!pinCollapsed;pinnedSection.classList.toggle('collapsed',pinCollapsed);
    localStorage.setItem('mb_pin_collapsed',pinCollapsed?'1':'0');
  });

  /* ── PINNED COLOR PICKER ────────────────────────────────────── */
  const pinColorBtn=$('pinColorBtn'), pinColorPopup=$('pinColorPopup');
  let currentPinColor=localStorage.getItem(PIN_COLOR_KEY)||'#ffcc00';
  function applyPinColor(hex){
    currentPinColor=hex;
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    pinnedSection.style.background=`rgba(${r},${g},${b},.08)`;
    pinnedSection.style.borderColor=`rgba(${r},${g},${b},.25)`;
    pinColorBtn.style.background=hex;
    localStorage.setItem(PIN_COLOR_KEY,hex);
  }
  applyPinColor(currentPinColor);

  // build pin color popup
  PIN_COLORS.forEach(c=>{
    const s=document.createElement('button');s.type='button';s.className='pin-color-swatch';
    s.style.background=c;
    s.addEventListener('click',e=>{e.stopPropagation();applyPinColor(c);pinColorPopup.classList.remove('open');
      pinColorPopup.querySelectorAll('.pin-color-swatch').forEach(el=>el.classList.toggle('selected',el.style.background===s.style.background))});
    pinColorPopup.appendChild(s);
  });
  const pinHex=document.createElement('input');pinHex.type='text';pinHex.className='pin-hex-input';
  pinHex.placeholder='#hex';pinHex.maxLength=7;
  pinHex.addEventListener('click',e=>e.stopPropagation());
  pinHex.addEventListener('keydown',e=>{if(e.key==='Enter'){e.stopPropagation();
    const v=pinHex.value.trim();if(/^#[0-9a-fA-F]{6}$/.test(v)){applyPinColor(v);pinColorPopup.classList.remove('open')}}});
  pinColorPopup.appendChild(pinHex);

  pinColorBtn.addEventListener('click',e=>{e.stopPropagation();pinColorPopup.classList.toggle('open')});

  /* ── TOOLBAR: FORMAT BUTTONS ────────────────────────────────── */
  document.querySelectorAll('.tb-btn[data-cmd]').forEach(btn=>{
    btn.addEventListener('click',e=>{e.preventDefault();doc.focus();
      document.execCommand(btn.dataset.cmd,false,null);scheduleNoteSave()});
  });

  /* ── TOOLBAR: PARAGRAPH STYLE ───────────────────────────────── */
  $('tbParagraph').addEventListener('change',function(){
    doc.focus();document.execCommand('formatBlock',false,this.value);scheduleNoteSave()});

  /* ── TOOLBAR: FONT FAMILY ───────────────────────────────────── */
  $('tbFont').addEventListener('change',function(){
    doc.focus();
    if(this.value){
      document.execCommand('fontName',false,this.value);
    }else{
      // "Default" — remove font override by applying the body's default font
      document.execCommand('fontName',false,"-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif");
    }
    scheduleNoteSave();
  });

  /* ── TOOLBAR: FONT SIZE ─────────────────────────────────────── */
  $('tbSize').addEventListener('change',function(){
    doc.focus();document.execCommand('fontSize',false,this.value);scheduleNoteSave()});

  /* ── COLOR PICKER (5 customizable swatches + hex) ──────────── */
  function loadSwatches(key,defaults){
    try{const s=JSON.parse(localStorage.getItem(key));if(Array.isArray(s)&&s.length===5)return s}catch(_){}
    return[...defaults];
  }
  function saveSwatches(key,arr){try{localStorage.setItem(key,JSON.stringify(arr))}catch(_){}}

  function buildColorPicker(opts){
    const {popupEl,swatchesEl,hexInput,applyBtn,dotEl,key,defaults,command}=opts;
    let swatches=loadSwatches(key,defaults);
    let selectedIdx=0;

    function renderSwatches(){
      swatchesEl.innerHTML='';
      swatches.forEach((c,i)=>{
        const s=document.createElement('button');s.type='button';s.className='color-swatch'+(i===selectedIdx?' selected':'');
        s.style.background=c;
        s.addEventListener('click',e=>{e.stopPropagation();selectedIdx=i;
          doc.focus();document.execCommand(command,false,c);
          dotEl.style.background=c;scheduleNoteSave();
          swatchesEl.querySelectorAll('.color-swatch').forEach((el,j)=>el.classList.toggle('selected',j===i));
        });
        // right-click to start editing this swatch
        s.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();
          selectedIdx=i;hexInput.value=c;hexInput.focus();
          swatchesEl.querySelectorAll('.color-swatch').forEach((el,j)=>el.classList.toggle('selected',j===i));
        });
        swatchesEl.appendChild(s);
      });
    }
    renderSwatches();

    applyBtn.addEventListener('click',e=>{e.stopPropagation();
      const v=hexInput.value.trim();if(!/^#[0-9a-fA-F]{6}$/.test(v))return;
      swatches[selectedIdx]=v;saveSwatches(key,swatches);renderSwatches();
      doc.focus();document.execCommand(command,false,v);dotEl.style.background=v;
      scheduleNoteSave();popupEl.classList.remove('open');
    });
    hexInput.addEventListener('click',e=>e.stopPropagation());
    hexInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyBtn.click()}});
  }

  // Text color picker
  const colorPopup=$('colorPopup'),colorBtn=$('tbColorBtn'),colorDot=$('tbColorDot');
  buildColorPicker({popupEl:colorPopup,swatchesEl:$('colorSwatches'),hexInput:$('colorHexInput'),
    applyBtn:$('colorHexApply'),dotEl:colorDot,key:SWATCH_KEY,defaults:DEFAULT_SWATCHES,command:'foreColor'});
  colorBtn.addEventListener('click',e=>{e.stopPropagation();colorPopup.classList.toggle('open');
    $('highlightPopup').classList.remove('open')});

  // Highlight picker
  const hlPopup=$('highlightPopup'),hlBtn=$('tbHighlightBtn'),hlDot=$('tbHighlightDot');
  buildColorPicker({popupEl:hlPopup,swatchesEl:$('highlightSwatches'),hexInput:$('highlightHexInput'),
    applyBtn:$('highlightHexApply'),dotEl:hlDot,key:HL_SWATCH_KEY,defaults:DEFAULT_HL_SWATCHES,command:'hiliteColor'});
  hlBtn.addEventListener('click',e=>{e.stopPropagation();hlPopup.classList.toggle('open');
    colorPopup.classList.remove('open')});

  /* close all popups on outside click */
  document.addEventListener('click',()=>{
    colorPopup.classList.remove('open');hlPopup.classList.remove('open');pinColorPopup.classList.remove('open')});

  /* ── KEYBOARD SHORTCUTS ─────────────────────────────────────── */
  doc.addEventListener('keydown',e=>{
    const mod=e.ctrlKey||e.metaKey;
    if(mod&&e.shiftKey&&e.key.toLowerCase()==='x'){e.preventDefault();document.execCommand('strikeThrough');scheduleNoteSave()}
    if(mod&&e.shiftKey&&e.key.toLowerCase()==='h'){e.preventDefault();
      const hl=loadSwatches(HL_SWATCH_KEY,DEFAULT_HL_SWATCHES);
      document.execCommand('hiliteColor',false,hl[0]);scheduleNoteSave()}
    if(mod&&e.shiftKey&&e.key.toLowerCase()==='c'){e.preventDefault();colorPopup.classList.toggle('open');hlPopup.classList.remove('open')}

    /* TAB INDENT / OUTDENT in doc (Google Docs style) */
    if(e.key==='Tab'){
      e.preventDefault();
      if(e.shiftKey){
        document.execCommand('outdent',false,null);
      }else{
        document.execCommand('indent',false,null);
      }
      scheduleNoteSave();
    }

    /* ARCHIVE selected text: Ctrl+Shift+- */
    if(mod&&e.shiftKey&&(e.key==='-'||e.key==='_')){
      e.preventDefault();
      archiveSelection();
    }
  });

  /* ── COLLAPSIBLE BLOCKS (inline arrow, no block styling) ────── */
  // Undo stack for collapse operations (stores doc innerHTML snapshots)
  const collapseUndoStack=[];
  const MAX_COLLAPSE_UNDO=20;

  function saveCollapseSnapshot(){
    collapseUndoStack.push(doc.innerHTML);
    if(collapseUndoStack.length>MAX_COLLAPSE_UNDO) collapseUndoStack.shift();
  }

  function undoCollapse(){
    if(!collapseUndoStack.length) return;
    doc.innerHTML=collapseUndoStack.pop();
    scheduleNoteSave();
  }

  function wrapSelectionInCollapseBlock(){
    const sel=window.getSelection();
    if(!sel.rangeCount||sel.isCollapsed) return;
    saveCollapseSnapshot();
    const range=sel.getRangeAt(0);
    const fragment=range.extractContents();

    // Extract title from first bold text in the selection
    const tempDiv=document.createElement('div');
    tempDiv.appendChild(fragment.cloneNode(true));
    let title='';
    const boldEl=tempDiv.querySelector('b,strong');
    if(boldEl) title=boldEl.textContent.trim();
    if(!title){
      // Fallback: first 30 chars of plain text
      const plain=tempDiv.textContent.trim();
      title=plain.length>30?plain.slice(0,30)+'\u2026':plain;
    }
    if(title.length>40) title=title.slice(0,40)+'\u2026';

    const wrap=document.createElement('span');
    wrap.className='collapse-wrap';

    const arrow=document.createElement('span');
    arrow.className='collapse-arrow';
    arrow.setAttribute('contenteditable','false');
    arrow.textContent='\u25be';

    // Label shown when collapsed
    const label=document.createElement('span');
    label.className='collapse-label';
    label.setAttribute('contenteditable','false');
    label.textContent=title||'collapsed';

    const inner=document.createElement('span');
    inner.className='collapse-inner';
    inner.appendChild(fragment);

    wrap.append(arrow,label,inner);
    range.insertNode(wrap);
    sel.removeAllRanges();
    scheduleNoteSave();
  }

  /* Single delegated mousedown on doc handles ALL collapse arrows.
     No MutationObserver, no per-element listeners, no rehydration needed. */
  doc.addEventListener('mousedown',e=>{
    const arrow=e.target.closest('.collapse-arrow');
    if(!arrow) return;
    e.preventDefault();
    e.stopPropagation();
    const wrap=arrow.closest('.collapse-wrap');
    if(!wrap) return;
    const collapsed=!wrap.classList.contains('collapsed');
    wrap.classList.toggle('collapsed',collapsed);
    arrow.textContent=collapsed?'\u25b8':'\u25be';
    scheduleNoteSave();
  });

  // On load, set correct arrow text for any existing collapse blocks
  setTimeout(()=>{
    doc.querySelectorAll('.collapse-wrap').forEach(wrap=>{
      const arrow=wrap.querySelector('.collapse-arrow');
      if(arrow){
        arrow.setAttribute('contenteditable','false');
        arrow.textContent=wrap.classList.contains('collapsed')?'\u25b8':'\u25be';
      }
    });
  },60);

  // Wire up toolbar button
  const collapseBtn=$('tbCollapseBtn');
  if(collapseBtn){
    collapseBtn.addEventListener('click',e=>{
      e.preventDefault();
      doc.focus();
      wrapSelectionInCollapseBlock();
    });
  }

  // Wire up archive toolbar button
  const archiveBtn=$('tbArchiveBtn');
  if(archiveBtn){
    archiveBtn.addEventListener('click',e=>{
      e.preventDefault();
      doc.focus();
      archiveSelection();
    });
  }

  // Undo collapse with Ctrl+Z when stack has items
  doc.addEventListener('keydown',e=>{
    const mod=e.ctrlKey||e.metaKey;
    if(mod&&!e.shiftKey&&e.key==='z'&&collapseUndoStack.length){
      e.preventDefault();
      undoCollapse();
    }
  });

  /* ── ARCHIVE FEATURE ─────────────────────────────────────── */
  function archiveSelection(){
    const sel=window.getSelection();
    if(!sel.rangeCount||sel.isCollapsed) return;
    const range=sel.getRangeAt(0);

    // Get the HTML content of selection
    const cloned=range.cloneContents();
    const tempDiv=document.createElement('div');
    tempDiv.appendChild(cloned);
    const html=tempDiv.innerHTML;
    if(!html.trim()) return;

    // Add to archive with timestamp separator
    const ts=Date.now();
    const dateStr=new Date(ts).toLocaleString([],{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
    const separator='<div style="font-size:11px;color:var(--fg2);opacity:.5;margin:12px 0 4px;border-top:1px solid var(--border);padding-top:6px">archived '+dateStr+'</div>';

    // Load existing archive
    let existing=localStorage.getItem(ARCHIVE_KEY)||'';
    existing=separator+html+existing;
    localStorage.setItem(ARCHIVE_KEY,existing);
    localStorage.setItem(ARCHIVE_TS_KEY,String(ts));

    // Sync to cloud
    fetch('/api/archive',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({content:existing,ts})}).catch(()=>{});

    // Delete from notes
    range.deleteContents();
    sel.removeAllRanges();
    scheduleNoteSave();

    // Flash indicator
    savedEl.textContent='archived';
    savedEl.classList.add('flash');
    clearTimeout(flashT);
    flashT=setTimeout(()=>savedEl.classList.remove('flash'),800);
  }

  // Expose for mobile button
  window._archiveSelection=archiveSelection;

  /* ── FOCUS DOC ON LOAD ──────────────────────────────────────── */
  setTimeout(()=>{doc.focus();try{const r=document.createRange();r.selectNodeContents(doc);
    r.collapse(false);const s=window.getSelection();s.removeAllRanges();s.addRange(r)}catch(_){}},50);

  /* ══════════════════════════════════════════════════════════════
     TODO LIST
     ══════════════════════════════════════════════════════════════ */
  const undoStack=[], redoStack=[], MAX_UNDO=40;
  let focusedTodoIdx=null;

  function loadTodos(){try{return JSON.parse(localStorage.getItem(TODO_KEY)||'[]')}catch(_){return[]}}
  function saveTodos(items,push){
    if(push!==false){const prev=localStorage.getItem(TODO_KEY)||'[]';undoStack.push(prev);
      if(undoStack.length>MAX_UNDO)undoStack.shift();redoStack.length=0}
    const ts=Date.now();
    localStorage.setItem(TODO_KEY,JSON.stringify(items));
    localStorage.setItem(TODO_TS_KEY,String(ts));
    flash();
    fetch('/api/todos',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({items,ts})}).catch(()=>{});
  }

  function todoUndo(){if(!undoStack.length)return;
    redoStack.push(localStorage.getItem(TODO_KEY)||'[]');
    const prev=JSON.parse(undoStack.pop());
    localStorage.setItem(TODO_KEY,JSON.stringify(prev));flash();renderTodos()}
  function todoRedo(){if(!redoStack.length)return;
    undoStack.push(localStorage.getItem(TODO_KEY)||'[]');
    const next=JSON.parse(redoStack.pop());
    localStorage.setItem(TODO_KEY,JSON.stringify(next));flash();renderTodos()}

  /* Sort: active first in order, then completed in order */
  function sortedTodos(items){
    const active=items.filter(t=>!t.done), done=items.filter(t=>t.done);
    return[...active,...done];
  }

  function renderTodos(){
    let items=loadTodos();
    items.forEach(t=>{if(t.indent===undefined)t.indent=0;if(!t.id)t.id=Math.random().toString(36).slice(2,9)});
    const sorted=sortedTodos(items);
    const activeCount=sorted.filter(t=>!t.done).length;
    todoCount.textContent=items.length?activeCount+'/'+items.length:'0';
    todoList.innerHTML='';
    if(!items.length){
      const e=document.createElement('li');e.className='todo-empty';
      e.textContent='no tasks yet — add one above';todoList.appendChild(e);return}
    let shownDoneSep=false;
    sorted.forEach((it)=>{
      const realIdx=items.findIndex(t=>t.id===it.id);
      if(it.done&&!shownDoneSep){shownDoneSep=true;
        const sep=document.createElement('div');sep.className='todo-separator';
        sep.textContent='completed';todoList.appendChild(sep)}
      const li=document.createElement('li');li.className='todo-item'+(it.done?' done':'');
      li.style.paddingLeft=(12+(it.indent||0)*24)+'px';
      li.dataset.idx=realIdx;

      const check=document.createElement('button');check.type='button';check.className='todo-check';
      check.setAttribute('aria-label',it.done?'mark incomplete':'mark complete');
      check.addEventListener('click',()=>{const cur=loadTodos();cur[realIdx].done=!cur[realIdx].done;
        saveTodos(sortedTodos(cur));renderTodos()});

      const text=document.createElement('span');text.className='todo-text';
      text.contentEditable='true';text.spellcheck=true;text.textContent=it.text;
      text.addEventListener('focus',()=>{focusedTodoIdx=realIdx});
      text.addEventListener('blur',()=>{const cur=loadTodos();
        if(cur[realIdx]&&text.textContent.trim()!==cur[realIdx].text){
          cur[realIdx].text=text.textContent.trim();saveTodos(cur)}focusedTodoIdx=null});
      text.addEventListener('keydown',e=>{
        if(e.key==='Enter'){e.preventDefault();text.blur()}
        if(e.key==='Tab'){e.preventDefault();
          const cur=loadTodos();const t=cur[realIdx];
          if(e.shiftKey){if(t.indent>0){t.indent--;saveTodos(cur);renderTodos()}}
          else{if(t.indent<3){t.indent++;saveTodos(cur);renderTodos()}}}
      });
      // double-space indent for mobile
      let lastSpace=0;
      text.addEventListener('beforeinput',e=>{
        if(e.data===' '){const now=Date.now();
          if(now-lastSpace<400){e.preventDefault();
            const cur=loadTodos();if(cur[realIdx].indent<3){cur[realIdx].indent++;saveTodos(cur);renderTodos()}}
          lastSpace=now}else{lastSpace=0}
      });

      const x=document.createElement('button');x.type='button';x.className='todo-x';
      x.textContent='×';x.title='delete';
      x.addEventListener('click',()=>{const cur=loadTodos();cur.splice(realIdx,1);
        saveTodos(cur);renderTodos()});

      li.append(check,text,x);todoList.appendChild(li);
    });
  }

  /* Add task — top of list */
  todoForm.addEventListener('submit',e=>{e.preventDefault();
    const text=todoInput.value.trim();if(!text)return;
    const items=loadTodos();
    items.unshift({id:Math.random().toString(36).slice(2,9),text,done:false,indent:0,ts:Date.now()});
    saveTodos(items);todoInput.value='';renderTodos()});

  /* Indent/Outdent/Undo buttons (mobile only, but always wired) */
  $('todoIndentBtn').addEventListener('click',()=>{
    if(focusedTodoIdx===null)return;const cur=loadTodos();
    if(cur[focusedTodoIdx]&&cur[focusedTodoIdx].indent<3){cur[focusedTodoIdx].indent++;saveTodos(cur);renderTodos()}});
  $('todoOutdentBtn').addEventListener('click',()=>{
    if(focusedTodoIdx===null)return;const cur=loadTodos();
    if(cur[focusedTodoIdx]&&cur[focusedTodoIdx].indent>0){cur[focusedTodoIdx].indent--;saveTodos(cur);renderTodos()}});
  $('todoUndoBtn').addEventListener('click',todoUndo);

  /* Ctrl+Z / Ctrl+Y in todo panel */
  panelTodos.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key==='z'){
      if(e.shiftKey){e.preventDefault();todoRedo()}
      else{e.preventDefault();todoUndo()}}
    if((e.ctrlKey||e.metaKey)&&e.key==='y'){e.preventDefault();todoRedo()}
  });

  /* Cloud sync for todos */
  async function loadTodosCloud(){
    try{
      const r=await fetch('/api/todos');if(!r.ok)return;
      const data=await r.json();
      const localTs=Number(localStorage.getItem(TODO_TS_KEY))||0;
      if(data.ts>localTs&&data.items&&data.items.length){
        localStorage.setItem(TODO_KEY,JSON.stringify(data.items));
        localStorage.setItem(TODO_TS_KEY,String(data.ts));
        renderTodos();
      }
    }catch(_){}
  }

  renderTodos();
  loadTodosCloud();
})();
