import test from 'node:test';import assert from 'node:assert/strict';
import {advicePurpose} from '../lib/advice-purpose.mjs';
import {POST} from '../app/api/conversation/route.js';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
test('explanations and follow-up facts do not become a new design brief',()=>{
 for(const request of ['how to crimp pex','Explain how to finish plywood','Why does my interior door rub?','What is MERV?']){
  assert.equal(advicePurpose({request},request).direct,true,request);
  assert.equal(advicePurpose({request},'I am not sure of the model').direct,true,request);
 }
 assert.equal(advicePurpose({request:'Renovate my basement'},'What is a pocket screw?').direct,true);
 for(const request of ['Design a cabinet','Convert my cabinet to a dog cage','I want to renovate a basement','Give me a structural framing cut list'])assert.equal(advicePurpose({},request).assessmentRequired,true,request);
});
test('direct how-to API answers bypass brief-confirmation schema while retaining research',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'kitsley-purpose-')),saved={...process.env},before=globalThis.fetch;
 t.after(async()=>{globalThis.fetch=before;for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);await rm(dir,{recursive:true,force:true});});
 Object.assign(process.env,{BILLING_ENABLED:'false',KITSLEY_DATA_DIR:dir,APP_URL:'https://kitsley.test',KITSLEY_AI_ENABLED:'true',OPENAI_API_KEY:'test-only',OPENAI_MODEL:'test-model'});
 const url='https://manufacturer.example/manual';
 globalThis.fetch=async(_,init)=>{const body=JSON.parse(init.body);assert.equal(body.tool_choice,'required');assert(body.text.format.schema.properties.text);assert(!body.text.format.schema.properties.briefReady);assert(body.text.format.schema.properties.technicalAssessment.anyOf);assert.match(body.instructions,/explain-or-instruct/);return Response.json({status:'completed',output:[{type:'web_search_call',status:'completed',action:{sources:[{url}]}},{content:[{type:'output_text',text:JSON.stringify({text:'Here is the relevant explanation.',research:{status:'supported',note:'Source applies',urls:[url]},technicalAssessment:null,designOperation:null,specialistReview:null,scope:'in-scope'})}]}]});};
 const r=await POST(new Request('https://kitsley.test/api/conversation',{method:'POST',headers:{origin:'https://kitsley.test'},body:JSON.stringify({projectId:'test',intake:true,messages:[{role:'user',content:'Explain the difference between PEX crimping and clamping tools.'}]})}));
 const d=await r.json();assert.equal(r.status,200);assert.equal(d.text,'Here is the relevant explanation.');assert.equal(d.discovery,undefined);
});
