// map.js — карта: ультрамариновая ветка периодов, светящиеся облачка, обложки,
// превью при наведении, камера (панорама и зум как в Figma).

/* ---------- map geometry ---------- */
const GAP = 370;
function layout(){
  state.periods.forEach((p,i) => { p._x = i*GAP; p._y = Math.round(Math.sin(i*1.2 + .5)*85); });
  const last = cur();
  state._tip = {x:last._x + 250, y:last._y + 40};
}
const pileR = p => 46 + 9*Math.sqrt(p.items.length);
const mapScale = s => s < .9 ? .85 : s > 1.05 ? 1.25 : 1;
function tokenPos(p, j){
  const a = j*2.39996 + hash(p.id)*6.28;
  const r = p.items.length === 1 ? 0 : 14*Math.sqrt(j + .35);
  return {x:Math.cos(a)*r, y:Math.sin(a)*r*.85, a};
}
function smooth(pts){
  let s = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++){
    const p0 = pts[i-1] || pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2] || p2;
    s += ` C${p1.x + (p2.x-p0.x)/6},${p1.y + (p2.y-p0.y)/6} ${p2.x - (p3.x-p1.x)/6},${p2.y - (p3.y-p1.y)/6} ${p2.x},${p2.y}`;
  }
  return s;
}
const synKey = it => it.url ? 'u:' + it.url.trim().toLowerCase() : (it.type === 'quote' || it.type === 'goal') ? 't:' + it.text.trim().toLowerCase().replace(/[.!?…\s]+$/,'') : null;

function tokenHTML(p, it, j){
  const t = tokenPos(p, j), m = mapScale(it.size), r = (hash(it.id)*16 - 8).toFixed(1);
  const pos = `left:calc(50% + ${t.x.toFixed(1)}px);top:calc(50% + ${t.y.toFixed(1)}px);--r:${r}deg;`;
  if (it.type === 'photo'){
    const w = 30*m, bg = it.src ? `background-image:url(${it.src})` : `background:${it.bg}`;
    return `<i class="tk tk-photo" style="${pos}width:${w}px;height:${w*1.2}px;${bg}"></i>`;
  }
  if (it.type === 'song') return `<i class="tk tk-song holo" style="${pos}width:${26*m}px;height:${26*m}px;--h:${songHue(it)}deg"></i>`;
  if (it.type === 'quote') return `<i class="tk tk-quote" style="${pos}width:${62*m}px">${esc(it.text)}</i>`;
  if (it.type === 'goal') return `<i class="tk tk-goal${it.done?' done':''}" style="${pos}width:${14*m}px;height:${14*m}px"></i>`;
  return `<i class="tk tk-link" style="${pos}width:${22*m}px;height:${22*m}px">↗</i>`;
}

