import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {plans,projectAccess,liveGrants} from '../lib/plans.mjs';
import {verifyStripeEvent} from '../lib/stripe.mjs';
import {fulfillEvent} from '../lib/billing-events.mjs';
const time=Date.now(),secret='whsec_test',raw=JSON.stringify({id:'evt_test'}),ts=Math.floor(time/1000);
const sign=(s=raw,t=ts)=>`t=${t},v1=${createHmac('sha256',secret).update(t+'.'+s).digest('hex')}`;
test('Stripe webhooks reject tampering, stale timestamps and missing secrets',()=>{
 assert.equal(verifyStripeEvent(raw,sign(),secret,time).id,'evt_test');
 assert.throws(()=>verifyStripeEvent(raw+' ',sign(),secret,time));
 assert.throws(()=>verifyStripeEvent(raw,sign(raw,ts-301),secret,time));
 assert.throws(()=>verifyStripeEvent(raw,sign(),'',time));
 assert.throws(()=>verifyStripeEvent(raw,'t=NaN,v1=00',secret,time));
});
test('Pass access is project-scoped, time-bounded and revocable',()=>{
 const g={plan:'project-pass',project_id:'p1',active:true,starts_at:new Date(time-1000).toISOString(),ends_at:new Date(time+1000).toISOString()};
 assert.equal(projectAccess([g],'p1',time),g);assert.equal(projectAccess([g],'p2',time),null);
 assert.equal(projectAccess([g],'p1',time+1000),null);assert.equal(liveGrants([{...g,active:false}],time).length,0);
 assert.equal(plans.plus.cents,2900);assert.equal(plans['project-pass'].cents,1900);
});
function fakeDB(){const rows=new Map(),revocations=new Set();return {rows,async rpc(name,args){if(name==='revoke_billing_grant'){revocations.add(args.reference);for(const [id,row] of rows)if(row.id===args.reference||row.source_id===args.reference)rows.set(id,{...row,active:false});}else if(name==='apply_billing_grant'){const row=args.payload;if(!revocations.has(row.id)&&!revocations.has(row.source_id)&&!rows.has(row.id))rows.set(row.id,row);}return {};},from(table){return {select(){return {eq(){return {maybeSingle:async()=>({data:{user_id:'u1'}})}}}},upsert(row){if(!rows.has(row.id))rows.set(row.id,row);return Promise.resolve({});},update(patch){return {eq:async(k,v)=>{for(const [id,row] of rows)if(row[k]===v)rows.set(id,{...row,...patch});return {};}}}}}};}
function fixture(){const db=fakeDB();let refunded=false;const stripe=async path=>{
 if(path.endsWith('/line_items'))return {data:[{price:{id:'price_pass'},quantity:1}]};
 if(path.startsWith('checkout/sessions/'))return {id:'cs_1',mode:'payment',payment_status:'paid',customer:'cus_1',metadata:{plan:'project-pass',kitsley_user:'u1',project_id:'p1'},payment_intent:'pi_1'};
 if(path.startsWith('payment_intents/'))return {latest_charge:{created:ts,amount_refunded:refunded?1900:0}};
 if(path.startsWith('invoice_payments'))return {data:[]};throw Error(path);
 };return {db,stripe,env:{STRIPE_PRICE_PROJECT_PASS:'price_pass'},refund(){refunded=true;}};}
