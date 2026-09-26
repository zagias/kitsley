import test from 'node:test';
import assert from 'node:assert/strict';
import {createConversation,nextQuestion,applyAnswer,nextAction,bookcaseInput,urgentIntent,repairConversationMatch} from '../lib/conversation.mjs';
import {design} from '../lib/bookcase.mjs';
import {POST,GET} from '../app/api/conversation/route.js';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('Door journey preserves the request and branches for specialist doors',()=>{
 const request="My bathroom door won't close properly, it rubs at the top";
 let r=createConversation(request,'door-test');assert.equal(r.guideId,'sticking-door');assert.equal(nextQuestion(r).id,'type');
 r=applyAnswer(r,'Exterior, fire or glazed door');assert.equal(nextQuestion(r),undefined);assert.match(nextAction(r),/qualified installer/);assert.equal(r.request,request);
 let ordinary=applyAnswer(createConversation(request,'other'),'Ordinary interior door');assert.equal(nextQuestion(ordinary).id,'contact');ordinary=applyAnswer(ordinary,'The edge rubs the frame');assert.match(nextAction(ordinary),/hinge screws/);assert.equal(nextQuestion(ordinary),undefined);
});
test('Bookcase intake carries validated dimensions into geometry and rejects invalid units',()=>{
 let r=createConversation('Build a bookcase','book-test');r=applyAnswer(r,'Books');
 assert.equal(applyAnswer(r,'72 x 100 x 30 cm').answers.dimensions,'720 × 1000 × 300 mm');assert.throws(()=>applyAnswer(r,'2000 x 1000 x 300 mm'));
 r=applyAnswer(r,'720 × 1000 × 300 mm');r=applyAnswer(r,'2');r=applyAnswer(r,'Spray paint');
 assert.equal(nextQuestion(r),undefined);assert.equal(design(bookcaseInput(r)).width,720);
 const reloaded=JSON.parse(JSON.stringify(r));assert.deepEqual(bookcaseInput(reloaded),bookcaseInput(r));
 assert.notEqual(createConversation('Build a bookcase','second').id,r.id);
});
test('Raised bed intake branches safely for balcony loading and urgent intent interrupts',()=>{
 let r=createConversation('A raised planting bed','garden');for(const answer of ['On a balcony or roof','2 x 1 m, 30 cm deep','Vegetables and herbs','No, help me choose'])r=applyAnswer(r,answer);
 assert.match(nextAction(r),/qualified professional/);assert.equal(nextQuestion(r),undefined);
 for(const text of ['I smell gas','My basement is flooded','There is water near the electrical outlet'])assert.equal(urgentIntent(text),true);
 assert.equal(nextQuestion(createConversation('I smell gas','urgent')),undefined);
});
test('AI endpoint stays offline without configuration and rejects other origins',async()=>{
 const old=process.env.KITSLEY_AI_ENABLED;delete process.env.KITSLEY_AI_ENABLED;
 try{assert.equal((await (await GET()).json()).enabled,false);assert.equal((await POST(new Request('http://localhost/api/conversation',{method:'POST',headers:{origin:'http://other.test'},body:'{}'}))).status,403);assert.equal((await POST(new Request('http://localhost/api/conversation',{method:'POST',headers:{origin:'http://localhost'},body:JSON.stringify({messages:[{role:'user',content:'Help plan my plywood project'}]})}))).status,503);}finally{if(old!==undefined)process.env.KITSLEY_AI_ENABLED=old;}
});
test('AI adapter sends bounded context, hides credentials and enforces persistent preview budget',async()=>{
 const keys=['KITSLEY_AI_ENABLED','OPENAI_API_KEY','OPENAI_MODEL','KITSLEY_AI_DAILY_LIMIT','KITSLEY_DATA_DIR'],old=Object.fromEntries(keys.map(k=>[k,process.env[k]])),originalFetch=globalThis.fetch,dir=await mkdtemp(join(tmpdir(),'kitsley-ai-'));
 Object.assign(process.env,{KITSLEY_AI_ENABLED:'true',OPENAI_API_KEY:'test-secret',OPENAI_MODEL:'test-model',KITSLEY_AI_DAILY_LIMIT:'1',KITSLEY_DATA_DIR:dir});
 let calls=0;globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://api.openai.com/v1/responses');const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.max_output_tokens,3000);assert.equal(body.tool_choice,'required');return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({text:'What will you store?',research:{status:'needs-details',note:'The intended load is unknown.',urls:[]}})}]}]});};
 const req=()=>new Request('http://localhost/api/conversation',{method:'POST',headers:{origin:'http://localhost'},body:JSON.stringify({guideId:'bookcase',messages:[{role:'user',content:'Build a bookcase'}]})});
 try{const result=await (await POST(req())).json();assert.equal(result.text,'What will you store?');assert.equal(result.research.status,'needs-details');assert.deepEqual(result.stepUpdates,[]);assert.equal((await POST(req())).status,429);assert.equal(calls,1);}finally{globalThis.fetch=originalFetch;for(const k of keys){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}await rm(dir,{recursive:true,force:true});}
});
test('Vague and safety requests do not open an unrelated shopping journey',()=>{
 assert.equal(createConversation('I want to','vague').guideId,null);
 const r=createConversation('A sewage backup','sewage');assert.equal(r.urgent,true);assert.equal(nextQuestion(r),undefined);
});

test('loose library suggestions do not silently become the project type',()=>{
 for(const request of ['Make a stable display from foamboard','Make a small indoor foamboard divider, identify it and choose a compatible glue','Indoor art that sticks to foamboard'])assert.equal(createConversation(request,'custom').guideId,null);
 assert.equal(createConversation('reset gfci','maintenance').guideId,'gfci-trip');
 assert.equal(createConversation('change HVAC filter','maintenance').guideId,'hvac-filter');
 assert.equal(createConversation('dripping faucet','repair').guideId,'dripping-faucet');
});

test('Basement building is not silently treated as a flood; old matches are repaired',()=>{
 for(const request of ['frame my basement','build my basement','finish my basement']){
 const r=createConversation(request,'test');assert.equal(r.guideId,'basement-finishing');assert.equal(r.urgent,false);assert.match(nextQuestion(r).text,/frame walls/);
 const old={...r,guideId:'basement-flood',urgent:true};assert.equal(repairConversationMatch(old).urgent,false);
 const hazard={...old,messages:[{role:'user',content:'It is flooded now'}]};assert.equal(repairConversationMatch(hazard).urgent,true);
 }
 assert.equal(createConversation('My basement is flooded','flood').urgent,true);
});