// a shapeless cloud: several soft, blurred puffs drifting around the centre
function blobHTML(p, R){
  const cs = cloudColors(p.bg), dark = isDark(p.bg), n = 3 + Math.min(3, Math.floor(p.items.length/3));
  const puff = (x, y, size, bg, blur, i) => {
    const h = hash(p.id + 'd' + i);
    return `<i class="puff" style="--x:${x.toFixed(1)}px;--y:${y.toFixed(1)}px;width:${size.toFixed(1)}px;height:${(size*(.8 + h*.3)).toFixed(1)}px;background:${bg};--bl:${blur.toFixed(1)}px;--dx:${((h-.5)*R*.45).toFixed(1)}px;--dy:${((hash(p.id+'e'+i)-.5)*R*.4).toFixed(1)}px;--sc:${(1.02 + h*.16).toFixed(2)};--dur:${(7 + h*7).toFixed(1)}s;--dl:${(-h*9).toFixed(1)}s"></i>`;
  };
  const h = hash(p.id + 'orb');
  // soft coloured light spilling onto the paper
  let s = puff(0, 0, R*3.6, `radial-gradient(closest-side,${rgba(cs[0], .30)},${rgba(cs[2], .10)} 55%,${rgba(cs[2], 0)})`, R*.22, 'a');
  // the slowly turning gradient body
  s += `<i class="orb" style="width:${(R*1.95).toFixed(1)}px;height:${(R*1.7).toFixed(1)}px;--bl:${(R*.2).toFixed(1)}px;--dur:${(16 + h*14).toFixed(1)}s;background:conic-gradient(from ${Math.round(h*360)}deg,${cs[0]},${cs[2]},${cs[1]},${cs[0]})"></i>`;
  for (let i = 0; i < n; i++){
    const a = i*2.1 + hash(p.id + 'a' + i)*1.6, off = R*(.25 + .35*hash(p.id + 'o' + i)), c = cs[i % cs.length];
    s += puff(Math.cos(a)*off, Math.sin(a)*off*.8, R*(1 + .55*hash(p.id + 's' + i)),
      `radial-gradient(closest-side,${rgba(c, .75)} 0%,${rgba(c, .35)} 50%,${rgba(c, 0)} 100%)`, R*.14, i);
  }
  // bright breathing core
  const core = dark ? '#FFD3E8' : '#FFFFFF';
  s += `<i class="core" style="width:${(R*.9).toFixed(1)}px;height:${(R*.8).toFixed(1)}px;--bl:${(R*.1).toFixed(1)}px;--dl:${(-h*4).toFixed(1)}s;background:radial-gradient(closest-side,${rgba(core, .95)},${rgba(core, .5)} 45%,${rgba(core, 0)})"></i>`;
  return `<div class="blob">${s}</div>`;
}

// the peek: the latest few things, laid out as a small collage around the cloud
const SLOTS = [[0,0],[-1,-.5],[1,-.45],[-.95,.62],[1,.6],[.08,-1.05],[-.06,1.08]];
// the one thing that says what this period was, sitting in the heart of the cloud
function coverHTML(it, R){
  if (it.type === 'photo'){
    const d = R*1.6;
    return `<div class="ccover cc-photo" style="width:${d}px;height:${d}px;background:${it.src ? `url(${it.src}) center/cover` : it.bg}"></div>`;
  }
  if (it.type === 'song'){
    const d = R*1.15;
    return `<div class="ccover cc-song" style="width:${d}px;height:${d}px"><i class="holo" style="--h:${songHue(it)}deg"></i>${it.cover ? `<i class="cd-label" style="background-image:url(${it.cover})"></i>` : ''}</div>`;
  }
  const text = it.type === 'goal' ? `◎ ${it.text}` : it.type === 'link' ? `↗ ${it.title}` : it.text;
  return `<div class="ccover cc-quote" style="width:${Math.max(140, R*1.9)}px">${esc(text)}</div>`;
}
function peekHTML(p, R){
  const hasCover = p.items.some(i => i.id === p.coverId);
  const items = p.items.filter(i => i.id !== p.coverId).slice(-(SLOTS.length - (hasCover ? 1 : 0))).reverse(); if (!items.length) return '';
  const u = Math.max(70, R*1.1);
  return `<div class="peek" style="--u:${u.toFixed(1)}px">` + items.map((it, j) => {
    const [sx, sy] = SLOTS[hasCover ? j + 1 : j];
    const st = `left:${(sx*u).toFixed(1)}px;top:${(sy*u*.78).toFixed(1)}px;--r:${(hash(it.id)*8 - 4).toFixed(1)}deg;--d:${j*40}ms`;
    if (it.type === 'photo') return `<i class="pk pk-photo" style="${st};background:${it.src ? `url(${it.src}) center/cover` : it.bg}"></i>`;
    if (it.type === 'song') return `<span class="pk pk-song" style="${st}"><i class="holo" style="--h:${songHue(it)}deg"></i><b>${esc(it.title)}</b></span>`;
    if (it.type === 'quote') return `<span class="pk pk-quote" style="${st}">${esc(it.text)}</span>`;
    if (it.type === 'goal') return `<span class="pk pk-goal${it.done ? ' done' : ''}" style="${st}"><i></i><b>${esc(it.text)}</b></span>`;
    return `<span class="pk pk-link" style="${st}"><b>↗ ${esc(it.title)}</b></span>`;
  }).join('') + `</div>`;
}

