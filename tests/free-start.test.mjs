import test from 'node:test';
import assert from 'node:assert/strict';
import {createConversation} from '../lib/conversation.mjs';
import {freeStartingPoint} from '../lib/free-start.mjs';
import {beginSetup,answerSetup,setupQuestion} from '../lib/project-intake-flow.mjs';

test('guest GFCI regression: useful matched guide immediately, no repeated discovery',()=>{
 const r=beginSetup(createConversation('The GFCI outlet in my bathroom keeps tripping','test'));
 const start=freeStartingPoint(r);
 assert.equal(start.guide.id,'gfci-trip');assert.match(start.steps[0],/leave it tripped/);
 assert.match(start.steps[0],/electrician/);assert.equal(setupQuestion(r),undefined);
 assert.equal(r.request,'The GFCI outlet in my bathroom keeps tripping');
 assert.equal(r.messages.some(m=>m.source==='ai'),false);
});
test('unclear GFCI symptoms ask only the missing fact, then revise the first step',()=>{
 let r=beginSetup(createConversation('My GFCI tripped','test'));
 assert.equal(setupQuestion(r).text,'Did it trip once, or does it keep tripping?');
 r=answerSetup(r,'It keeps tripping');assert.equal(setupQuestion(r),undefined);
 assert.match(freeStartingPoint(r).steps[0],/leave it tripped/);
 const once=beginSetup(createConversation('My GFCI tripped for the first time','once'));
 assert.equal(setupQuestion(once),undefined);assert.match(freeStartingPoint(once).title,/Before/);
});
test('emergencies and hazardous procedures cannot become guest reset instructions',()=>{
 assert.equal(freeStartingPoint(createConversation('GFCI keeps tripping and water is near the outlet','test')),null);
 const point=freeStartingPoint(createConversation('How do I replace an electrical outlet?','test'));
 assert.match(point.steps[0],/qualified professional/);
 assert.doesNotMatch(point.steps.join(' '),/press RESET|connect the wire/i);
});
test('named household and trade tasks skip category questions without inferring safety',()=>{
 for(const request of ['Replace my furnace filter','Install a TV wall mount','Patch damaged drywall']){
  const r=beginSetup(createConversation(request,'test'));assert.equal(setupQuestion(r).id,'constraint');
  assert.equal(r.safetyAcknowledgment,undefined);assert.ok(freeStartingPoint(r).steps.length);
 }
});
test('old guest records gain guidance without losing stored answers; unmatched tasks do not invent guides',()=>{
 const r={...createConversation('The GFCI keeps tripping','test'),setup:{version:1,answers:{scope:'Something stopped working',constraint:'bathroom',experience:'new'}},messages:[{role:'user',content:'bathroom'}]};
 const before=JSON.stringify(r);assert.equal(setupQuestion(r),undefined);assert.equal(freeStartingPoint(r).guide.id,'gfci-trip');assert.equal(JSON.stringify(r),before);
 const unsupported=freeStartingPoint(createConversation('Help me make a zeppelin','test'));
 assert.equal(unsupported.guide,undefined);assert.match(unsupported.steps[0],/unknown/);
});
