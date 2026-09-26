import test from 'node:test';
import assert from 'node:assert/strict';

test('account experience persists through sync, navigation initialization and another device edit',async()=>{
 const rows=new Map(),events=new EventTarget();
 globalThis.localStorage={getItem:k=>rows.get(k)??null,setItem:(k,v)=>rows.set(k,v),removeItem:k=>rows.delete(k),key:i=>[...rows.keys()][i],get length(){return rows.size;}};
 globalThis.window={addEventListener:(...a)=>events.addEventListener(...a),removeEventListener:(...a)=>events.removeEventListener(...a),dispatchEvent:e=>events.dispatchEvent(e),location:{reload(){}}};
 globalThis.document={visibilityState:'hidden'};
 let remote={userId:'test-account',revision:0,entities:{}},puts=0;
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async(url,init={})=>{
  if(url==='/api/account')return Response.json({user:{id:'test-account',name:'Test'}});
  if(init.method==='PUT'){const body=JSON.parse(init.body);assert.equal(body.schemaVersion,2);remote={userId:'test-account',revision:remote.revision+1,entities:body.entities};puts++;}
  return Response.json(remote);
 };
 const storage=await import('../lib/account-storage.mjs');
 try{
  await storage.initializeWorkspace();
  storage.workspaceStorage.setItem('kitsley-experience-v1',JSON.stringify([{id:'woodworking',level:'some',source:'user',updatedAt:'2026-09-26'}]));
  await storage.syncNow();assert.equal(remote.entities['experience:woodworking'].level,'some');assert.ok(puts);
  storage.stopWorkspaceSync();await storage.initializeWorkspace();
  assert.equal(JSON.parse(storage.workspaceStorage.getItem('kitsley-experience-v1'))[0].level,'some');
  remote.entities['experience:plumbing']={id:'plumbing',level:'beginner',source:'user',updatedAt:'2026-09-26'};remote.revision++;
  await storage.syncNow();const values=JSON.parse(storage.workspaceStorage.getItem('kitsley-experience-v1'));
  assert.equal(values.find(v=>v.id==='woodworking').level,'some');assert.equal(values.find(v=>v.id==='plumbing').level,'beginner');
 }finally{storage.stopWorkspaceSync();globalThis.fetch=originalFetch;delete globalThis.window;delete globalThis.document;delete globalThis.localStorage;}
});
