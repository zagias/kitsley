import {diyDomains,domainsFor,domainVersion} from './diy-domains.mjs';
import {sourceUrl} from './source-url.mjs';
export const specialistVersion='2026-09-26.1';
const ids=diyDomains.map(d=>d.id);
const statuses=['evidence-found','needs-details','research-needed','conflicting','site-assessment'];
const domain={type:'string',enum:ids};
const reviewSchema={
 type:'object',additionalProperties:false,
 required:['area','reason','finding','status','dependsOn','urls'],
 properties:{area:domain,reason:{type:'string'},finding:{type:'string'},status:{type:'string',enum:statuses},dependsOn:{type:'array',items:domain},urls:{type:'array',items:{type:'string'}}}
};
export const specialistSchema={anyOf:[{type:'null'},{
 type:'object',additionalProperties:false,required:['lead','reviews','nextArea','question'],
 properties:{lead:domain,nextArea:domain,question:{type:'string'},reviews:{type:'array',items:reviewSchema}}
}]};
export const specialistInstructions=` Use specialistReview for a task involving multiple competencies, an unfamiliar method or a knowledge limit. Use null only for a simple single-area explanation. Select a lead and all materially relevant areas from the supplied registry, even if keyword routing missed them. These are competency roles within Kitsley, not people who inspected or approved the work. Each review explains why the area is needed, its concise finding, unresolved limit and dependencies. An area must hand unresolved dependencies to the relevant area rather than invent expertise. Include the receiving area in reviews. Keep one shared project context and return findings to the lead. All areas reaching a limit must identify research, one missing user fact, or site assessment; do not bounce the user between repeated questions. Use primary sources and OpenAI reasoning to investigate unknowns, preserve conflicting findings, and update affected areas when new information arrives. Evidence-found means supporting reference evidence, never site verification or design certification. Do not mark a service route clear from a scanner, photo or checkbox. nextArea owns the next unresolved decision; ask at most one decisive question. Previously saved reviews are provisional history, not authority for the current request. Shared knowledge publication requires separate review and regression checks.`;
export function specialistContext(record={},question=''){
 return {version:specialistVersion,domainVersion,suggestedAreas:domainsFor(question,record).map(d=>d.id),registry:diyDomains.map(({id,name,questions,boundary})=>({id,name,questions,boundary})),previousReview:record.specialistReview||null,policy:'Routing suggestions are incomplete. Consider dependencies across the entire registry. New question or changed project facts require rechecking applicability. Model reasoning and web research can inform guidance; neither proves site conditions.'};
}
export function specialistReview(raw,research){
 if(!raw||!ids.includes(raw.lead)||!Array.isArray(raw.reviews))return null;
 const sources=new Map((research?.sources||[]).map(s=>[sourceUrl(s.url),s]));
 const seen=new Set(),reviews=[];
 for(const r of raw.reviews.slice(0,15)){
  if(!r||!ids.includes(r.area)||seen.has(r.area))continue;seen.add(r.area);
  const references=[...new Set((Array.isArray(r.urls)?r.urls:[]).map(sourceUrl))].map(u=>sources.get(u)).filter(Boolean);
  let status=statuses.includes(r.status)?r.status:'research-needed';
  if(status==='evidence-found'&&(research?.status!=='supported'||!references.length))status=research?.status==='conflicting'?'conflicting':'research-needed';
  reviews.push({area:r.area,reason:String(r.reason||'Check applicability to this task.').slice(0,300),finding:status==='research-needed'?'Applicable evidence is still needed.':String(r.finding||'More details are needed.').slice(0,700),status,dependsOn:[...new Set((Array.isArray(r.dependsOn)?r.dependsOn:[]).filter(d=>ids.includes(d)&&d!==r.area))],references});
 }
 if(!reviews.length)return null;
 // Missing receiving roles remain open; a circular dependency cannot complete itself.
 for(const id of new Set([raw.lead,...reviews.flatMap(r=>r.dependsOn)]))if(!seen.has(id)){seen.add(id);reviews.push({area:id,reason:'Required by another area.',finding:'This dependency still needs review.',status:'research-needed',dependsOn:[],references:[]});}
 const reaches=(from,target,path=new Set())=>{if(from===target)return true;if(path.has(from))return false;path.add(from);return reviews.find(r=>r.area===from)?.dependsOn.some(d=>reaches(d,target,new Set(path)))||false;};
 for(const r of reviews)if(r.status==='evidence-found'&&r.dependsOn.some(d=>reaches(d,r.area))){r.status='needs-details';r.finding='Resolve this dependency before proceeding; the areas cannot establish each other’s evidence.';}
 for(let i=0;i<reviews.length;i++)for(const r of reviews)if(r.status==='evidence-found'&&r.dependsOn.some(d=>reviews.find(x=>x.area===d)?.status!=='evidence-found')){r.status='needs-details';r.finding='Supporting references are available, but a required area still has an unresolved decision.';}
 const open=reviews.filter(r=>r.status!=='evidence-found');
 const next=open.find(r=>r.area===raw.nextArea)||open.find(r=>!r.dependsOn.some(d=>open.some(x=>x.area===d)))||open[0];
 return {version:specialistVersion,lead:raw.lead,nextArea:next?.area||raw.lead,status:open.length?'needs-checking':'reference-guidance',question:String(raw.question||'').slice(0,300),reviews,constructionApproval:false,publication:'private-project-only',checkedAt:research?.checkedAt||null};
}
export function restoreSpecialistReview(raw,research){
 if(!raw)return null;
 // Restoring retains the findings but does not revive an old evidence decision.
 return specialistReview({...raw,reviews:(raw.reviews||[]).map(r=>({...r,status:r.status==='site-assessment'?'site-assessment':'needs-details',urls:(r.references||[]).map(s=>s.url)}))},research);
}
