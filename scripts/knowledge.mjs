import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {approveKnowledge,compileKnowledge,renderKnowledgeModule,validateKnowledgeRecord} from '../lib/knowledge-publication.mjs';
import {candidateBatch,researchKnowledgeTopic} from '../lib/knowledge-research.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(root,'knowledge');
const read=async name=>JSON.parse(await fs.readFile(path.join(dir,name),'utf8'));
const write=async(name,data)=>{const target=path.join(dir,name),temp=target+'.tmp';await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(temp,JSON.stringify(data,null,2)+'\n',{mode:0o600});await fs.rename(temp,target);};
const [command,...args]=process.argv.slice(2);
try{
 const catalog=await read('approved.json'),revocations=await read('revocations.json');
 if(command==='compile'||command==='check'){
  const output=renderKnowledgeModule(compileKnowledge(catalog,{revocations})),target=path.join(root,'lib/managed-knowledge.mjs');
  if(command==='check'){if(await fs.readFile(target,'utf8')!==output)throw Error('Compiled catalog differs from reviewed records. Run knowledge:compile.');}
  else await fs.writeFile(target,output);
  const expired=catalog.filter(x=>validateKnowledgeRecord(x.record).some(e=>e.includes('expired'))).map(x=>x.record.id);
  const {foundationKnowledge,foundationAnswer}=await import('../lib/diy-knowledge.mjs');
  if(new Set(foundationKnowledge.map(r=>r.id)).size!==foundationKnowledge.length)throw Error('Managed ID collides with existing foundation');
  const legacyIds=new Set(foundationKnowledge.filter(r=>!r.publication).map(r=>r.id));
  if(catalog.some(x=>legacyIds.has(x.record.id)))throw Error('Managed revision cannot replace a legacy reference');
  for(const item of catalog)for(const q of item.record.questions||[])if(!revocations.some(r=>r.id===item.record.id)&&!validateKnowledgeRecord(item.record).some(e=>e.includes('expired'))&&foundationAnswer(q)?.foundationIds?.[0]!==item.record.id)throw Error('Exact question conflicts with an existing foundation answer: '+q);
  console.log(JSON.stringify({status:'ok',approvedRevisions:catalog.length,reviewDue:expired,revocations:revocations.length}));
 }else if(command==='research'){
  const topics=await read('topics.json'),topic=topics.find(t=>t.id===args[0]);if(!topic)throw Error('Choose a topic ID from knowledge/topics.json');
  const batch=await researchKnowledgeTopic(topic,{apiKey:process.env.OPENAI_API_KEY,model:process.env.KNOWLEDGE_RESEARCH_MODEL||process.env.OPENAI_MODEL});
  const name=`candidates/${topic.id}-${Date.now()}.json`;await write(name,batch);console.log(JSON.stringify({file:path.join(dir,name),states:batch.records.map(x=>x.status)}));
 }else if(command==='validate'){
  const filename=path.resolve(args[0]||'');if(!filename.startsWith(path.join(dir,'candidates')+path.sep))throw Error('Validate a draft inside knowledge/candidates');
  const batch=JSON.parse(await fs.readFile(filename,'utf8'));
  const checked=candidateBatch({records:batch.records?.map(x=>x.record),limitations:batch.limitations},{model:batch.model,id:batch.responseId,output:batch.provenance?.searched?[{type:'web_search_call',status:'completed',action:{sources:(batch.provenance.retrievedSources||[]).map(url=>({url}))}}]:[]});
  await write(path.relative(dir,filename),{...checked,createdAt:batch.createdAt});console.log(JSON.stringify({states:checked.records.map(x=>x.status)}));
 }else if(command==='approve'){
  const [filename,index,reviewer,kind,...note]=args;if(!filename||!/^\d+$/.test(index||''))throw Error('approve <candidate.json> <index> <reviewer> <editorial|qualified-trade> <review notes>');
  const batch=JSON.parse(await fs.readFile(path.resolve(filename),'utf8')),candidate=batch.records?.[Number(index)];if(!candidate||candidate.status!=='awaiting-review')throw Error('Only validated awaiting-review candidates can be approved');
  const item=approveKnowledge(candidate.record,{reviewer,kind,notes:note.join(' ')});
  if(catalog.some(x=>x.record.id===item.record.id&&x.record.revision>=item.record.revision))throw Error('Use a new increasing revision; published history is immutable');
  compileKnowledge([...catalog,item],{revocations});await write('approved.json',[...catalog,item]);console.log('Review recorded. Compile, run tests and deploy to publish.');
 }else if(command==='revoke'){
  const [id,reviewer,...reason]=args;const next=[...revocations,{id,reviewer,reason:reason.join(' '),at:new Date().toISOString()}];compileKnowledge(catalog,{revocations:next});await write('revocations.json',next);console.log('Revocation recorded. Compile and deploy to remove this record; no older revision is silently restored.');
 }else if(command==='plan'){
  const topics=await read('topics.json');console.log(JSON.stringify({topics,reviewDue:catalog.filter(x=>Date.parse(x.record.reviewBy)<Date.now()+30*86400000).map(x=>({id:x.record.id,reviewBy:x.record.reviewBy})),publication:'Research produces candidates only; review, compile and deployment are required.'},null,2));
 }else throw Error('Commands: plan, research, validate, approve, revoke, compile, check');
}catch(e){console.error(e.message);process.exitCode=1;}