test('Payment replay cannot duplicate a pass or extend its lifetime',async()=>{
 const f=fixture(),event={type:'checkout.session.completed',data:{object:{id:'cs_1'}}};await fulfillEvent(event,f);const first=f.db.rows.get('cs_1');await fulfillEvent(event,f);
 assert.equal(f.db.rows.size,1);assert.equal(f.db.rows.get('cs_1'),first);assert.equal(Date.parse(first.ends_at)-Date.parse(first.starts_at),30*86400000);
});
test('Refund followed by delayed checkout event never restores access',async()=>{
 const f=fixture(),event={type:'checkout.session.completed',data:{object:{id:'cs_1'}}};await fulfillEvent(event,f);f.refund();
 await fulfillEvent({type:'charge.refunded',data:{object:{id:'ch_1',payment_intent:'pi_1'}}},f);await fulfillEvent(event,f);assert.equal(f.db.rows.get('cs_1').active,false);
});
test('Refund before checkout fulfillment never creates an entitlement',async()=>{
 const f=fixture();f.refund();await fulfillEvent({type:'checkout.session.completed',data:{object:{id:'cs_1'}}},f);assert.equal(f.db.rows.size,0);
});
test('Wrong configured price cannot grant access',async()=>{
 const f=fixture();f.env.STRIPE_PRICE_PROJECT_PASS='other';await assert.rejects(fulfillEvent({type:'checkout.session.completed',data:{object:{id:'cs_1'}}},f));assert.equal(f.db.rows.size,0);
});
test('Subscription cancellation revokes all periods; period-end cancellation retains paid access',async()=>{
 const db=fakeDB();db.rows.set('in_1',{source_id:'sub_1',active:true});
 await fulfillEvent({type:'customer.subscription.updated',data:{object:{id:'sub_1'}}},{db,stripe:async()=>({id:'sub_1',status:'active',cancel_at_period_end:true})});assert.equal(db.rows.get('in_1').active,true);
 await fulfillEvent({type:'customer.subscription.deleted',data:{object:{id:'sub_1'}}},{db,stripe:async()=>({id:'sub_1',status:'canceled'})});assert.equal(db.rows.get('in_1').active,false);
});
test('Revocation tombstones win even if an in-flight grant is inserted afterward',async()=>{
 const db=fakeDB();await db.rpc('revoke_billing_grant',{reference:'pi_race'});await db.rpc('apply_billing_grant',{payload:{id:'cs_race',source_id:'pi_race',active:true}});assert.equal(db.rows.size,0);
});
test('Only a paid current invoice grants Plus; replay keeps the same period',async()=>{
 const db=fakeDB(),start=ts-10,end=ts+1000;
 const invoice={id:'in_1',status:'paid',parent:{subscription_details:{subscription:'sub_1'}},lines:{data:[{pricing:{price_details:{price:'price_plus'}},period:{start,end}}]}};
 const subscription={id:'sub_1',status:'active',customer:'cus_1',metadata:{kitsley_user:'u1'},items:{data:[{price:{id:'price_plus'},current_period_start:start,current_period_end:end}]}};
 const stripe=async p=>p.startsWith('invoices/')?invoice:p.startsWith('subscriptions/')?subscription:{data:[]};
 const options={db,stripe,env:{STRIPE_PRICE_PLUS:'price_plus'}};
 await fulfillEvent({type:'invoice.paid',data:{object:{id:'in_1'}}},options);assert.equal(db.rows.get('in_1').plan,'plus');
 await fulfillEvent({type:'invoice.paid',data:{object:{id:'in_1'}}},options);assert.equal(db.rows.size,1);
 invoice.id='in_old';invoice.lines.data[0].period.start-=86400;await fulfillEvent({type:'invoice.paid',data:{object:{id:'in_old'}}},options);assert.equal(db.rows.size,1);
});

import {billingAccountAllowed} from '../lib/billing.mjs';
test('Sandbox checkout supports existing and new signed-in accounts',()=>{
 const mode=process.env.STRIPE_MODE,id=process.env.BILLING_TEST_USER_ID;
 try{process.env.STRIPE_MODE='test';delete process.env.BILLING_TEST_USER_ID;
 assert.equal(billingAccountAllowed({id:'visitor'}),true);
 process.env.BILLING_TEST_USER_ID='tester';assert.equal(billingAccountAllowed({id:'tester'}),true);
 assert.equal(billingAccountAllowed({id:'visitor'}),true);assert.equal(billingAccountAllowed(null),false);
 process.env.STRIPE_MODE='live';assert.equal(billingAccountAllowed({id:'visitor'}),true);
 }finally{if(mode===undefined)delete process.env.STRIPE_MODE;else process.env.STRIPE_MODE=mode;if(id===undefined)delete process.env.BILLING_TEST_USER_ID;else process.env.BILLING_TEST_USER_ID=id;}
});
