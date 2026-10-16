import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {MODULES,mayInstall,complete,nextModule,follow,spin} from '../src/model.mjs';
import {makeEngine} from '../src/engine.mjs';
test('Assembly observes mechanical dependencies, refuses duplicate parts, and completes all six modules',()=>{
const installed=new Set();assert.equal(mayInstall('turbine',installed),false);assert.equal(complete(installed),false);
for(const id of ['shaft','compressor','inlet','combustor','turbine','nozzle']){assert.equal(mayInstall(id,installed),true);installed.add(id);assert.equal(mayInstall(id,installed),false);}
assert.equal(complete(installed),true);assert.equal(nextModule(installed),null);
});
test('Unknown modules and impossible order cannot complete assembly',()=>{
const installed=new Set();assert.equal(mayInstall('nozzle',installed),false);assert.equal(mayInstall('invalid',installed),false);assert.equal(nextModule(installed),'shaft');assert.equal(MODULES.length,6);
});
test('Geometry contains no invalid coordinates or indices and each module has a physical extent',()=>{
const engine=makeEngine();assert.ok(engine.count>300);
engine.root.updateMatrixWorld(true);
engine.root.traverse(obj=>{
if(obj.geometry){for(const n of obj.geometry.attributes.position.array)assert.ok(Number.isFinite(n),obj.name);if(obj.geometry.index)for(const idx of obj.geometry.index.array)assert.ok(idx<obj.geometry.attributes.position.count,obj.name);}
if(obj.isInstancedMesh){for(const n of obj.instanceMatrix.array)assert.ok(Number.isFinite(n),'instance matrix');}
});
for(const m of MODULES){const box=new THREE.Box3().setFromObject(engine.modules[m.id]);assert.ok(!box.isEmpty());assert.ok(box.getSize(new THREE.Vector3()).length()>.3);}
});
test('Time-based easing is frame-independent, clamped after inactive tabs, and never overshoots',()=>{
let a=0,b=0;for(let i=0;i<60;i++)a=follow(a,1,1/60);for(let i=0;i<120;i++)b=follow(b,1,1/120);assert.ok(Math.abs(a-b)<1e-12);assert.ok(a<1&&a>0);assert.ok(Math.abs(spin(3,20)-.15)<1e-12);assert.equal(follow(0,1,-1),0);
});

test('Magnet accepts nearby module centres, independent of grabbing point, and rejects distant drops',async()=>{
const {withinMagnet,magnetRadius}=await import('../src/model.mjs');
assert.equal(withinMagnet([565,335],[500,300],1280),true);
assert.equal(withinMagnet([560,310],[500,300],390),false);
assert.equal(withinMagnet([545,320],[500,300],390),true);
assert.equal(withinMagnet([740,300],[500,300],1280),false);
const grabOffset=[180,-20],pointer=[710,295],centre=pointer.map((n,i)=>n-grabOffset[i]);
assert.equal(withinMagnet(centre,[500,300],1280),true);
assert.equal(withinMagnet(pointer,[500,300],1280),false);
assert.ok(magnetRadius(390)>=54&&magnetRadius(1280)<=125);
});
