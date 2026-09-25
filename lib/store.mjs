import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {products} from './catalog.mjs';
const dir=()=>path.resolve(process.env.KITSLEY_DATA_DIR||process.env.TOOLWISE_DATA_DIR||'.data');
const empty=()=>({products,overrides:{},links:{},events:[]});
export async function readStore(){try{const stored=JSON.parse(await readFile(path.join(dir(),'store.json'),'utf8'));stored.products=[...stored.products,...products.filter(p=>!stored.products.some(x=>x.id===p.id))];return stored;}catch(e){if(e.code==='ENOENT')return empty();throw e;}}
let queue=Promise.resolve();
export function mutateStore(fn){const job=queue.then(async()=>{const data=await readStore();const result=await fn(data);await mkdir(dir(),{recursive:true});const target=path.join(dir(),'store.json');const tmp=target+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(data,null,2),{mode:0o600});await rename(tmp,target);return result;});queue=job.catch(()=>{});return job;}
export async function recordEvent(type,details){return mutateStore(s=>{s.events.push({id:randomUUID(),at:new Date().toISOString(),type,...details});s.events=s.events.slice(-10000);});}
