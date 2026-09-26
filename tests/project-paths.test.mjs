import test from 'node:test';
import assert from 'node:assert/strict';
import {projectPath,pathSetup,workflowContext,phaseById} from '../lib/project-paths.mjs';
import {createConversation} from '../lib/conversation.mjs';
import {engineContext,projectContextKey} from '../lib/project-engine.mjs';
import {makeBackup,validateBackup} from '../lib/workspace-backup.mjs';

test('four paths follow the selected purpose and leave unfamiliar tasks open',()=>{
 for(const [request,path] of [['Build a bookcase','build'],['Change an HVAC filter','household'],['Reset a GFCI','household'],['Install a TV mount','household'],['Plumbing for a sink','trade'],['Install drywall','trade'],['Finish my basement','big-project'],['Reno bathroom','big-project'],['Build a coat cupboard','big-project']])assert.equal(projectPath({request}).id,path,request);
 assert.equal(projectPath({request:'A foamboard display'}),null);
 assert.equal(projectPath({request:'Build a cabinet',useCase:'big-project'}).id,'big-project');
 assert.equal(projectPath({request:'unfamiliar',useCase:'invalid'}),null);
});
test('household, trade and large-project setups ask different useful questions',()=>{
 assert.match(pathSetup({useCase:'household'}).questions[1].text,/item/);
 assert.match(pathSetup({useCase:'trade'}).questions[1].text,/where/);
 assert.match(pathSetup({useCase:'big-project'}).questions[2].text,/organize/);
 assert.equal(pathSetup({useCase:'build'}),null);
});
test('hazard and support checks follow task content regardless of the selected area',()=>{
 const r={useCase:'build',request:'Reset a breaker and install a floating TV mount'};
 assert.equal(workflowContext(r).requiredChecks.length,2);
 assert.match(workflowContext(r).requiredChecks.join(' '),/Never infer safety from a successful reset/);
 assert.match(workflowContext({useCase:'household',request:'replace plumbing pipes'}).requiredChecks[0],/isolation/);
});
test('path and planning phase are saved, restored and included in the engine context',()=>{
 const r={...createConversation('Renovate a bathroom','path-test',undefined,'big-project'),projectPhase:'requirements'};
 const restored=validateBackup(makeBackup([r],[],[])).conversations[0];
 assert.equal(restored.useCase,'big-project');assert.equal(restored.projectPhase,'requirements');
 assert.equal(engineContext(restored).workflow.phase.name,'Requirements & specialists');
 assert.notEqual(projectContextKey(r),projectContextKey({...r,projectPhase:'design'}));
 assert.equal(phaseById('invented').id,'scope');
});
