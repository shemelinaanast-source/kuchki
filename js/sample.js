// sample.js — примеры кучек, которые видно при первом запуске (как на макете),
// и пустое начало («начать с чистого»).

const SAMPLE_VERSION = 2;
function sample(){
  const P = (name, start, end, sphere, formula, items) => ({id:uid(), name, start, end, sphere, bg:'bumaga', formula, items:items.map(i => ({id:uid(), size:1, r:0, ...i}))});
  const song = (title, x, y, ts, extra = {}) => ({type:'song', title, url:yt(title), platform:'YouTube', x, y, ts, ...extra});
  const img = (name, x, y, ts, extra = {}) => ({type:'photo', src:`design/assets/${name}.png`, caption:'', x, y, ts, size:.85, ...extra});
  const periods = [
    P('Июль пасечный', '2026-07-01', '2026-07-31', 'july', '', [
      {type:'quote', text:'мёд, пчёлы и тишина', x:-160, y:-60, ts:'2026-07-06T19:10'},
      song('Björk — Hyperballad', 160, 60, '2026-07-18T23:40'),
      {type:'goal', text:'научиться делать свечи из воска', done:false, x:-120, y:120, ts:'2026-07-10T11:00'},
      img('flower', 220, -120, '2026-07-14T17:30', {size:.6}),
      {type:'quote', text:'всё сладкое — медленное', x:40, y:-150, ts:'2026-07-22T21:15'},
      song('Mitski — My Love Mine All Mine', -300, 40, '2026-07-27T00:20')
    ]),
    P('Август на Атлантике', '2026-08-01', '2026-08-31', 'atlantic', '', [
      {type:'quote', text:'солёный ветер и длинные дни', x:-160, y:-40, ts:'2026-08-09T09:30'},
      song('Cocteau Twins — Heaven or Las Vegas', 180, 40, '2026-08-21T01:10'),
      img('feel', -260, 120, '2026-08-12T14:00', {size:.6}),
      {type:'goal', text:'проплыть до буйка', done:true, x:60, y:170, ts:'2026-08-15T08:40'},
      {type:'quote', text:'океан не спешит', x:120, y:-150, ts:'2026-08-24T20:05'},
      song('Björk — Hyperballad', -40, 60, '2026-08-28T23:50')
    ]),
    P('Штучки в сентябре', '2026-09-01', null, 'sept', '', [
      {type:'quote', text:'Meow', sticker:true, x:-372, y:-230, ts:'2026-09-02T12:00'},
      img('quest', -69, -182, '2026-09-04T18:20'),
      img('feel', -7, 7, '2026-09-08T10:05'),
      img('flower', -197, 138, '2026-09-11T21:40'),
      img('flowers', 36, 204, '2026-09-15T16:00'),
      img('pink-mood', 417, -138, '2026-09-19T11:30', {size:1.35, caption:'My main project mood'}),
      song('Alicia Keys-Fallin', 335, 157, '2026-09-22T23:15')
    ])
  ];
  return {periods, examples:true, v:SAMPLE_VERSION, band:'grey'};
}
function blank(){ return {periods:[{id:uid(), name:'Сейчас', start:today(), end:null, sphere:'july', bg:'bumaga', formula:'', items:[]}], examples:false, v:SAMPLE_VERSION, band:state?.band || 'grey'}; }
