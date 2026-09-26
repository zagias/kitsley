import test from 'node:test';import assert from 'node:assert/strict';
import {pilotPayload,runPilotPair,pilotModels} from '../lib/learning-pilot.mjs';
const packet={runId:'test',caseId:'one',expiresAt:'2026-09-27T16:00:00Z',question:'Can I upgrade this filter?',evidence:[{url:'https://www.epa.gov/indoor-air-quality-iaq/what-merv-rating',findings:'System compatibility must be established.'}]};
test('pilot pins models, disables tools, caps outputs and bounds all serialized input',()=>{
 for(const m of pilotModels){const p=pilotPayload(packet,m);assert.equal(p.service_tier,'default');assert.equal(p.tools,undefined);assert.equal(p.store,false);assert.equal(p.max_output_tokens,2500);}
 assert.throws(()=>pilotPayload(packet,'gpt-unbudgeted'));
 assert.throws(()=>pilotPayload({...packet,evidence:[{url:'https://example.com',findings:'x'.repeat(3001)}]},pilotModels[0]));
});
test('pilot does not run after deadline or retry failed calls',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;return {ok:false,status:429};};
 await assert.rejects(runPilotPair(packet,{apiKey:'test',fetchImpl,now:()=>Date.parse('2026-09-28')}));assert.equal(calls,0);
 await assert.rejects(runPilotPair(packet,{apiKey:'test',fetchImpl,now:()=>Date.parse('2026-09-26')}));assert.equal(calls,1);
});
test('both models receive identical evidence and results remain unpublished',async()=>{
 const inputs=[];const result=await runPilotPair(packet,{apiKey:'test',now:()=>Date.parse('2026-09-26'),fetchImpl:async(_,init)=>{const p=JSON.parse(init.body);inputs.push(p.input);return {ok:true,json:async()=>({status:'completed',model:p.model,id:'resp-test',usage:{input_tokens:100,output_tokens:100},output:[{content:[{type:'output_text',text:JSON.stringify({text:'Check compatibility first.'})}]}]})};}});
 assert.deepEqual(inputs[0],inputs[1]);assert.equal(result.results.length,2);assert.equal(result.review.publication,'not-published');
});
