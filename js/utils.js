// utils.js — общие помощники: палитры фонов, цвета облачков, даты по-русски,
// экранирование, хэши, распознавание музыкальных ссылок.

const $ = s => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const BGS = [
  {k:'utro',  n:'утро',    v:'linear-gradient(165deg,#FFF8F2 0%,#FFDDE8 100%)', c:['#FF8DB8','#FFC49C','#FF6FA3']},
  {k:'persik',n:'персик',  v:'radial-gradient(120% 90% at 18% 8%,#FFEEDD 0%,#FFD0C2 55%,#F7B2C4 100%)', c:['#FF9C7C','#FFCB85','#F4709D']},
  {k:'myata', n:'мята',    v:'linear-gradient(165deg,#F4FCF8 0%,#D2F0E4 100%)', c:['#5FD8B2','#AFF2D4','#3EC4AC']},
  {k:'lav',   n:'лаванда', v:'linear-gradient(165deg,#F8F5FF 0%,#DED4FB 100%)', c:['#A78DFF','#E4BDFF','#8B6CF2']},
  {k:'nebo',  n:'небо',    v:'linear-gradient(180deg,#EAF3FF 0%,#FDEDF4 100%)', c:['#7EB8FF','#FFB5D2','#5F9DF6']},
  {k:'bumaga',n:'бумага',  v:'#FBFAF8', c:['#E3C7B4','#F7E7DA','#D2AE98']},
  {k:'noch',  n:'ночь',    v:'radial-gradient(120% 90% at 30% 10%,#43294A 0%,#231C33 60%,#17131F 100%)', c:['#8A46B0','#E46CAA','#4A2F86'], dark:true}
];
const bgOf = k => BGS.find(b => b.k === k);
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`; };
const cloudColors = k => bgOf(k)?.c || (/^#[0-9a-f]{6}$/i.test(k || '') ? [k, '#FFFFFF', k] : BGS[0].c);
const bgValue = k => bgOf(k)?.v || k || '#fff';
const isDark = k => {
  const b = bgOf(k); if (b) return !!b.dark;
  const m = /^#([0-9a-f]{6})$/i.exec(k || ''); if (!m) return false;
  const n = parseInt(m[1],16), r=n>>16, g=(n>>8)&255, bl=n&255;
  return (0.299*r + 0.587*g + 0.114*bl) < 120;
};

const MN = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const MG = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const d = s => new Date(s.length === 10 ? s + 'T12:00' : s);
function range(p){
  const s = d(p.start);
  if (!p.end) return `${MN[s.getMonth()]} ${s.getFullYear()} — `;
  const e = d(p.end);
  if (s.getFullYear() === e.getFullYear()) {
    if (s.getMonth() === e.getMonth()) return `${MN[s.getMonth()]} ${s.getFullYear()}`;
    return `${MN[s.getMonth()]} — ${MN[e.getMonth()]} ${e.getFullYear()}`;
  }
  return `${MN[s.getMonth()]} ${s.getFullYear()} — ${MN[e.getMonth()]} ${e.getFullYear()}`;
}
function fmtTs(iso){
  const t = d(iso), p = n => String(n).padStart(2,'0');
  return `${t.getDate()} ${MG[t.getMonth()]} ${t.getFullYear()}, ${p(t.getHours())}:${p(t.getMinutes())}`;
}
const today = () => { const t = new Date(), p = n => String(n).padStart(2,'0'); return `${t.getFullYear()}-${p(t.getMonth()+1)}-${p(t.getDate())}`; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// ids must stay unique across reloads now that things are saved
let seq = 0; const uid = () => 'x' + Date.now().toString(36) + (++seq).toString(36) + Math.random().toString(36).slice(2,5);
function hash(s){ let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h,16777619); } return (h>>>0)/4294967295; }

function platform(url){
  const u = url.toLowerCase();
  if (u.includes('spotify.')) return 'Spotify';
  if (u.includes('music.yandex')) return 'Яндекс Музыка';
  if (u.includes('youtube.') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('soundcloud.')) return 'SoundCloud';
  if (u.includes('music.apple')) return 'Apple Music';
  if (u.includes('vk.com/music') || u.includes('vk.com/audio')) return 'VK Музыка';
  return null;
}
// the same song always gets the same foil tint, in every period
const songHue = it => Math.round(hash((it.title || it.url || '').toLowerCase())*360);
function splitSong(t){
  const parts = String(t).split(/\s[—–-]\s/);
  return parts.length > 1 ? {artist:parts[0], title:parts.slice(1).join(' — ')} : {artist:'', title:t};
}
const hostOf = url => { try { return new URL(url).hostname.replace(/^www\./,''); } catch { return 'ссылка'; } };
const yt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
