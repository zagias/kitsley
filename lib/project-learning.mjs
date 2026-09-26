import {ownedChoices} from './catalog.mjs';
export const practiceAreas=['woodworking','finishing','plumbing','electrical','drywall','household','outdoor'];
export const toolRelationships=['owned','borrowed','rented','provided','unused'];
export function cleanCompletion(value){
 if(!value||value.version!==1||value.confirmed!==true||!/^[-a-zA-Z0-9]{1,80}$/.test(value.eventId||'')||typeof value.designKey!=='string'||value.designKey.length>800||typeof value.completedAt!=='string'||!Number.isFinite(Date.parse(value.completedAt)))return null;
 if(!['success','needs-work'].includes(value.outcome)||!Array.isArray(value.areas)||value.areas.some(id=>!practiceAreas.includes(id))||!value.tools||typeof value.tools!=='object'||Array.isArray(value.tools)||Object.keys(value.tools).length>100)return null;
 if(Object.entries(value.tools).some(([id,state])=>!ownedChoices.includes(id)||!toolRelationships.includes(state)))return null;
 return {version:1,eventId:value.eventId,confirmed:true,designKey:value.designKey,outcome:value.outcome,areas:[...new Set(value.areas)],tools:{...value.tools},completedAt:value.completedAt};
}
export function practiceHistory(records=[]){
 const found=new Map(),seen=new Set();
 for(const record of records){
  const review=cleanCompletion(record?.completionReview);if(!review||review.outcome!=='success'||seen.has(review.eventId))continue;seen.add(review.eventId);
  // Revision changes do not erase a person's historical practice. They also do
  // not certify that the revised design or installation has been completed.
  for(const id of review.areas){const item=found.get(id)||{id,projects:0,lastCompletedAt:'',guideIds:[],source:'user-confirmed-practice'};item.projects++;if(review.completedAt>item.lastCompletedAt)item.lastCompletedAt=review.completedAt;if(typeof record.guideId==='string'&&record.guideId.length<=80&&item.guideIds.length<20&&!item.guideIds.includes(record.guideId))item.guideIds.push(record.guideId);found.set(id,item);}
 }
 return [...found.values()].sort((a,b)=>a.id.localeCompare(b.id));
}
export function completionLearning(review,currentExperience=[]){
 const valid=cleanCompletion(review);if(!valid)throw Error('Confirm the result, your work and the tools used first.');
 return {owned:Object.entries(valid.tools).filter(([,state])=>state==='owned').map(([id])=>id),suggestedAreas:valid.outcome==='success'?valid.areas.filter(id=>!['some','experienced'].includes(currentExperience.find(e=>e.id===id)?.level)):[]};
}
