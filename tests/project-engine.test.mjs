import test from 'node:test';import assert from 'node:assert/strict';
import {compileBookcase,compileProposal,engineDecision,proposalCurrent,engineCapabilities} from '../lib/project-engine.mjs';
import {technicalAssessment,assessmentTopics} from '../lib/technical-assessment.mjs';
import {feasibilityQuestion,requestedMeasurements} from '../lib/feasibility.mjs';
import {proposeChange} from '../lib/project-actions.mjs';
import {makeBackup,validateBackup} from '../lib/workspace-backup.mjs';
const record={version:1,id:'engine-test',guideId:'bookcase',request:'A bookcase for books',answers:{},messages:[],pack:{input:{width:600,height:900,depth:300,thickness:18,shelves:2,material:'mdf'},build:{version:1,options:{finish:'paint'}}}};
const operation={builder:'bookcase.uniform-panels.v1',target:'whole-design',changes:{width:620},reason:'Fit the available space'};
const research={status:'supported',sources:[{url:'https://manufacturer.example/manual',title:'Manual'}],checkedAt:'2026-09-26T12:00:00Z'};

test('registered builder produces one consistent set of drawings, parts, tools, materials and steps',()=>{
 for(const material of ['plywood','mdf','melamine-mdf','melamine-particleboard'])for(const shelves of [1,2,3]){
  const b=compileBookcase({...record.pack.input,material,shelves});assert.equal(b.parts.reduce((n,p)=>n+p.qty,0),shelves+5);assert.equal(b.steps.length,b.drawings.steps.length);assert.ok(b.tools.length);assert.ok(b.materials.length);assert.match(b.drawings.overview,/<svg/);assert.match(b.drawings.parts,/<svg/);assert.equal(b.checks.constructionApproval,false);assert.equal(b.checks.loadRating,null);
 }
 assert.throws(()=>compileBookcase({...record.pack.input,width:50.8}));assert.throws(()=>compileBookcase({...record.pack.input,material:'foam'}));assert.throws(()=>compileBookcase({...record.pack.input,width:'600'}));
 assert.equal(engineCapabilities.learn.automaticPublication,false);
});
test('design proposals require a registered operation, valid dimensions and an unchanged context',()=>{
 const p=compileProposal(record,operation,'Make the entire bookcase 620 mm wide');assert.equal(p.status,'review');assert.equal(p.input.width,620);assert.equal(record.pack.input.width,600);assert.ok(proposalCurrent(record,p));assert.equal(proposalCurrent({...record,notes:'Now needs to fit below a window'},p),false);
 for(const q of ['Make the top shelf 100 mm less deep','Make a dog cage','Make it a wall-hung cabinet'])assert.equal(compileProposal(record,operation,q).status,'unsupported');
 assert.equal(compileProposal(record,{...operation,changes:{width:3000}}).status,'unsupported');
 assert.equal(compileProposal(record,{...operation,changes:{unknown:12}}).status,'unsupported');
 assert.equal(proposeChange(record,'Make the top shelf 100 mm deep').input,undefined);
 assert.equal(proposeChange(record,'Make the whole bookcase 2 feet wide').input.width,610);
});
test('unknown material research records gaps instead of inventing approval',()=>{
 const a=technicalAssessment({summary:'Identify the foamboard',question:'Which kind of foamboard do you have?',choices:['Paper-faced craft board','Rigid insulation','Not sure'],checks:[{topic:'cutting',status:'established',finding:'Use an unspecified heated tool',urls:[]}]},research);
 assert.equal(a.stage,'needs-checking');assert.equal(a.checks.length,assessmentTopics.length);assert.equal(a.checks.find(c=>c.topic==='cutting').status,'needs-details');assert.ok(a.checks.some(c=>c.topic==='joining'));
 const d=engineDecision({record,question:'Use foamboard instead',raw:{technicalAssessment:{...a,checks:[]}},result:{text:'Need more details',stepUpdates:[{step:1,text:'Start cutting'}]},research});assert.equal(d.engine.phase,'needs-checking');assert.deepEqual(d.stepUpdates,[]);assert.equal(d.engine.learning.publication,'not-published');
});
test('a pending design proposal does not write instructions against the previous geometry',()=>{
 const d=engineDecision({record,question:'Make the entire bookcase 620 mm wide',raw:{designOperation:operation},result:{text:'Review the change',stepUpdates:[{step:1,text:'Cut 620 mm now'}]},research});assert.equal(d.engine.phase,'review-design');assert.deepEqual(d.stepUpdates,[]);assert.equal(d.designProposal.status,'review');
});
test('scale and unit checks ask before correcting; miniature and part requests keep their meaning',()=>{
 const a=feasibilityQuestion(record,'Build a bookshelf 2 inches wide');assert.match(a.text,/14.8 mm/);assert.ok(a.feasibility.choices.some(c=>c.includes('2 feet')));assert.equal(record.pack.input.width,600);
 assert.equal(feasibilityQuestion(record,'Make it 2 feet wide'),null);assert.equal(feasibilityQuestion(record,'Make a miniature shelf 2 inches wide'),null);assert.equal(feasibilityQuestion(record,'Use a 2 inch thick panel'),null);
 assert.equal(feasibilityQuestion(record,'Set width to 600').feasibility.code,'unit-needed');assert.equal(requestedMeasurements('Make it 2 feet wide').width.mm,609.6);
});
test('sources and assessment survive backup without becoming shared published knowledge',()=>{
 const assessment=technicalAssessment({summary:'Check coating',question:'Which exact coating?',choices:[],checks:[{topic:'finish',finding:'Check the manual',status:'established',urls:[research.sources[0].url]}]},research);
 const r={...record,technicalAssessment:assessment,messages:[{role:'assistant',content:'Check coating',source:'ai',research,technicalAssessment:assessment}],stepAdvice:{0:{text:'Keep existing parts',question:'What next?',designKey:'abc',research}}};
 const restored=validateBackup(makeBackup([r],[],[])).conversations[0];assert.equal(restored.messages[0].research.sources[0].url,research.sources[0].url);assert.equal(restored.technicalAssessment.checks.length,assessmentTopics.length);assert.equal(restored.stepAdvice[0].research.sources[0].url,research.sources[0].url);
});

