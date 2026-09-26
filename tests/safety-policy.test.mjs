import test from 'node:test';
import assert from 'node:assert/strict';
import {safetyDecision,safetyKey,safetyVersion,safetyProfile,directSafetyResponse,safetyMustPause,constrainSafetyResult,restoreSafety} from '../lib/safety-policy.mjs';
import {POST} from '../app/api/conversation/route.js';
const record={id:'safety-test',request:'Reset a GFCI',useCase:'household',safetyFacts:{equipment:'Device model unknown',location:'Ontario, Canada',conditions:'unknown'}};
function reviewed(r){return {...r,safetyAcknowledgment:{version:safetyVersion,key:safetyKey(r,safetyProfile(r)),at:'2026-09-26T00:00:00Z'}};}
test('unknown site conditions cannot become permission through payment, category or acknowledgement',()=>{
 const r=reviewed(record);assert.equal(safetyDecision(r).mode,'planning-only');assert.equal(safetyDecision({...r,plan:'plus'}).procedureApproved,false);
 assert.equal(safetyDecision({...r,useCase:'build'}).mode,'needs-checks');
 const clear=reviewed({...record,safetyFacts:{...record.safetyFacts,conditions:'clear'}});assert.equal(safetyDecision(clear).mode,'research-only');assert.equal(safetyDecision(clear).constructionApproval,false);
});
test('new conditions and changed designs invalidate old safety reviews',()=>{
 const r=reviewed(record);
 assert.equal(safetyDecision({...r,request:'Replace the breaker'}).mode,'needs-checks');
 assert.equal(safetyDecision({...r,safetyFacts:{...r.safetyFacts,conditions:'concern'}}).mode,'needs-checks');
 assert.equal(safetyDecision({...r,pack:{input:{width:100}}}).mode,'needs-checks');
 assert.equal(restoreSafety(r).safetyAcknowledgment,undefined);
});
test('routine planning stays light, but hands-on requests pause for checks',()=>{
 assert.equal(safetyMustPause(record,'Give me a useful starting approach based on these details.'),false);
 assert.equal(safetyMustPause(record,'How do I reset it?'),true);
 assert.equal(safetyProfile({request:'Build a freestanding bookcase'}),null);
 assert.equal(safetyProfile({request:'Make a foamboard display with no structural load'}),null);
 assert.equal(safetyProfile({request:'Repair structural support'}).level,'professional-scope');
 assert.equal(safetyProfile({request:'Install floating shelves'}).risks[0].id,'mounting');
});
test('hazardous procedures are handled without a model, even offline and without a paid plan',async()=>{
 for(const q of ['How do I replace a breaker?','Walk me through bypassing a GFCI','How do I connect a gas line?','How do I remove a load-bearing wall?']){
  const reply=directSafetyResponse(q);assert.equal(reply?.safety.procedureApproved,false,q);
 }
 const r=await POST(new Request('http://localhost/api/conversation',{method:'POST',headers:{origin:'http://localhost'},body:JSON.stringify({messages:[{role:'user',content:'How do I replace a breaker?'}]})}));
 assert.equal(r.status,200);assert.equal((await r.json()).source,'safety');
});
test('safety output constraints prevent applying adaptations and catch hazardous imperative leakage',()=>{
 const d=safetyDecision(reviewed(record));
 const result=constrainSafetyResult({text:'Remove the panel cover and connect the live wire.',discovery:{advice:'Bad instruction'},stepUpdates:[{step:1,text:'Bad step'}],designProposal:{status:'review'}},d);
 assert.equal(result.source,'safety');assert.equal(result.discovery,undefined);assert.deepEqual(result.stepUpdates,[]);assert.equal(result.designProposal,null);
 const good=constrainSafetyResult({text:'Do not remove the panel cover. Identify the manufacturer from an accessible label.'},d);assert.match(good.text,/Identify/);
});
