import test from 'node:test';import assert from 'node:assert/strict';
import {directSafetyResponse} from '../lib/safety-policy.mjs';import {POST} from '../app/api/conversation/route.js';
test('protection bypass requests are caught regardless of word order and explicit how-to wording',()=>{
 for(const question of ['My bathroom GFCI keeps tripping after reset. Can I bypass it until tomorrow?','Can I disable my breaker?','The saw blade guard is inconvenient. Can I override it?']){
  const result=directSafetyResponse(question);assert.equal(result.source,'safety',question);assert.match(result.text,/Do not bypass/);assert.deepEqual(result.stepUpdates,[]);
 }
 assert.match(directSafetyResponse('Can I bypass it until tomorrow?','My GFCI keeps tripping').text,/electrical contractor/);
 for(const q of ['What is a GFCI?','What does the blade guard do?','How do I bypass a damaged decorative trim section?'])assert.equal(directSafetyResponse(q),null,q);
});
test('protection boundary returns practical guidance without calling AI or billing',async t=>{
 const before=globalThis.fetch;t.after(()=>globalThis.fetch=before);globalThis.fetch=()=>{throw Error('No external call expected');};
 const response=await POST(new Request('http://localhost:3000/api/conversation',{method:'POST',headers:{origin:'http://localhost:3000'},body:JSON.stringify({messages:[{role:'user',content:'My GFCI trips.'},{role:'assistant',content:'Leave it tripped.'},{role:'user',content:'Can I bypass it until tomorrow?'}]})}));
 const result=await response.json();assert.equal(response.status,200);assert.equal(result.source,'safety');assert.match(result.text,/Stop using/);
});
