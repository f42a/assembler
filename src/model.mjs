export const MODULES=[
{id:'shaft',name:'Вал и подшипники',short:'Вал',move:[0,2.9,-3.5],requires:[]},
{id:'compressor',name:'Осевой компрессор',short:'Компрессор',move:[-2.2,3.1,.2],requires:['shaft']},
{id:'combustor',name:'Камера сгорания',short:'Камера',move:[0,3.6,-1.3],requires:['compressor']},
{id:'turbine',name:'Двухступенчатая турбина',short:'Турбина',move:[2.9,2.6,.2],requires:['shaft','combustor']},
{id:'nozzle',name:'Реактивное сопло',short:'Сопло',move:[4.0,.6,.3],requires:['turbine']},
{id:'inlet',name:'Воздухозаборник',short:'Впуск',move:[-3.7,1.1,.2],requires:['compressor']}
];
export function mayInstall(id,installed){const m=MODULES.find(m=>m.id===id);return !!m&&!installed.has(id)&&m.requires.every(id=>installed.has(id));}
export function complete(installed){return MODULES.every(m=>installed.has(m.id));}
export function missingConnections(id,installed){return MODULES.find(m=>m.id===id)?.requires.filter(r=>!installed.has(r))||[];}
export function nextModule(installed){return MODULES.find(m=>mayInstall(m.id,installed))?.id||null;}
export function follow(current,target,dt,tau=.38){return current+(target-current)*(1-Math.exp(-Math.max(0,Math.min(dt,.05))/tau));}
export function spin(speed,dt){return speed*Math.max(0,Math.min(dt,.05));}

export function magnetRadius(viewportWidth){return Math.min(82,Math.max(42,viewportWidth*.14));}
export function withinMagnet(centre,home,viewportWidth){return Math.hypot(centre[0]-home[0],centre[1]-home[1])<=magnetRadius(viewportWidth);}