const MONTHS = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];

function renderMap(){
  layout();
  const ps = state.periods, last = cur();
  // one ultramarine line through every period, fading off into the future
  const t = state._tip;
  let svg = `<path class="branch" d="${smooth(ps.map(p => ({x:p._x, y:p._y})))}"/>`;
  svg += `<path class="tip" d="M${last._x},${last._y} C${last._x+100},${last._y} ${t.x-90},${t.y} ${t.x},${t.y}"/>`;
  // synapses: same song / link / phrase in different periods
  const groups = {};
  ps.forEach((p, pi) => p.items.forEach((it, j) => {
    const k = synKey(it); if (!k) return;
    const t = tokenPos(p, j);
    (groups[k] ||= []).push({pid:p.id, pi, x:p._x + t.x, y:p._y + t.y});
  }));
  Object.values(groups).forEach(g => {
    g.sort((a,b) => a.pi - b.pi);
    for (let i = 0; i < g.length - 1; i++){
      const a = g[i], b = g[i+1]; if (a.pid === b.pid) continue;
      const lift = 60 + Math.abs(b.x - a.x)*.22;
      svg += `<path class="syn" data-a="${a.pid}" data-b="${b.pid}" d="M${a.x},${a.y} C${a.x},${a.y-lift} ${b.x},${b.y-lift} ${b.x},${b.y}"/>`;
    }
  });

  let html = `<svg id="links" aria-hidden="true">${svg}</svg>`;
  ps.forEach(p => {
    const n = p.items.length, R = pileR(p), isCur = p === last;
    const o = isCur ? 1 : (.38 + .62*Math.min(1, n/6)).toFixed(2);
    const quiet = !isCur && n <= 2;
    const cov = p.items.find(i => i.id === p.coverId);
    const toks = cov ? '' : p.items.slice(0, 26).map((it, j) => tokenHTML(p, it, j)).join('');
    html += `<div class="cluster${isCur?' current':''}" data-id="${p.id}" style="left:${p._x}px;top:${p._y}px;--o:${o}">
      ${blobHTML(p, R)}
      <div class="pile" style="width:${R*2}px;height:${R*2}px">${toks}</div>
      ${cov ? coverHTML(cov, R) : ''}
      ${peekHTML(p, R)}
      <div class="clabel" style="top:${R*1.3+14}px">
        <div class="cname">${esc(p.name)}</div>
        <div class="cdates mono">${esc(range(p))}${isCur?'<span class="cnow">сейчас</span>':''}</div>
        ${quiet ? '<div class="cquiet mono">тихий период</div>' : ''}
        ${p.formula ? `<div class="cformula">${esc(p.formula)}</div>` : ''}
      </div>
    </div>`;
  });
  html += `<div class="newnode" style="left:${state._tip.x}px;top:${state._tip.y}px"><div class="plus"><svg viewBox="0 0 50 50" aria-hidden="true"><path d="M27 4 C40 5 47 15 46 27 C45 39 35 47 23 46 C11 45 3 35 4 23 C5 12 14 4 29 6"/></svg>+</div><div class="nl mono">новая кучка</div></div>`;
  world.innerHTML = html;
  peekId = null;
  const now = new Date();
  $('#issue').firstChild.textContent = `выпуск № ${ps.length} · ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  updateDock();
}
function lightSyn(id){
  world.querySelectorAll('.syn').forEach(el => el.classList.toggle('lit', !!id && (el.dataset.a === id || el.dataset.b === id)));
}

/* ---------- camera ---------- */
function applyCam(){
  world.style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.k})`;
  map.classList.toggle('near', cam.k >= 1.35);
}
let camAnim = 0;
function animateCam(to, dur = 700, done){
  cancelAnimationFrame(camAnim);
  if (reduced){ Object.assign(cam, to); applyCam(); done && done(); return; }
  const from = {...cam}, t0 = performance.now();
  const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
  const step = now => {
    const t = Math.min(1, (now - t0)/dur), e = ease(t);
    cam.x = from.x + (to.x - from.x)*e; cam.y = from.y + (to.y - from.y)*e; cam.k = from.k + (to.k - from.k)*e;
    applyCam();
    if (t < 1) camAnim = requestAnimationFrame(step); else done && done();
  };
  camAnim = requestAnimationFrame(step);
}
function fitCam(){
  const W = innerWidth, H = innerHeight, ps = state.periods;
  const xs = ps.map(p => p._x).concat(state._tip.x), ys = ps.map(p => p._y);
  const minX = Math.min(...xs) - 170, maxX = Math.max(...xs) + 90, minY = Math.min(...ys) - 150, maxY = Math.max(...ys) + 200;
  const k = Math.max(.08, Math.min(1.1, W/(maxX - minX), (H - 230)/(maxY - minY)));
  return {k, x: W/2 - (minX + maxX)/2*k, y: (H - 40)/2 - (minY + maxY)/2*k + 20};
}
function zoomAt(px, py, f){
  const k = Math.min(3, Math.max(.05, cam.k*f));
  const wx = (px - cam.x)/cam.k, wy = (py - cam.y)/cam.k;
  cam.k = k; cam.x = px - wx*k; cam.y = py - wy*k; applyCam();
}

