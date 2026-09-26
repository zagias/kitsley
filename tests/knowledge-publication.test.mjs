import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {approveKnowledge,validateKnowledgeRecord,validatePublication,compileKnowledge,renderKnowledgeModule} from '../lib/knowledge-publication.mjs';
import {candidateBatch,researchKnowledgeTopic} from '../lib/knowledge-research.mjs';
import {foundationAnswer,foundationKnowledge,foundationContext,findFoundation} from '../lib/diy-knowledge.mjs';
import {trustedKnowledgeUrl} from '../lib/knowledge-policy.mjs';
const items=JSON.parse(fs.readFileSync(new URL('../knowledge/approved.json',import.meta.url))),now=Date.parse('2026-09-26T23:59:00Z'),sample=()=>structuredClone(items[0].record);
test('reviewed content and generated runtime catalog cannot diverge',()=>{
 const compiled=compileKnowledge(items,{now});assert.equal(compiled.entries.length,52);
 assert.equal(fs.readFileSync(new URL('../lib/managed-knowledge.mjs',import.meta.url),'utf8'),renderKnowledgeModule(compiled));
 for(const i of items)assert.deepEqual(validatePublication(i,{now}),[],i.record.id);
 assert.equal(foundationKnowledge.length,119);
});
test('altered content, conflicts, invented sources and missing fact support cannot publish',()=>{
 const changed=structuredClone(items[0]);changed.record.facts[0]='Use an arbitrary setting';assert(validatePublication(changed,{now}).includes('Content changed since review'));
 for(const mutate of [r=>r.conflicts=['Unresolved'],r=>r.evidence=[],r=>r.sources[0].url='https://trane.com.attacker.example/manual',r=>r.applicability.materials=[],r=>r.reviewBy='2028-01-01',r=>r.checkedAt='2027-01-01']){
  const r=sample();mutate(r);assert.throws(()=>approveKnowledge(r,{reviewer:'Editor',notes:'Checked exact sources',now}));
 }
 for(const url of ['http://trane.com/manual','https://trane.com@evil.example/','https://localhost/manual','https://trane.com:8443/manual'])assert(!trustedKnowledgeUrl(url));
 for(const bad of [null,{}, {sources:{}},{facts:['A'],sources:[null],evidence:[null]}])assert(validateKnowledgeRecord(bad,{now}).length);
});
test('expired entries stop runtime reuse; revocation does not resurrect an earlier revision',()=>{
 const r=sample(),v2={...r,revision:2};const history=[items[0],approveKnowledge(v2,{reviewer:'Editor',notes:'Second reviewed revision',now})];
 assert.equal(compileKnowledge(history,{now}).entries[0].revision,2);
 assert.equal(compileKnowledge(history,{now,revocations:[{id:r.id,reviewer:'Editor',reason:'Source withdrawn',at:new Date(now).toISOString()}]}).entries.length,0);
 assert.throws(()=>compileKnowledge([...history,items[0]],{now}),/Duplicate revision/);
 assert.equal(foundationAnswer('Can disposable HVAC filters be washed?',{now:Date.parse('2027-01-01')}),null);
 assert.equal(foundationAnswer('Can disposable HVAC filters be washed?',{now}).source,'foundation');
 assert.equal(foundationAnswer('Can my furnace filter be washed if it is black?',{now}),null);
});
test('elevated procedural records require qualified review, never a second AI opinion',()=>{
 const r={...sample(),risk:'elevated',kind:'procedure'};assert.throws(()=>approveKnowledge(r,{reviewer:'AI challenger',kind:'editorial',notes:'Model agreed',now}),/qualified trade/);
 assert.doesNotThrow(()=>approveKnowledge(r,{reviewer:'Named qualified reviewer',kind:'qualified-trade',notes:'Manual workflow; identity must be verified by publishing organization',now}));
});
test('research output is quarantined without completed search provenance and cannot self-approve',()=>{
 const r=sample(),raw={records:[r],limitations:[],review:{status:'approved'}};
 assert.equal(candidateBatch(raw,{output:[]},{now}).records[0].status,'quarantined');
 const response={output:[{type:'web_search_call',status:'completed',action:{sources:r.sources}}]};const batch=candidateBatch(raw,response,{now});
 assert.equal(batch.records[0].status,'awaiting-review');assert.equal(batch.review,undefined);assert.equal(batch.records[0].review,undefined);
 assert.equal(candidateBatch({records:[{...r,sources:{}}]},response,{now}).records[0].status,'quarantined');
});
test('research runner restricts sources, does not store user data and returns candidates only',async()=>{
 const r=sample();let body;
 const result=await researchKnowledgeTopic({domain:'hvac',question:'Compare disposable and reusable filters'},{apiKey:'test',model:'configured-test-model',now,fetchImpl:async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');body=JSON.parse(options.body);return {ok:true,json:async()=>({status:'completed',output:[{type:'web_search_call',status:'completed',action:{sources:r.sources}},{type:'message',content:[{type:'output_text',text:JSON.stringify({records:[r],limitations:[]})}]}]})};}});
 assert.equal(body.store,false);assert.equal(body.max_tool_calls,4);assert(body.tools[0].filters.allowed_domains.includes('trane.com'));assert.equal(result.records[0].status,'awaiting-review');
 const ctx=foundationContext('KERDI seam overlap',{}, {now});assert(ctx.entries.some(e=>e.id==='kerdi-overlap'&&e.applicability&&e.evidence));
});

test('ordinary connecting words cannot displace relevant technical references',()=>{
 const hits=findFoundation('What grit before primer?',{limit:5,now});assert(hits.some(x=>x.id==='paint-sanding'));assert(!hits.some(x=>x.id==='door-handing'||x.id==='kerdi-test-timing'));
});
