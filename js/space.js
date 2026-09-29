// space.js — пространство внутри кучки: полоса с заголовком, название,
// вещи, которые можно двигать, увеличивать, делать обложкой; свой зум.

/* ---------- space ---------- */
function enterSpace(id){
  const p = byId(id); if (!p) return;
  closeNew();
  open = id; savedCam = {...cam}; spPan = {x:0,y:0}; spZ = 1;
  askDelete(false);
  const k = 2.1;
  animateCam({k, x: innerWidth/2 - p._x*k, y: innerHeight/2 - p._y*k}, 650);
  renderSpace();
  fitIfCrowded();
  space.style.setProperty('--cx', innerWidth/2 + 'px');
  space.style.setProperty('--cy', innerHeight/2 + 'px');
  space.hidden = false;
  document.body.classList.add('space-on');
  setTimeout(() => space.classList.add('open'), reduced ? 0 : 280);
  updateDock();
}
function exitSpace(){
  if (!open) return;
  const id = open; open = null;
  space.classList.remove('open');
  document.body.classList.remove('space-on');
  renderMap();
  setTimeout(() => { if (!open) space.hidden = true; }, reduced ? 0 : 700);
  animateCam(savedCam || fitCam(), 750, () => bump(id));
}
/* ---------- deleting a period: two steps, so it never happens by accident ---------- */
function askDelete(on){
  const p = byId(open);
  if (on && p){
    const n = p.items.length;
    $('#delText').textContent = n ? `удалить «${p.name}» и всё внутри (${n})?` : `удалить «${p.name}»?`;
  }
  $('#delAsk').hidden = !on;
  $('#delBtn').hidden = on;
}
function deletePeriod(){
  const p = byId(open); if (!p) return;
  const i = state.periods.indexOf(p);
  if (playing && p.items.some(it => it.id === playing.id)) stopPlay();
  p.items.forEach(it => { if (it.local) Store.delTrack(it.id); });
  state.periods.splice(i, 1);
  if (!state.periods.length) state.periods.push(blank().periods[0]);
  else if (i === state.periods.length) cur().end = null;   // the one before becomes "now" again
  save();
  open = null;
  space.classList.remove('open');
  document.body.classList.remove('space-on');
  renderMap();
  setTimeout(() => { if (!open) space.hidden = true; }, reduced ? 0 : 700);
  animateCam(fitCam(), 750);
  toast(`Кучка «${p.name}» удалена`);
}
$('#delBtn').onclick = () => askDelete(true);
$('#delNo').onclick = () => askDelete(false);
$('#delYes').onclick = deletePeriod;

