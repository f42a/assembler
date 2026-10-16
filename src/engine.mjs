import * as THREE from 'three';
export function makeEngine(){
const root=new THREE.Group();root.position.y=2.31;
const modules={},rotors=[],hot=[],parts=[];let count=0;
const mats={
steel:new THREE.MeshStandardMaterial({color:0x9eacb7,metalness:.89,roughness:.29}),
bright:new THREE.MeshStandardMaterial({color:0xc2cdd4,metalness:.92,roughness:.22}),
dark:new THREE.MeshStandardMaterial({color:0x353e47,metalness:.85,roughness:.4}),
black:new THREE.MeshStandardMaterial({color:0x131d24,metalness:.65,roughness:.54}),
bronze:new THREE.MeshStandardMaterial({color:0xbb9160,metalness:.83,roughness:.31}),
copper:new THREE.MeshStandardMaterial({color:0xb76839,metalness:.8,roughness:.34}),
teal:new THREE.MeshStandardMaterial({color:0x304e52,metalness:.57,roughness:.5}),
rubber:new THREE.MeshStandardMaterial({color:0x171b1d,metalness:0,roughness:.86}),
};
for(const id of ['shaft','compressor','combustor','turbine','nozzle','inlet']){const g=new THREE.Group();g.name=id;g.userData.module=id;root.add(g);modules[id]=g;}
const fixed=new THREE.Group();fixed.name='cradle';root.add(fixed);
function mesh(g,geo,mat,name){const m=new THREE.Mesh(geo,typeof mat==='string'?mats[mat]:mat);m.name=name;m.castShadow=true;m.receiveShadow=true;g.add(m);count++;parts.push(m);return m;}
function box(g,dimensions,position,mat='steel',name='Braced plate'){const m=mesh(g,new THREE.BoxGeometry(...dimensions),mat,name);m.position.set(...position);return m;}
function cyl(g,x,y,z,r,len,mat='steel',r1=r,segments=48,name='Machined cylinder'){
const m=mesh(g,new THREE.CylinderGeometry(r1,r,len,segments,1,false),mat,name);m.rotation.z=-Math.PI/2;m.position.set(x,y,z);return m;}
function bar(g,a,b,r,mat='steel',name='Tie rod'){
const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),m=mesh(g,new THREE.CylinderGeometry(r,r,A.distanceTo(B),12),mat,name);
m.position.copy(A).add(B).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.sub(A).normalize());return m;}
function ringGeometry(x0,x1,ri0,ro0,ri1=ri0,ro1=ro0,start=0,span=Math.PI*2,segments=72){
const pos=[],idx=[];let index=0;
function quad(a,b,c,d){pos.push(...a,...b,...c,...d);idx.push(index,index+2,index+1,index,index+3,index+2);index+=4;}
const at=(x,r,a)=>[x,Math.cos(a)*r,Math.sin(a)*r];
for(let i=0;i<segments;i++){
const a=start+i*span/segments,b=start+(i+1)*span/segments;
quad(at(x0,ro0,a),at(x1,ro1,a),at(x1,ro1,b),at(x0,ro0,b));
quad(at(x0,ri0,b),at(x1,ri1,b),at(x1,ri1,a),at(x0,ri0,a));
quad(at(x0,ri0,a),at(x0,ro0,a),at(x0,ro0,b),at(x0,ri0,b));
quad(at(x1,ri1,b),at(x1,ro1,b),at(x1,ro1,a),at(x1,ri1,a));
}
if(span<Math.PI*2-.001){for(const a of [start,start+span])quad(at(x0,ri0,a),at(x1,ri1,a),at(x1,ro1,a),at(x0,ro0,a));}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();return geo;}
function ring(g,x0,x1,ri,ro,mat='steel',ri1=ri,ro1=ro,start=0,span=Math.PI*2,name='Annular flange'){return mesh(g,ringGeometry(x0,x1,ri,ro,ri1,ro1,start,span),mat,name);}
function torus(g,x,y,z,r,tube,mat='steel',arc=Math.PI*2,rotation=0){const m=mesh(g,new THREE.TorusGeometry(r,tube,8,72,arc),mat,'Retaining ring');m.rotation.y=Math.PI/2;m.rotation.z=rotation;m.position.set(x,y,z);return m;}
function bolts(g,x,r,n=16,start=0,span=Math.PI*2,mat='bright'){
const washerGeo=new THREE.CylinderGeometry(.10,.10,.025,16),headGeo=new THREE.CylinderGeometry(.068,.068,.07,6);
for(const [geo,material,dx] of [[washerGeo,mats.dark,0],[headGeo,mats[mat],-.05]]){
const inst=new THREE.InstancedMesh(geo,material,n);inst.castShadow=true;const obj=new THREE.Object3D();
for(let i=0;i<n;i++){const a=start+(i+.5)*span/n;obj.position.set(x+dx,r*Math.cos(a),r*Math.sin(a));obj.rotation.set(0,0,-Math.PI/2);obj.updateMatrix();inst.setMatrixAt(i,obj.matrix);}
inst.userData.components=n;g.add(inst);count+=n;parts.push(inst);}
}
function bladeGeometry(rootR,tipR,chord=.32,sweep=.13,twist=.35){
const pos=[],idx=[];const nr=7,nc=8;
for(let side=0;side<2;side++)for(let i=0;i<=nr;i++)for(let j=0;j<=nc;j++){
const v=i/nr,u=j/nc,rr=rootR+(tipR-rootR)*v,t=(u-.5)*chord;
const angle=twist*(.2+.8*v),thick=.016*Math.sin(Math.PI*u)*(1-.3*v)*(side?1:-1);
const x=t*Math.cos(angle)+sweep*v;
const z=t*Math.sin(angle)+.085*Math.sin(Math.PI*u)+thick;
pos.push(x,rr,z);
}
const sheet=(nr+1)*(nc+1);
for(let side=0;side<2;side++)for(let i=0;i<nr;i++)for(let j=0;j<nc;j++){
const a=side*sheet+i*(nc+1)+j,b=a+1,c=a+nc+2,d=a+nc+1;
idx.push(...(side?[a,c,b,a,d,c]:[a,b,c,a,c,d]));}
for(let i=0;i<nr;i++)for(const j of [0,nc]){const a=i*(nc+1)+j,b=(i+1)*(nc+1)+j;idx.push(a,b,b+sheet,a,b+sheet,a+sheet);}
for(let j=0;j<nc;j++)for(const i of [0,nr]){const a=i*(nc+1)+j,b=a+1;idx.push(a,a+sheet,b+sheet,a,b+sheet,b);}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();return geo;}
function bladeRow(g,x,rootR,tipR,n,mat='bright',stationary=false,phase=0){
const rotor=new THREE.Group();rotor.position.x=x;g.add(rotor);if(!stationary)rotors.push(rotor);
const inst=new THREE.InstancedMesh(bladeGeometry(rootR,tipR,stationary?.25:.34,stationary?-.1:.12,stationary?-.75:.85),mats[mat],n);inst.castShadow=true;inst.receiveShadow=true;const obj=new THREE.Object3D();
for(let i=0;i<n;i++){obj.rotation.set(i*Math.PI*2/n+phase,0,0);obj.updateMatrix();inst.setMatrixAt(i,obj.matrix);}rotor.add(inst);inst.userData.components=n;count+=n;parts.push(inst);return rotor;}
const CUT=Math.PI*.53,SPAN=Math.PI*1.23;
// The cradle holds the casing at its flange saddles; the rotor mounts to bearing sleeves.
for(const z of [-1.12,1.12])box(fixed,[12.7,.2,.34],[0,-2.0,z],'teal','Maintenance rail');
for(const x of [-4.1,2.6]){
for(const z of [-1.12,1.12]){box(fixed,[.9,.26,.9],[x,-2.18,z],'black','Levelling foot');
bar(fixed,[x,-1.90,z],[x,-.55,z*.45],.11,'teal','A-frame strut');cyl(fixed,x,-1.90,z,.13,.6,'bright',.13,12,'Levelling screw');}
box(fixed,[.40,.20,2.8],[x,-1.94,0],'teal','Cross member');
ring(fixed,x-.14,x+.14,1.54,1.73,'teal',1.54,1.73,Math.PI*.58,Math.PI*.84,'Cradle saddle');
for(const z of [-1.38,1.38])box(fixed,[.48,.34,.30],[x,-.53,z],'teal','Saddle clamp shoe');
}
box(fixed,[3.4,.08,2.24],[-.1,-2.0,0],'dark','Spill tray');
// Main shaft and open bearing cartridges.
cyl(modules.shaft,-.20,0,0,.18,10.50,'bright',.18,48,'Common compressor/turbine shaft');
for(const x of [-4.5,-.90,3.45]){
ring(modules.shaft,x-.20,x+.20,.19,.35,'bronze',.19,.35,0,Math.PI*2,'Bearing bronze sleeve');
ring(modules.shaft,x-.24,x-.20,.19,.40,'steel');ring(modules.shaft,x+.20,x+.24,.19,.40,'steel');
for(let i=0;i<10;i++){const a=i*Math.PI*2/10;cyl(modules.shaft,x,.27*Math.cos(a),.27*Math.sin(a),.052,.29,'bright',.052,12,'Bearing roller');}
}
cyl(modules.shaft,3.8,0,0,.24,.24,'dark',.24,16,'Spline coupling');
// Air inlet, guide vanes and spinner.
ring(modules.inlet,-5.65,-5.42,1.44,1.67,'bright',1.43,1.64,0,Math.PI*2,'Rolled intake lip');
ring(modules.inlet,-5.42,-4.89,1.43,1.55,'steel',1.36,1.49,CUT,SPAN,'Cutaway intake duct');
ring(modules.inlet,-4.95,-4.85,1.34,1.63,'dark');bolts(modules.inlet,-4.96,1.51,18);
const nose=new THREE.Group();modules.inlet.add(nose);rotors.push(nose);
cyl(nose,-5.15,0,0,.05,1.25,'bright',.70,64,'Spinner cone');
cyl(nose,-4.51,0,0,.70,.12,'steel',.70,64,'Spinner hub');
bladeRow(modules.inlet,-4.94,.72,1.40,12,'dark',true,.1);
// Four compressor rotor stages, interleaved with stator guide rows.
for(let i=0;i<4;i++){
const x=-4.45+i*.80,rr=.73+i*.055,tip=1.43-i*.055;
const rot=bladeRow(modules.compressor,x,rr,tip,24,'bright',false,i*.13);rot.name='compressor-rotor-'+i;rot.userData.compressorStage=i;
ring(rot,-.09,.09,.185,rr,'steel',.185,rr,0,Math.PI*2,'Compressor rotor disc');
ring(rot,-.11,.11,.185,.37,'dark');bolts(rot,-.12,.47,10);
if(i<3){const sx=x+.39;bladeRow(modules.compressor,sx,rr+.05,tip+.02,20,'dark',true,.06);
ring(modules.compressor,sx-.035,sx+.035,tip-.015,tip+.09,'dark',tip-.015,tip+.09,CUT,SPAN,'Stator seat');}
}
for(const [x0,x1,r0,r1] of [[-4.84,-3.45,1.48,1.45],[-3.43,-2.14,1.45,1.35],[-2.12,-1.43,1.35,1.29]]){
ring(modules.compressor,x0,x1,r0,r0+.105,'steel',r1,r1+.105,CUT,SPAN,'Split compressor casing');
ring(modules.compressor,x0-.055,x0+.055,r0,r0+.21,'dark',r0,r0+.21,CUT,SPAN,'Casing flange');bolts(modules.compressor,x0-.06,r0+.15,14,CUT,SPAN);
}
// Axial diffuser and annular combustion chamber with perforated flame tube.
bladeRow(modules.combustor,-1.30,.70,1.25,12,'steel',true);
ring(modules.combustor,-1.40,-.90,.89,1.30,'steel',.88,1.38,CUT,SPAN,'Diffuser outer wall');
ring(modules.combustor,-.92,1.68,1.25,1.39,'dark',1.23,1.35,CUT,SPAN,'Pressure jacket cutaway');
ring(modules.combustor,-.86,1.48,.98,1.04,'copper',.92,.98,CUT+.12,SPAN-.24,'Annular perforated flame tube');
ring(modules.combustor,-.91,1.49,.42,.49,'bronze',.42,.49,CUT,SPAN,'Inner flame-tube wall');
for(let i=0;i<7;i++){const x=-.85+i*.38;ring(modules.combustor,x,x+.035,1.035,1.07,'bronze',1.035,1.07,CUT+.12,SPAN-.24,'Flame-tube stiffening hoop');}
// Perforations use recessed dark cups, distributed on the real liner surface.
const perforation=new THREE.CylinderGeometry(.036,.030,.014,10);const holes=new THREE.InstancedMesh(perforation,mats.black,112);const ho=new THREE.Object3D();let hi=0;
for(let row=0;row<7;row++)for(let i=0;i<16;i++){
const a=CUT+.17+(i+.5)*(SPAN-.34)/16,rr=1.052;
ho.position.set(-.63+row*.29,rr*Math.cos(a),rr*Math.sin(a));ho.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(0,Math.cos(a),Math.sin(a)));ho.updateMatrix();holes.setMatrixAt(hi++,ho.matrix);}
modules.combustor.add(holes);holes.userData.components=112;parts.push(holes);count+=112;
const insideHoles=holes.clone();const innerHole=new THREE.Object3D();hi=0;
for(let row=0;row<7;row++)for(let i=0;i<16;i++){
const a=CUT+.17+(i+.5)*(SPAN-.34)/16,rr=.978;
innerHole.position.set(-.63+row*.29,rr*Math.cos(a),rr*Math.sin(a));innerHole.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(0,-Math.cos(a),-Math.sin(a)));innerHole.updateMatrix();insideHoles.setMatrixAt(hi++,innerHole.matrix);}
insideHoles.instanceMatrix.needsUpdate=true;modules.combustor.add(insideHoles);parts.push(insideHoles);

