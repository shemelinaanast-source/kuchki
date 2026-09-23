// add.js — всё, что попадает в кучки: строка ввода (цитаты, цели, ссылки),
// картинки и mp3 через кнопку, перетаскивание и вставку.

/* ---------- adding things ---------- */
function freeSpot(p){
  const W = innerWidth, H = innerHeight;
  const z = open ? spZ : 1;
  const rx = Math.min(W*.36, 380)/z, yTop = -(H/2 - 250)/z, yBot = (H/2 - 170)/z;
  const cx = open ? -spPan.x/z : 0, cy = open ? -spPan.y/z : 0;
  let best = {x:cx, y:cy + 40}, bestD = -1;
  for (let i = 0; i < 40; i++){
    const x = cx + (Math.random()*2 - 1)*rx, y = cy + yTop + Math.random()*Math.max(60, yBot - yTop);
    const dmin = p.items.reduce((m, it) => Math.min(m, Math.hypot((it.x - x)/1.6, it.y - y)), 1e9);
    if (dmin > bestD){ bestD = dmin; best = {x, y}; }
  }
  return {x:Math.round(best.x), y:Math.round(best.y)};
}
function addItem(item, at){
  const p = target();
  Object.assign(item, {id:uid(), ts:new Date().toISOString(), size:1, r:(item.type === 'photo' ? Math.round(Math.random()*8 - 4) : 0)});
  Object.assign(item, at || freeSpot(p));
  p.items.push(item);
  save();
  if (open === p.id){ renderSpace(); }
  else { renderMap(); bump(p.id); toast(`Легло в «${p.name}»`); }
}
function submitText(){
  const input = $('#composeText'), t = input.value.trim(); if (!t) return;
  const m = t.match(/https?:\/\/\S+/);
  if (m){
    const url = m[0], plat = platform(url);
    const rest = t.replace(url, '').replace(/\s+/g, ' ').replace(/^[\s\-–—:|·]+|[\s\-–—:|·]+$/g, '').trim();
    addItem(plat ? {type:'song', url, platform:plat, title:rest || `трек на ${plat}`} : {type:'link', url, title:rest || hostOf(url)});
  } else addItem(goalMode ? {type:'goal', text:t, done:false} : {type:'quote', text:t});
  input.value = '';
}
$('#composer').addEventListener('submit', e => { e.preventDefault(); submitText(); });
$('#goalBtn').onclick = () => { goalMode = !goalMode; $('#goalBtn').setAttribute('aria-pressed', String(goalMode)); $('#composeText').placeholder = goalMode ? 'Какая цель у этого периода?' : 'Цитата, мысль или ссылка на песню…'; $('#composeText').focus(); };

function readImage(file, max = 1100){
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      const img = new Image();
      img.onerror = rej;
      img.onload = () => {
        const s = Math.min(1, max/Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width*s); c.height = Math.round(img.height*s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', .86));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
const isAudio = f => f.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|oga|flac|opus)$/i.test(f.name);
async function addFiles(files, at){
  const list = [...files].filter(f => f.type.startsWith('image/') || isAudio(f));
  if (!list.length){ toast('Пока умею картинки и музыку'); return; }
  for (let i = 0; i < list.length; i++){
    const f = list[i], spot = at ? {x:at.x + i*40, y:at.y + i*30} : null;
    if (isAudio(f)){ await addTrack(f, spot); continue; }
    try {
      const src = await readImage(f);
      addItem({type:'photo', src, caption:''}, spot);
    } catch { toast('Не получилось открыть картинку'); }
  }
}

/* ---------- mp3 ---------- */
const trackFiles = new Map();   // item id → File/Blob, for the fallback in player.js
async function addTrack(file, at){
  let tags = {};
  try { tags = await readTags(file); } catch {}
  const base = file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ').replace(/^\s*\d{1,3}\s*[-.)]\s*/, '').trim();
  const title = tags.title ? (tags.artist ? `${tags.artist} — ${tags.title}` : tags.title) : base;
  let cover = null;
  if (tags.picture){ try { cover = await readImage(tags.picture, 420); } catch {} }
  const ext = (file.name.match(/\.([^.]+)$/) || [, 'audio'])[1].toLowerCase();
  const item = {type:'song', title, platform:ext, local:true, src:URL.createObjectURL(file), cover};
  addItem(item, at);
  trackFiles.set(item.id, file);
  Store.putTrack(item.id, file);
}
$('#fileIn').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });

// drag & drop files / links from anywhere
let dragDepth = 0;
const veil = $('#veil');
addEventListener('dragenter', e => { if (![...e.dataTransfer.types].some(t => t === 'Files' || t === 'text/uri-list' || t === 'text/plain')) return; e.preventDefault(); dragDepth++; veil.textContent = `Отпусти — и оно ляжет в «${target().name}»`; veil.hidden = false; });
addEventListener('dragover', e => e.preventDefault());
addEventListener('dragleave', () => { if (--dragDepth <= 0){ dragDepth = 0; veil.hidden = true; } });
addEventListener('drop', e => {
  e.preventDefault(); dragDepth = 0; veil.hidden = true;
  const at = open ? {x:Math.round((e.clientX - innerWidth/2 - spPan.x)/spZ), y:Math.round((e.clientY - innerHeight/2 - spPan.y)/spZ)} : null;
  if (e.dataTransfer.files.length) return addFiles(e.dataTransfer.files, at);
  const txt = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
  if (txt){ $('#composeText').value = txt.split('\n')[0]; submitText(); }
});
// paste images anywhere
addEventListener('paste', e => {
  const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
  if (files.length){ e.preventDefault(); addFiles(files); return; }
  const inField = e.target.closest?.('input,textarea');
  if (!inField){
    const t = e.clipboardData?.getData('text/plain');
    if (t){ e.preventDefault(); $('#composeText').value = t; submitText(); }
  }
});
