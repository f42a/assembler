import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';import {makeDevice} from '../src/devices.mjs';import {PROJECTS} from '../src/assembly-model.mjs';
for(const config of PROJECTS.filter(c=>c.id!=='turbine'))test(config.id+': complete kit, valid geometry and finite working animation',()=>{
 const d=makeDevice(config.id);assert.equal(Object.keys(d.modules).length,config.count);assert.ok(d.count>70);
 for(const m of Object.values(d.modules)){const b=new T.Box3().setFromObject(m);assert.equal(b.isEmpty(),false);assert.ok(b.getSize(new T.Vector3()).length()>.1);}
 for(const power of [0,1])for(const time of [0,1,5]){d.update(time,power);d.root.updateMatrixWorld(true);d.root.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.geometry)assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));});}
});
