import test from 'node:test';import assert from 'node:assert/strict';
import {diyDomains,domainsFor,aggregateDomainLearning} from '../lib/diy-domains.mjs';
import {foundationKnowledge,foundationCurrent,foundationContext,foundationAnswer,findFoundation} from '../lib/diy-knowledge.mjs';
import {knowledgeCoverage} from '../lib/knowledge-coverage.mjs';
import {coordinationContext} from '../lib/trade-coordination.mjs';
import {specialistContext,specialistReview,restoreSpecialistReview} from '../lib/specialist-review.mjs';
import {engineDecision,engineContext} from '../lib/project-engine.mjs';
import {rememberAnswer} from '../lib/internal-answers.mjs';
import {makeBackup,validateBackup} from '../lib/workspace-backup.mjs';
import {researchFormat} from '../lib/advice-research.mjs';
const now=Date.parse('2026-09-26T12:00:00Z'),url='https://example.com/manual';
const research={status:'supported',sources:[{url,title:'Manual'}],checkedAt:new Date(now).toISOString()};
const review=(area,dependsOn=[],status='evidence-found')=>({area,reason:'Needed for this project',finding:'Scoped reference information',status,dependsOn,urls:[url]});
test('references cover named competencies while reporting partial coverage honestly',()=>{
 const c=knowledgeCoverage([],now);assert.equal(c.domains.length,15);assert(c.total>=60);assert.equal(c.current,c.total);assert.equal(c.modelTraining,false);assert.equal(c.expertCertification,false);
 for(const d of c.domains)assert.match(d.status,/partial-reference-coverage|research-required/);
 for(const [q,id] of [['cabinet wall shims','cabinet-out-of-plumb'],['hinge model','cabinet-hinge-plan'],['gfci reset lockout','gfci-lockout'],['pvc cpvc abs cement','pipe-cement-selection'],['drywall compound','drywall-compound'],['foamboard adhesive facing','foamboard-bond'],['connector fastener nail','connector-fastener'],['hvac merv filter','filter-merv'],['prehung door plumb','door-plumb']])assert(findFoundation(q,{now,limit:20}).some(e=>e.id===id),q);
 const first=foundationKnowledge[0];assert(!foundationCurrent({...first,checkedAt:'2027-01-01'},now));assert(!foundationCurrent({...first,sources:['missing']},now));assert(!foundationAnswer('What is MERV',{now:Date.parse('2030-01-01')}));
});
test('routing follows current topic and retains the project for ambiguous followups',()=>{
 const r={request:'Hang a prehung door'};assert(domainsFor('What next?',r).some(d=>d.id==='doors'));assert.deepEqual(domainsFor('What is MERV?',r).map(d=>d.id),['hvac']);assert.deepEqual(domainsFor('unmatchedxyz',null),[]);
 for(const q of ['Can I use this screw for my wall cabinet?','How deep can I cut this drywall?','What MERV can my furnace take?'])assert.equal(foundationAnswer(q,{now}),null);
 assert(foundationContext('drywall and plumbing',{}, {now}).domains.length>=2);assert.equal(specialistContext({},'unrecognized material').registry.length,diyDomains.length);
});
test('wall checks persist across trade changes without treating reported clear conditions as clearance',()=>{
 const r={request:'Cut an opening in drywall',safetyFacts:{conditions:'clear',equipment:'Drywall'},messages:[]};
 for(const q of ['What next?','My scanner found no cable','Power is off','A plumber says there are no pipes','Cut a different opening']){
  const c=coordinationContext(r,q);assert(c,q);assert.equal(c.constructionApproval,false);assert.equal(c.state,'site-checks-required');assert.deepEqual(c.handoffs.map(h=>h.to),['electrical','plumbing','drywall']);
 }
 assert.equal(coordinationContext(r,'What is MERV?'),null);
 const ctx=engineContext(r,'Cut another opening');assert.match(ctx.coordination.rule,/Changed location/);
 const d=engineDecision({record:r,question:'Cut the drywall',raw:{},result:{text:'Planning discussion',stepUpdates:[{step:1,text:'Cut now'}]},research});assert.deepEqual(d.stepUpdates,[]);assert.equal(d.designProposal,null);assert.equal(d.engine.phase,'needs-checking');
});
test('general specialist handoffs validate evidence and propagate unresolved dependencies',()=>{
 const raw={lead:'cabinetry',nextArea:'adhesives',question:'Which facing?',reviews:[review('cabinetry',['materials']),review('materials',['adhesives']),review('adhesives',[],'needs-details')]};
 const r=specialistReview(raw,research);assert.equal(r.nextArea,'adhesives');assert.equal(r.status,'needs-checking');assert(r.reviews.every(v=>v.status==='needs-details'));assert.equal(r.constructionApproval,false);assert.equal(r.publication,'private-project-only');
 const missing=specialistReview({lead:'finishing',reviews:[review('finishing',['materials'])]},research);assert(missing.reviews.some(r=>r.area==='materials'&&r.status==='research-needed'));
 const fake=specialistReview({lead:'hvac',reviews:[{...review('hvac'),urls:['https://invented.example/manual']}]},research);assert.equal(fake.reviews[0].status,'research-needed');
 const cycle=specialistReview({lead:'plumbing',reviews:[review('plumbing',['drywall']),review('drywall',['plumbing'])]},research);assert.equal(cycle.status,'needs-checking');
 const supported=specialistReview({lead:'doors',reviews:[review('doors')]},research);assert.equal(supported.status,'reference-guidance');assert.equal(restoreSpecialistReview(supported,research).status,'needs-checking');
 const schema=researchFormat(null).schema;assert(schema.required.includes('specialistReview'));assert(schema.properties.specialistReview.anyOf[1].properties.lead.enum.includes('electrical'));
});
test('learning records known area counts and backup cannot restore completion authority',()=>{
 const r={version:1,id:'multi-test',request:'Cabinet work',answers:{},messages:[],guideId:null};
 r.knowledge=rememberAnswer(r,'What about the foam adhesive?',{source:'foundation',text:'Scoped reference'});
 r.knowledge.domains['PRIVATE ADDRESS']=100;r.knowledge.domains.electrical=-5;
 const counts=aggregateDomainLearning([r]);assert(counts.some(c=>c.id==='adhesives'));assert.doesNotMatch(JSON.stringify(counts),/PRIVATE|Cabinet work|foam adhesive/);
 r.specialistReview=specialistReview({lead:'doors',reviews:[review('doors')]},research);
 const b=validateBackup(makeBackup([r],[],[])).conversations[0];assert(b.knowledge.domains.adhesives>0);assert.equal(b.knowledge.domains.electrical,undefined);assert.equal(b.specialistReview.status,'needs-checking');
});
