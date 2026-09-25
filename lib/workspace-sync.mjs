// Account workspace protocol. Missing values are tombstones, not missing snapshots.
export const collections={
 'kitsley-conversations-v1':'conversation', 'kitsley-saved':'saved',
 'kitsley-owned':'tool', 'kitsley-sheet-stock':'stock'
};
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export function flatten(storage){
 const out={};
 for(const [key,type] of Object.entries(collections)){
  const list=JSON.parse(storage.getItem(key)||'[]');
  if(!Array.isArray(list))throw Error('Saved workspace data is invalid.');
  for(const value of list){const id=type==='tool'?value:value?.id;if(typeof id==='string')out[type+':'+id]=value;}
 }
 for(let i=0;i<storage.length;i++){const key=storage.key(i);if(/^kitsley-plan-/.test(key))out['draft:'+key.slice(13)]=JSON.parse(storage.getItem(key));if(/^kitsley-offer-choice-/.test(key)||key==='kitsley-interest-id')out['preference:'+key]=storage.getItem(key);}
 return out;
}
export function diff(base,current){const changes={};for(const key of new Set([...Object.keys(base),...Object.keys(current)]))if(!key.startsWith('recovery:')&&!equal(base[key]??null,current[key]??null))changes[key]=current[key]??null;return changes;}
export function mergeChanges(base,local,remote,newId){
 const merged={...remote},conflicts=[];
 for(const [key,value] of Object.entries(diff(base,local))){
  const theirs=remote[key]??null,previous=base[key]??null;
  if(!equal(theirs,previous)&&!equal(theirs,value)){
   // Preserve both versions for recovery; deletions win over stale device edits.
   const recoveryKey='recovery:'+newId();
   merged[recoveryKey]={key,local:value,remote:theirs,at:new Date().toISOString()};conflicts.push(recoveryKey);
   if(theirs===null||value===null){merged[key]=null;continue;}
  }
  merged[key]=value;
 }
 return {merged,conflicts};
}
export function activeEntities(entities){return Object.fromEntries(Object.entries(entities).filter(([,v])=>v!==null));}
export function validateEntities(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>6000)throw Error('Workspace is too large or invalid.');
 if(JSON.stringify(value).length>3_000_000)throw Error('Workspace exceeds the 3 MB sync limit. Download a backup and remove unused projects.');
 for(const [key,v] of Object.entries(value)){
  if(!/^(conversation|saved|tool|stock|draft|preference|recovery):[a-zA-Z0-9_-]{1,160}$/.test(key))throw Error('Invalid workspace item.');
  if(v===null)continue;
  const type=key.split(':')[0],id=key.slice(type.length+1);
  if(type==='tool'&&(typeof v!=='string'||v!==id))throw Error('Invalid tool.');
  if(type==='preference'&&typeof v!=='string')throw Error('Invalid preference.');
  if(['conversation','saved','stock','draft','recovery'].includes(type)&&(!v||typeof v!=='object'||Array.isArray(v)))throw Error('Invalid project data.');
  if(['conversation','saved','stock'].includes(type)&&v.id!==id)throw Error('Invalid record ID.');
  if(type==='conversation'&&(v.version!==1||typeof v.request!=='string'||!Array.isArray(v.messages)||!v.answers||typeof v.answers!=='object'))throw Error('Invalid conversation.');
  if(type==='saved'&&!Array.isArray(v.done))throw Error('Invalid saved project.');
 }
 return value;
}