ring(modules.combustor,-.96,-.86,.53,1.32,'steel',.53,1.32,CUT,SPAN,'Injector plate');
for(let i=0;i<8;i++){
const a=(i+.5)*Math.PI*2/8,rr=.76,y=rr*Math.cos(a),z=rr*Math.sin(a);
cyl(modules.combustor,-.84,y,z,.12,.31,'bronze',.07,16,'Swirl injector');
cyl(modules.combustor,-1.05,y,z,.12,.10,'dark',.12,6,'Injector union nut');
bar(modules.combustor,[-1.08,y,z],[-1.08,y*1.70,z*1.70],.037,'copper','Fuel injector branch');}
torus(modules.combustor,-1.08,0,0,1.30,.047,'copper');
ring(modules.combustor,-.95,-.84,1.35,1.53,'steel',1.35,1.53,CUT,SPAN);bolts(modules.combustor,-.96,1.445,14,CUT,SPAN);
ring(modules.combustor,1.60,1.71,1.25,1.49,'steel',1.25,1.49,CUT,SPAN);bolts(modules.combustor,1.58,1.40,14,CUT,SPAN);
// External fuel pipe, connection block and retained clips.
const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.1,.48,1.2),new THREE.Vector3(-1.1,.68,1.65),new THREE.Vector3(-.80,.72,1.75),new THREE.Vector3(.80,.72,1.75),new THREE.Vector3(1.02,.45,1.35)]);
mesh(modules.combustor,new THREE.TubeGeometry(curve,48,.055,10,false),'bronze','Fuel supply pipe');
for(const x of [-.52,.55]){box(modules.combustor,[.16,.18,.20],[x,.72,1.75],'dark','Fuel pipe clip');bar(modules.combustor,[x,.65,1.38],[x,.68,1.74],.045,'steel','Fuel clip bracket');}
box(modules.combustor,[.43,.39,.35],[1.05,.39,1.53],'dark','Fuel connection block');
for(const x of [-.4,.7]){bar(modules.combustor,[x,1.02,.91],[x,1.30,1.11],.075,'bright','Thermocouple port');box(modules.combustor,[.16,.18,.19],[x,1.32,1.13],'black','Sensor connector');}
const fireMat=new THREE.MeshStandardMaterial({color:0x582910,emissive:0xff6522,emissiveIntensity:0,roughness:.72,metalness:.1,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false});
const glow=ring(modules.combustor,-.60,1.38,.56,.93,fireMat,.56,.87,CUT+.1,SPAN-.2,'Combustion gas');hot.push(fireMat);glow.castShadow=false;
// Hot-section turbine and its stationary nozzle-guide vanes.
bladeRow(modules.turbine,1.80,.62,1.14,20,'bronze',true);
for(let i=0;i<2;i++){
const x=2.10+i*.68,rr=.68-i*.04,tip=1.16-i*.07;
const rot=bladeRow(modules.turbine,x,rr,tip,24,'bronze',false,i*.13);
ring(rot,-.095,.095,.185,rr,'dark',.185,rr,0,Math.PI*2,'Turbine rotor disc');ring(rot,-.11,.11,.185,.35,'steel');bolts(rot,-.14,.46,12,0,Math.PI*2,'bright');}
ring(modules.turbine,1.74,3.17,1.20,1.31,'steel',1.15,1.27,CUT,SPAN,'Turbine heat shield');
for(const x of [1.73,2.52,3.16]){ring(modules.turbine,x-.045,x+.045,1.21,1.40,'dark',1.21,1.40,CUT,SPAN);bolts(modules.turbine,x-.05,1.33,14,CUT,SPAN);}
// Tail cone, support struts and twelve individual nozzle petals.
cyl(modules.nozzle,4.04,0,0,.54,1.67,'dark',.025,64,'Central tail cone');
for(let i=0;i<4;i++){const a=(i+.25)*Math.PI*2/4;bar(modules.nozzle,[3.39,.54*Math.cos(a),.54*Math.sin(a)],[3.39,1.24*Math.cos(a),1.24*Math.sin(a)],.045,'bright','Tail bearing strut');}
ring(modules.nozzle,3.19,3.59,1.14,1.28,'steel',1.13,1.27,CUT,SPAN,'Nozzle transition');
for(let i=0;i<12;i++){
const a=i*Math.PI*2/12+.016;
ring(modules.nozzle,3.60,5.04,1.125,1.20,'steel',.86,.94,a,Math.PI*2/12-.025,'Overlapping nozzle petal');
bar(modules.nozzle,[3.60,1.27*Math.cos(a),1.27*Math.sin(a)],[4.39,1.09*Math.cos(a),1.09*Math.sin(a)],.031,'dark','Nozzle actuator rod');
cyl(modules.nozzle,3.60,1.285*Math.cos(a),1.285*Math.sin(a),.058,.13,'bright',.058,12,'Nozzle petal pivot');}
ring(modules.nozzle,3.50,3.62,1.14,1.35,'dark');bolts(modules.nozzle,3.50,1.285,18);
ring(modules.nozzle,5.01,5.10,.855,.975,'bright');
for(let i=0;i<3;i++)torus(modules.nozzle,4.3+i*.28,0,0,1.08-i*.05,.016,'dark');
// Compact data plate on the fixed cradle.
const plate=box(fixed,[1.45,.12,.02],[-3.7,-2.0,1.301],'bright','Serial plate');
for(const x of [-4.3,-3.1])cyl(fixed,x,-2,1.32,.025,.025,'black',.025,8,'Serial plate rivet');
root.updateMatrixWorld(true);
return{root,modules,rotors,hot,mats,parts,count,ringGeometry};
}
