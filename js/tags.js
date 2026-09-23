// tags.js — читает ID3-теги mp3: название, исполнителя и вшитую обложку.

// minimal ID3v2 reader: title, artist and the embedded cover
async function readTags(file){
  const head = new Uint8Array(await file.slice(0, 10).arrayBuffer());
  if (head[0] !== 0x49 || head[1] !== 0x44 || head[2] !== 0x33) return {};
  const ver = head[3], flags = head[5];
  const synch = (b, i) => (b[i] << 21) | (b[i+1] << 14) | (b[i+2] << 7) | b[i+3];
  const be = (b, i, n) => { let v = 0; for (let k = 0; k < n; k++) v = v*256 + b[i+k]; return v; };
  const size = synch(head, 6);
  const b = new Uint8Array(await file.slice(0, Math.min(10 + size, 12e6)).arrayBuffer());
  const decode = (bytes, enc) => {
    let label = 'utf-8';
    if (enc === 0) label = bytes.some(x => x > 0x7f) ? 'windows-1251' : 'iso-8859-1';  // old Russian tags are usually cp1251
    else if (enc === 1) label = bytes[0] === 0xfe ? 'utf-16be' : 'utf-16le';
    else if (enc === 2) label = 'utf-16be';
    return new TextDecoder(label).decode(bytes).replace(/^﻿/, '').replace(/\0+$/g, '').split('\0')[0].trim();
  };
  const endOfStr = (i, enc) => {
    if (enc === 1 || enc === 2){ while (i + 1 < b.length && !(b[i] === 0 && b[i+1] === 0)) i += 2; return i + 2; }
    while (i < b.length && b[i] !== 0) i++; return i + 1;
  };
  const out = {};
  let pos = 10;
  if (flags & 0x40) pos += ver === 4 ? synch(b, 10) : 4 + be(b, 10, 4);
  const hdr = ver === 2 ? 6 : 10, end = Math.min(b.length, 10 + size);
  while (pos + hdr <= end){
    const id = String.fromCharCode(...b.subarray(pos, pos + (ver === 2 ? 3 : 4)));
    if (!/^[A-Z0-9]{3,4}$/.test(id)) break;
    const fsz = ver === 2 ? be(b, pos + 3, 3) : ver === 4 ? synch(b, pos + 4) : be(b, pos + 4, 4);
    const s0 = pos + hdr, body = b.subarray(s0, s0 + fsz);
    if (id === 'TIT2' || id === 'TT2') out.title = decode(body.subarray(1), body[0]);
    else if (id === 'TPE1' || id === 'TP1') out.artist = decode(body.subarray(1), body[0]);
    else if ((id === 'APIC' || id === 'PIC') && !out.picture){
      const enc = b[s0]; let i = s0 + 1, mime;
      if (id === 'PIC'){ mime = 'image/' + String.fromCharCode(...b.subarray(i, i + 3)).toLowerCase().replace('jpg', 'jpeg'); i += 3; }
      else { const j = endOfStr(i, 0); mime = String.fromCharCode(...b.subarray(i, j - 1)) || 'image/jpeg'; i = j; }
      i += 1;                    // picture type
      i = endOfStr(i, enc);      // description
      out.picture = new Blob([b.subarray(i, s0 + fsz)], {type: mime.includes('/') ? mime : 'image/' + mime});
    }
    pos = s0 + fsz;
  }
  return out;
}
