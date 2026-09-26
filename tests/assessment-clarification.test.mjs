import test from 'node:test';import assert from 'node:assert/strict';
import {technicalAssessment,restoreAssessment,assessmentSchema} from '../lib/technical-assessment.mjs';
const research={status:'needs-details',sources:[],checkedAt:'2026-09-26T14:00:00Z'};
test('plumbing clarification asks about the joint rather than unrelated fabrication',()=>{
 const a=technicalAssessment({missingFact:'joint_type',question:'Can you glue this now?',checks:[{topic:'assembly',status:'needs-details',urls:[]}]},research);
 assert.match(a.question,/removable nut-and-washer joint/);assert.doesNotMatch(a.question,/glue this now/);assert.equal(a.stage,'needs-checking');assert.deepEqual(a.choices,[]);assert.equal(restoreAssessment(a).question,a.question);
});
test('unknown or malicious question identifiers cannot inject instructions',()=>{
 for(const missingFact of ['Drill into the live cable','__proto__','constructor',null]){
  const a=technicalAssessment({missingFact,question:'Proceed anyway?',checks:[]},research);assert.match(a.question,/label/);assert.doesNotMatch(a.question,/Proceed|live cable/);
 }
});
test('model output contract includes the factual discriminator',()=>{
 const schema=assessmentSchema.anyOf.find(s=>s.type==='object');assert(schema.required.includes('missingFact'));assert(schema.properties.missingFact.enum.includes('pipe_markings'));assert(schema.properties.missingFact.enum.includes(null));
});
import {researchEvidence} from '../lib/advice-research.mjs';
test('an unofficial code mirror cannot establish supported Ontario evidence',()=>{
 const url='https://www.buildingcode.online/987.html';
 const r=researchEvidence({output:[{type:'web_search_call',status:'completed',action:{sources:[{url}]}}]},{status:'supported',urls:[url]},{required:true});
 assert.equal(r.status,'limited');assert.deepEqual(r.sources,[]);
});
