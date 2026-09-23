// state.js — общее состояние приложения и ссылки на главные элементы страницы.
// state.periods — периоды по порядку; последний без даты конца — текущий.

const map = $('#map'), world = $('#world'), space = $('#space'), spWorld = $('#spWorld'), spCanvas = $('#spCanvas');

let state, cam = {x:0,y:0,k:1}, open = null, savedCam = null, spPan = {x:0,y:0}, spZ = 1, goalMode = false;
const cur = () => state.periods[state.periods.length - 1];
const byId = id => state.periods.find(p => p.id === id);
const target = () => open ? byId(open) : cur();
