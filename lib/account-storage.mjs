import {collections,flatten,diff,equal,mergeChanges,activeEntities,workspaceSchemaVersion} from './workspace-sync.mjs';
let scope=null,account=null,running=null,timer=null,poller=null,stopped=false;
let status={state:'loading',text:'Loading your workspace…',user:null};
const listeners=new Set();
export function subscribeSync(fn){listeners.add(fn);return()=>listeners.delete(fn);}
export function syncStatus(){return status;}
function report(state,text){status={state,text,user:account};for(const fn of listeners)fn();}
function cacheKey(){return 'kitsley-account-v1:'+scope;}
function readCache(){return JSON.parse(localStorage.getItem(cacheKey())||'{"values":{},"base":{},"revision":0}');}
function cacheWrite(cache){localStorage.setItem(cacheKey(),JSON.stringify(cache));}
function rawKeys(){return Object.keys(readCache().values);}
function notifyProfile(key){if(['kitsley-conversations-v1','kitsley-equipment-v1','kitsley-experience-v1'].includes(key))window.dispatchEvent(new Event('kitsley-profile'));}
export const workspaceStorage={
 getItem(key){if(scope===null)throw Error('Workspace is still loading.');return scope==='guest'?localStorage.getItem(key):readCache().values[key]??null;},
 setItem(key,value){if(scope===null)throw Error('Workspace is still loading.');if(scope==='guest'){localStorage.setItem(key,value);notifyProfile(key);return;}const c=readCache();if(c.values[key]===value)return;c.values[key]=value;cacheWrite(c);report('pending','Saving to your account…');notifyProfile(key);schedule();},
 removeItem(key){if(scope==='guest'){localStorage.removeItem(key);notifyProfile(key);return;}const c=readCache();delete c.values[key];cacheWrite(c);report('pending','Saving to your account…');notifyProfile(key);schedule();},
 get length(){return scope==='guest'?localStorage.length:rawKeys().length;},
 key(i){return scope==='guest'?localStorage.key(i):rawKeys()[i]}
};
function adapter(values){return {getItem:k=>values[k]??null,get length(){return Object.keys(values).length;},key:i=>Object.keys(values)[i]};}
function valuesFor(entities){const values={};for(const [key,type] of Object.entries(collections))values[key]=JSON.stringify(Object.entries(entities).filter(([k,v])=>k.startsWith(type+':')&&v!==null).map(([,v])=>v).sort((a,b)=>String(b.updatedAt||b.at||'').localeCompare(String(a.updatedAt||a.at||''))));for(const [k,v] of Object.entries(entities)){if(v===null)continue;if(k.startsWith('draft:'))values['kitsley-plan-'+k.slice(6)]=JSON.stringify(v);if(k.startsWith('preference:'))values[k.slice(11)]=v;}return values;}
function notifyData(){window.dispatchEvent(new Event('kitsley-sync'));window.dispatchEvent(new Event('kitsley-stock'));}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>syncNow(),650);}
async function request(method='GET',body){const r=await fetch('/api/workspace',{method,cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});const data=await r.json();if(r.status===401){stopped=true;report('expired','Your session expired. Reload and sign in again.');throw Error('Your session expired. Reload and sign in again.');}if(!r.ok){if(data.conflict)return {conflict:true};throw Error(data.error||'Sync is unavailable.');}if(data.userId!==scope){stopped=true;report('expired','Your account changed. Reload to continue.');throw Error('Your account changed. Reload to continue.');}return data;}
export async function initializeWorkspace(){
 stopped=false;
 const r=await fetch('/api/account',{cache:'no-store',signal:AbortSignal.timeout(15000)});const data=await r.json();if(!r.ok)throw Error('Could not verify your account. Please retry.');
 account=data.user;scope=account?.id||'guest';
 localStorage.setItem('kitsley-session-account',scope);
 window.addEventListener('storage',sessionChanged);
 if(!account){report('guest','Saved on this device');return;}
 // Claim legacy guest data once per browser; never move another account's cache.
 let c=readCache();if(!localStorage.getItem('kitsley-guest-import-owner')){
  const legacy=flatten(localStorage);if(Object.keys(legacy).length){c.values=valuesFor({...legacy,...flatten(adapter(c.values))});c.importPending=true;cacheWrite(c);}
  localStorage.setItem('kitsley-guest-import-owner',scope);
 }
 await syncNow();
 poller=setInterval(()=>{if(document.visibilityState==='visible')syncNow();},15000);
 window.addEventListener('online',syncNow);window.addEventListener('focus',syncNow);window.addEventListener('storage',storageChanged);
}
function sessionChanged(event){if(event.key==='kitsley-session-account'&&event.newValue!==scope){stopWorkspaceSync();window.location.reload();}}
function storageChanged(event){if(event.key===cacheKey()){notifyData();schedule();}}
export function stopWorkspaceSync(){stopped=true;clearTimeout(timer);clearInterval(poller);window.removeEventListener('online',syncNow);window.removeEventListener('focus',syncNow);window.removeEventListener('storage',storageChanged);window.removeEventListener('storage',sessionChanged);}
export async function syncNow(){
 if(!account||stopped)return;if(running)return running;
 running=(async()=>{try{
  report('syncing','Syncing your workspace…');
  for(let attempt=0;attempt<4;attempt++){
   const remote=await request();let c=readCache(),local=flatten(adapter(c.values));
   // Import adds records only. Server tombstones prevent old imports reviving deletions.
   if(c.importPending){local={...local};for(const k of Object.keys(remote.entities))if(!(k in c.base))delete local[k];}
   const {merged,conflicts}=mergeChanges(c.base,local,remote.entities,()=>crypto.randomUUID());
   if(c.importPending){const originals=flatten(adapter(c.values));for(const [key,value] of Object.entries(originals)){if(key in remote.entities&&!(key in c.base)&&!equal(value,remote.entities[key])){const id='recovery:'+crypto.randomUUID();merged[id]={key,local:value,remote:remote.entities[key],at:new Date().toISOString()};conflicts.push(id);}}}
   let saved=remote;
   if(!equal(merged,remote.entities)){saved=await request('PUT',{schemaVersion:workspaceSchemaVersion,userId:scope,revision:remote.revision,entities:merged});if(saved.conflict)continue;}
   // Retain edits made while the network request was in flight.
   const latest=readCache(),current=flatten(adapter(latest.values)),edits=diff(flatten(adapter(c.values)),current);
   const next={...activeEntities(saved.entities)};for(const [k,v] of Object.entries(edits)){if(v===null)delete next[k];else next[k]=v;}
   const before=latest.values;cacheWrite({...latest,values:valuesFor(next),base:saved.entities,revision:saved.revision,importPending:false});
   if(c.importPending){for(const key of Object.keys(collections))localStorage.removeItem(key);for(const key of Object.keys(localStorage))if(/^kitsley-plan-|^kitsley-offer-choice-/.test(key))localStorage.removeItem(key);}
   if(!equal(before,valuesFor(next)))notifyData();
   if(Object.keys(edits).length){report('pending','Saving your latest changes…');schedule();}else report('synced',conflicts.length?'Synced · conflicting versions kept in Account':'Saved to your account');
   return;
  }
  throw Error('Another device is updating this workspace. Retrying shortly.');
 }catch(e){if(!stopped)report('error',(e.name==='TimeoutError'?'Connection timed out.':e.message)+' Changes are kept on this device.');}finally{running=null;}})();return running;
}
export async function prepareSignOut(){await syncNow();if(account){const c=readCache();if(Object.keys(diff(c.base,flatten(adapter(c.values)))).length)throw Error('Some changes have not synced. Reconnect and retry before signing out.');}}
export function recoveryVersions(){return account?Object.fromEntries(Object.entries(readCache().base).filter(([k,v])=>k.startsWith('recovery:')&&v)):{};}
