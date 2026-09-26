import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {POST} from '../app/api/conversation/route.js';
import {workshopDefaults,workshopModel,workshopProgress} from '../lib/bookcase-workshop.mjs';

test('Bookcase requests use the current guide, skip discovery and fail closed for invalid dimensions',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'kitsley-ai-test-')),saved={...process.env},fetchBefore=globalThis.fetch;
 t.after(async()=>{globalThis.fetch=fetchBefore;for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);await rm(dir,{recursive:true,force:true});});
 Object.assign(process.env,{BILLING_ENABLED:'false',KITSLEY_DATA_DIR:dir,APP_URL:'https://kitsley.test',KITSLEY_AI_ENABLED:'true',OPENAI_API_KEY:'test-only',OPENAI_MODEL:'test-model'});
 let sent,calls=0;globalThis.fetch=async(url,init)=>{calls++;assert.equal(url,'https://api.openai.com/v1/responses');sent=JSON.parse(init.body);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:'Step 2: use 180 grit on the faces.'}]}]});};
 const body={guideId:'bookcase',projectId:'test',intake:true,workshop:{input:workshopDefaults,build:workshopProgress(workshopModel(),{finish:'paint'})},messages:[{role:'user',content:'What grit before primer?'}]};
 const request=b=>new Request('https://kitsley.test/api/conversation',{method:'POST',headers:{origin:'https://kitsley.test'},body:JSON.stringify(b)});
 const response=await POST(request(body));assert.equal(response.status,200);assert.equal(sent.text,undefined);
 assert.match(sent.instructions,/CURRENT ILLUSTRATED GUIDE/);assert.match(sent.instructions,/Lightly hand-sand the faces with 180 grit/);assert.match(sent.instructions,/not project discovery/);
 assert.equal((await response.json()).discovery,undefined);
 const invalid={...body,workshop:{...body.workshop,input:{...workshopDefaults,width:900}}};
 assert.equal((await POST(request(invalid))).status,409);assert.equal(calls,1);
 globalThis.fetch=async()=>new Response('',{status:503});assert.equal((await POST(request(body))).status,502);
});
