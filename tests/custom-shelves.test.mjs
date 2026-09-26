import test from 'node:test';
import assert from 'node:assert/strict';
import {workshopModel,workshopDefaults,workshopProgress,workshopSteps,workshopShopping} from '../lib/bookcase-workshop.mjs';
import {workshopArt} from '../lib/bookcase-workshop-art.mjs';
import {compileBookcase,compileProposal,proposalCurrent,engineDecision} from '../lib/project-engine.mjs';
import {proposeChange} from '../lib/project-actions.mjs';
import {commitWorkshop} from '../lib/workshop-revision.mjs';
import {makeBackup,validateBackup} from '../lib/workspace-backup.mjs';
import {bookcaseAIContext} from '../lib/bookcase-ai-context.mjs';
import {internalAnswer} from '../lib/internal-answers.mjs';
import {designOperationSchema} from '../lib/design-operation-contract.mjs';
const input={...workshopDefaults,material:'mdf'},options={finish:'paint',wall:'unknown',cutting:'supplier'};
const pack=commitWorkshop(null,input,options,{}),record={version:1,id:'custom-shelves-test',guideId:'bookcase',request:'A bookcase',answers:{},messages:[],pack};

test('shelf changes propagate through every design artifact without changing the outer cabinet',()=>{
 const p=proposeChange(record,'Make the upper interior shelf 100 mm shallower');
 assert.equal(p.status,'review');assert.deepEqual(p.input.shelfInsets,[0,100]);assert.equal(record.pack.input.shelfInsets,undefined);
 const b=compileBookcase(p.input,options),d=b.model,old=compileBookcase(input,options);
 assert.deepEqual([d.width,d.height,d.depth],[600,900,300]);assert.equal(d.parts.find(p=>p.id==='C2').width,194);assert.equal(d.parts.find(p=>p.id==='C1').width,294);
 assert.deepEqual(d.shelfPanels[1].holeOffsets,[25,97,169]);assert.equal(d.pocketCount,24);assert.deepEqual(d.backScrews,old.model.backScrews);assert.ok(d.area<old.model.area);
 for(const kind of ['overview','parts','layout','pockets','first-side','second-side','finish']){const a=workshopArt(d,kind,options);assert.notEqual(a,workshopArt(old.model,kind,options));assert.doesNotMatch(a,/NaN|undefined/);}
 assert.match(b.drawings.overview,/<polygon/);assert.match(b.drawings.overview,/C2: 194 mm/);assert.match(b.drawings.parts,/194 mm/);assert.match(b.drawings.steps[2],/97 mm/);
 assert.match(b.steps[0].detail,/C2: 194 mm core depth/);assert.doesNotMatch(JSON.stringify(b.steps),/Keep every front edge flush|Keep each front edge flush|B and C all have the same length and depth/);
 assert.match(JSON.stringify(workshopShopping(d,options)),/564 × 194 × 18/);
 const current={...record,pack:commitWorkshop(pack,p.input,options,{stage:'kit'})};
 assert.equal(bookcaseAIContext(current).interiorShelves[1].coreDepth,194);assert.match(internalAnswer(current,'show me my cut list').text,/C2.*194/);
});
test('the same dimensional constraints hold across materials, sizes, edges and shelf counts',()=>{
 for(const material of ['plywood','mdf','melamine-mdf','melamine-particleboard'])for(const depth of [250,300,350])for(const shelves of [1,2,3])for(const edgeThickness of [0.5,1,2]){
  const b=compileBookcase({...input,material,depth,shelves,edgeThickness,shelfInsets:Array.from({length:shelves},(_,i)=>i===shelves-1?70:0)},options),d=b.model;
  for(const p of d.shelfPanels){assert.equal(p.inset+p.width,d.panelDepth);assert.equal(p.length+2*d.thickness,d.width);assert.ok(p.width>=150);assert.ok(p.holeOffsets.every(n=>n>15&&n<p.finishedDepth-15));}
  assert.equal(d.parts.reduce((n,p)=>n+p.qty,0),shelves+5);assert.equal(d.horizontalPanels.reduce((n,p)=>n+p.qty*6,0),d.pocketCount);
  if(d.melamine){assert.equal(d.shelfPanels.at(-1).finishedDepth,depth-6-70);assert.match(b.steps[0].actions[0],/each core depth/);}
 }
});
test('ambiguous requests clarify; width, top-panel, and unsupported shape changes never resize the cabinet',()=>{
 const q=proposeChange(record,'make the top shelf 100mm more narrow than the lower 2');assert.ok(q.clarification);assert.match(q.clarification.question,/front to back/);
 assert.ok(proposeChange(record,q.clarification.choices[0]).clarification);
 const three={...record,pack:commitWorkshop(null,{...input,shelves:3},options,{})};const q3=proposeChange(three,'make the top shelf 100mm more narrow than the lower 2');assert.equal(proposeChange(three,q3.clarification.choices[0]).status,'review');
 for(const text of ['Make the upper interior shelf 100 mm less wide','Make the upper interior shelf 100 mm deep','Make the upper interior shelf 400 mm deep','Make a tapered side to fit a leaning wall','Make the top panel 100 mm less deep'])assert.ok(proposeChange(record,text).unsupported,text);
 assert.ok(proposeChange(record,'Make the top shelf 100 mm shallower').clarification);
 assert.ok(proposeChange(record,'Make the upper interior shelf shallower').clarification);
 assert.deepEqual(proposeChange(record,'Make the lower interior shelf 40 mm shallower than the upper shelf').input.shelfInsets,[40,0]);
 assert.ok(proposeChange(record,'Using 18 mm MDF, make the upper interior shelf 200 mm deep').clarification);
 assert.equal(proposeChange(record,'Make the upper interior shelf 4 inches shallower').input.shelfInsets[1],101.6);
 assert.equal(proposeChange(record,'Make the upper interior shelf 3 1/2 inches shallower').input.shelfInsets[1],88.9);
 assert.equal(proposeChange(record,'Make the upper interior shelf 3-1/2 inches shallower').input.shelfInsets[1],88.9);
 assert.ok(proposeChange(record,'Make the upper interior shelf 1/0 inches shallower').clarification);
 for(const shelfInsets of [[0],[-1,0],[0,200],[0,NaN],['0',20]])assert.throws(()=>workshopModel({...input,shelfInsets}));
});
test('reviewed revisions preserve history, invalidate completed steps and survive backup/restoration',()=>{
 const old={...pack,build:{...pack.build,done:[0,1,2],stage:'build',active:2}};
 const next=commitWorkshop(old,{...input,shelfInsets:[0,100]},options,old.build,'2026-09-26T10:00:00Z');
 assert.equal(next.build.revision,2);assert.deepEqual(next.build.done,[]);assert.deepEqual(next.build.review,[0,1,2]);assert.deepEqual(old.build.done,[0,1,2]);assert.equal(next.revisions[0].input.shelfInsets,undefined);
 const restored=validateBackup(makeBackup([{...record,pack:next}],[],[])).conversations[0];assert.deepEqual(restored.pack.input.shelfInsets,[0,100]);assert.equal(restored.pack.revisions.length,1);assert.deepEqual(restored.pack.build.review,[0,1,2]);
 const previous=restored.pack.revisions[0],reverted=commitWorkshop(restored.pack,previous.input,previous.options,restored.pack.build);
 assert.equal(reverted.build.revision,3);assert.equal(workshopModel(reverted.input).customShelves,false);assert.deepEqual(reverted.revisions[1].input.shelfInsets,[0,100]);
 assert.throws(()=>validateBackup(makeBackup([{...record,pack:{...next,input:{...next.input,shelfInsets:[0,999]}}}],[],[])));
 const unchanged=workshopProgress(workshopModel({...input,shelfInsets:[0,0]}),options,pack.build);assert.equal(unchanged.key,pack.build.key);
});
test('remote operations use the same compiler and must remain bound to their exact project',()=>{
 const op={builder:'bookcase.recessed-shelves.v1',target:'interior-shelves',changes:{shelfInsets:[0,100],width:null}};
 const p=compileProposal(record,op,'Make the upper interior shelf 100 mm shallower');assert.equal(p.status,'review');assert.ok(proposalCurrent(record,p));assert.equal(proposalCurrent({...record,pack:{...pack,input:{...input,material:'plywood'}}},p),false);
 assert.equal(compileProposal(record,{...op,changes:{shelfInsets:[0,100],width:620}}).status,'unsupported');
 assert.equal(compileProposal(record,op,'Make the top shelf narrower').status,'unsupported');
 assert.ok(designOperationSchema.anyOf[1].properties.changes.required.includes('shelfInsets'));
 assert.throws(()=>workshopArt('overview',workshopModel(input)));
});


