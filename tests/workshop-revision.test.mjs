import test from 'node:test';
import assert from 'node:assert/strict';
import {workshopDefaults,workshopModel,workshopProgress} from '../lib/bookcase-workshop.mjs';
import {reviseWorkshop,designChanged} from '../lib/workshop-revision.mjs';
const options={finish:'paint',cutting:'self',wall:'unknown'};
const pack=()=>({input:workshopDefaults,build:{...workshopProgress(workshopModel(),options),done:[0,1,4],active:4,stage:'build',revision:3,revisedAt:'2026-09-25T10:00:00Z'}});
test('dimension revision preserves completed steps as reviews and regenerates geometry',()=>{const old=pack(),input={...old.input,width:640,shelves:3};assert.equal(designChanged(old,input,options),true);const next=reviseWorkshop(old,input,options,{...old.build,stage:'kit'},'2026-09-26T10:00:00Z');assert.equal(next.revision,4);assert.deepEqual(next.done,[]);assert.deepEqual(next.review,[0,1,4]);assert.equal(next.active,0);assert.equal(next.stage,'kit');assert.equal(workshopModel(input).parts[1].length,604);assert.equal(old.input.width,600);assert.deepEqual(old.build.done,[0,1,4]);});
test('navigation does not create a revision, review acknowledgement persists',()=>{const old=pack();const next=reviseWorkshop(old,old.input,options,{...old.build,stage:'kit',review:[2]});assert.equal(next.revision,3);assert.deepEqual(next.done,[0,1,4]);assert.deepEqual(next.review,[2]);assert.equal(next.revisedAt,old.build.revisedAt);});
test('invalid changes reject before a revision is applied',()=>{const old=pack();assert.throws(()=>reviseWorkshop(old,{...old.input,width:1500},options,old.build));});
