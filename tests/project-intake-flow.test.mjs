import test from 'node:test';
import assert from 'node:assert/strict';
import {beginSetup,answerSetup,setupQuestion,freeAllowance} from '../lib/project-intake-flow.mjs';
const project={id:'p1',request:'reno bathroom',messages:[]};
test('setup collects a brief without consuming AI replies, preserves uncertainty and resumes',()=>{
 let r=beginSetup(project);assert.match(r.messages[0].content,/current positions/);
 assert.throws(()=>answerSetup(r,'change'),/Which option/);
 r=answerSetup(r,'The layout');assert.equal(setupQuestion(r).id,'constraint');
 r=answerSetup(JSON.parse(JSON.stringify(r)),'Not sure yet');
 r=answerSetup(r,'I’m new to DIY');assert.equal(setupQuestion(r),undefined);
 assert.equal(r.setup.answers.constraint,'Not sure yet');assert.equal(r.request,project.request);
 assert.equal(r.messages.some(m=>m.source==='ai'),false);
});
test('free allowance only counts current-month server ledger and applies account project cap',()=>{
 const now=new Date('2026-09-25T12:00:00Z');const row=id=>({project_id:id,bucket:'free:2026-09',feature:'answer'});
 assert.equal(freeAllowance({signedIn:true,usage:[row('p1'),row('p1'),row('p1')]},'p1',now),0);
 assert.equal(freeAllowance({signedIn:true,usage:[row('p1'),row('p2'),row('p3')]},'p4',now),0);
 assert.equal(freeAllowance({signedIn:true,usage:[row('p1'),{...row('p1'),bucket:'paid'},{...row('p1'),bucket:'free:2026-08'}]},'p1',now),2);
 assert.equal(freeAllowance({signedIn:false},'p1',now),null);
});
test('basement work starts as planning rather than a flooding emergency',()=>{
 const r=beginSetup({...project,request:'frame my basement'});assert.match(r.messages[0].content,/finished basement/);assert.match(setupQuestion(r).choices[0],/Frame/);
});
