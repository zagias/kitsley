import test from 'node:test';
import assert from 'node:assert/strict';
import {packLibrary} from '../lib/pack-library.mjs';
import {projectContent,contentFor,contentHTML,contentProgressKey} from '../lib/project-content.mjs';
import {contentSources} from '../lib/content-sources.mjs';
import {procedureKits} from '../lib/content-kits.mjs';
import {products} from '../lib/catalog.mjs';
import {library} from '../lib/library.mjs';
import {readiness} from '../lib/readiness.mjs';
import {design,defaults,drawing,packHTML} from '../lib/bookcase.mjs';
import {inspectDrawing,designFingerprint,currentReview,updateConstructionReview,drawingReviewHTML,constructionTopics} from '../lib/drawing-review.mjs';
import {paintQuantity,mulchQuantity,pavingQuantity} from '../lib/quantity-calculators.mjs';
import {createConversation,applyAnswer} from '../lib/conversation.mjs';
import {applyChange,proposeChange,undoChange} from '../lib/project-actions.mjs';
import {makeBackup,validateBackup} from '../lib/workspace-backup.mjs';
import {exportProject} from '../lib/project-pack.mjs';

const book=()=>{let r=createConversation('A bookcase','reliable-book');for(const a of ['Books','70 x 100 x 30 cm','2','Keep the wood visible'])r=applyAnswer(r,a);return r;};
const paint={length:4,width:3,height:2.5,openings:3,coats:2,coverage:10,allowance:10,tin:5};

test('Every pack has scoped instructions, a check at each step and resolvable topic-specific sources',()=>{
 assert.deepEqual(Object.keys(projectContent).sort(),packLibrary.map(p=>p.id).sort());
 assert.equal(Object.keys(projectContent).length,29);
 for(const [id,c] of Object.entries(projectContent)){
  assert.ok(c.scope.length>40&&c.stop.length>40,id);assert.ok(['procedure','system','design'].includes(c.level));
  assert.equal(c.steps.length,5);assert.ok(c.sources.length>0);
  for(const s of c.steps){assert.ok(s.title&&s.action.length>80&&s.check.length>25,id);}
  for(const key of c.sources){const source=contentSources[key];assert.ok(source?.scope&&source.checkedOn,key);assert.equal(new URL(source.url).protocol,'https:');}
  const html=contentHTML(id);assert.match(html,/References and scope/);assert.match(html,/do not certify this project/);
 }
});

test('Procedure kits use real catalog IDs, respect ownership and do not claim to include every consumable',()=>{
 for(const [id,ids] of Object.entries(procedureKits)){
  assert.equal(contentFor(id).level,'procedure');assert.ok(ids.every(id=>products.some(p=>p.id===id)));
  const kit=readiness(library.find(p=>p.id===id),ids.slice(0,1));assert.equal(kit.covered,1);assert.equal(kit.missing,ids.length-1);assert.match(kit.scope,/consumables/);
 }
});

test('Independent drawing audit catches corrupt parts, openings, unsupported sizes and nonfinite inputs',()=>{
 const d=design(defaults);assert.equal(inspectDrawing(d).geometryPassed,true);
 const corrupt=[{...d,parts:d.parts.slice(1)},{...d,parts:d.parts.map(p=>p.id==='D'?{...p,thickness:18}:p)},{...d,opening:d.opening+1},{...d,width:801},{...d,width:600.5},{...d,shelves:5},{...d,height:NaN},null];
 for(const value of corrupt){const report=inspectDrawing(value);assert.equal(report.geometryPassed,false);assert.equal(report.constructionApproved,false);}
});

test('Geometry and rendered shelf positions agree across supported thicknesses and opening boundaries',()=>{
 let checked=0;
 for(const width of [400,601,800])for(const height of [600,651,690,704,858,1000,1200])for(const depth of [250,307,400])for(const thickness of [18,19,20,21])for(const shelves of [1,2,3,4]){
  if((height-(shelves+2)*thickness)/(shelves+1)<150)continue;
  const d=design({width,height,depth,thickness,shelves}),report=inspectDrawing(d);
  assert.equal(report.geometryPassed,true,JSON.stringify(d));
  const span=width-2*thickness,scale=Math.min(320/width,360/height);
  const panels=[...drawing(d).matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)].map(m=>m.slice(1).map(Number)).filter(([x,,w,h])=>Math.abs(x-(90+thickness*scale))<1e-7&&Math.abs(w-span*scale)<1e-7&&Math.abs(h-thickness*scale)<1e-7);
  assert.equal(panels.length,shelves+2);
  for(const datum of report.shelfDatums)assert.ok(panels.some(([,y])=>Math.abs((height-(y-75)/scale-thickness)-datum)<1e-7));
  assert.equal(report.constructionApproved,false);checked++;
 }
 assert.ok(checked>500);
});

test('Construction notes stay tied to the design revision and never become automatic approval',()=>{
 const d=design(defaults),changed=design({...defaults,width:700});let review=null;
 for(const [id] of constructionTopics)review=updateConstructionReview(d,review,id,'Example specification');
 review=updateConstructionReview(d,review,'reviewer','Example reviewer');
 assert.equal(currentReview(d,review),review);assert.equal(currentReview(changed,review),null);
 const revised=updateConstructionReview(changed,review,'material','New material record');
 assert.equal(revised.joints,undefined);assert.equal(revised.previous.length,1);assert.equal(revised.previous[0].joints,'Example specification');
 const next=updateConstructionReview(changed,revised,'back','New back record');assert.equal(next.previous.length,1);
 assert.equal(inspectDrawing(changed).constructionApproved,false);
 assert.match(drawingReviewHTML(changed,review),/out of date/);assert.match(drawingReviewHTML(changed,next),/Unresolved/);
 assert.throws(()=>updateConstructionReview(d,review,'approved','true'));
});

