export const PROJECTS=[
 {id:'indicator',title:'Измерительный стенд',count:7},
 {id:'waves',title:'Волновая установка',count:9},
 {id:'computer',title:'Настольный компьютер',count:11},
 {id:'arcade',title:'Аркадный автомат',count:13},
 {id:'hand',title:'Механическая рука',count:15},
 {id:'turbine',title:'Турбореактивный двигатель',count:20,modules:['shaft','inlet','compressor','combustor','turbine','nozzle'],splits:{shaft:1,inlet:2,compressor:8,combustor:4,turbine:3,nozzle:2}},
 {id:'rocket',title:'Ракетный двигатель',count:24}
];
export function shuffle(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function snapRadius(width){return Math.min(32,Math.max(22,width*.035));}
export function canSeat(part,parts,distance,radius){return !part.installed && Number.isFinite(distance) && distance<=radius;}
export function complete(parts){return parts.length>0&&parts.every(p=>p.installed);}
