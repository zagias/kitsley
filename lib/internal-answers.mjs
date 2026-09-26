import {manualFor,manualVersion,isPaintManual} from './guide-manuals.mjs';
import {bookcaseAIContext} from './bookcase-ai-context.mjs';
export const knowledgeVersion='kitsley-guide-knowledge-2026-09-26.1';
const normalize=s=>String(s||'').toLowerCase().replace(/[?!.]+$/g,'').replace(/\s+/g,' ').trim();
function fingerprint(record,question,owned=[]){
 const history=[];let skip=false;for(const message of record.messages||[]){if(message.role==='user'){skip=normalize(message.content)===question;if(!skip)history.push([message.role,message.content]);}else if(!skip)history.push([message.role,message.content]);}
 // Full canonical context rather than a probabilistic hash: no collision-based reuse.
 return JSON.stringify([knowledgeVersion,record?.id,manualVersion,record?.guideId,record?.manualOptions,record?.instructionProgress?.active,record?.setup,record?.pack?.input,record?.pack?.build?.key,record?.pack?.build?.active,record?.request,record?.notes,record?.answers,record?.stepAdvice,[...owned].sort(),history]);
}
export function internalAnswer(record,question,owned=[]){
 if(!record?.guideId)return null;
 const q=normalize(question);if(!q||q.length>200)return null;
 const prior=(record.knowledge?.answers||[]).find(a=>a.question===q&&a.context===fingerprint(record,q,owned)&&a.version===knowledgeVersion);
 if(prior)return {text:prior.text,source:'saved-answer',stepUpdates:[]};
 // Intentionally narrow intents: compound requests and substitutions need reasoning.
 if(/\b(instead|change|switch|but|except|without|can i use|could i use|my own|rather|replace)\b/.test(q))return null;
 let guide;try{guide=bookcaseAIContext(record);}catch{return null;}if(!guide)return manualAnswer(record,q);
 let step;
 if(/^(?:what |which )?(?:sandpaper|grit|sanding grit)(?: (?:do i need|should i use|for this|for sanding))?$/.test(q)||/^(?:what|which) grit (?:sandpaper )?(?:should|do) i (?:use|need)$/.test(q))step=1;
 else if(/^(what|which) (paint|primer|finish)( do i need| should i use| for this)?$/.test(q))step=7;
 else if(/^(what|which) (?:pocket )?screws?( do i need| should i use| for (?:the )?shelves)?$/.test(q))step=2;
 else if(/^(?:what are|show me) (?:my |the )?(?:cut list|panel sizes|dimensions)$/.test(q))return {source:'guide',text:guide.parts.map(p=>`${p.id} ${p.name}: ${p.qty} × ${p.length} × ${p.width} × ${p.thickness} mm (${p.material}).`).join('\n')+'\nFinished core sizes; for melamine add the saved front edging only. The back remains 6 mm plywood.',stepUpdates:[]};
 else if(/^(?:how|where) (?:do i |should i )?(?:attach|fit|secure) (?:the )?back$/.test(q))step=6;
 else if(/^(?:how|where) (?:do i |should i )?anchor (?:it|this|the bookcase)$/.test(q))step=8;
 else if(/^(?:what|which) (?:tools|materials|supplies) (?:do i need|are needed)$/.test(q))return {source:'guide',text:(/tools/.test(q)?[...new Set(guide.steps.flatMap(s=>s.tools))].join(', '):guide.supplies.map(s=>`${s.name}: ${s.qty} ${s.unit}.`).join('\n'))+'\nOpen Tools & materials for specifications and your owned-tool checklist.',stepUpdates:[]};
 else if(/^(?:what do i do next|explain this step|help with this step)$/.test(q))step=guide.currentStep-1;
 else return null;
 const s=guide.steps[step];return {source:'guide',text:`Step ${step+1} · ${s.title}\n${s.actions.join('\n\n')}\n\nCheck: ${s.check}`,stepUpdates:[]};
}
export function rememberAnswer(record,question,result,owned=[]){
 const source=result.source||'ai',q=normalize(question),previous=record.knowledge||{},answers=[...(previous.answers||[])];
 if(source==='ai'&&!result.discovery&&result.text&&q.length>=12&&q.length<=200){const context=fingerprint(record,q,owned);if(context.length>16000)return {version:1,answers:answers.slice(0,10),usage:previous.usage||{}};const existing=answers.findIndex(a=>a.question===q&&a.context===context);if(existing>=0)answers.splice(existing,1);answers.unshift({question:q,text:String(result.text).slice(0,3000),context,version:knowledgeVersion});}
 const topic=questionTopic(question),topics={...(previous.topics||{})};if(topic)topics[topic]=(topics[topic]||0)+1;
 return {version:1,guideId:record.guideId,topics,answers:answers.slice(0,10),usage:{guide:(previous.usage?.guide||0)+(source==='guide'?1:0),reused:(previous.usage?.reused||0)+(source==='saved-answer'?1:0),ai:(previous.usage?.ai||0)+(source==='ai'?1:0)},updatedAt:new Date().toISOString()};
}

