import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {foundationAnswer,findFoundation,foundationContext} from '../lib/diy-knowledge.mjs';
import {knowledgeCoverage} from '../lib/knowledge-coverage.mjs';
import {beginSetup,setupQuestion,answerSetup} from '../lib/project-intake-flow.mjs';import {freeStartingPoint} from '../lib/free-start.mjs';
const scenarios=JSON.parse(fs.readFileSync(new URL('../knowledge/six-area-scenarios.json',import.meta.url)));
for(const s of scenarios)test(`reference retrieval and scope: ${s.id}`,()=>{
 const now=Date.parse('2026-09-26T18:00:00Z');
 const found=findFoundation(s.question,{limit:5,now}).find(e=>e.id===s.referenceId);
 assert.ok(found,'Required reference must be in the actual direct-context shortlist');assert.equal(found.scope,s.mustRetainScope);assert.deepEqual(found.required,s.required);
 const answer=foundationAnswer(s.educationalQuestion,{now});assert.equal(answer.foundationIds[0],s.referenceId);assert.ok(answer.text.includes(found.scope));for(const limit of found.limits)assert.ok(answer.text.includes(limit));
 assert.equal(foundationAnswer(s.question,{now}),null,'A personal scenario must not receive an exact cached general answer');
 assert.equal(foundationAnswer(s.educationalQuestion,{now:Date.parse('2028-01-01')}),null,'Expired answers cannot be reused');
});
test('experience benchmark cannot be inflated by counts or customer demand',()=>{
 const report=knowledgeCoverage([],Date.parse('2026-09-26'));
 assert.equal(report.expertCertification,false);assert.equal(report.domains.filter(d=>d.benchmark).length,6);
 for(const d of report.domains.filter(d=>d.benchmark)){assert.ok(d.benchmark.gap);assert.equal(d.benchmark.tasks.length,3);assert.ok(d.benchmark.next);assert.equal(d.benchmark.accuracy,undefined);}
});
test('plywood finishing gives relevant guest guidance and only asks missing decision facts',()=>{
 let r=beginSetup({request:'explain how to finish plywood',messages:[],useCase:'build'});
 assert.equal(setupQuestion(r).text,'What look do you want?');const start=freeStartingPoint(r);assert.match(start.title,/plywood/);assert.match(start.steps.join(' '),/veneer/);assert.doesNotMatch(start.steps.join(' '),/photograph|model numbers/);
 r=answerSetup(r,'Clear — keep the wood visible');assert.match(setupQuestion(r).text,/bare or already finished/);
 r=answerSetup(r,'Bare, indoors');assert.equal(setupQuestion(r),undefined);
 const complete=beginSetup({request:'Explain how to paint bare plywood indoors',messages:[]});assert.equal(setupQuestion(complete),undefined);
});
test('finishing recognition does not intercept different tasks or urgent hazards',()=>{
 assert.match(setupQuestion(beginSetup({request:'Build a plywood cabinet',messages:[]})).text,/cabinet/);
 assert.equal(freeStartingPoint({request:'My plywood is on fire'}),null);
});
