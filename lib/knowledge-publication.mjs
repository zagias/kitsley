import {createHash} from 'node:crypto';
import {trustedKnowledgeUrl,normalizeKnowledgeQuestion,referenceDateCurrent} from './knowledge-policy.mjs';
import {diyDomains} from './diy-domains.mjs';
const categories=new Set(diyDomains.flatMap(d=>d.categories));
const key=v=>typeof v==='string'&&/^[a-z][a-z0-9-]{2,79}$/.test(v);
const text=(v,max=1200)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const list=(v,max=20)=>Array.isArray(v)&&v.length>0&&v.length<=max&&v.every(x=>text(x));
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
export const knowledgeDigest=record=>createHash('sha256').update(JSON.stringify(stable(record??null))).digest('hex');
export function validateKnowledgeRecord(r,{now=Date.now(),allowExpired=false}={}){
 const errors=[];if(!r||typeof r!=='object')return ['Missing record'];
 if(!key(r.id)||!Number.isSafeInteger(r.revision)||r.revision<1)errors.push('Invalid id/revision');
 if(!categories.has(r.category))errors.push('Unknown category');
 if(!text(r.title,180)||!text(r.scope)||!list(r.tags)||!list(r.facts,8)||!list(r.required)||!list(r.limits))errors.push('Missing bounded content, prerequisites or limitations');
 if(!['reference','procedure'].includes(r.kind))errors.push('Unknown knowledge kind');
 if(!['ordinary','elevated'].includes(r.risk))errors.push('Unknown risk');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(r.checkedAt)||!/^\d{4}-\d{2}-\d{2}$/.test(r.reviewBy)||!referenceDateCurrent(r,now)&&!allowExpired)errors.push('Invalid, future or expired review dates');
 const days=(Date.parse(r.reviewBy)-Date.parse(r.checkedAt))/86400000;if(!Number.isFinite(days)||days<=0||days>183)errors.push('Review interval exceeds six months');
 if(!r.applicability||!['products','materials','environment','jurisdiction','exclusions'].every(k=>list(r.applicability[k],10)))errors.push('Explicit product/material/environment/jurisdiction/exclusions required');
 if(!Array.isArray(r.conflicts)||r.conflicts.length)errors.push('Unresolved evidence conflicts');
 const sources=Array.isArray(r.sources)?r.sources:[];
 if(!Array.isArray(sources)||!sources.length||sources.length>8||sources.some(s=>!s||!key(s.id)||!trustedKnowledgeUrl(s.url)||!text(s.title,200)||!text(s.edition,200))||new Set(sources?.map(s=>s?.id)).size!==sources?.length)errors.push('Invalid primary sources or editions');
 if(!Array.isArray(r.evidence)||!Array.isArray(r.facts)||r.facts.some((_,i)=>!r.evidence.some(e=>e&&e.fact===i&&sources.some(s=>s&&s.id===e.source)&&text(e.locator,300)&&text(e.support,600))))errors.push('Every fact needs a source and a specific evidence locator');
 if(!Array.isArray(r.questions)||r.questions.length>8||r.questions.some(q=>!text(q,200)||normalizeKnowledgeQuestion(q)!==q))errors.push('Questions must be bounded normalized exact educational phrases');
 return errors;
}
export function approveKnowledge(record,{reviewer,kind='editorial',notes,now=Date.now()}={}){
 const errors=validateKnowledgeRecord(record,{now});
 if(!text(reviewer,100)||!text(notes,1500)||!['editorial','qualified-trade'].includes(kind))errors.push('Review identity, kind and notes required');
 // A second AI answer does not establish professional approval for procedural high-risk work.
 if(record?.kind==='procedure'&&record?.risk==='elevated'&&kind!=='qualified-trade')errors.push('Elevated-risk procedures require qualified trade review');
 if(errors.length)throw Error(errors.join('; '));
 return {record:structuredClone(record),review:{status:'approved',reviewer,kind,notes,at:new Date(now).toISOString(),digest:knowledgeDigest(record)}};
}
export function validatePublication(item,{now=Date.now(),allowExpired=false}={}){
 const errors=validateKnowledgeRecord(item?.record,{now,allowExpired});const r=item?.review;
 if(r?.status!=='approved'||!text(r?.reviewer,100)||!text(r?.notes,1500)||!['editorial','qualified-trade'].includes(r?.kind)||!Number.isFinite(Date.parse(r?.at))||Date.parse(r?.at)>now||Date.parse(r?.at)<Date.parse(item?.record?.checkedAt))errors.push('Missing valid review');
 if(r?.digest!==knowledgeDigest(item?.record))errors.push('Content changed since review');
 if(item?.record?.kind==='procedure'&&item?.record?.risk==='elevated'&&r?.kind!=='qualified-trade')errors.push('Qualified trade review required');
 return errors;
}
export function compileKnowledge(items,{now=Date.now(),revocations=[]}={}){
 const latest=new Map(),seen=new Set();
 for(const item of items){const errors=validatePublication(item,{now,allowExpired:true});if(errors.length)throw Error(`${item?.record?.id}: ${errors.join('; ')}`);const r=item.record,k=r.id+':'+r.revision;if(seen.has(k))throw Error('Duplicate revision '+k);seen.add(k);if(!latest.has(r.id)||latest.get(r.id).record.revision<r.revision)latest.set(r.id,item);}
 const revoked=new Set();for(const r of revocations){if(!latest.has(r.id)||!text(r.reason)||!text(r.reviewer,100)||!Number.isFinite(Date.parse(r.at))||Date.parse(r.at)>now)throw Error('Invalid revocation');revoked.add(r.id);}
 const entries=[],sources={},questions={};
 for(const {record:r,review} of [...latest.values()].sort((a,b)=>a.record.id.localeCompare(b.record.id))){
  if(revoked.has(r.id))continue;
  for(const s of r.sources){if(sources[s.id]&&JSON.stringify(sources[s.id])!==JSON.stringify(s))throw Error('Conflicting source id '+s.id);sources[s.id]=s;}
  for(const q of r.questions){if(questions[q]&&questions[q]!==r.id)throw Error('Ambiguous exact question '+q);questions[q]=r.id;}
  const {questions:unused,evidence,...rest}=r;
  entries.push({...rest,sources:r.sources.map(s=>s.id),status:'source-backed',publication:{digest:review.digest,reviewKind:review.kind,reviewedAt:review.at},evidence});
 }
 return {entries,sources,questions,summary:{managed:entries.length,approvedRevisions:items.length,revoked:revoked.size,policy:'Reviewed versioned references. Research candidates cannot publish themselves.'}};
}
export function renderKnowledgeModule(compiled){return '// Generated by npm run knowledge:compile. Edit reviewed records, not this file.\nexport const managedKnowledge='+JSON.stringify(compiled.entries,null,2)+';\nexport const managedSources='+JSON.stringify(compiled.sources,null,2)+';\nexport const managedQuestions='+JSON.stringify(compiled.questions,null,2)+';\nexport const publicationSummary='+JSON.stringify(compiled.summary)+';\n';}
