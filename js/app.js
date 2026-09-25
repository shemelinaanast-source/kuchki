// app.js — новая кучка, подсказки, горячие клавиши и запуск:
// достаём сохранённые кучки (или показываем примеры) и рисуем карту.

/* ---------- new period ---------- */
function openNew(){
  if (open) return;
  $('#newNote').textContent = `«${cur().name}» закроется сегодняшним днём и останется на ветке. Всё новое будет падать в новую кучку.`;
  $('#newPop').hidden = false; $('#newName').value = ''; $('#newName').focus();
}
function closeNew(){ $('#newPop').hidden = true; }
$('#newBtn').onclick = () => $('#newPop').hidden ? openNew() : closeNew();
$('#newForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#newName').value.trim() || 'Без названия';
  const prev = cur(); prev.end = today();
  const used = state.periods.map(p => p.bg);
  const bg = (BGS.find(b => !b.dark && !used.includes(b.k)) || BGS[0]).k;
  const p = {id:uid(), name, start:today(), end:null, bg, formula:'', items:[]};
  state.periods.push(p); closeNew(); renderMap(); save();
  animateCam(fitCam(), 500, () => enterSpace(p.id));
});

/* ---------- misc ---------- */
function updateDock(){
  $('#dockHint').textContent = open ? 'вкинуть в эту кучку' : `вкинуть в «${cur().name}»`;
  $('#newBtn').hidden = !!open;
}
function bump(id){
  const el = world.querySelector(`.cluster[data-id="${id}"]`); if (!el) return;
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}
let tt = 0;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 1800); }
function syncNote(){
  const where = Store.ok ? 'сохраняется в этом браузере' : 'в этом окне сохранение недоступно';
  $('#noteText').textContent = state.examples ? `в кучках примеры · ${where}` : where;
  $('#clearBtn').hidden = !state.examples;
}
$('#clearBtn').onclick = async () => {
  if (playing) stopPlay();
  await Store.clear().catch(() => {});
  state = blank(); save(); syncNote(); renderMap(); animateCam(fitCam(), 500); toast('Чисто. Вкидывай первое');
};
addEventListener('keydown', e => {
  if (e.key === 'Escape'){ if (!$('#newPop').hidden) closeNew(); else exitSpace(); return; }
  const typing = e.target.closest?.('input,textarea');
  // Figma-style: Shift+1 shows everything, Ctrl/Cmd +/− zooms the canvas instead of the page
  if (!typing && e.shiftKey && e.code === 'Digit1'){ e.preventDefault(); open ? spFit() : animateCam(fitCam(), 600); return; }
  if ((e.ctrlKey || e.metaKey) && ['=','+','-'].includes(e.key)){
    e.preventDefault();
    const f = e.key === '-' ? .8 : 1.25;
    open ? glideSp(() => spZoomAt(innerWidth/2, innerHeight/2, f)) : zoomAt(innerWidth/2, innerHeight/2, f);
  }
});
addEventListener('resize', () => { if (!open) Object.assign(cam, fitCam()); applyCam(); });

/* ---------- start ---------- */
(async function start(){
  const saved = await Store.load();
  if (saved){
    state = saved.state;
    // local tracks come back as blobs: give each one a fresh playable url
    state.periods.forEach(p => p.items.forEach(it => {
      if (!it.local) return;
      const blob = saved.tracks.get(it.id);
      if (blob){ it.src = URL.createObjectURL(blob); trackFiles.set(it.id, blob); }
    }));
  } else state = sample();
  syncNote(); renderMap();
  Object.assign(cam, fitCam()); applyCam();
})();