/* ---------- map input ---------- */
const pts = new Map(); let drag = null, pinch = null;
map.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  map.setPointerCapture(e.pointerId);
  pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (pts.size === 1) drag = {x0:e.clientX, y0:e.clientY, cx:cam.x, cy:cam.y, moved:false, target:e.target};
  else if (pts.size === 2){
    const [a,b] = [...pts.values()];
    pinch = {d0:Math.hypot(a.x-b.x, a.y-b.y), k0:cam.k}; if (drag) drag.moved = true;
  }
});
map.addEventListener('pointermove', e => {
  if (!pts.has(e.pointerId)) return;
  pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (pinch && pts.size === 2){
    const [a,b] = [...pts.values()];
    zoomAt((a.x+b.x)/2, (a.y+b.y)/2, (pinch.k0*Math.hypot(a.x-b.x, a.y-b.y)/pinch.d0)/cam.k);
    return;
  }
  if (!drag) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (!drag.moved && Math.hypot(dx,dy) > 4){ drag.moved = true; map.classList.add('dragging'); }
  if (drag.moved){ cam.x = drag.cx + dx; cam.y = drag.cy + dy; applyCam(); }
});
const endPtr = e => {
  pts.delete(e.pointerId);
  if (pts.size < 2) pinch = null;
  if (drag && pts.size === 0){
    if (!drag.moved && e.type === 'pointerup'){
      const c = drag.target.closest?.('.cluster'), nn = drag.target.closest?.('.newnode');
      if (c) enterSpace(c.dataset.id); else if (nn) openNew();
    }
    drag = null; map.classList.remove('dragging');
  }
};
map.addEventListener('pointerup', endPtr);
map.addEventListener('pointercancel', endPtr);
map.addEventListener('wheel', e => {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY*.01));
  else { cam.x -= e.shiftKey ? e.deltaY : e.deltaX; cam.y -= e.shiftKey ? 0 : e.deltaY; applyCam(); }
}, {passive:false});
let peekId = null;
function setPeek(id){
  if (id === peekId) return;
  peekId = id;
  world.querySelectorAll('.cluster.peeking').forEach(el => el.classList.remove('peeking'));
  if (id) world.querySelector(`.cluster[data-id="${id}"]`)?.classList.add('peeking');
  lightSyn(id);
}
world.addEventListener('pointerover', e => { const c = e.target.closest('.cluster'); setPeek(c ? c.dataset.id : null); });
world.addEventListener('pointerleave', () => setPeek(null));
$('#zIn').onclick = () => zoomAt(innerWidth/2, innerHeight/2, 1.25);
$('#zOut').onclick = () => zoomAt(innerWidth/2, innerHeight/2, .8);
$('#zFit').onclick = () => animateCam(fitCam(), 600);
