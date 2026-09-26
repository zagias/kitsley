import test from 'node:test';
import assert from 'node:assert/strict';
import {checkoutCustomer} from '../lib/checkout-customer.mjs';
test('New and existing customers get the authenticated account email when missing',async()=>{
 for(const id of [null,'cus_existing']){
  const calls=[];
  const customer=await checkoutCustomer(async(path,params,key)=>{calls.push({path,params,key});return {id:id||'cus_new',...params};},id,{id:'u1',email:'account@example.com'});
  assert.equal(customer.email,'account@example.com');assert.equal(calls.length,2);
  assert.deepEqual(calls[1].params,{email:'account@example.com'});
  if(!id){assert.equal(calls[0].key,'kitsley-customer-u1');assert.deepEqual(calls[0].params,{'metadata[kitsley_user]':'u1'});}
 }
});
test('An existing billing email is preserved',async()=>{
 let calls=0;const customer=await checkoutCustomer(async()=>{calls++;return {id:'cus_1',email:'billing@example.com'};},'cus_1',{id:'u1',email:'account@example.com'});
 assert.equal(calls,1);assert.equal(customer.email,'billing@example.com');
});
test('Missing account email does not erase billing data and deleted customers fail closed',async()=>{
 let calls=0;await checkoutCustomer(async()=>{calls++;return {id:'cus_1'};},'cus_1',{id:'u1'});assert.equal(calls,1);
 await assert.rejects(checkoutCustomer(async()=>({id:'cus_1',deleted:true}),'cus_1',{id:'u1',email:'account@example.com'}));
});
