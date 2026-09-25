import test from 'node:test';
import assert from 'node:assert/strict';
class Storage{constructor(){this.data=new Map();}getItem(k){return this.data.get(k)??null;}setItem(k,v){this.data.set(k,String(v));}removeItem(k){this.data.delete(k);}key(i){return [...this.data.keys()][i];}get length(){return this.data.size;}}
test('sync imports once, retries CAS, keeps in-flight edits, handles deletion and isolates accounts',async()=>{
 globalThis.localStorage=new Storage();globalThis.window=new EventTarget();globalThis.document={visibilityState:'visible'};
 window.location={reload(){}};
 let user={id:'user-a',name:'A'},remote={revision:0,entities:{}},fail=false,race=false,inflight=null;
 globalThis.fetch=async(url,opts={})=>{
  if(url==='/api/account')return Response.json({user});
  if(fail)return Response.json({error:'Offline'}, {status:503});
  if(opts.method==='PUT'){
   const body=JSON.parse(opts.body);assert.equal(body.userId,user.id);
   if(race){race=false;remote={revision:remote.revision+1,entities:{...remote.entities,'tool:pliers':'pliers'}};return Response.json({conflict:true},{status:409});}
   assert.equal(body.revision,remote.revision);remote={revision:remote.revision+1,entities:body.entities};if(inflight){const fn=inflight;inflight=null;fn();}
  }
  return Response.json({...remote,userId:user.id});
 };
 const client=await import('../lib/account-storage.mjs');
 localStorage.setItem('kitsley-owned','["hammer"]');
 await client.initializeWorkspace();assert.equal(remote.entities['tool:hammer'],'hammer');assert.equal(localStorage.getItem('kitsley-owned'),null);
 assert.equal(client.syncStatus().state,'synced');
 client.workspaceStorage.setItem('kitsley-owned','["hammer","drill"]');race=true;await client.syncNow();assert.equal(remote.entities['tool:pliers'],'pliers');assert.equal(remote.entities['tool:drill'],'drill');
 client.workspaceStorage.setItem('kitsley-owned','["hammer","drill","pliers","square"]');inflight=()=>client.workspaceStorage.setItem('kitsley-owned','["hammer","drill","pliers","square","level"]');await client.syncNow();assert(client.workspaceStorage.getItem('kitsley-owned').includes('level'));await client.syncNow();assert.equal(remote.entities['tool:level'],'level');
 fail=true;client.workspaceStorage.setItem('kitsley-owned','["hammer"]');await client.syncNow();assert.equal(client.syncStatus().state,'error');await assert.rejects(client.prepareSignOut());fail=false;await client.syncNow();assert.equal(remote.entities['tool:drill'],null);
 const rev=remote.revision;await client.syncNow();assert.equal(remote.revision,rev,'unchanged tombstones must not create new revisions');
 client.stopWorkspaceSync();user={id:'user-b',name:'B'};remote={revision:0,entities:{}};await client.initializeWorkspace();assert.deepEqual(JSON.parse(client.workspaceStorage.getItem('kitsley-owned')||'[]'),[]);assert.deepEqual(remote.entities,{});client.stopWorkspaceSync();
 user=null;await client.initializeWorkspace();assert.equal(client.syncStatus().state,'guest');assert.equal(client.workspaceStorage.getItem('kitsley-owned'),null);client.stopWorkspaceSync();
});