test('an unresolved assessment cannot present model confidence or a proceed-anyway choice as approval',()=>{
 const raw={technicalAssessment:{summary:'These cutting and glue methods are fine.',question:'Should we proceed with these methods?',choices:['Proceed with current methods','Wait for identification'],checks:[{topic:'material',status:'needs-details',finding:'Use an unverified adhesive now.',urls:[]}]}};
 const result={text:'Use an unverified adhesive now.',discovery:{advice:'Use it now.',briefReady:true,question:'Proceed?',choices:['Proceed']},stepUpdates:[]};
 const d=engineDecision({record:{request:'A foamboard craft'},question:'Check the method',raw,result,research:{...research,status:'needs-details',sources:[]}});
 assert.doesNotMatch(d.text,/Use an unverified/);assert.equal(d.discovery.briefReady,false);assert.equal(d.technicalAssessment.choices.length,0);assert.match(d.technicalAssessment.question,/label/);assert.doesNotMatch(d.technicalAssessment.checks[0].finding,/adhesive now/);assert.equal(d.engine.phase,'needs-checking');
});

test('unknown compatibility asks for evidence instead of asking the user to approve a tool',()=>{
 const a=technicalAssessment({question:'Should I use the Logan tools for this 5 mm board?',choices:['Yes','No','Unsure'],checks:[{topic:'material',finding:'Board is unidentified.',status:'needs-details',urls:[]}]},{...research,status:'needs-details',sources:[]});
 assert.deepEqual(a.choices,[]);assert.match(a.question,/label or purchase listing/);assert.equal(a.stage,'needs-checking');
});
