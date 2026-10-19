import {test} from 'node:test';import assert from 'node:assert/strict';import {PROJECTS,canSeat,complete,shuffle,snapRadius} from '../src/assembly-model.mjs';
test('six unique devices grow from nine to twenty-four components',()=>{assert.deepEqual(PROJECTS.map(p=>p.count),[9,11,13,15,20,24]);assert.equal(new Set(PROJECTS.map(p=>p.id)).size,6);});
test('nearby parts snap regardless of initial flip or assembly order; installed parts stay locked',()=>{const p={installed:false,turn:1,requires:['shaft']};assert.equal(canSeat(p,[],85,110),true);assert.equal(canSeat(p,[],150,110),false);assert.equal(canSeat(p,[],NaN,110),false);p.installed=true;assert.equal(canSeat(p,[],0,110),false);assert.equal(complete([p]),true);});
test('shuffle preserves every available part',()=>{const a=[1,2,3,4,5];const b=shuffle(a,()=>.3);assert.deepEqual([...b].sort(),a);assert.notDeepEqual(b,a);});

test('magnet requires close alignment on narrow and wide screens',()=>{for(const width of [390,1020,1920]){const radius=snapRadius(width);assert.ok(radius>=22&&radius<=32);assert.equal(canSeat({installed:false},[],20,radius),true);assert.equal(canSeat({installed:false},[],40,radius),false);}});

import {CylinderGeometry} from 'three';
import {blueprintEdges} from '../src/assembly-model.mjs';
test('blueprint includes the full length of smooth cylindrical rods',()=>{
 const geo=new CylinderGeometry(.05,.05,4,40),edges=blueprintEdges(geo),points=edges.attributes.position;
 let longitudinal=0;for(let i=0;i<points.count;i+=2)if(Math.abs(points.getY(i)-points.getY(i+1))>3.9)longitudinal++;
 assert.ok(longitudinal>=2,'a rod must have side edges, not just disconnected end rings');geo.dispose();edges.dispose();
});
