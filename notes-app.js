(function(){
  /* ── CONSTANTS ─────────────────────────────────────────────── */
  const DOC_KEY='mb_notes_doc', META_KEY='mb_notes_doc_meta', PIN_KEY='mb_notes_pinned',
        TODO_KEY='mb_notes_todos', TODO_TS_KEY='mb_notes_todos_ts', THEME_KEY='mb_theme';
  const COLORS=['#141414','#6e6e73','#e55','#e87d2f','#e8b63a','#34c759',
                '#30b0c7','#3478f6','#8944e0','#e54f8a','#8b6f47','#f0f0f2'];

  /* ── DOM ────────────────────────────────────────────────────── */
  const $=id=>document.getElementById(id);
  const root=document.documentElement, doc=$('doc'), savedEl=$('savedIndicator'),
        toggle=$('themeToggle'), pinnedBody=$('pinnedBody'), pinnedSection=$('pinnedSection'),
        pinnedHeader=$('pinnedHeader'), todoList=$('todoList'), todoForm=$('todoForm'),
        todoInput=$('todoInput'), todoCount=$('todoCount');

  /* ── THEME ──────────────────────────────────────────────────── */
  toggle.addEventListener('click',()=>{
    const next=root.getAttribute('data-theme')==='dark'?'light':'dark';
    root.setAttribute('data-theme',next);
    try{localStorage.setItem(THEME_KEY,next)}catch(_){}
  });

  /* ── MOBILE TABS ────────────────────────────────────────────── */
  const tabBtns=document.querySelectorAll('.tab-btn');
  const panelNotes=$('panelNotes'), panelTodos=$('panelTodos');
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

  let saveTimer=null;
  function persistNotes(){
    try{
      const ts=Date.now();
      localStorage.setItem(DOC_KEY,doc.innerHTML);
      localStorage.setItem(PIN_KEY,pinnedBody.innerHTML);
      localStorage.setItem(META_KEY,String(ts));
      flash();
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
      }
    }catch(_){}
  }
  loadNotesCloud();

  window.addEventListener('pagehide',()=>{if(saveTimer){clearTimeout(saveTimer);persistNotes()}});

  /* ── PASTE PLAIN TEXT ───────────────────────────────────────── */
  doc.addEventListener('paste',e=>{e.preventDefault();
    document.execCommand('insertText',false,(e.clipboardData||window.clipboardData).getData('text'))});

  /* ── PINNED TOGGLE ──────────────────────────────────────────── */
  let pinCollapsed=localStorage.getItem('mb_pin_collapsed')==='1';
  if(pinCollapsed)pinnedSection.classList.add('collapsed');
  pinnedHeader.addEventListener('click',()=>{
    pinCollapsed=!pinCollapsed;pinnedSection.classList.toggle('collapsed',pinCollapsed);
    localStorage.setItem('mb_pin_collapsed',pinCollapsed?'1':'0');
  });

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
    doc.focus();document.execCommand('fontName',false,this.value||'');scheduleNoteSave()});

  /* ── TOOLBAR: FONT SIZE ─────────────────────────────────────── */
  $('tbSize').addEventListener('change',function(){
    doc.focus();document.execCommand('fontSize',false,this.value);scheduleNoteSave()});

  /* ── TOOLBAR: COLOR PICKER ──────────────────────────────────── */
  const colorPopup=$('colorPopup'), colorDot=$('tbColorDot'), colorBtn=$('tbColorBtn');
  COLORS.forEach(c=>{
    const s=document.createElement('button');s.type='button';s.className='color-swatch';
    s.style.background=c;s.title=c;
    s.addEventListener('click',e=>{e.stopPropagation();doc.focus();
      document.execCommand('foreColor',false,c);colorDot.style.background=c;
      colorPopup.classList.remove('open');scheduleNoteSave()});
    colorPopup.appendChild(s);
  });
  colorBtn.addEventListener('click',e=>{e.stopPropagation();colorPopup.classList.toggle('open');
    $('tablePopup').classList.remove('open')});

  /* ── TOOLBAR: TABLE GRID ────────────────────────────────────── */
  const tablePopup=$('tablePopup'),tableGrid=$('tableGrid'),tableSizeLabel=$('tableSizeLabel');
  for(let r=1;r<=5;r++)for(let c=1;c<=5;c++){
    const cell=document.createElement('button');cell.type='button';cell.className='table-cell';
    cell.dataset.r=r;cell.dataset.c=c;
    cell.addEventListener('mouseenter',()=>{
      tableSizeLabel.textContent=c+'×'+r;
      tableGrid.querySelectorAll('.table-cell').forEach(el=>{
        el.classList.toggle('highlight',+el.dataset.r<=r&&+el.dataset.c<=c)});
    });
    cell.addEventListener('click',e=>{e.stopPropagation();insertTable(+cell.dataset.r,+cell.dataset.c);
      tablePopup.classList.remove('open')});
    tableGrid.appendChild(cell);
  }
  $('tbTableBtn').addEventListener('click',e=>{e.stopPropagation();tablePopup.classList.toggle('open');
    colorPopup.classList.remove('open')});
  tableGrid.addEventListener('mouseleave',()=>{tableSizeLabel.textContent='';
    tableGrid.querySelectorAll('.table-cell').forEach(el=>el.classList.remove('highlight'))});

  function insertTable(rows,cols){
    let h='<table><tbody>';
    for(let r=0;r<rows;r++){h+='<tr>';for(let c=0;c<cols;c++)h+='<td>&nbsp;</td>';h+='</tr>'}
    h+='</tbody></table><p><br></p>';
    doc.focus();document.execCommand('insertHTML',false,h);scheduleNoteSave();
  }

  /* close popups on outside click */
  document.addEventListener('click',()=>{colorPopup.classList.remove('open');tablePopup.classList.remove('open')});

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
    // ensure all items have indent
    items.forEach(t=>{if(t.indent===undefined)t.indent=0;if(!t.id)t.id=Math.random().toString(36).slice(2,9)});
    const sorted=sortedTodos(items);
    const activeCount=sorted.filter(t=>!t.done).length;
    todoCount.textContent=items.length?activeCount+'/'+items.length:'0';
    todoList.innerHTML='';
    if(!items.length){
      const e=document.createElement('li');e.className='todo-empty';
      e.textContent='no tasks yet — add one above';todoList.appendChild(e);return}
    let shownDoneSep=false;
    sorted.forEach((it,si)=>{
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

  /* Indent/Outdent/Undo buttons */
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