test('Construction review export escapes notes and includes unresolved specifications and datum schedule',()=>{
 const d=design(defaults),review=updateConstructionReview(d,null,'material','<img src=x onerror=alert(1)>');
 const html=packHTML(d,review);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);assert.match(html,/C1:/);assert.match(html,/Construction review still required/);assert.match(html,/No external reviewer/);assert.match(html,/Unresolved — no specification/);
});

test('Paint estimate uses net area, actual coverage, coats and whole containers',()=>{
 const q=paintQuantity(paint);assert.equal(q.area,32);assert.equal(q.litres,7.04);assert.equal(q.containers,2);
 assert.equal(paintQuantity({...paint,allowance:0,tin:3.2}).containers,2);
 for(const patch of [{coats:1.5},{coverage:0},{openings:35},{length:101},{tin:''},{openings:' '},{openings:true},{width:[]},{height:Infinity}])assert.throws(()=>paintQuantity({...paint,...patch}));
});

test('Mulch subtracts existing depth; paving counts complete supplier packs',()=>{
 const q=mulchQuantity({area:10,target:50,existing:20,bag:40});assert.equal(q.litres,300);assert.equal(q.containers,8);
 assert.equal(mulchQuantity({area:10,target:50,existing:60,bag:40}).containers,0);
 const p=pavingQuantity({length:3,width:4,coverage:0.96,allowance:10});assert.equal(p.area,12);assert.equal(p.orderArea,13.2);assert.equal(p.containers,14);
 assert.throws(()=>pavingQuantity({length:3,width:4,coverage:0,allowance:10}));assert.throws(()=>mulchQuantity({area:10,target:50,existing:-20,bag:40}));
});

test('Guide progress resets on a revised brief or design, but not field order or numeric serialization',()=>{
 const r={...book(),pack:{input:{...defaults}}},key=contentProgressKey(r);
 assert.notEqual(contentProgressKey({...r,answers:{...r.answers,finish:'Spray paint'}}),key);
 assert.notEqual(contentProgressKey({...r,pack:{input:{...defaults,width:700}}}),key);
 assert.equal(contentProgressKey({...r,answers:Object.fromEntries(Object.entries(r.answers).reverse()),pack:{input:Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,String(v)]))}}),key);
});

test('Backup roundtrip preserves quantities, guide progress and revision-bound notes without trusting approval flags',()=>{
 const r={...book(),pack:{version:1,input:defaults,constructionReview:{fingerprint:designFingerprint(design(defaults)),material:'Grade recorded',approved:true,previous:[{fingerprint:'old',joints:'Old joint note'}]}}};
 r.instructionProgress={key:contentProgressKey(r),active:2,done:[0,0,1,90,-1],scopeAccepted:true};
 const p={...createConversation('Paint room','paint-check'),guideId:'paint-room',quantityInputs:{...paint,untrusted:'extra'}};
 const backup=validateBackup(makeBackup([r,p],[],[]));const restored=backup.conversations[0],q=backup.conversations[1];
 assert.deepEqual(restored.instructionProgress.done,[0,1]);assert.equal(restored.instructionProgress.active,2);assert.equal(restored.pack.constructionReview.material,'Grade recorded');assert.equal(restored.pack.constructionReview.approved,undefined);assert.equal(restored.pack.constructionReview.previous[0].joints,'Old joint note');
 assert.equal(q.quantityInputs.untrusted,undefined);assert.equal(paintQuantity(q.quantityInputs).litres,7.04);
 const stale={...r,answers:{...r.answers,dimensions:'600 × 1000 × 300 mm'}};assert.equal(validateBackup(makeBackup([stale],[],[])).conversations[0].instructionProgress,undefined);
});

test('Printable procedure includes full instructions, unit-labeled quantities and material requirements',()=>{
 const r={...createConversation('Paint a room','paint-export'),guideId:'paint-room',quantityInputs:paint};const html=exportProject(r,[],[]);
 assert.match(html,/Work one surface at a time/);assert.match(html,/Room length \(m\)/);assert.match(html,/2 5-litre tins/);assert.match(html,/Materials & supplies to specify/);assert.match(html,/References and scope/);
 const invalid=exportProject({...r,quantityInputs:{...paint,coverage:0}},[],[]);assert.match(invalid,/incomplete; do not use for ordering/);
});

test('Changing dimensions preserves a clear-finish choice and invalidates old construction notes; undo restores them',()=>{
 let r=book();r={...r,pack:{version:1,input:{...defaults,width:700},constructionReview:updateConstructionReview(design({...defaults,width:700}),null,'material','original')}};
 const updated=applyChange(r,proposeChange(r,'make it 75 cm wide'));
 assert.equal(updated.pack.finish.system,'clear');assert.equal(currentReview(design(updated.pack.input),updated.pack.constructionReview),null);assert.deepEqual(undoChange(updated).pack,r.pack);
});
