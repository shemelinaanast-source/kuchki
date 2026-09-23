// player.js — проигрывание своих mp3: диск крутится, по краю идёт прогресс,
// над строкой ввода видно, что сейчас играет.

const player = $('#player');
let playing = null;   // {id, title}
function findSong(id){ for (const p of state.periods){ const it = p.items.find(i => i.id === id); if (it) return it; } return null; }
function togglePlay(it){
  if (!it.src){ toast('Файл трека не найден — перетащи его ещё раз'); return; }
  if (playing && playing.id === it.id){ player.paused ? player.play().catch(() => {}) : player.pause(); return; }
  playing = {id:it.id, title:it.title, fellBack:false};
  player.src = it.src;
  player.play().catch(() => {});
  syncPlay();
}
function stopPlay(){ player.pause(); player.removeAttribute('src'); player.load(); playing = null; syncPlay(); }
// if the page refuses blob: audio, retry once with the file inlined
player.addEventListener('error', () => {
  if (!playing || playing.fellBack) { if (playing) toast('Этот файл не получилось проиграть'); return; }
  const f = trackFiles.get(playing.id); if (!f) return;
  playing.fellBack = true;
  const fr = new FileReader();
  fr.onload = () => { const it = findSong(playing.id); if (it) it.src = fr.result; player.src = fr.result; player.play().catch(() => {}); };
  fr.readAsDataURL(f);
});
const mmss = t => isFinite(t) ? `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}` : '0:00';
function syncPlay(){
  spWorld.querySelectorAll('.song.playing,.song.paused').forEach(el => {
    if (!playing || el.closest('.item').dataset.id !== playing.id){
      el.classList.remove('playing','paused'); el.querySelector('.cd-btn').textContent = '▶';
      const it = findSong(el.closest('.item').dataset.id); if (it) el.querySelector('.song-cap em').textContent = `${it.platform} · ${it.src ? 'играть' : 'файл не найден'}`;
    }
  });
  const np = $('#nowPlaying');
  if (!playing){ np.hidden = true; return; }
  const on = !player.paused;
  np.hidden = false;
  np.textContent = `${on ? '❚❚' : '▶'} ${playing.title}`;
  const el = spWorld.querySelector(`.item[data-id="${playing.id}"] .song`);
  if (el){
    el.classList.toggle('playing', on); el.classList.toggle('paused', !on);
    el.querySelector('.cd-btn').textContent = on ? '❚❚' : '▶';
    el.querySelector('.cd').style.setProperty('--prog', player.duration ? (player.currentTime/player.duration).toFixed(4) : 0);
    el.querySelector('.song-cap em').textContent = `${mmss(player.currentTime)} / ${mmss(player.duration)}`;
  }
}
['play','pause','timeupdate','loadedmetadata'].forEach(ev => player.addEventListener(ev, syncPlay));
player.addEventListener('ended', () => { player.currentTime = 0; syncPlay(); });
$('#nowPlaying').onclick = () => { if (playing) player.paused ? player.play().catch(() => {}) : player.pause(); };