function itemHTML(it){
  const isCover = byId(open)?.coverId === it.id;
  let body = '';
  if (it.type === 'photo'){
    body = it.src
      ? `<div class="ph"><img src="${it.src}" alt="${esc(it.caption || 'картинка')}" draggable="false"></div>`
      : `<div class="ph fake" style="background:${it.bg}" role="img" aria-label="${esc(it.caption)}"></div>`;
    if (it.caption) body += `<div class="cap">${esc(it.caption)}</div>`;
  } else if (it.type === 'song'){
    const cap = `<span class="song-cap"><b>${esc(it.title)}</b><em>${it.local ? (it.src ? esc(it.platform) : 'файл не найден') : `${esc(it.platform)} ↗`}</em></span>`;
    body = it.local
      ? `<button class="song" type="button" data-act="play" aria-label="Играть: ${esc(it.title)}"><span class="cd"><span class="cd-btn">${ICON_PLAY}</span><span class="cd-ring"></span></span>${cap}</button>`
      : `<a class="song" href="${esc(it.url)}" target="_blank" rel="noopener" draggable="false" aria-label="Слушать: ${esc(it.title)}"><span class="cd"><span class="cd-btn">${ICON_PLAY}</span></span>${cap}</a>`;
  } else if (it.type === 'quote'){
    body = `<p class="quote${it.sticker ? ' sticker' : ''}">${esc(it.text)}</p>`;
  } else if (it.type === 'goal'){
    body = `<button class="goal${it.done?' done':''}" type="button" data-act="toggle"><span class="ring"></span><span><span class="ey">цель</span><span class="gt">${esc(it.text)}</span></span></button>`;
  } else {
    body = `<a class="linkc" href="${esc(it.url)}" target="_blank" rel="noopener" draggable="false">${esc(it.title)}<small>${esc(hostOf(it.url))} ↗</small></a>`;
  }
  return `<div class="item it-${it.type}" data-id="${it.id}" style="left:${it.x}px;top:${it.y}px;--s:${it.size};--r:${it.r||0}deg">
    <div class="it-body">${body}</div>
    ${isCover ? '<span class="cover-tag">обложка кучки</span>' : ''}
    <div class="it-meta"><span>${esc(fmtTs(it.ts))}</span><button type="button" data-act="cover">${isCover ? 'снять обложку' : 'обложка'}</button><button type="button" data-act="size">размер</button><button type="button" data-act="del">убрать</button></div>
  </div>`;
}
function renderSpace(){
  const p = byId(open); if (!p) return;
  $('#spName').value = p.name;
  $('#spDates').textContent = monthLabel(p);
  $('#spFormula').value = p.formula || '';
  spWorld.innerHTML = p.items.map(itemHTML).join('');
  applySp();
  $('#spEmpty').hidden = p.items.length > 0;
  syncPlay();
}
function applySp(){
  spWorld.style.transform = `translate(${spPan.x}px,${spPan.y}px) scale(${spZ})`;
  dots(space, innerWidth/2 + spPan.x, innerHeight/2 + spPan.y, spZ);
  $('#spZoomLbl').textContent = Math.round(spZ*100) + '%';
}
function spZoomAt(px, py, f){
  const z = Math.min(3, Math.max(.1, spZ*f));
  const cx = px - innerWidth/2, cy = py - innerHeight/2;
  const wx = (cx - spPan.x)/spZ, wy = (cy - spPan.y)/spZ;
  spZ = z; spPan.x = cx - wx*z; spPan.y = cy - wy*z; applySp();
}
function glideSp(fn){
  if (!reduced){ spWorld.classList.add('glide'); setTimeout(() => spWorld.classList.remove('glide'), 460); }
  fn(); applySp();
}
// on a small window, step back so the whole period is in view when it opens
function fitIfCrowded(){
  const p = byId(open); if (!p || !p.items.length) return;
  const xs = p.items.map(i => i.x), ys = p.items.map(i => i.y);
  const w = Math.max(...xs) - Math.min(...xs) + 340, h = Math.max(...ys) - Math.min(...ys) + 300;
  if (w > innerWidth - 40 || h > innerHeight - 260) spFit();
}
function spFit(){
  const p = byId(open); if (!p) return;
  glideSp(() => {
    if (!p.items.length){ spZ = 1; spPan = {x:0,y:0}; return; }
    const xs = p.items.map(i => i.x), ys = p.items.map(i => i.y);
    const minX = Math.min(...xs) - 170, maxX = Math.max(...xs) + 170, minY = Math.min(...ys) - 150, maxY = Math.max(...ys) + 150;
    const top = 150, bottom = 110;
    spZ = Math.max(.1, Math.min(1, (innerWidth - 40)/(maxX - minX), (innerHeight - top - bottom)/(maxY - minY)));
    spPan = {x: -(minX + maxX)/2*spZ, y: (top - bottom)/2 - (minY + maxY)/2*spZ};
  });
}
$('#spIn').onclick = () => glideSp(() => spZoomAt(innerWidth/2, innerHeight/2, 1.25));
$('#spOut').onclick = () => glideSp(() => spZoomAt(innerWidth/2, innerHeight/2, .8));
$('#spZoomLbl').onclick = spFit;
$('#backBtn').onclick = exitSpace;
$('#spName').addEventListener('input', e => { const p = byId(open); if (p) { p.name = e.target.value || 'Без названия'; updateDock(); save(); } });
$('#spFormula').addEventListener('input', e => { const p = byId(open); if (p) { p.formula = e.target.value; save(); } });
$('#spFormula').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });

