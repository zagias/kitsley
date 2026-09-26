import test from 'node:test';
import assert from 'node:assert/strict';
import {foundationKnowledge,foundationSources,foundationAnswer,foundationContext,findFoundation,foundationQuickQuestions} from '../lib/diy-knowledge.mjs';
import {internalAnswer,rememberAnswer} from '../lib/internal-answers.mjs';
const now=Date.parse('2026-09-26T12:00:00Z');
test('every published foundation has provenance, scope, required inputs and limits',()=>{
 assert.equal(new Set(foundationKnowledge.map(e=>e.id)).size,foundationKnowledge.length);
 for(const e of foundationKnowledge){assert.ok(e.scope&&e.facts.length&&e.required.length&&e.limits.length);assert.ok(e.revision>0);assert.ok(Date.parse(e.reviewBy)>Date.parse(e.checkedAt));for(const id of e.sources){assert.ok(foundationSources[id]);assert.equal(new URL(foundationSources[id].url).protocol,'https:');}}
});
test('similar wording never authorizes a personal material, screw or tool prescription',()=>{
 for(const q of ['What screws for my 36 inch dog cage?','What bit size for MDF?','What is melamine and can my dog chew it?','What is melamine instead of plywood for this load?','Use 10 mm screws for a wall cabinet','What grit for old paint?','Wagner 3500 orange peel, how much thinner?','I want a nonstandard cabinet','What is the difference between the flexio 3500 nozzles for my solvent lacquer?'])assert.equal(foundationAnswer(q,{now}),null,q);
 for(const q of foundationQuickQuestions)assert.equal(foundationAnswer(q,{now}).source,'foundation',q);
 assert.ok(internalAnswer({},'What is melamine?'));
});
test('expired references fail closed for direct answers and background retrieval',()=>{
 const expired=Date.parse('2028-01-01');assert.equal(foundationAnswer('What is melamine',{now:expired}),null);assert.deepEqual(findFoundation('MDF screws',{now:expired}),[]);
});
test('retrieval ranks material/system references but carries explicit applicability limits',()=>{
 for(const [q,id] of [['MDF screws pilot splitting','mdf-fixing'],['melamine core','melamine-core'],['orange peel sprayer','spray-diagnosis'],['Kreg pocket screws','pocket-thread'],['saw blade plywood','finish-blade']])assert.ok(findFoundation(q,{now}).some(e=>e.id===id),q);
 const ctx=foundationContext('MDF screws',{pack:{input:{material:'mdf',thickness:18}},notes:'PRIVATE ADDRESS',messages:[{content:'PRIVATE QUESTION'}]},{now});
 assert.equal(ctx.confirmedProject.thicknessMm,18);assert.match(ctx.policy,/relevant match is not validation/);assert.doesNotMatch(JSON.stringify(ctx),/PRIVATE/);assert.ok(ctx.entries.every(e=>e.required.length));
 assert.equal(foundationContext('unmatchedxyz',null,{now}),null);
});
test('sizing facts cannot confuse a screw core with its outside diameter or a pocket bit',()=>{
 const e=foundationKnowledge.find(e=>e.id==='mdf-fixing');assert.match(e.facts[0],/CORE diameter/);assert.match(e.limits.join(' '),/pocket-hole drill/);
 const k=foundationKnowledge.find(e=>e.id==='pocket-thread');assert.match(k.scope,/Kreg/);assert.ok(k.required.includes('Actual thickness of both pieces'));
});
test('reference answers do not enter the AI-answer cache or consume AI usage counts',()=>{
 const r={messages:[]},q='What is melamine',a=foundationAnswer(q,{now}),k=rememberAnswer(r,q,a);
 assert.equal(k.answers.length,0);assert.equal(k.usage.foundation,1);assert.equal(k.usage.ai,0);
});
test('finishing references preserve substrate, exact formulation and timing distinctions',()=>{
 for(const [q,id] of [['bonding primer stix','bonding-primer'],['shellac primer','shellac-primer'],['oil cover stain primer','oil-primer'],['gel stain','gel-stain'],['topcoat amber','oil-clear'],['primer recoat cure','primer-timing']])assert.ok(findFoundation(q,{now}).some(e=>e.id===id),q);
 const timing=foundationKnowledge.find(e=>e.id==='primer-timing');assert.match(timing.scope,/25°C.*50%/);assert.match(timing.facts.join(' '),/3–4 hours.*3–4 days/);assert.match(timing.limits.join(' '),/24-hour/);
 assert.equal(foundationAnswer('What is a bonding primer?',{now}).foundationIds[0],'bonding-primer');
 assert.equal(foundationAnswer('What is a bonding primer for my swollen MDF?',{now}),null);
 assert.ok(findFoundation('old paint sanding',{now}).some(e=>e.id==='old-coating'));
});
test('sanding records separate pad size, stroke, grit and a finish-specific schedule',()=>{
 const e=foundationKnowledge.find(e=>e.id==='sander-pad');assert.match(e.facts[0],/125 mm.*150 mm/);assert.match(e.facts[0],/3 mm.*5 mm/);
 for(const [q,id] of [['belt sander machine','sander-type'],['hand sponge curve','hand-sanding'],['disc size stroke','sander-pad'],['abrasive belt backing','abrasive-format']])assert.ok(findFoundation(q,{now}).some(e=>e.id===id),q);
 assert.equal(foundationAnswer('Can I use a belt sander on thin veneer?',{now}),null);
 assert.equal(foundationAnswer('What is the difference between sander pad size and stroke?',{now}).foundationIds[0],'sander-pad');
});
