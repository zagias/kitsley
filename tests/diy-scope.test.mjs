import test from 'node:test';import assert from 'node:assert/strict';
import {obviousOutsideScope} from '../lib/diy-scope.mjs';
import {engineDecision} from '../lib/project-engine.mjs';
import {POST} from '../app/api/conversation/route.js';
test('obvious unrelated requests are rejected but unfamiliar DIY is not',()=>{
 for(const q of ['Give me stock picks','Write me a poem','Give me dating advice','Write a Python script'])assert(obviousOutsideScope(q),q);
 for(const q of ['How do I cut aerogel board?','Can I fit a smart home sensor?','Which primer for my wall?','How do I prepare a repair budget?'])assert.equal(obviousOutsideScope(q),false,q);
});
test('scope rejection does not publish model advice or learning',()=>{
 const a=engineDecision({raw:{scope:'out-of-scope'},result:{text:'Buy this stock',stepUpdates:[{step:1,text:'buy'}]},research:{status:'supported',sources:[]}});
 assert.equal(a.scope,'out-of-scope');assert.doesNotMatch(a.text,/Buy this stock/);assert.deepEqual(a.stepUpdates,[]);assert.equal(a.engine,undefined);
});
test('obvious unrelated requests return before model enablement or billing',async t=>{
 const previous=process.env.APP_URL;process.env.APP_URL='https://kitsley.test';t.after(()=>{if(previous===undefined)delete process.env.APP_URL;else process.env.APP_URL=previous;});
 const r=await POST(new Request('https://kitsley.test/api/conversation',{method:'POST',headers:{origin:'https://kitsley.test'},body:JSON.stringify({messages:[{role:'user',content:'Give me stock picks'}]})}));
 assert.equal(r.status,200);assert.equal((await r.json()).scope,'out-of-scope');
});
import {localScopeResponse} from '../lib/diy-scope.mjs';
test('food, trivia and small talk stay local while relevant food-safe DIY reaches research',()=>{
 for(const q of ['Hello','How are you?','What should I cook tonight?','Give me a pasta recipe','What is the capital of France?','Who won the match yesterday?'])assert(localScopeResponse(q),q);
 for(const q of ['What food-safe finish for a wooden cutting board?','How do I repair the oven door?','How can I cut aerogel insulation?'])assert.equal(localScopeResponse(q),null,q);
});
test('brief follow-ups retain DIY context but it does not authorize a general conversation',()=>{
 const messages=[{role:'user',content:'Build a plywood shelf'}];
 assert.equal(localScopeResponse('What thickness?',{messages}),null);
 assert.equal(localScopeResponse('18 mm',{messages}),null);
 assert(localScopeResponse('What should I cook tonight?',{messages}));
 assert(localScopeResponse('Tell me about ancient Rome',{messages}));
});
test('the home-project sphere includes planning, accessibility, ownership and costs',()=>{
 const messages=[{role:'user',content:'I am building a plywood desk'}];
 for(const q of ['How do I choose a contractor?','Can smart home automation help?','How do I make furniture accessible?','What about renting instead?','Is there a cheaper alternative?','Can I do this left-handed?'])assert.equal(localScopeResponse(q,{messages}),null,q);
 assert(localScopeResponse('What is the capital of France?',{messages}));
});
