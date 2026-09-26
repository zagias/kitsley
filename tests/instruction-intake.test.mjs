import test from 'node:test';import assert from 'node:assert/strict';
import {setupFlow} from '../lib/project-intake-flow.mjs';import {freeStartingPoint} from '../lib/free-start.mjs';
test('named how-to questions bypass general project and experience discovery across trades',()=>{
 for(const request of ['how to crimp pex','How do I patch drywall?','Explain HVAC filter ratings','How do I hang an interior door?','What adhesive for acrylic?']){
  const flow=setupFlow({request});assert.equal(flow.questions.length,1,request);assert.equal(flow.questions[0].id,'constraint',request);assert.doesNotMatch(flow.questions[0].text,/Which kind of work|main goal|experience/i,request);
 }
 const pex=freeStartingPoint({request:'how to crimp pex'});assert.match(pex.steps.join(' '),/Crimp rings and clamp rings/);assert.match(pex.source.url,/sharkbite/);
});
test('project planning still collects a brief rather than pretending a design is known',()=>{
 const flow=setupFlow({request:'I want to renovate my basement'});assert(flow.questions.length>1);
});