export function questionTopic(question){const q=normalize(question);for(const [topic,re] of [['sanding',/grit|sandpaper|sanding/],['finish',/paint|primer|finish|coat/],['fasteners',/screw|fixing|fastener|joint/],['materials',/material|plywood|mdf|melamine/],['tools',/tool|drill|saw/],['dimensions',/size|dimension|width|height|depth/],['steps',/step|next|how do/]])if(re.test(q))return topic;return 'other';}
function manualAnswer(record,q){
 const m=manualFor(record.guideId,record.manualOptions);if(!m)return null;
 let index=Number.isInteger(record.instructionProgress?.active)?record.instructionProgress.active:0;
 if(/^(what|which) (?:sandpaper|grit|sanding grit)(?: (?:do i need|should i use))?$/.test(q)){
  if(isPaintManual(record.guideId)&&(!record.manualOptions?.surface||record.manualOptions.surface==='unknown'))return {source:'guide',text:'First identify the surface: solid wood, veneer, MDF or laminate. Choose it in your guide so Kitsley can give the matching sanding grit and primer. Do not sand an unidentified old coating.',stepUpdates:[]};
  index=m.steps.findIndex(s=>/sand/.test(s.title.toLowerCase()));
 }else if(/^(what|which) (paint|primer|finish)( do i need| should i use)?$/.test(q)){
  if(isPaintManual(record.guideId)&&(!record.manualOptions?.surface||record.manualOptions.surface==='unknown'))return {source:'guide',text:'Which surface are you painting? Select solid wood, veneer, MDF or laminate in the guide before choosing the primer and paint system.',stepUpdates:[]};
  const topic=/primer/.test(q)?/prim/:/paint/;index=m.steps.findIndex(s=>topic.test(s.title.toLowerCase()));
 }else if(!/^(?:what do i do next|explain this step|help with this step|what tools do i need)$/.test(q))return null;
 const step=m.steps[index];if(!step)return null;
 return {source:'guide',text:`Step ${index+1} · ${step.title}\n${step.spec||''}\n${step.action}\n${step.caution?'Before starting: '+step.caution+'\n':''}Check: ${step.check}\nTools: ${(step.tools||[]).join(', ')}${m.stop?'\nGuide limit: '+m.stop:''}`,stepUpdates:[]};
}
export function aggregateGuideLearning(records){const groups=new Map();for(const r of records){if(!r.guideId||!r.knowledge?.topics)continue;for(const [topic,count] of Object.entries(r.knowledge.topics)){if(!['sanding','finish','fasteners','materials','tools','dimensions','steps','other'].includes(topic)||!Number.isFinite(count)||count<=0)continue;const key=r.guideId+':'+topic,entry=groups.get(key)||{guideId:r.guideId,topic,questions:0,projects:0};entry.questions+=Math.min(count,10000);entry.projects++;groups.set(key,entry);}}return [...groups.values()].sort((a,b)=>b.questions-a.questions).slice(0,100);}
