import test from 'node:test';import assert from 'node:assert/strict';
import {answerEvidenceIssues} from '../lib/advice-research.mjs';
import {engineDecision} from '../lib/project-engine.mjs';
import {directSafetyResponse} from '../lib/safety-policy.mjs';
import {foundationAnswer,foundationContext} from '../lib/diy-knowledge.mjs';
import {POST} from '../app/api/conversation/route.js';
const url='https://www.epa.gov/indoor-air-quality-iaq/what-merv-rating';
const evidence={searched:true,status:'supported',sources:[{url,title:'EPA'}]};
test('unverified citations cannot borrow credibility from another retrieved source',()=>{
 assert.deepEqual(answerEvidenceIssues('Read [EPA]('+url+'?utm_source=openai).',evidence),[]);
 assert.deepEqual(answerEvidenceIssues('Evidence [claim](https://unknown.example/claim).',evidence),['unverified-citation']);
 const d=engineDecision({question:'Can I upgrade my furnace filter to MERV 16?',raw:{},research:evidence,result:{text:'MERV 16 is required [claim](https://unknown.example/claim).',stepUpdates:[{step:1,text:'Install it'}]}});
 assert.doesNotMatch(d.text,/MERV 16 is required/);assert.match(d.text,/does not establish/);assert.equal(d.research.status,'limited');assert.deepEqual(d.stepUpdates,[]);assert.equal(d.designProposal,null);
});
test('failed retrieval does not expose an unsupported method even if model reports needs-details',()=>{
 const d=engineDecision({question:'Which unidentified material should I heat?',raw:{},research:{searched:true,status:'needs-details',sources:[]},result:{text:'Heat it to 300 degrees.',stepUpdates:[{step:0,text:'Heat now'}]}});
 assert.doesNotMatch(d.text,/300|Heat now/);assert.match(d.text,/could not confirm/);assert.deepEqual(d.stepUpdates,[]);
});
test('door recovery offers a supported observation, not an invented trimming allowance',()=>{
 const d=engineDecision({question:'My bedroom door rubs at the top. Should I plane it?',raw:{},research:{searched:true,status:'needs-details',sources:[]},result:{text:'Trim 5 mm.'}});
 assert.match(d.text,/alignment before/);assert.match(d.text,/spirit level/);assert.doesNotMatch(d.text,/5 mm/);
});
test('concealed-service risks preempt the model across drilling and cutting phrasings',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>{throw Error('No external call should be made');};
 try{
  for(const q of ['I want to cut drywall above a socket. No live wire detected. Is it clear?','The scanner sees nothing. Can I drill into this wall?','Can I saw the ceiling near a cable?']){
   const d=directSafetyResponse(q);assert(d);assert.match(d.text,/does not prove/);assert.deepEqual(d.stepUpdates,[]);assert.equal(d.safety.procedureApproved,false);
  }
  const origin=process.env.APP_URL||'http://localhost:3000';
  const r=await POST(new Request(origin+'/api/conversation',{method:'POST',headers:{origin},body:JSON.stringify({messages:[{role:'user',content:'Can I drill the wall beside an outlet if my scanner is clear?'}]})}));
  assert.equal(r.status,200);assert.equal((await r.json()).source,'safety');
 }finally{globalThis.fetch=old;}
 assert.equal(directSafetyResponse('Which scanner should I buy to inspect drywall?'),null);
 assert.equal(directSafetyResponse('How do I cut a loose drywall sheet on a bench away from wires?'),null);
});
test('reviewed educational knowledge is reused, but personalized suitability still requires reasoning',()=>{
 assert.match(foundationAnswer('What does MERV measure?').text,/particle capture/);
 assert.match(foundationAnswer('Does no wire warning prove a wall is safe to drill?').text,/not clearance/);
 assert.equal(foundationAnswer('Will a MERV 16 filter work in my old furnace?'),null);
 assert(foundationContext('Can I use a higher MERV filter in this furnace?',{}).entries.some(e=>e.id==='filter-rating-compatibility'));
});
