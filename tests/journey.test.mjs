import test from 'node:test';
import assert from 'node:assert/strict';
import {projectTitle,projectStage,safeReturnPath} from '../lib/journey.mjs';
import {makeBackup,validateBackup} from '../lib/workspace-backup.mjs';
test('project names preserve the user request instead of a guessed guide title',()=>{
 assert.equal(projectTitle({request:'Frame my basement',guideId:'flooded-basement'}),'Frame my basement');
 assert.equal(projectTitle({request:'reno bathroom',title:'Guest bathroom'}),'Guest bathroom');
 assert.equal(projectStage({setup:{version:1,answers:{scope:'Refresh',constraint:'Small',experience:'Beginner'}}}),'Ready for advice');
 assert.equal(projectStage({messages:[{source:'ai'}]}),'Advice ready');
});
test('sign-in only returns to safe internal application routes',()=>{
 for(const path of ['/project/abc-123?panel=plan','/offers?project=abc','/library?category=plumbing','/toolbox','/'])assert.equal(safeReturnPath(path),path);
 for(const path of ['https://evil.test','//evil.test','/\\evil.test','/auth/callback','/api/billing','/project/abc\n','/%2f%2fevil.test','/offers/../api/secret',null])assert.equal(safeReturnPath(path),'/');
});
test('backups preserve setup progress and AI advice without trusting arbitrary discovery data',()=>{
 const record={version:1,id:'test-project',request:'Build a cabinet',answers:{},messages:[{role:'assistant',content:'Here is your advice',source:'ai'}],setup:{version:1,answers:{scope:'Build new',constraint:'24 inches',experience:'Beginner',extra:'ignore'}},discovery:{advice:'Measure the available space first.',question:'What height?',choices:[],facts:['Cabinet','24 inches','Beginner'],unknowns:['Height'],briefReady:true},briefConfirmed:true};
 const restored=validateBackup(makeBackup([record],[],[])).conversations[0];
 assert.deepEqual(restored.setup.answers,{scope:'Build new',constraint:'24 inches',experience:'Beginner'});
 assert.equal(restored.messages[0].source,'ai');assert.equal(restored.briefConfirmed,true);
 assert.equal(restored.discovery.advice,record.discovery.advice);
 const invalid=validateBackup(makeBackup([{...record,discovery:{bad:'data'}}],[],[])).conversations[0];assert.equal(invalid.discovery,undefined);
});