test('registered depth geometry can be reviewed without invented web support; uncertain methods stay blocked',()=>{
 const op={builder:'bookcase.recessed-shelves.v1',target:'interior-shelves',factsComplete:true,changes:{shelfInsets:[0,94]}};
 const base={record,question:'Adjust the upper interior shelf to two hundred millimetres deep',raw:{designOperation:op},result:{text:'Invent an extra support',stepUpdates:[{step:1,text:'Cut now'}]},research:{status:'limited',sources:[]}};
 const d=engineDecision(base);assert.equal(d.designProposal.status,'review');assert.equal(d.engine.phase,'review-design');assert.deepEqual(d.stepUpdates,[]);assert.doesNotMatch(d.text,/extra support/);assert.equal(d.designProposal.input.shelfInsets[1],94);
 assert.ok(proposalCurrent({...record,stepAdvice:{}},d.designProposal));
 assert.equal(proposalCurrent({...record,stepAdvice:{0:{text:'Changed guidance'}}},d.designProposal),false);
 assert.equal(engineDecision({...base,research:{status:'needs-details',sources:[]}}).designProposal.status,'review');
 assert.equal(engineDecision({...base,research:{status:'conflicting',sources:[]}}).designProposal,null);
 for(const factsComplete of [false,undefined])assert.equal(engineDecision({...base,raw:{designOperation:{...op,factsComplete}}}).designProposal,null);
 for(const question of ['Make the upper shelf shallower for an aquarium','Make this a pet crate'])assert.equal(engineDecision({...base,question}).designProposal.status,'unsupported');
 const wrong={...op,changes:{shelfInsets:[0,94],material:'plywood'}};assert.equal(engineDecision({...base,raw:{designOperation:wrong}}).designProposal.status,'unsupported');
 const material={builder:'bookcase.uniform-panels.v1',target:'whole-design',changes:{material:'plywood'}};assert.equal(engineDecision({...base,raw:{designOperation:material}}).designProposal,null);
});
