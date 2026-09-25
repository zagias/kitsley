import test from 'node:test';
import assert from 'node:assert/strict';
import {embeddedSession} from '../lib/checkout-session.mjs';
const params={customer:'cus_1',mode:'subscription',ui_mode:'embedded',redirect_on_completion:'never','metadata[kitsley_user]':'user1','metadata[plan]':'plus','metadata[project_id]':''};
test('A delayed first attempt does not send the stale reservation deadline to Stripe',async()=>{
 let submitted;const request=async(path,body,key)=>{if(!body)return {data:[]};submitted={path,body,key};return {id:'new',client_secret:'test'};};
 await embeddedSession(request,params,'old-reservation');
 assert.equal(submitted.body.expires_at,undefined);assert.equal(submitted.body.ui_mode,'embedded');assert.equal(submitted.key,'kitsley-embedded-v2-old-reservation');
});
test('Reopening an unpaid embedded checkout reuses it without a new expiry or charge session',async()=>{
 const existing={id:'existing',customer:'cus_1',mode:'subscription',status:'open',ui_mode:'embedded',client_secret:'test',expires_at:Math.floor(Date.now()/1000)+300,metadata:{kitsley_user:'user1',plan:'plus'}};
 let calls=0;const result=await embeddedSession(async(path,body)=>{calls++;assert.equal(body,undefined);return {data:[existing]};},params,'new-reservation');
 assert.equal(result,existing);assert.equal(calls,1);
});
test('Sessions for other owners, projects, or hosted checkout cannot be reused',async()=>{
 const base={customer:'cus_1',mode:'subscription',status:'open',ui_mode:'embedded',client_secret:'test',metadata:{kitsley_user:'user1',plan:'plus'}};
 const data=[{...base,metadata:{...base.metadata,kitsley_user:'other'}},{...base,metadata:{...base.metadata,project_id:'other'}},{...base,ui_mode:'hosted'}];
 let created=0;await embeddedSession(async(path,body)=>{if(!body)return {data};created++;return {id:'new'};},params,'attempt');assert.equal(created,1);
});
