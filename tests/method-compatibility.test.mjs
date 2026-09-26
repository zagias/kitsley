import test from 'node:test';import assert from 'node:assert/strict';
import {methodCompatibility} from '../lib/method-compatibility.mjs';import {freeStartingPoint} from '../lib/free-start.mjs';import {setupFlow} from '../lib/project-intake-flow.mjs';import {POST} from '../app/api/conversation/route.js';
test('incorrect method is corrected before generic setup and copper transition remains possible',()=>{
 const record={request:'how to solder pex'};assert.match(freeStartingPoint(record).title,/isn’t soldered/);const flow=setupFlow(record);assert.equal(flow.questions.length,1);assert.equal(flow.questions[0].text,'What are you joining the PEX to?');assert(flow.questions[0].choices.includes('Copper pipe'));
 const copper=methodCompatibility('Solder a copper to PEX transition');assert.match(copper.text,/transition connection/);assert.match(copper.question,/transition fitting/);
 assert.equal(methodCompatibility('How do I solder copper pipe?'),null);assert.equal(methodCompatibility('How do I crimp PEX?'),null);assert.equal(methodCompatibility('Test PVC with water'),null);
 assert.equal(methodCompatibility('Test CPVC with compressed air').id,'plastic-pipe-no-air-test');
});
test('removing GFCI is not classified as ordinary household care or reset troubleshooting',()=>{
 const r={request:'remove gfci'};assert.match(freeStartingPoint(r).steps.join(' '),/electrical wiring/);const f=setupFlow(r);assert.equal(f.questions.length,1);assert.equal(f.questions[0].text,'What are you trying to achieve?');assert(!f.questions[0].choices.includes('Routine care or replacement'));
});
test('compatibility correction reaches chat without an AI request or allowance',async t=>{
 const before=globalThis.fetch;t.after(()=>globalThis.fetch=before);globalThis.fetch=()=>{throw Error('No call expected');};
 const r=await POST(new Request('http://localhost:3000/api/conversation',{method:'POST',headers:{origin:'http://localhost:3000'},body:JSON.stringify({messages:[{role:'user',content:'how to solder pex'}]})}));const d=await r.json();assert.equal(r.status,200);assert.match(d.text,/not solder/);assert.equal(d.source,'compatibility');assert.deepEqual(d.stepUpdates,[]);
});
