import {build} from 'esbuild';
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import * as THREE from 'three';
import * as K from './src/anatomy-kit.mjs';
import {makeEngine} from './src/engine.mjs';
const model=makeEngine();model.root.updateMatrixWorld(true);
const projection=K.fitProjection([[-6.5,-2,0],[6,-2,0],[6,2,5],[-6.5,2,5]],1000,550,{pad:30,azimuth:225,elevation:28});
const polygons=[],light=new THREE.Vector3(-.3,.8,.5).normalize(),view=new THREE.Vector3(-.57,.42,.70).normalize();
const V=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()],M=new THREE.Matrix4(),T=new THREE.Matrix4();
model.root.traverse(mesh=>{
if(!mesh.isMesh||mesh.material.opacity===0)return;
const g=mesh.geometry,pos=g.attributes.position,indices=g.index?.array;
const material=mesh.material;const color=material.color||new THREE.Color(0xaaaaaa);
const count=mesh.isInstancedMesh?mesh.count:1;
for(let instance=0;instance<count;instance++){
M.copy(mesh.matrixWorld);if(mesh.isInstancedMesh){mesh.getMatrixAt(instance,T);M.multiply(T);}
for(let i=0;i<(indices?indices.length:pos.count);i+=3){
for(let j=0;j<3;j++)V[j].fromBufferAttribute(pos,indices?indices[i+j]:i+j).applyMatrix4(M);
const n=V[1].clone().sub(V[0]).cross(V[2].clone().sub(V[0])).normalize();if(n.dot(view)<.015)continue;
const points=V.map(v=>K.iso([v.x,-v.z,v.y],projection));
const area=Math.abs((points[1][0]-points[0][0])*(points[2][1]-points[0][1])-(points[1][1]-points[0][1])*(points[2][0]-points[0][0]));if(area<.24)continue;
const col=color.clone().multiplyScalar(.55+Math.max(0,n.dot(light))*.85);
polygons.push({depth:(V[0].dot(view)+V[1].dot(view)+V[2].dot(view))/3,svg:`<path d="${K.pathOf(points,true)}" fill="#${col.getHexString()}"/>`});
}
}
});
polygons.sort((a,b)=>a.depth-b.depth);
const fallback=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 550" role="img" aria-label="Открытый газотурбинный двигатель: лопатки компрессора и турбины, камера сгорания, трубопроводы и крепёж"><ellipse cx="500" cy="459" rx="390" ry="34" fill="#000" opacity=".14"/>${polygons.map(p=>p.svg).join('')}</svg>`;
const result=await build({entryPoints:['src/main.mjs'],bundle:true,format:'iife',target:'es2022',minify:true,write:false});
const js=result.outputFiles[0].text,css=readFileSync('src/style.css','utf8');
const html=readFileSync('src/index.html','utf8').replace('__STYLE__',()=>css).replace('__SCRIPT__',()=>js.replace(/<\/script/gi,'<\\/script')).replace('__FALLBACK__',()=>fallback.replace(/fill="#[0-9a-f]+"/gi,'fill="none"').replace('role="img"','role="img" stroke="#78a8b8" stroke-width=".25" opacity=".25"'));
mkdirSync('dist',{recursive:true});writeFileSync('dist/index.html',html);writeFileSync('dist/engine-preview.svg',fallback);writeFileSync('dist/build-info.json',JSON.stringify({elements:model.count,meshes:model.parts.length,triangles:polygons.length,modules:6}));
copyFileSync('ANATOMY-LICENSE','dist/ANATOMY-LICENSE');copyFileSync('node_modules/three/LICENSE','dist/THREE-LICENSE');
console.log(JSON.stringify({elements:model.count,meshes:model.parts.length,fallbackTriangles:polygons.length,htmlBytes:Buffer.byteLength(html)}));
