import test from 'node:test';
import assert from 'node:assert/strict';
import {researchEvidence,researchFormat,researchInstructions,sourceUrl,citedParts,savedResearch} from '../lib/advice-research.mjs';
import {workshopAdviceFormat,mergeStepAdvice} from '../lib/workshop-advice.mjs';
import {rememberAnswer} from '../lib/internal-answers.mjs';

const url='https://www.wagnerspraytech.com/manual.pdf';
const data={output:[{type:'web_search_call',status:'completed',action:{sources:[{url}]}},{content:[{type:'output_text',annotations:[{type:'url_citation',url,title:'Wagner manual'}]}]}]};
test('research format adds evidence requirements without mutating existing formats',()=>{
 const next=researchFormat(workshopAdviceFormat);assert.ok(next.schema.required.includes('research'));assert.ok(!workshopAdviceFormat.schema.required.includes('research'));assert.ok(next.schema.required.includes('steps'));
 assert.match(researchInstructions,/ALL materials/);assert.match(researchInstructions,/independent/);assert.match(researchInstructions,/model, substrate/);
});
test('support requires completed search and a used source actually returned by the provider',()=>{
 const valid=researchEvidence(data,{status:'supported',note:'Model matches',urls:[url,url,'https://invented.example/manual']},{required:true});
 assert.equal(valid.status,'supported');assert.deepEqual(valid.sources,[{url,title:'Wagner manual'}]);
 assert.equal(researchEvidence(data,{status:'supported',urls:['https://invented.example/manual']},{required:true}).status,'limited');
 assert.equal(researchEvidence({output:[data.output[1]]},{status:'supported',urls:[url]},{required:true}).status,'limited');
 assert.equal(researchEvidence({output:[]},{status:'supported',urls:[]},{required:true}).status,'limited');
 assert.equal(researchEvidence(data,{status:'conflicting',urls:[url]}).status,'conflicting');
 assert.equal(researchEvidence({},null).status,'limited');
});
test('missing details do not become unsupported instructions; unsourced URLs never render',()=>{
 const e=researchEvidence(data,{status:'needs-details',note:'Which nozzle?',urls:[url]});
 assert.equal(e.status,'needs-details');
 const parts=citedParts(`See [manual](${url}) and [fake](https://invented.example/spec).`,e);
 assert.equal(parts.filter(p=>p.url).length,1);assert.equal(parts.find(p=>p.url).url,url);
 for(const bad of ['javascript:alert(1)','http://127.0.0.1/a','http://localhost/a','https://u:p@example.com','http://[::1]/a','https://example.com:9000/a'])assert.equal(sourceUrl(bad),null);
});
test('an unverified research note cannot leak a product specification into current or restored advice',()=>{
 const raw={status:'needs-details',note:'Use a 4.76 mm blade and proceed.',urls:['https://invented.example/manual']};
 const e=researchEvidence(data,raw,{required:true});assert.doesNotMatch(e.note,/4.76|proceed/);
 assert.doesNotMatch(savedResearch({...raw,sources:[]}).note,/4.76|proceed/);
});
test('unresolved research cannot overwrite saved steps or become a reusable AI answer',()=>{
 const record={id:'test',guideId:'bookcase',messages:[],pack:{build:{key:'design'}},stepAdvice:{0:{text:'Existing guidance'}}};
 for(const status of ['conflicting','limited','needs-details']){
  const result={text:'New advice',research:{status},stepUpdates:[{step:1,text:'Unsafe replacement'}]};
  assert.deepEqual(mergeStepAdvice(record,result,'question'),record.stepAdvice);
  assert.equal(rememberAnswer(record,'Which screw should I use?',result).answers.length,0);
 }
 const result={text:'Supported scoped advice',research:{status:'supported',sources:[{url}]},stepUpdates:[{step:2,text:'Use documented setup'}]};
 assert.equal(mergeStepAdvice(record,result,'question')[1].research.sources[0].url,url);
 assert.equal(rememberAnswer(record,'Which screw should I use?',result).answers.length,0);
});
