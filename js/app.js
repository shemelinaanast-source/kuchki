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
  const p = {id:uid(), name, start:today(), end:null, sphere:nextSphere(), bg:'bumaga', formula:'', items:[]};
  state.periods.push(p); closeNew(); renderMap(); save();
  animateCam(fitCam(), 500, () => enterSpace(p.id));
});

/* ---------- band colour: grey / lime / ultramarine, one choice for the whole app ---------- */
function applyBand(){
  const b = BANDS.find(x => x.k === state.band) || BANDS[0];
  document.documentElement.style.setProperty('--band', b.c);
  document.documentElement.dataset.band = b.k;
  document.querySelectorAll('.dots button').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.k === b.k)));
}
document.querySelectorAll('.dots').forEach(box => {
  box.innerHTML = BANDS.map(b => `<button type="button" data-k="${b.k}" style="--c:${b.c}" title="${b.n}" aria-label="Цвет полосы: ${b.n}"></button>`).join('');
  box.addEventListener('click', e => {
    const b = e.target.closest('button[data-k]'); if (!b) return;
    state.band = b.dataset.k; applyBand(); save();
  });
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
  $('#noteText').textContent = state.examples ? 'в кучках примеры' : Store.ok ? '' : 'в этом окне сохранение недоступно';
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
  // untouched examples from an older design are swapped for the current ones
  if (saved && !(saved.state.examples && saved.state.v !== SAMPLE_VERSION)){
    state = saved.state;
    // local tracks come back as blobs: give each one a fresh playable url
    state.periods.forEach(p => p.items.forEach(it => {
      if (!it.local) return;
      const blob = saved.tracks.get(it.id);
      if (blob){ it.src = URL.createObjectURL(blob); trackFiles.set(it.id, blob); }
    }));
  } else state = sample();
  state.band ||= 'grey';
  applyBand(); syncNote(); renderMap();
  Object.assign(cam, fitCam()); applyCam();
})();
