import * as T from 'three';
// Original Three.js assembly models inspired by Anatomy's instrument vocabulary.
function kit(){
 const root=new T.Group(),modules={},names={},parts=[],motions=[];let count=0;
 const palette={steel:[0xaab9c4,.86,.27],bright:[0xe0e8eb,.86,.22],dark:[0x293844,.75,.4],teal:[0x366b70,.55,.36],copper:[0xbe8052,.8,.3],brass:[0xc4a16a,.8,.3],black:[0x111a20,.15,.54],ivory:[0xd1cbb5,.25,.4],red:[0xb65042,.4,.35],blue:[0x4b8b9a,.5,.3]};
 const mats=Object.fromEntries(Object.entries(palette).map(([k,[color,metalness,roughness]])=>[k,new T.MeshStandardMaterial({color,metalness,roughness})]));
 const material=m=>typeof m==='string'?mats[m]:m;
 function mesh(g,geo,m='steel',p=[0,0,0]){const o=new T.Mesh(geo,material(m));o.position.set(...p);o.castShadow=true;o.receiveShadow=true;g.add(o);parts.push(o);count++;return o;}
 function box(g,p,s,m='steel'){return mesh(g,new T.BoxGeometry(...s),m,p);}
 function cyl(g,p,r,h,m='steel',axis='y',rt=r,n=40){const o=mesh(g,new T.CylinderGeometry(rt,r,h,n),m,p);if(axis==='z')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.z=Math.PI/2;return o;}
 function torus(g,p,r,t=.04,m='steel',axis='y'){const o=mesh(g,new T.TorusGeometry(r,t,8,56),m,p);if(axis==='y')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;return o;}
 function rod(g,a,b,r=.05,m='steel'){const a1=new T.Vector3(...a),b1=new T.Vector3(...b);const o=cyl(g,a1.clone().add(b1).multiplyScalar(.5).toArray(),r,a1.distanceTo(b1),m);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b1.sub(a1).normalize());return o;}
 function pipe(g,points,r=.06,m='copper'){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),40,r,10,false),m);}
 function bolts(g,p,r,n=12,axis='y'){for(let i=0;i<n;i++){const a=i*2*Math.PI/n;const q=axis==='y'?[p[0]+r*Math.cos(a),p[1],p[2]+r*Math.sin(a)]:axis==='z'?[p[0]+r*Math.cos(a),p[1]+r*Math.sin(a),p[2]]:[p[0],p[1]+r*Math.cos(a),p[2]+r*Math.sin(a)];cyl(g,q,.055,.065,'bright',axis,.055,6);}}
 function part(id,name){const module=new T.Group(),inner=new T.Group();module.add(inner);root.add(module);modules[id]=module;names[id]=name;return inner;}
 function group(parent,p=[0,0,0]){const g=new T.Group();g.position.set(...p);parent.add(g);return g;}
 function base(w=7,d=4){const g=new T.Group();root.add(g);box(g,[0,.12,0],[w,.24,d],'dark');for(const x of [-w/2+.35,w/2-.35])for(const z of [-d/2+.35,d/2-.35]){cyl(g,[x,.02,z],.18,.16,'black');cyl(g,[x,.28,z],.075,.08,'bright','y',.075,6);}return g;}
 function finish(camera){return{root,modules,names,rotors:[],hot:[],parts,mats,count,camera,update:(time,power)=>motions.forEach(fn=>fn(time,power))};}
 return{root,modules,names,mats,parts,motions,mesh,box,cyl,torus,rod,pipe,bolts,part,group,base,finish};
}
function indicator(){
 const k=kit(),{box,cyl,torus,rod,bolts,part,group}=k;k.base(7,3.8);
 let g=part('rails','Направляющие');for(const z of [-.65,.65]){rod(g,[-2.7,.65,z],[2.7,.65,z],.09);for(const x of [-2.6,2.6])box(g,[x,.44,z],[.4,.4,.4],'teal');}
 g=part('carriage','Измерительная каретка');const slide=group(g);box(slide,[.7,.77,0],[2.25,.24,1.65],'teal');for(let i=0;i<3;i++)box(slide,[i*.58,.97+i*.09,0],[.5,.16+i*.18,.72],'bright');for(let i=0;i<22;i++)box(slide,[-.3+i*.09,.90,.73],[.012,.015,i%5===0?.16:.08],'bright');
 g=part('post','Стойка индикатора');box(g,[-2.2,.55,-.7],[.9,.65,.9],'teal');cyl(g,[-2.2,2.0,-.7],.13,2.5);torus(g,[-2.2,1,-.7],.15,.045,'brass');
 g=part('arm','Кронштейн с зажимом');box(g,[-2.2,2.75,-.7],[.5,.5,.45],'dark');rod(g,[-2.2,2.75,-.7],[.8,2.75,-.7],.11);cyl(g,[-2.2,2.75,-.38],.21,.18,'brass','z');for(let i=0;i<20;i++){const a=i*Math.PI/10;box(g,[-2.2+.2*Math.cos(a),2.75+.2*Math.sin(a),-.38],[.03,.03,.19],'dark');}
 g=part('dial','Корпус индикатора');cyl(g,[.65,2.60,-.23],.71,.4,'dark','z');torus(g,[.65,2.60,0],.69,.065,'bright','z');cyl(g,[.65,2.60,.005],.63,.02,'ivory','z');for(let i=0;i<60;i++){const a=i*Math.PI/30,o=box(g,[.65+Math.sin(a)*.55,2.60+Math.cos(a)*.55,.025],[.015,i%5===0?.12:.055,.012],'black');o.rotation.z=-a;}bolts(g,[.65,2.60,.04],.7,4,'z');
 g=part('probe','Измерительный шток');cyl(g,[.65,1.65,-.18],.11,.68,'bright');cyl(g,[.65,1.29,-.18],.055,.15,'brass');for(let i=0;i<10;i++)torus(g,[.65,1.50+i*.035,-.18],.12,.015,'dark');
 g=part('needle','Стрелочный механизм');const needle=group(g,[.65,2.60,.06]);box(needle,[0,.23,0],[.035,.55,.025],'red');cyl(g,[.65,2.60,.08],.09,.06,'brass','z');
 k.motions.push((t,p)=>{slide.position.x=Math.sin(t*.35)*.5*p;needle.rotation.z=-Math.sin(t*.35)*1.5*p;});return k.finish({target:[0,1.5,0],span:8,distance:17});
}
function waves(){
 const k=kit(),{box,cyl,torus,rod,pipe,part,group}=k;k.base(7,5);
 let g=part('legs','Опоры резервуара');for(const x of [-2.65,2.65])for(const z of [-1.8,1.8]){rod(g,[x,.3,z],[x,1.5,z],.11);cyl(g,[x,.4,z],.2,.15,'brass');}
 g=part('tank','Рама резервуара');for(const x of [-2.7,2.7])box(g,[x,1.5,0],[.16,.45,3.8],'teal');for(const z of [-1.85,1.85])box(g,[0,1.5,z],[5.55,.45,.16],'teal');box(g,[0,1.3,0],[5.4,.08,3.65],'bright');for(let i=0;i<22;i++){box(g,[-2.5+i*.24,1.74,1.85],[.025,.015,i%5===0?.14:.07],'bright');}for(const x of [-2.7,2.7])for(const z of [-1.7,0,1.7])cyl(g,[x,1.75,z],.05,.06,'brass','y',.05,6);
 g=part('water','Прозрачная ванна');const waterMat=new T.MeshStandardMaterial({color:0x3f98a6,metalness:.55,roughness:.16,transparent:true,opacity:.78,side:T.DoubleSide});const water=k.mesh(g,new T.PlaneGeometry(5.25,3.5,60,40),waterMat,[0,1.5,0]);water.rotation.x=-Math.PI/2;for(const x of [-2.6,2.6])box(g,[x,1.48,0],[.04,.26,3.5],'blue');for(const z of [-1.73,1.73])box(g,[0,1.48,z],[5.2,.26,.04],'blue');const original=water.geometry.attributes.position.array.slice();
 g=part('bridge','Мост генератора');for(const x of [-2.7,2.7])box(g,[x,2,-.9],[.15,1,.23],'dark');box(g,[0,2.45,-.9],[5.6,.16,.3],'steel');
 g=part('motor','Эксцентриковый привод');cyl(g,[0,2.75,-.9],.3,.85,'teal','x');for(let i=0;i<10;i++)torus(g,[-.35+i*.075,2.75,-.9],.31,.025,'dark','x');cyl(g,[.55,2.75,-.9],.22,.1,'brass','x');
 g=part('dippers','Волнообразующие штоки');const dips=group(g);rod(dips,[-.85,2.15,-.85],[.85,2.15,-.85],.06);for(const x of [-.75,.75]){rod(dips,[x,2.15,-.85],[x,1.48,-.85],.045);cyl(dips,[x,1.48,-.85],.15,.08,'dark');}
 g=part('lamp-post','Стойка подсветки');rod(g,[2.9,.3,-1.8],[2.9,4.2,-1.8],.09);rod(g,[2.9,4.2,-1.8],[0,4.2,-.5],.09);cyl(g,[2.9,.45,-1.8],.25,.3,'teal');
 g=part('lamp','Осветитель');cyl(g,[0,3.97,-.5],.54,.35,'dark','y',.35);const lampMat=new T.MeshStandardMaterial({color:0xf2e4bd,emissive:0xffd89c,emissiveIntensity:0});cyl(g,[0,3.78,-.5],.48,.03,lampMat);
 g=part('control','Блок частоты');box(g,[2.3,.65,1.9],[1.1,.65,.65],'teal');cyl(g,[2.1,.65,2.25],.15,.08,'brass','z');pipe(g,[[2.6,.7,1.8],[3,.8,1],[3,1.9,-.9],[.3,2.5,-.9]],.035,'black');
 k.motions.push((t,p)=>{dips.position.y=Math.sin(t*3)*.04*p;lampMat.emissiveIntensity=p*2;const a=water.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=original[i*3],y=original[i*3+1];const r1=Math.hypot(x-.75,y-.85),r2=Math.hypot(x+.75,y-.85);a.setZ(i,p*.028*(Math.sin(r1*9-t*3)+Math.sin(r2*9-t*3)));}a.needsUpdate=true;water.geometry.computeVertexNormals();});return k.finish({target:[0,2,0],span:8,distance:18});
}
function computer(){
 const k=kit(),{box,cyl,torus,rod,pipe,part,group}=k;k.base(7,5);
 let g=part('chassis','Шасси компьютера');box(g,[0,.55,-.1],[4.4,.35,3],'ivory');for(const x of [-2.1,2.1])box(g,[x,1.0,-.5],[.12,.8,2.2],'ivory');
 g=part('board','Системная плата');box(g,[0,.79,-.35],[3.6,.09,2.2],'teal');for(let i=0;i<18;i++){box(g,[-1.5+(i%6)*.55,.87,-1+(i/6|0)*.65],[.32,.08,.28],'black');for(let j=0;j<4;j++)box(g,[-1.67+(i%6)*.55+j*.1,.87,-.82+(i/6|0)*.65],[.025,.04,.1],'brass');}
 g=part('cpu','Процессор с радиатором');box(g,[-.5,1,-.4],[.95,.15,.95],'dark');for(let i=0;i<12;i++)box(g,[-.96+i*.084,1.22,-.4],[.025,.3,.9],'bright');
 g=part('ram','Модули памяти');for(const z of [-.9,-.6]){box(g,[.8,1.10,z],[1.25,.48,.06],'teal');for(let i=0;i<5;i++)box(g,[.33+i*.23,1.14,z+.04],[.16,.25,.03],'black');}
 g=part('power','Блок питания');box(g,[1.25,1.05,.55],[1.15,.65,.85],'steel');for(let i=0;i<9;i++)box(g,[.8+i*.11,1.39,.55],[.025,.012,.65],'dark');pipe(g,[[1,1,.1],[1,1.5,-.2],[0,1.5,-.5],[-.1,.9,-.5]],.055,'red');
 g=part('drive','Дисковод');box(g,[-.9,1.05,1],[1.9,.45,.7],'dark');box(g,[-.9,1.05,1.37],[1.8,.35,.05],'ivory');box(g,[-.9,1.08,1.41],[1.3,.06,.03],'black');box(g,[-.2,.96,1.43],[.15,.05,.04],'teal');
 g=part('stand','Подставка монитора');box(g,[0,1.65,-.6],[2,.12,1.3],'ivory');box(g,[0,1.9,-.7],[.55,.55,.5],'dark');
 g=part('crt','Кинескоп');box(g,[0,3.0,-.4],[3.2,2.2,1.35],'dark');cyl(g,[0,3,-1.35],.4,.8,'steel','z',.18);pipe(g,[[0,3,-1.6],[1.4,2.6,-1.6],[1.4,1.1,-1]],.04,'black');
 g=part('bezel','Рамка экрана');for(const x of [-1.7,1.7])box(g,[x,3,.36],[.28,2.55,.35],'ivory');for(const y of [1.82,4.18])box(g,[0,y,.36],[3.6,.22,.35],'ivory');for(let i=0;i<7;i++)box(g,[1.3,2+i*.12,.56],[.17,.025,.02],'dark');
 g=part('display','Экран');const screenMat=new T.MeshStandardMaterial({color:0x091b17,emissive:0x2d9f75,emissiveIntensity:0,roughness:.2});box(g,[0,3,.31],[3.1,2.12,.08],screenMat);const pixels=group(g);for(let row=0;row<9;row++)for(let col=0;col<18;col++)if((col*7+row*11)%5!==0)box(pixels,[-1.3+col*.135,3.8-row*.16,.37],[.075,.035,.012],'teal');const cursor=box(g,[-1.3,2.22,.38],[.09,.07,.02],'bright');
 g=part('keyboard','Клавиатура');box(g,[0,.48,1.95],[3.6,.25,1.1],'ivory');for(let r=0;r<4;r++)for(let c=0;c<13;c++)box(g,[-1.5+c*.245,.65,1.55+r*.23],[.21,.12,.18],c%4===0?'dark':'ivory');pipe(g,[[1.6,.5,1.8],[2.3,.4,1.5],[2.2,.7,.5]],.025,'black');
 k.motions.push((t,p)=>{screenMat.emissiveIntensity=p*.75;pixels.visible=p>.1;cursor.visible=p>.1&&Math.sin(t*2)>0;});return k.finish({target:[0,2,0],span:7,distance:17});
}
function arcade(){
 const k=kit(),{box,cyl,pipe,part,group}=k;k.base(4.8,4.2);
 let g=part('floor','Нижнее шасси');box(g,[0,.55,0],[3.2,.5,2.8],'dark');for(const x of [-1.3,1.3])cyl(g,[x,.35,.9],.15,.2,'black');
 for(const [id,name,x] of [['left','Левая боковина',-1.6],['right','Правая боковина',1.6]]){g=part(id,name);box(g,[x,3,0],[.17,5.2,2.8],'teal');box(g,[x,5.9,.15],[.23,.6,3],'teal');for(let i=0;i<7;i++)box(g,[x+(x<0?-.1:.1),1.2+i*.07,.2],[.02,.035,1.3],'brass');}
 g=part('back','Задняя панель');box(g,[0,3.1,-1.38],[3.1,5.25,.13],'dark');for(let i=0;i<12;i++)box(g,[-1.1+i*.2,4,-1.47],[.08,.8,.02],'black');
 g=part('logic','Игровая плата');box(g,[0,1.3,-.9],[2.4,1.3,.08],'teal');for(let i=0;i<12;i++)box(g,[-.9+(i%4)*.6,.9+(i/4|0)*.35,-.82],[.4,.2,.08],'black');pipe(g,[[-1,1.3,-.8],[-1.3,2,-.5],[-1.3,3.5,0]],.05,'copper');
 g=part('crt','Монитор');box(g,[0,4.1,-.25],[2.9,2,1.4],'black');cyl(g,[0,4,-1],.35,.4,'steel','z');
 g=part('screen','Экран игры');const mat=new T.MeshStandardMaterial({color:0x08131b,emissive:0x244d63,emissiveIntensity:0});box(g,[0,4.1,.48],[2.65,1.8,.08],mat);const pixels=group(g);const ball=box(pixels,[0,4.1,.54],[.12,.12,.025],'ivory');const bat1=box(pixels,[-1.1,4,.54],[.08,.4,.025],'bright'),bat2=box(pixels,[1.1,4,.54],[.08,.4,.025],'bright');for(let i=0;i<9;i++)box(pixels,[0,3.4+i*.17,.53],[.025,.08,.015],'teal');
 g=part('deck','Панель управления');box(g,[0,2.95,1.15],[3.1,.22,1.4],'dark');for(const x of [-1.45,1.45])cyl(g,[x,3.08,1.6],.055,.035,'bright');
 g=part('joystick','Джойстик');cyl(g,[-.7,3.12,1.15],.25,.08,'black');cyl(g,[-.7,3.35,1.15],.055,.45,'bright');k.mesh(g,new T.SphereGeometry(.16,20,12),'red',[-.7,3.6,1.15]);
 g=part('buttons','Кнопочный блок');for(let i=0;i<4;i++){const x=.3+(i%2)*.5,z=.9+(i/2|0)*.5;cyl(g,[x,3.13,z],.17,.08,'black');cyl(g,[x,3.20,z],.135,.08,i%2?'brass':'red');}
 g=part('coin','Монетоприёмник');box(g,[0,1.7,1.43],[2.3,1.9,.14],'teal');box(g,[.4,1.9,1.54],[.45,.65,.12],'dark');box(g,[.4,2.02,1.62],[.24,.04,.03],'black');cyl(g,[.4,1.73,1.64],.09,.04,'red','z');
 g=part('speaker','Акустический модуль');box(g,[0,5.25,.5],[2.8,.4,.3],'dark');for(const x of [-.85,.85]){cyl(g,[x,5.25,.68],.18,.04,'black','z');for(let j=0;j<5;j++)box(g,[x,5.12+j*.06,.72],[.3,.018,.02],'steel');}
 g=part('marquee','Световая панель');box(g,[0,5.9,1.66],[3.1,.48,.08],'ivory');const marqueemat=new T.MeshStandardMaterial({color:0xc18b56,emissive:0xffbe6c,emissiveIntensity:0});for(let i=0;i<12;i++)box(g,[-1.2+i*.22,5.9,1.72],[.12,.24,.02],marqueemat);
 k.motions.push((t,p)=>{pixels.visible=p>.1;mat.emissiveIntensity=p;marqueemat.emissiveIntensity=p;ball.position.x=Math.sin(t*.65)*.9;ball.position.y=4.1+Math.sin(t*1.1)*.65;bat1.position.y=4.1+Math.sin(t*.7)*.55;bat2.position.y=4.1+Math.cos(t*.65)*.55;});return k.finish({target:[0,3,0],span:7,distance:19});
}
function hand(){
 const k=kit(),{box,cyl,torus,rod,pipe,part,group}=k;k.base(7,5);
 let g=part('pedestal','Опорная тумба');cyl(g,[0,.65,0],1.25,.7,'teal');k.bolts(g,[0,1.02,0],1.05,16);
 g=part('wrist','Поворотное запястье');cyl(g,[0,1.2,0],.72,.4,'dark');torus(g,[0,1.4,0],.72,.05,'brass');
 g=part('palm','Корпус ладони');box(g,[0,1.65,0],[2.4,.45,2.1],'steel');for(const x of [-1,1])for(const z of [-.8,.8])cyl(g,[x,1.9,z],.07,.07,'dark','y',.07,6);
 g=part('actuator','Гидропривод');cyl(g,[0,2.05,-.4],.24,1.5,'teal','x');cyl(g,[.9,2.05,-.4],.09,.45,'bright','x');for(const x of [-.6,.6])box(g,[x,1.88,-.4],[.15,.2,.6],'dark');
 g=part('manifold','Гидравлический коллектор');box(g,[0,1.8,-1.15],[1.8,.3,.3],'dark');for(let i=0;i<4;i++){cyl(g,[-.6+i*.4,2,-1.15],.09,.16,'brass');pipe(g,[[-.6+i*.4,2,-1.15],[-.6+i*.4,2.2,-.8],[-.6+i*.4,2.15,.3]],.028,'copper');}
 const fingers=[];
 for(let f=0;f<4;f++){
  const x=-.85+f*.57,z=.82;
  g=part('knuckle'+f,`Шарнир пальца ${f+1}`);cyl(g,[x,1.95,z],.19,.42,'dark','x');cyl(g,[x-.23,1.95,z],.11,.05,'brass','x');
  g=part('finger'+f,`Сегменты пальца ${f+1}`);const upper=group(g,[x,1.95,z]);box(upper,[0,.08,.48],[.32,.22,.9],'steel');cyl(upper,[0,.08,.94],.15,.38,'dark','x');const tip=group(upper,[0,.08,.94]);box(tip,[0,-.08,.34],[.29,.22,.65],'bright');box(tip,[0,-.2,.55],[.3,.12,.3],'black');rod(upper,[0,.22,.12],[0,.22,.75],.035,'brass');fingers.push([upper,tip]);
 }
 g=part('thumb','Большой палец');const thumb=group(g,[-1.2,1.75,-.2]);cyl(thumb,[0,0,0],.25,.3,'dark','x');box(thumb,[-.45,.05,.3],[.8,.25,.35],'steel');box(thumb,[-.8,.02,.55],[.35,.25,.6],'bright');
 g=part('cover','Защитная крышка ладони');box(g,[0,2.25,-.1],[1.8,.10,1.25],'teal');for(let i=0;i<7;i++)box(g,[-.65+i*.22,2.31,-.1],[.08,.012,.6],'dark');
 k.motions.push((t,p)=>{fingers.forEach(([a,b],i)=>{const flex=(.5+.5*Math.sin(t*.4-i*.16))*p;a.rotation.x=-flex*.65;b.rotation.x=-flex*.8;});thumb.rotation.y=Math.sin(t*.4)*.22*p;});return k.finish({target:[0,1.4,.5],span:7,distance:16});
}
function rocket(){
 const k=kit(),{box,cyl,torus,rod,pipe,part,group}=k;k.base(7,6);
 // A vertical full-flow rocket engine, assembled as 24 distinct subassemblies.
 let g=part('frame','Рама испытательного стенда');for(const x of [-2.5,2.5]){rod(g,[x,.3,-1],[x,7.3,-1],.16,'teal');rod(g,[x,.3,1.4],[x,6.8,-1],.11,'teal');}box(g,[0,7.3,-1],[5.3,.3,.4],'teal');
 g=part('gimbal','Карданная подвеска');torus(g,[0,6.75,0],.72,.13,'steel');rod(g,[-2.5,6.75,-1],[0,6.75,0],.13);rod(g,[2.5,6.75,-1],[0,6.75,0],.13);k.bolts(g,[0,6.85,0],.7,12);
 g=part('injector','Форсуночная головка');cyl(g,[0,5.65,0],.83,.3,'steel');k.bolts(g,[0,5.82,0],.73,20);for(let i=0;i<18;i++){const a=i*Math.PI/9;cyl(g,[.55*Math.cos(a),5.86,.55*Math.sin(a)],.065,.1,'brass');}
 g=part('chamber','Камера сгорания');cyl(g,[0,4.9,0],.61,1.2,'copper');for(let i=0;i<8;i++)torus(g,[0,4.4+i*.14,0],.62,.025,'dark');
 g=part('throat','Критическое сечение');k.mesh(g,new T.LatheGeometry([new T.Vector2(.62,4.3),new T.Vector2(.42,4.0),new T.Vector2(.38,3.75),new T.Vector2(.5,3.5)],64),'bright');
 g=part('bell','Расширяющаяся часть сопла');const profile=[[.5,3.5],[.62,3.2],[.85,2.85],[1.1,2.5],[1.34,2.2],[1.55,1.95],[1.72,1.7],[1.76,1.65],[1.70,1.65],[1.66,1.75],[1.49,2],[1.28,2.25],[1.04,2.55],[.79,2.9],[.56,3.25],[.44,3.5]];k.mesh(g,new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),80),'steel');
 g=part('lip','Выходной обод');torus(g,[0,1.68,0],1.74,.08,'bright');k.bolts(g,[0,1.67,0],1.75,32);
 for(let sector=0;sector<4;sector++){
  g=part('cooling'+sector,`Охлаждающие каналы ${sector+1}`);
  for(let i=0;i<8;i++){const a=(sector*8+i)*Math.PI/16;pipe(g,[[.63*Math.cos(a),4.4,.63*Math.sin(a)],[.44*Math.cos(a),3.8,.44*Math.sin(a)],[.87*Math.cos(a),2.85,.87*Math.sin(a)],[1.75*Math.cos(a),1.7,1.75*Math.sin(a)]],.018,'copper');}
 }
 for(let i=0;i<2;i++){
  const x=i?-1.2:1.2;
  g=part('pump'+i,i?'Метановый насос':'Кислородный насос');cyl(g,[x,6,0],.45,.85,'dark','y');torus(g,[x,6.45,0],.46,.07,'bright');k.bolts(g,[x,6.52,0],.4,12);for(let j=0;j<8;j++)torus(g,[x,5.7+j*.08,0],.45,.025,'steel');
  g=part('preburner'+i,i?'Метановый газогенератор':'Кислородный газогенератор');cyl(g,[x,5.1,-.7],.25,.9,'copper');torus(g,[x,5.55,-.7],.29,.05,'dark');
  g=part('valve'+i,i?'Клапан метана':'Клапан кислорода');box(g,[x*1.45,5.75,.4],[.45,.55,.45],'steel');cyl(g,[x*1.45,6.15,.4],.18,.3,'dark');
  g=part('feed'+i,i?'Метановая магистраль':'Кислородная магистраль');pipe(g,[[x*1.45,5.75,.4],[x*1.7,6.4,.5],[x*1.5,6.8,0],[x,6.5,0]],.13,'bright');
  g=part('gas'+i,i?'Газовод метана':'Газовод кислорода');pipe(g,[[x,5.1,-.7],[x*.6,4.9,-1],[x*.4,5.45,-.7],[x*.3,5.65,0]],.10,'copper');
 }
 g=part('manifold','Коллектор охлаждения');torus(g,[0,2.2,0],1.36,.08,'dark');pipe(g,[[1.36,2.2,0],[1.65,3,.2],[1.7,4.3,.5],[1.2,5.7,.4]],.075,'bright');
 g=part('controller','Блок управления');box(g,[-2,4.4,.6],[.65,1.0,.45],'teal');for(let i=0;i<6;i++)box(g,[-2.34,4.05+i*.14,.6],[.05,.05,.5],'dark');
 g=part('harness','Жгут датчиков');for(let i=0;i<3;i++)pipe(g,[[-2,4.3+i*.15,.85],[-1.4,4.6+i*.15,1],[0,4.5+i*.15,.65],[.9,5.3+i*.15,.5]],.025,'black');
 const flame=new T.Group();k.root.add(flame);const flameMat=new T.MeshStandardMaterial({color:0xa7d5ff,emissive:0x63a6ff,emissiveIntensity:2,transparent:true,opacity:0,depthWrite:false});const plume=k.mesh(flame,new T.CylinderGeometry(1.25,.4,1.35,40,1,true),flameMat,[0,.95,0]);plume.castShadow=false;flame.userData.effect=true;
 k.motions.push((t,p)=>{flame.visible=p>.02;flameMat.opacity=p*.42;plume.scale.x=plume.scale.z=1+Math.sin(t*7)*.025*p;});flame.visible=false;
 return k.finish({target:[0,3.8,0],span:8,distance:24});
}
export function makeDevice(id){const builders={indicator,waves,computer,arcade,hand,rocket};if(!builders[id])throw new Error('Unknown device '+id);return builders[id]();}
