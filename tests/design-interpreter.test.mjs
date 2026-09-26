import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {isShelfDesignRequest,shelfInterpretationContext,compileShelfInterpretation} from '../lib/design-interpreter.mjs';
import {workshopDefaults,workshopModel,workshopProgress} from '../lib/bookcase-workshop.mjs';
import {rememberAnswer} from '../lib/internal-answers.mjs';
import {POST} from '../app/api/conversation/route.js';
const input={...workshopDefaults,material:'mdf',shelfInsets:[0,100]};const record={id:'test',guideId:'bookcase',pack:{input,build:workshopProgress(workshopModel(input))}};
const question='Please adjust the upper interior shelf to a finished depth of two hundred millimetres, keeping its back edge aligned to the back panel.';
const parsed={status:'proposal',shelves:[2],mode:'finished-depth',value:200,unit:'mm',question:''};
test('intent routing separates geometry extraction from product and safety research',()=>{
 assert.equal(isShelfDesignRequest(record,question),true);
 for(const q of ['What depth is my interior shelf?','Make the upper interior shelf deeper for an aquarium','Adjust the interior shelf depth using different screws','Make the top shelf narrower','Change the interior shelf depth and use MDF','Adjust the interior shelf depth to carry 40 kg of weight'])assert.equal(isShelfDesignRequest(record,q),false,q);
 assert.deepEqual(shelfInterpretationContext(record).shelves.map(s=>[s.number,s.finishedDepthMm]),[[1,294],[2,194]]);
});
test('the model extracts intent but Kitsley computes exact metric and imperial geometry',()=>{
 const r=compileShelfInterpretation(record,parsed,question);assert.equal(r.designProposal.status,'review');assert.deepEqual(r.designProposal.input.shelfInsets,[0,94]);assert.equal(record.pack.input.shelfInsets[1],100);assert.deepEqual(r.stepUpdates,[]);
 const inch=compileShelfInterpretation(record,{...parsed,mode:'reduce-by',value:1,unit:'in'},question);assert.deepEqual(inch.designProposal.input.shelfInsets,[0,125.4]);
 const belowLimit=compileShelfInterpretation(record,{...parsed,value:100},question);assert.equal(belowLimit.designProposal.status,'unsupported');
 assert.deepEqual(rememberAnswer(record,question,r).answers,[]);
});
test('ambiguous and malformed interpretation never invents or applies a dimension',()=>{
 const r=compileShelfInterpretation(record,{...parsed,status:'clarify',question:'Which shelf and depth?'},question);assert.equal(r.designProposal,null);assert.match(r.text,/Which shelf/);
 for(const patch of [{shelves:[0]},{shelves:[3]},{shelves:[2,2]},{value:null},{value:Infinity},{unit:'none'},{mode:'width'}])assert.throws(()=>compileShelfInterpretation(record,{...parsed,...patch},question));
});
test('the route uses one bounded interpretation call and returns a review without an unverified method',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'kitsley-geometry-')),saved={...process.env},before=globalThis.fetch;let calls=0;
 t.after(async()=>{globalThis.fetch=before;for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);await rm(dir,{recursive:true,force:true});});
 Object.assign(process.env,{BILLING_ENABLED:'false',KITSLEY_DATA_DIR:dir,APP_URL:'https://kitsley.test',KITSLEY_AI_ENABLED:'true',OPENAI_API_KEY:'test-only',OPENAI_MODEL:'test-model'});
 globalThis.fetch=async(_,init)=>{calls++;const body=JSON.parse(init.body);assert.equal(body.text.format.name,'shelf_depth_request');assert.equal(body.tools,undefined);assert.equal(body.store,false);assert.equal(body.input.length,1);assert.equal(JSON.parse(body.input[0].content).currentDesign.shelves[1].finishedDepthMm,194);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(parsed)}]}]});};
 const response=await POST(new Request('https://kitsley.test/api/conversation',{method:'POST',headers:{origin:'https://kitsley.test'},body:JSON.stringify({projectId:'test',guideId:'bookcase',workshop:record.pack,messages:[{role:'assistant',content:'Old wrong shelf depth: 294 mm'},{role:'user',content:question}]})}));
 const result=await response.json();assert.equal(response.status,200);assert.equal(calls,1);assert.deepEqual(result.designProposal.input.shelfInsets,[0,94]);assert.deepEqual(result.stepUpdates,[]);assert.match(result.text,/preview/);
});
