import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanCompanion,companionFromEntities,experienceSuggestion,relevantAreas,validEquipment,validExperience,equipmentKey,experienceKey} from '../lib/companion-profile.mjs';
import {validateEntities,flatten,mergeChanges} from '../lib/workspace-sync.mjs';
import {makeBackup,validateBackup} from '../lib/workspace-backup.mjs';
import {internalAnswer,rememberAnswer} from '../lib/internal-answers.mjs';
import {safetyDecision} from '../lib/safety-policy.mjs';
const tool={id:'sprayer-1',toolId:'sprayer',make:'Wagner',model:'3500',variant:'Unknown region',accessories:'Tip not yet identified',source:'user',updatedAt:'2026-09-26'};
const experience={id:'finishing',level:'beginner',source:'user',updatedAt:'2026-09-26'};
test('account equipment supports multiple models; removed ownership is excluded from advice',()=>{
 const entities={'equipment:sprayer-1':tool,'equipment:sprayer-2':{...tool,id:'sprayer-2',model:'Other model'},'tool:sprayer':'sprayer','experience:finishing':experience};
 validateEntities(entities);assert.equal(companionFromEntities(entities).equipment.length,2);
 assert.equal(companionFromEntities({...entities,'tool:sprayer':null}).equipment.length,0);
 assert.equal(companionFromEntities({}).experience.length,0);
});
test('profile validation rejects arbitrary tools, qualifications, oversized text and mismatched IDs',()=>{
 assert(!validEquipment({...tool,toolId:'unrecognized'}));assert(!validEquipment({...tool,model:'x'.repeat(101)}));assert(!validEquipment({...tool,make:'',model:''}));
 assert(!validExperience({...experience,level:'certified'}));assert(!validExperience({...experience,id:'all'}));
 assert.throws(()=>validateEntities({'equipment:wrong-id':tool}));assert.throws(()=>validateEntities({'experience:electrical':experience}));
});
test('independent domain and equipment edits sync without overwriting each other',()=>{
 const values={[equipmentKey]:JSON.stringify([tool]),[experienceKey]:JSON.stringify([experience])};
 const flat=flatten({getItem:k=>values[k],length:2,key:i=>Object.keys(values)[i]});
 const merged=mergeChanges({},flat,{'experience:plumbing':{...experience,id:'plumbing',level:'some'}},()=> 'recovery');
 assert.equal(merged.merged['experience:plumbing'].level,'some');assert.equal(merged.merged['experience:finishing'].level,'beginner');assert.equal(merged.merged['equipment:sprayer-1'].model,'3500');
});
test('equipment and separate skills survive backup; old backups remain supported',()=>{
 const result=validateBackup(makeBackup([],['sprayer'],[],[tool],[experience]));assert.deepEqual(result.equipment,[tool]);assert.deepEqual(result.experience,[experience]);
 const old=JSON.parse(makeBackup([],[],[]));delete old.equipment;delete old.experience;assert.deepEqual(validateBackup(JSON.stringify(old)).experience,[]);
 assert.throws(()=>validateBackup(makeBackup([],[],[],[{...tool,accessories:'x'.repeat(401)}],[])));
});
test('only explicit first-person experience creates a suggestion, and domains stay separate',()=>{
 assert.deepEqual(experienceSuggestion("I'm new to plumbing"),{id:'plumbing',level:'beginner'});
 assert.deepEqual(experienceSuggestion('I am experienced with woodworking'),{id:'woodworking',level:'experienced'});
 for(const s of ['I finished all steps','My friend is experienced with electrical',"I'm not experienced with plumbing",'I bought Plus','The wiring worked'])assert.equal(experienceSuggestion(s),null);
 assert.deepEqual(relevantAreas({request:'repair plumbing and drywall'}),['plumbing','drywall']);
});
test('exact answer reuse invalidates when tool model, accessory or experience changes',()=>{
 const r={id:'project-a',guideId:'paint-cabinets',request:'paint cabinets',messages:[]},q='How should I organize my workspace?',ctx=cleanCompanion([tool],[experience],['sprayer']);
 r.knowledge=rememberAnswer(r,q,{text:'Personal advice'},['sprayer'],ctx);
 r.messages=[{role:'user',content:q},{role:'assistant',content:'Personal advice'}];
 assert.equal(internalAnswer(r,q,['sprayer'],ctx).source,'saved-answer');
 for(const next of [cleanCompanion([{...tool,model:'Different'}],[experience],['sprayer']),cleanCompanion([{...tool,accessories:'New tip'}],[experience],['sprayer']),cleanCompanion([tool],[{...experience,level:'experienced'}],['sprayer'])])assert.equal(internalAnswer(r,q,['sprayer'],next),null);
});
test('self-reported electrical experience does not lower safety decisions',()=>{
 const r={request:'Change electrical wiring',messages:[]},q='How do I work on a live breaker panel?';
 assert.deepEqual(safetyDecision({...r,experience:[{id:'electrical',level:'experienced'}]},q),safetyDecision(r,q));
});
