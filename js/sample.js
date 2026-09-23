// sample.js — примеры кучек, которые видно при первом запуске,
// и пустое начало («начать с чистого»).

function sample(){
  const P = (name,start,end,bg,formula,items) => ({id:uid(),name,start,end,bg,formula,items:items.map(i => ({id:uid(),size:1,r:0,...i}))});
  const song = (title,x,y,ts,extra={}) => ({type:'song',title,url:yt(title),platform:'YouTube',x,y,ts,size:.8,...extra});
  const periods = [
    P('Переезд и тишина','2025-11-03','2026-01-26','nebo','Просто дожить до весны и не потерять себя.',[
      {type:'quote',text:'Делай медленно, но каждый день',x:-150,y:30,ts:'2025-11-20T22:14',r:-2},
      {type:'photo',bg:'linear-gradient(170deg,#DCE6F3 0%,#EEF1F8 45%,#F6E4EC 100%)',caption:'окно в новой квартире',x:170,y:40,ts:'2025-12-08T09:30',r:3,size:.9}
    ]),
    P('Весна и глина','2026-01-26','2026-04-18','persik','Руки знают раньше головы.',[
      {type:'photo',bg:'radial-gradient(60% 50% at 50% 60%,#E9C3A8 0%,#C99477 60%,#F3E2D6 61%,#F9EDE4 100%)',caption:'первая кривая чашка',x:-290,y:-10,ts:'2026-02-02T18:05',r:-4,size:1.1},
      song('Björk — Hyperballad',60,-80,'2026-02-11T23:40'),
      {type:'quote',text:'Ошибка — это тоже форма',x:280,y:-20,ts:'2026-02-19T21:02',size:1.1},
      {type:'goal',text:'Записаться на гончарный курс',done:true,x:-20,y:10,ts:'2026-02-03T10:12'},
      {type:'photo',bg:'linear-gradient(135deg,#FFF1D8 0%,#F8D8B0 40%,#E8B598 100%)',caption:'свет в мастерской',x:40,y:190,ts:'2026-03-07T16:20',r:3,size:.8},
      song('Cocteau Twins — Heaven or Las Vegas',290,150,'2026-03-15T01:10'),
      {type:'quote',text:'Красота живёт в незаконченном',x:-290,y:230,ts:'2026-03-28T20:44',size:.8},
      {type:'goal',text:'Слепить сервиз для мамы',done:false,x:300,y:-130,ts:'2026-04-01T12:00'}
    ]),
    P('Лето на износ','2026-04-18','2026-08-04','myata','Слишком много чужих задач.',[
      {type:'goal',text:'Сдать проект до июля',done:true,x:-180,y:0,ts:'2026-05-06T09:15'},
      song('Земфира — Хочешь?',150,-40,'2026-06-21T02:30'),
      {type:'quote',text:'Отдых — тоже работа',x:40,y:150,ts:'2026-07-30T22:00',size:.9}
    ]),
    P('Большая практика','2026-08-04',null,'lav','Делать красивые штуки руками и кодом.',[
      {type:'photo',bg:'linear-gradient(150deg,#FFD6E7 0%,#EBD9FF 55%,#CFE6FF 100%)',caption:'первый проект: Y2K CD-плеер',x:-300,y:-20,ts:'2026-08-10T19:30',r:-3,size:1.1},
      song('Björk — Hyperballad',60,-75,'2026-08-14T00:12'),
      {type:'quote',text:'Делай медленно, но каждый день',x:280,y:20,ts:'2026-08-22T21:48',size:1.1},
      {type:'goal',text:'Собрать карту кучек',done:false,x:-30,y:30,ts:'2026-09-01T11:00'},
      {type:'photo',bg:'linear-gradient(#F4C4D4 1px,transparent 1px) 0 0/14px 14px,linear-gradient(90deg,#F4C4D4 1px,#fff 1px) 0 0/14px 14px',caption:'розовая сетка — референс',x:30,y:200,ts:'2026-09-12T15:05',r:2,size:.75},
      song('Mitski — My Love Mine All Mine',290,170,'2026-09-15T23:20'),
      {type:'quote',text:'Вдохновение приходит во время работы',x:-300,y:240,ts:'2026-09-18T10:40',size:.8},
      {type:'goal',text:'Показать проект друзьям',done:false,x:310,y:-120,ts:'2026-09-20T13:00'}
    ])
  ];
  periods[1].coverId = periods[1].items[0].id;   // first crooked cup
  periods[3].coverId = periods[3].items[0].id;   // the CD player project
  return {periods, examples:true};
}
function blank(){ return {periods:[{id:uid(),name:'Сейчас',start:today(),end:null,bg:'utro',formula:'',items:[]}], examples:false}; }
