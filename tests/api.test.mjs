import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {GET as adminGet,POST as adminPost} from '../app/api/admin/route.js';
import {POST as planPost} from '../app/api/recommend/route.js';
import {GET as redirectGet} from '../app/go/[id]/route.js';
test('Admin access, persistent edits, referral validation and tracking',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'kitsley-test-'));process.env.KITSLEY_DATA_DIR=dir;process.env.ADMIN_TOKEN=randomUUID();
 const auth={Authorization:'Bearer '+process.env.ADMIN_TOKEN,'Content-Type':'application/json'};
 const req=(body,headers=auth)=>new Request('http://localhost/api/admin',{method:'POST',headers,body:JSON.stringify(body)});
 try{
  assert.equal((await adminGet(new Request('http://localhost/api/admin'))).status,401);
  assert.equal((await adminPost(req({action:'product'},{}))).status,401);
  let data=await (await adminGet(new Request('http://localhost/api/admin',{headers:auth}))).json();const original=data.products.find(p=>p.id==='guide');
  assert.equal((await adminPost(req({...original,action:'product',min:40,max:110}))).status,200);
  data=await (await adminGet(new Request('http://localhost/api/admin',{headers:auth}))).json();assert.equal(data.products.find(p=>p.id==='guide').min,40);
  assert.equal((await adminPost(req({action:'link',productId:'guide',merchantId:'amazon',url:'https://evil.example/'}))).status,400);
  assert.equal((await adminPost(req({action:'link',productId:'guide',merchantId:'amazon',url:'https://www.amazon.ca/dp/TEST'}))).status,200);
  const redirect=await redirectGet(new Request('http://localhost/go/guide?merchant=amazon'),{params:Promise.resolve({id:'guide'})});assert.equal(redirect.status,302);assert.equal(redirect.headers.get('location'),'https://www.amazon.ca/dp/TEST');
  assert.equal((await redirectGet(new Request('http://localhost/go/guide?merchant=evil'),{params:Promise.resolve({id:'guide'})})).status,404);
  const plan=await planPost(new Request('http://localhost/api/recommend',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({description:'Build cabinet doors',material:'mdf',finish:'paint',owned:['saw']})}));assert.equal(plan.status,200);const result=await plan.json();assert.equal(result.ownedCount,1);assert.equal(result.project.id,'cabinet-doors');
  data=await (await adminGet(new Request('http://localhost/api/admin',{headers:auth}))).json();assert.ok(data.events.some(e=>e.type==='click'));assert.ok(data.events.some(e=>e.type==='recommendation'));
 }finally{delete process.env.KITSLEY_DATA_DIR;delete process.env.ADMIN_TOKEN;await rm(dir,{recursive:true,force:true});}
});
