import test from 'node:test';import assert from 'node:assert/strict';
import {POST} from '../app/api/conversation/route.js';
test('public foundation answers work with AI disconnected, without external calls',async t=>{
 const saved={...process.env},originalFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);});
 process.env.APP_URL='https://kitsley.test';process.env.KITSLEY_AI_ENABLED='false';globalThis.fetch=()=>{throw Error('must not call outside services');};
 const request=(question,origin='https://kitsley.test')=>new Request('https://kitsley.test/api/conversation',{method:'POST',headers:{origin},body:JSON.stringify({messages:[{role:'user',content:question}]})});
 const result=await POST(request('What is melamine?'));assert.equal(result.status,200);const body=await result.json();assert.equal(body.source,'foundation');assert.ok(body.references.length);assert.equal(body.freeRemaining,undefined);
 assert.equal((await POST(request('What is melamine?','https://evil.test'))).status,403);
 assert.equal((await POST(request('What screws do I need for my dog cage?'))).status,503);
});
