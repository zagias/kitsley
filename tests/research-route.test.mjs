import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {POST} from '../app/api/conversation/route.js';
import {workshopDefaults,workshopModel,workshopProgress} from '../lib/bookcase-workshop.mjs';

test('research applies outside bookcases and blocks conflicting or fabricated evidence from build steps',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'kitsley-research-')),saved={...process.env},before=globalThis.fetch;
 t.after(async()=>{globalThis.fetch=before;for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);await rm(dir,{recursive:true,force:true});});
 Object.assign(process.env,{BILLING_ENABLED:'false',KITSLEY_DATA_DIR:dir,APP_URL:'https://kitsley.test',KITSLEY_AI_ENABLED:'true',OPENAI_API_KEY:'test-only',OPENAI_MODEL:'test-model'});
 const url='https://www.wagnerspraytech.com/manual.pdf';let status='conflicting',urls=[url];
 globalThis.fetch=async(_,init)=>{const body=JSON.parse(init.body);assert.deepEqual(body.tools,[{type:'web_search',search_context_size:'medium'}]);assert.match(body.instructions,/ALL materials/);return Response.json({status:'completed',output:[{type:'web_search_call',status:'completed',action:{sources:[{url}]}},{content:[{type:'output_text',text:JSON.stringify({text:'The product and nozzle instructions disagree. Which exact coating is this?',steps:[{step:2,guidance:'Unresolved change'}],research:{status,note:'Exact coating needed',urls}})}]}]});};
 const ask=b=>POST(new Request('https://kitsley.test/api/conversation',{method:'POST',headers:{origin:'https://kitsley.test'},body:JSON.stringify(b)}));
 const body={projectId:'test',guideId:'bookcase',workshop:{input:workshopDefaults,build:workshopProgress(workshopModel())},messages:[{role:'user',content:'Can I use this coating with my Wagner sprayer?'}]};
 const conflict=await (await ask(body)).json();assert.deepEqual(conflict.stepUpdates,[]);assert.equal(conflict.research.status,'conflicting');assert.equal(conflict.research.sources[0].url,url);
 status='supported';urls=['https://invented.example/manual'];const missing=await (await ask(body)).json();assert.deepEqual(missing.stepUpdates,[]);assert.equal(missing.research.status,'limited');assert.match(missing.text,/could not confirm/);
 urls=[url];const paint=await (await ask({...body,guideId:'paint-cabinets',workshop:undefined})).json();assert.equal(paint.research.status,'supported');assert.equal(paint.research.sources[0].url,url);
});

test('first discovery advice requires a real source check and unknown projects require a structured assessment',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'kitsley-discovery-research-')),saved={...process.env},before=globalThis.fetch;
 t.after(async()=>{globalThis.fetch=before;for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);await rm(dir,{recursive:true,force:true});});
 Object.assign(process.env,{BILLING_ENABLED:'false',KITSLEY_DATA_DIR:dir,APP_URL:'https://kitsley.test',KITSLEY_AI_ENABLED:'true',OPENAI_API_KEY:'test-only',OPENAI_MODEL:'test-model'});
 globalThis.fetch=async(_,init)=>{const body=JSON.parse(init.body);assert.equal(body.tool_choice,'required');assert.equal(body.text.format.schema.properties.technicalAssessment.type,'object');return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({advice:'Use an unverified adhesive.',question:'Is this your plan?',choices:[],facts:['Indoor','Display','Foamboard'],unknowns:['Brand'],briefReady:true,research:{status:'supported',note:'No real source',urls:[]}})}]}]});};
 const r=await POST(new Request('https://kitsley.test/api/conversation',{method:'POST',headers:{origin:'https://kitsley.test'},body:JSON.stringify({projectId:'test',intake:true,messages:[{role:'user',content:'Help with a foamboard display.'}]})}));
 const data=await r.json();assert.equal(r.status,200);assert.equal(data.research.status,'limited');assert.equal(data.discovery,undefined);assert.match(data.text,/could not confirm/);assert.deepEqual(data.stepUpdates,[]);
});
