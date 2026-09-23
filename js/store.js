// store.js — сохранение в этом браузере (IndexedDB).
// Все кучки лежат одной записью, а каждый mp3 — отдельным файлом,
// чтобы большие треки не раздували основную запись.

const Store = (() => {
  let dbp = null, timer = 0, ok = 'indexedDB' in window;

  const db = () => dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('kuchki', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('tracks'); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  // run one request inside a transaction and resolve when it's committed
  const run = async (name, mode, fn) => {
    const t = (await db()).transaction(name, mode), req = fn(t.objectStore(name));
    return new Promise((res, rej) => { t.oncomplete = () => res(req && req.result); t.onerror = t.onabort = () => rej(t.error); });
  };

  // what goes to disk: no layout leftovers (_x, _y, _tip) and no blob: urls of local tracks
  function snapshot(st){
    const copy = JSON.parse(JSON.stringify(st, (k, v) => k[0] === '_' ? undefined : v));
    copy.periods.forEach(p => p.items.forEach(i => { if (i.local) delete i.src; }));
    return copy;
  }
  async function write(st){
    try { await run('kv', 'readwrite', s => s.put(snapshot(st), 'state')); }
    catch (e) { ok = false; console.warn('save failed', e); syncNote(); }
  }

  return {
    get ok(){ return ok; },
    // returns {state, tracks: Map(id → Blob)} or null on first launch
    async load(){
      try {
        const st = await run('kv', 'readonly', s => s.get('state'));
        if (!st) return null;
        const t = (await db()).transaction('tracks', 'readonly'), os = t.objectStore('tracks');
        const keys = os.getAllKeys(), vals = os.getAll();
        await new Promise((res, rej) => { t.oncomplete = res; t.onerror = () => rej(t.error); });
        return {state: st, tracks: new Map(keys.result.map((k, i) => [k, vals.result[i]]))};
      } catch (e) { ok = false; console.warn('load failed', e); return null; }
    },
    // debounced: typing a name or dragging a photo doesn't hammer the disk
    save(st){ if (!ok) return; clearTimeout(timer); timer = setTimeout(() => write(st), 300); },
    flush(st){ if (!ok || !timer) return; clearTimeout(timer); timer = 0; write(st); },
    putTrack(id, blob){ if (ok) run('tracks', 'readwrite', s => s.put(blob, id)).catch(e => console.warn(e)); },
    delTrack(id){ if (ok) run('tracks', 'readwrite', s => s.delete(id)).catch(e => console.warn(e)); },
    async clear(){ if (!ok) return; await run('tracks', 'readwrite', s => s.clear()); await run('kv', 'readwrite', s => s.clear()); }
  };
})();

const save = () => Store.save(state);
addEventListener('pagehide', () => Store.flush(state));
addEventListener('visibilitychange', () => { if (document.hidden) Store.flush(state); });