// dragging items & panning space
let sd = null, justDragged = false, spPinch = null;
const spPts = new Map();
spCanvas.addEventListener('pointerdown', e => {
  if (e.button > 0 || e.target.closest('.it-meta')) return;
  const el = e.target.closest('.item'), p = byId(open); if (!p) return;
  spCanvas.setPointerCapture(e.pointerId);
  spPts.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (spPts.size === 2){
    const [a,b] = [...spPts.values()];
    if (sd){ (sd.el || spCanvas).classList.remove('dragging'); sd = null; }
    justDragged = true;
    spPinch = {d0:Math.hypot(a.x-b.x, a.y-b.y), z0:spZ};
    return;
  }
  if (el){
    const it = p.items.find(i => i.id === el.dataset.id);
    p.items.splice(p.items.indexOf(it), 1); p.items.push(it); spWorld.appendChild(el);
    sd = {kind:'item', el, it, x0:e.clientX, y0:e.clientY, ox:it.x, oy:it.y, moved:false};
  } else sd = {kind:'pan', x0:e.clientX, y0:e.clientY, ox:spPan.x, oy:spPan.y, moved:false};
});
spCanvas.addEventListener('pointermove', e => {
  if (spPts.has(e.pointerId)) spPts.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (spPinch && spPts.size === 2){
    const [a,b] = [...spPts.values()];
    spZoomAt((a.x+b.x)/2, (a.y+b.y)/2, (spPinch.z0*Math.hypot(a.x-b.x, a.y-b.y)/spPinch.d0)/spZ);
    return;
  }
  if (!sd) return;
  const dx = e.clientX - sd.x0, dy = e.clientY - sd.y0;
  if (!sd.moved && Math.hypot(dx,dy) > 4){ sd.moved = true; (sd.el || spCanvas).classList.add('dragging'); }
  if (!sd.moved) return;
  if (sd.kind === 'item'){ sd.it.x = Math.round(sd.ox + dx/spZ); sd.it.y = Math.round(sd.oy + dy/spZ); sd.el.style.left = sd.it.x + 'px'; sd.el.style.top = sd.it.y + 'px'; }
  else { spPan.x = sd.ox + dx; spPan.y = sd.oy + dy; applySp(); }
});
space.addEventListener('wheel', e => {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) spZoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY*.01));
  else { spPan.x -= e.shiftKey ? e.deltaY : e.deltaX; spPan.y -= e.shiftKey ? 0 : e.deltaY; applySp(); }
}, {passive:false});
const endSd = e => {
  spPts.delete(e.pointerId);
  if (spPts.size < 2) spPinch = null;
  if (!sd){ if (!spPts.size) setTimeout(() => justDragged = false, 0); return; }
  if (sd.moved){ justDragged = true; setTimeout(() => justDragged = false, 0); if (sd.kind === 'item') save(); }
  (sd.el || spCanvas).classList.remove('dragging'); sd = null;
};
spCanvas.addEventListener('pointerup', endSd);
spCanvas.addEventListener('pointercancel', endSd);
spCanvas.addEventListener('click', e => {
  if (justDragged){ e.preventDefault(); e.stopPropagation(); return; }
  const btn = e.target.closest('[data-act]'); if (!btn) return;
  const el = btn.closest('.item'), p = byId(open), it = p.items.find(i => i.id === el.dataset.id);
  if (btn.dataset.act === 'cover'){ p.coverId = p.coverId === it.id ? null : it.id; renderSpace(); save(); toast(p.coverId ? 'Теперь это обложка кучки' : 'Обложка снята'); return; }
  if (btn.dataset.act === 'del'){ if (p.coverId === it.id) p.coverId = null; if (playing && playing.id === it.id) stopPlay(); if (it.local) Store.delTrack(it.id); p.items.splice(p.items.indexOf(it), 1); renderSpace(); save(); toast('Убрано из кучки'); return; }
  if (btn.dataset.act === 'size'){ it.size = it.size < .9 ? 1 : it.size < 1.05 ? 1.35 : .75; el.style.setProperty('--s', it.size); save(); return; }
  if (btn.dataset.act === 'toggle'){ it.done = !it.done; btn.classList.toggle('done', it.done); save(); }
  if (btn.dataset.act === 'play') togglePlay(it);
}, true);
