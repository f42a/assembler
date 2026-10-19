import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {makeEngine} from './engine.mjs';
import {makeDevice} from './devices.mjs';
import {follow} from './model.mjs';
import {PROJECTS,shuffle,canSeat,complete,snapRadius,blueprintEdges} from './assembly-model.mjs';
const $=s=>document.querySelector(s),host=$('#viewport');
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch(e){$('#fallback').hidden=false;host.hidden=true;$('#assembly').disabled=true;$('#run').disabled=true;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.90;renderer.setClearColor(0x171c20,0);host.append(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x171c20,175,320);
const pmrem=new THREE.PMREMGenerator(renderer);const envScene=new RoomEnvironment();const environment=pmrem.fromScene(envScene,.035);scene.environment=environment.texture;scene.environmentIntensity=.55;envScene.dispose();pmrem.dispose();
const camera=new THREE.PerspectiveCamera(34,1,.1,350);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=8;controls.maxDistance=160;controls.maxPolarAngle=Math.PI*.83;controls.minPolarAngle=.13;controls.enablePan=false;controls.rotateSpeed=.65;controls.zoomSpeed=.75;
const hemi=new THREE.HemisphereLight(0xc8e0ef,0x36312c,1.05);scene.add(hemi);
const key=new THREE.DirectionalLight(0xeaf3fc,2.9);key.position.set(-4,11,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-11;key.shadow.camera.right=11;key.shadow.camera.top=9;key.shadow.camera.bottom=-9;key.shadow.normalBias=.05;key.shadow.bias=-.0003;key.shadow.radius=3;scene.add(key);scene.add(key.target);
const rim=new THREE.DirectionalLight(0x8ec5e2,2.5);rim.position.set(3,5,-8);scene.add(rim);
const warm=new THREE.DirectionalLight(0xffdfbd,1.0);warm.position.set(-8,3,1);scene.add(warm);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.ShadowMaterial({color:0x000000,opacity:.38}));ground.rotation.x=-Math.PI/2;ground.position.y=-.055;ground.receiveShadow=true;scene.add(ground);
let engine,pieces=[],order=[],drawing,project=0,selected=null,blueprint=true,running=false,finished=false,drag=null,speed=0,angle=0,last=0,frame=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
const moduleNames={shaft:'Вал с подшипниками',inlet:'Воздухозаборник',compressor:'Компрессор',combustor:'Камера сгорания',turbine:'Турбина',nozzle:'Сопло'};
const burnerLight=new THREE.PointLight(0xff7a34,0,5,2);burnerLight.position.set(.25,2.55,.4);scene.add(burnerLight);
function report(s){$('#status-text').textContent=s;$('#live').textContent=s;}
function disposeEngine(){if(drawing){scene.remove(drawing);drawing.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}if(engine){scene.remove(engine.root);const geometries=new Set(),materials=new Set();engine.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}}
function startProject(index){
 drag=null;controls.enabled=true;disposeEngine();project=index;selected=null;finished=false;running=false;speed=0;angle=0;blueprint=true;pieces=[];
 const config=PROJECTS[index];
 engine=config.id==='turbine'?makeEngine():makeDevice(config.id);scene.add(engine.root);
 if(!engine.camera)engine.camera={target:[-.4,2.4,0],span:13,distance:24};
 const moduleIds=config.modules||Object.keys(engine.modules);
 engine.update?.(0,0);
 engine.root.updateMatrixWorld(true);
 for(const id of moduleIds){
  const g=engine.modules[id],count=config.splits?.[id]||1,children=[...g.children];
  const rotors=children.filter(o=>engine.rotors.includes(o));
  let groups=[];
  if(count===1)groups=[children];
  else{
   groups=rotors.map(o=>[o]);
   const stationary=children.filter(o=>!rotors.includes(o));
   const n=count-groups.length;
   stationary.sort((a,b)=>new THREE.Box3().setFromObject(a).getCenter(new THREE.Vector3()).x-new THREE.Box3().setFromObject(b).getCenter(new THREE.Vector3()).x);
   for(let i=0;i<n;i++)groups.push(stationary.slice(Math.floor(i*stationary.length/n),Math.floor((i+1)*stationary.length/n)));
  }
  groups.forEach((children,i)=>{
   if(!children.length)return;
   const group=new THREE.Group();engine.root.add(group);engine.root.updateMatrixWorld(true);
   for(const child of children)group.attach(child);
   group.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(group),home=box.getCenter(new THREE.Vector3()).sub(engine.root.position);
   for(const child of group.children)child.position.sub(home);
   group.position.copy(home);group.updateMatrixWorld(true);
   const isRotor=children.some(o=>engine.rotors.includes(o));
   const p={id:`${id}-${i}`,module:id,obj:group,home,installed:false,turn:0,requires:[],rotor:isRotor,name:count===1?(engine.names?.[id]||moduleNames[id]):isRotor?(id==='inlet'?'Обтекатель':id==='compressor'?'Рабочее колесо компрессора':'Рабочее колесо турбины'):(id==='compressor'?'Статор и корпус':id==='combustor'?'Секция камеры сгорания':id==='nozzle'?'Секция сопла':moduleNames[id])};
   group.traverse(o=>o.userData.piece=p.id);pieces.push(p);
  });
 }
 drawing=new THREE.Group();drawing.position.copy(engine.root.position);scene.add(drawing);drawing.updateMatrixWorld(true);
 // Build the drawing from final component transforms, not the loose kit.
 for(const p of [...pieces,...engine.root.children.filter(o=>!o.userData.effect&&!pieces.some(p=>p.obj===o)&&!Object.values(engine.modules).includes(o)).map(obj=>({obj}))]){p.obj.updateMatrixWorld(true);const outlines=new THREE.Group();drawing.add(outlines);
 p.obj.traverse(o=>{if(!o.isMesh||o.material.opacity===0||o.userData.noDrawing)return;
 for(let ancestor=o;ancestor&&ancestor!==p.obj.parent;ancestor=ancestor.parent)if(!ancestor.visible)return;const geo=blueprintEdges(o.geometry),mat=new THREE.LineBasicMaterial({color:0xa0c9d6,transparent:true,opacity:.55});
 for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){const line=new THREE.LineSegments(geo,mat),m=o.matrixWorld.clone();if(o.isInstancedMesh){const inst=new THREE.Matrix4();o.getMatrixAt(i,inst);m.multiply(inst);}m.premultiply(drawing.matrixWorld.clone().invert());const surface=new THREE.Mesh(o.geometry,new THREE.MeshBasicMaterial({color:0x1d2a30,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}));surface.applyMatrix4(m);outlines.add(surface);line.applyMatrix4(m);outlines.add(line);}
 });}
 // Engineering centreline stays in the drawing only and remains readable through dense edges.
 if(config.id==='turbine'){
 const axisEnd=5.6;
 const axisGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6.2,0,0),new THREE.Vector3(axisEnd,0,0)]);
 const axis=new THREE.Line(axisGeometry,new THREE.LineDashedMaterial({color:0xf0cc88,dashSize:.22,gapSize:.10,transparent:true,opacity:.95,depthTest:false}));axis.computeLineDistances();axis.renderOrder=10;drawing.add(axis);
 const marks=[];for(const x of [-6.2,axisEnd])marks.push(new THREE.Vector3(x,-.14,0),new THREE.Vector3(x,.14,0),new THREE.Vector3(x,0,-.14),new THREE.Vector3(x,0,.14));
 const ticks=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(marks),new THREE.LineBasicMaterial({color:0xf0cc88,depthTest:false}));ticks.renderOrder=10;drawing.add(ticks);
 }
 order=shuffle(pieces);if(order.every((p,i)=>p===pieces[i]))order.reverse();
 for(const p of pieces){p.obj.rotation.y=p.turn*Math.PI;p.obj.visible=false;}
 $('#project-title').textContent=config.title;$('#project-label').textContent=`ПРОЕКТ ${index+1} / ${PROJECTS.length}`;$('#kit-count').textContent=`${pieces.length} деталей`;
 $('#projects').innerHTML=PROJECTS.map((c,i)=>`<button data-project="${i}" class="${i===index?'active':''}" aria-label="Проект ${i+1}: ${c.title}">${i+1}</button>`).join('');
 createTray();ui();resize();fitCamera();report('Рассмотри чертёж, затем начни сборку');kick();
}
const thumbScene=new THREE.Scene();thumbScene.environment=environment.texture;thumbScene.environmentIntensity=.8;thumbScene.add(new THREE.HemisphereLight(0xd9ebff,0x38414a,2));const thumbLight=new THREE.DirectionalLight(0xffffff,4);thumbLight.position.set(-3,5,6);thumbScene.add(thumbLight);
function thumbnail(p){
 const clone=p.obj.clone(true);clone.visible=true;clone.position.set(0,0,0);thumbScene.add(clone);clone.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(clone),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),cam=new THREE.PerspectiveCamera(32,1.5,.01,100);
 const radius=size.length()/2;cam.position.copy(center).addScaledVector(new THREE.Vector3(-.9,.45,1).normalize(),radius/Math.sin(16*Math.PI/180)*1.10);cam.lookAt(center);
 renderer.setSize(180,120,false);renderer.render(thumbScene,cam);const url=renderer.domElement.toDataURL();thumbScene.remove(clone);return url;
}
function createTray(){
 $('#modules').innerHTML=order.map(p=>`<button data-part="${p.id}" aria-label="${p.name}" title="${p.name}"><img draggable="false" alt="${p.name}" src="${thumbnail(p)}"><span>${p.name}</span></button>`).join('');$('#modules').scrollLeft=0;resize();
}
function ui(){
 engine.root.visible=!blueprint;drawing.visible=blueprint;
 $('#assembly').textContent=blueprint?'Начать сборку':'Посмотреть чертёж';if(blueprint&&pieces.some(p=>p.installed))$('#assembly').textContent='Продолжить сборку';
 $('#assembly').setAttribute('aria-pressed',String(blueprint));$('#mode-label').textContent=blueprint?'ЧЕРТЁЖ':finished?'СОБРАНО':'СБОРКА';
 $('#tray').hidden=blueprint||finished;$('#selection').hidden=blueprint||!selected||finished;
 $('#selected-name').textContent=selected?.name||'';$('#flip').disabled=!!selected?.installed;
 $('#put-back').textContent=selected?.installed?'Снять деталь':'Вернуть в набор';
 $('#run').hidden=!finished;$('#run-label').textContent=running?'Остановить':'Пуск';$('#run-icon').setAttribute('d',running?'M5 5h10v10H5Z':'m7 4 8 6-8 6Z');$('#run').disabled=blueprint;
 $('#next').hidden=!finished||project===PROJECTS.length-1;$('#complete-note').hidden=!finished||blueprint;
 $('#progress').textContent=`${pieces.filter(p=>p.installed).length} / ${pieces.length}`;
 $('#gesture').textContent=blueprint?'Вращай чертёж, чтобы рассмотреть соединения':finished?'Можно вращать и рассматривать':(host.clientWidth<721?'Деталь → место · свайп набора — листать':'Перетащи деталь · R — перевернуть · фон — вращать');
 for(const b of $('#modules').children){const p=pieces.find(p=>p.id===b.dataset.part);b.classList.toggle('selected',selected===p);b.classList.toggle('installed',p.installed);b.disabled=p.installed;b.setAttribute('aria-pressed',String(selected===p));}
 host.dataset.mode=blueprint?'blueprint':'assembly';host.dataset.project=project;host.dataset.total=pieces.length;host.dataset.installed=pieces.filter(p=>p.installed).length;host.dataset.running=running;host.dataset.complete=finished;host.dataset.selected=selected?.id||'';
}
function stagePoint(){return controls.target.clone().addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),3.8).sub(engine.root.position);}
function select(p){
 if(blueprint||finished||p.installed)return;
 if(selected&&!selected.installed&&selected!==p)selected.obj.visible=false;
 selected=p;p.obj.visible=true;p.obj.position.copy(stagePoint());ui();kick();
}
function flip(){if(!selected||selected.installed||blueprint)return;selected.turn=1-selected.turn;selected.obj.rotation.y=selected.turn*Math.PI;const b=$(`[data-part="${selected.id}"] img`);b.src=thumbnail(selected);resize();kick();}
function putBack(){if(!selected||selected.installed)return;selected.obj.visible=false;selected=null;ui();report('');kick();}
function screen(v){const p=v.clone().project(camera),r=renderer.domElement.getBoundingClientRect();return new THREE.Vector2((p.x+1)*r.width/2+r.left,(-p.y+1)*r.height/2+r.top);}
function rayAt(e){const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);return ray;}
function seat(p){
 const distance=screen(p.obj.position.clone().add(engine.root.position)).distanceTo(screen(p.home.clone().add(engine.root.position)));
 if(canSeat(p,pieces,distance,snapRadius(host.clientWidth))){
 p.installed=true;p.turn=0;p.obj.position.copy(p.home);p.obj.rotation.y=0;selected=null;report('');
 if(complete(pieces)){finished=true;running=true;report('Собрано. Механизм работает.');}
 ui();resize();kick();return true;
 }
 report('');kick();return false;
}
function beginDrag(p,e,fromTray=false){
 if(blueprint||finished||p.installed)return; if(fromTray)select(p);else{selected=p;ui();}
 const world=p.obj.position.clone().add(engine.root.position),plane=new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),world);
 const hit=rayAt(e).ray.intersectPlane(plane,new THREE.Vector3());if(!hit)return;
 drag={p,plane,offset:fromTray?new THREE.Vector3():world.clone().sub(hit),pointer:e.pointerId,start:new THREE.Vector2(e.clientX,e.clientY),moved:false,touchTray:fromTray&&e.pointerType==='touch',scrollStart:$('#modules').scrollLeft,mode:null};controls.enabled=false;
 if(!fromTray)renderer.domElement.setPointerCapture(e.pointerId);e.preventDefault();
}
window.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointer)return;
 const dx=e.clientX-drag.start.x,dy=e.clientY-drag.start.y;drag.moved ||=Math.hypot(dx,dy)>5;if(!drag.moved)return;
 if(drag.touchTray&&!drag.mode)drag.mode=Math.abs(dx)>Math.abs(dy)*1.2?'scroll':'drag';
 if(drag.mode==='scroll'){$('#modules').scrollLeft=drag.scrollStart-dx;drag.p.obj.visible=false;selected=null;ui();kick();return;}
 const v=rayAt(e).ray.intersectPlane(drag.plane,new THREE.Vector3());if(v){drag.p.obj.position.copy(v.add(drag.offset).sub(engine.root.position));kick();}
});
function release(e,cancel=false){if(!drag||e.pointerId!==drag.pointer)return;const d=drag;drag=null;controls.enabled=true;if(d.moved&&!cancel&&d.mode!=='scroll'){const v=rayAt(e).ray.intersectPlane(d.plane,new THREE.Vector3());if(v)d.p.obj.position.copy(v.add(d.offset).sub(engine.root.position));const r=host.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)seat(d.p);else {d.p.obj.visible=false;selected=null;ui();}}kick();}
window.addEventListener('pointerup',e=>release(e));window.addEventListener('pointercancel',e=>release(e,true));
$('#modules').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-part]');if(b&&e.button===0)beginDrag(pieces.find(p=>p.id===b.dataset.part),e,true);});
$('#modules').addEventListener('click',e=>{if(e.detail!==0)return;const b=e.target.closest('[data-part]');if(b)select(pieces.find(p=>p.id===b.dataset.part));});
let sceneTap=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(blueprint||finished||e.button!==0)return;rayAt(e);const h=ray.intersectObjects(pieces.filter(p=>p.obj.visible).map(p=>p.obj),true)[0];if(h){const p=pieces.find(p=>p.id===h.object.userData.piece);if(p&&!p.installed){beginDrag(p,e);return;}}if(selected&&!selected.installed)sceneTap={id:e.pointerId,x:e.clientX,y:e.clientY};},true);
renderer.domElement.addEventListener('pointerup',e=>{const t=sceneTap;sceneTap=null;if(!t||t.id!==e.pointerId||!selected||selected.installed||Math.hypot(e.clientX-t.x,e.clientY-t.y)>5)return;const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),selected.home.clone().add(engine.root.position));const v=rayAt(e).ray.intersectPlane(plane,new THREE.Vector3());if(v){selected.obj.position.copy(v.sub(engine.root.position));seat(selected);}},true);
renderer.domElement.addEventListener('pointercancel',()=>{sceneTap=null;});
function fitCamera(){const cfg=engine.camera,target=new THREE.Vector3(...cfg.target);controls.target.copy(target);const aspect=host.clientWidth/host.clientHeight;const d=Math.max(cfg.distance,cfg.span/(2*Math.tan(17*Math.PI/180)*aspect*.80));camera.position.copy(target).addScaledVector(new THREE.Vector3(-.65,.45,1).normalize(),d);controls.update();kick();}
function resize(){renderer.setSize(host.clientWidth,host.clientHeight,false);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();kick();}
function tick(now){frame=0;const dt=Math.min((now-last)/1000||.016,.05);last=now;
 speed=follow(speed,running&&!blueprint?1:0,dt,1.2);angle+=speed*dt*3.5;
 for(const rotor of engine?.rotors||[])if(!reduced.matches&&!blueprint)rotor.rotation.x=angle;
 for(const m of engine?.hot||[]){m.emissiveIntensity=speed*2.4;m.opacity=speed*.34;}burnerLight.intensity=PROJECTS[project].id==='turbine'?speed*5:0;
 if(engine.update&&!blueprint)engine.update(reduced.matches?0:angle,finished?speed:0);host.dataset.motion=angle.toFixed(3);
 controls.update();renderer.render(scene,camera);
 if(selected){host.dataset.selected=selected.id;host.dataset.turn=selected.turn;host.dataset.partPos=screen(selected.obj.position.clone().add(engine.root.position)).toArray().join(',');host.dataset.homePos=screen(selected.home.clone().add(engine.root.position)).toArray().join(',');}
 if(!document.hidden&&(running||speed>.001))kick();
}
function kick(){if(!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
controls.addEventListener('change',kick);
$('#assembly').onclick=()=>{blueprint=!blueprint;ui();report('');resize();};
$('#flip').onclick=flip;$('#put-back').onclick=putBack;
$('#run').onclick=()=>{running=!running;ui();kick();};$('#next').onclick=()=>startProject(Math.min(PROJECTS.length-1,project+1));
$('#projects').onclick=e=>{const b=e.target.closest('[data-project]');if(b&&+b.dataset.project!==project)startProject(+b.dataset.project);};
$('#reset-view').onclick=fitCamera;$('.brand').onclick=e=>{e.preventDefault();fitCamera();};
$('#help').onclick=()=>$('#help-dialog').showModal();$('#close-help').onclick=()=>$('#help-dialog').close();
window.addEventListener('keydown',e=>{if($('#help-dialog').open)return;
 if(e.key.toLowerCase()==='r'||e.key.toLowerCase()==='к'){flip();e.preventDefault();}
 if(e.key==='Escape'&&selected){putBack();}
 if(e.key==='Enter'&&selected&&!selected.installed){seat(selected);e.preventDefault();}
 if(selected&&!selected.installed&&e.key.startsWith('Arrow')){const axis=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,['ArrowLeft','ArrowRight'].includes(e.key)?0:1);selected.obj.position.addScaledVector(axis,['ArrowLeft','ArrowDown'].includes(e.key)?-.16:.16);e.preventDefault();kick();}
});
window.addEventListener('resize',()=>{resize();fitCamera();});document.addEventListener('visibilitychange',kick);
startProject(0);resize();fitCamera();
