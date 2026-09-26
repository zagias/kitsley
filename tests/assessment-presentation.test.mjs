import test from 'node:test';import assert from 'node:assert/strict';import {engineDecision} from '../lib/project-engine.mjs';
const url='https://www.ikea.com/ca/en/assembly_instructions/example.pdf';
const research={status:'needs-details',sources:[{url,title:'Manufacturer installation guidance'}],checkedAt:'2026-09-26T12:00:00Z'};
test('partial findings remain useful without exposing unverified construction prose',()=>{
 const raw={technicalAssessment:{checks:[{topic:'assembly',finding:'Keep the carcass square rather than bending it to the wall.',status:'established',urls:[url]},{topic:'joining',finding:'Unknown mounting system.',status:'needs-details',urls:[]}]}};
 const result=engineDecision({record:{},question:'My cabinet wall leans.',raw,research,result:{text:'Use these invented fasteners and start drilling.',stepUpdates:[{step:1,text:'Drill now'}]}});
 assert.match(result.text,/Keep the carcass square/);assert.match(result.text,/Which exact adhesive or fastener/);assert.doesNotMatch(result.text,/invented fasteners|start drilling/);assert.deepEqual(result.stepUpdates,[]);assert.equal(result.designProposal,null);assert.equal(result.technicalAssessment.stage,'needs-checking');
});
test('a claimed finding without retrieved evidence is not surfaced as established',()=>{
 const raw={technicalAssessment:{checks:[{topic:'strength',finding:'An unsupported 15 mm shelf safely carries any load.',status:'established',urls:['https://invented.example/rating']}]}};
 const result=engineDecision({record:{},question:'Can this shelf carry books?',raw,research,result:{text:'Safe for any load.'}});
 assert.doesNotMatch(result.text,/safely|Safe for any load/);assert.match(result.text,/What will this support/);assert.equal(result.engine.phase,'needs-checking');assert.deepEqual(result.stepUpdates,[]);
});
test('unknown cabinet mounting retains useful scoped guidance without approving fixings',()=>{
 const raw={technicalAssessment:{checks:[{topic:'assembly',finding:'Unknown mounting arrangement',status:'needs-details',urls:[]}]}};
 const result=engineDecision({question:'My Ontario wall leans 12 mm over the cabinet height. Should I pull it square using longer screws?',raw,research,result:{text:'Install a rail now.',stepUpdates:[{step:1,text:'Mount rail'}]}});
 assert.match(result.text,/do not pull it out of shape/);assert.match(result.text,/How is this cabinet supported/);assert.match(result.text,/do not establish the fixings/);assert.doesNotMatch(result.text,/Install a rail now/);assert.deepEqual(result.stepUpdates,[]);assert.equal(result.engine.phase,'needs-checking');
});
test('cabinet diagnostic does not replace unrelated electrical or known follow-up questions',()=>{
 for(const question of ['My outlet is hot. Can I pull it from the wall?','It is a floor-standing cabinet with bracket model 123. What now?']){
  const result=engineDecision({question,raw:{technicalAssessment:{checks:[]}},research,result:{text:'Unverified'}});
  assert.doesNotMatch(result.text,/How is this cabinet supported/);
 }
});
test('independent established facts survive unresolved method checks without exposing raw procedure',()=>{
 const raw={technicalAssessment:{missingFact:'joint_type',establishedPrinciples:[{text:'A washer-sealed slip joint seals at its washer, not with cement on its threads.',urls:[url]}],checks:[{topic:'joining',status:'needs-details',finding:'Actual connection needs confirmation.',urls:[url]}]}};
 const d=engineDecision({question:'Should I cement the threads?',raw,research,result:{text:'Apply cement now.',stepUpdates:[{step:1,text:'Apply cement'}]}});
 assert.match(d.text,/seals at its washer/);assert.match(d.text,/nut-and-washer/);assert.doesNotMatch(d.text,/Apply cement now/);assert.deepEqual(d.stepUpdates,[]);assert.equal(d.engine.phase,'needs-checking');
});
test('unretrieved principle sources do not bypass evidence checks',()=>{
 const raw={technicalAssessment:{establishedPrinciples:[{text:'Use any screw for any load.',urls:['https://invented.example/test']}],checks:[]}};
 const d=engineDecision({raw,research,result:{text:'Unverified instructions'}});assert.doesNotMatch(d.text,/any screw/);assert.deepEqual(d.technicalAssessment.establishedPrinciples,[]);
});
