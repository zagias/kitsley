import {workshopModel,workshopOptions,workshopProgress,workshopSteps,workshopSupplies,workshopScope,workshopSources,workshopVersion} from './bookcase-workshop.mjs';

import {products} from './catalog.mjs';

// Generate context from the same model as the displayed instructions. Never insert
// user-authored notes or an old library outline into this trusted guide context.
export function bookcaseAIContext(record){
 if(record?.guideId!=='bookcase'||record?.pack?.build?.version!==1)return null;
 const d=workshopModel(record.pack.input),options=workshopOptions(record.pack.build.options);
 const progress=workshopProgress(d,options,record.pack.build),steps=workshopSteps(d,options);
 return {version:workshopVersion,scope:workshopScope,material:{name:d.materialName,core:d.material,frontEdgingMm:d.edgeThickness,back:"6 mm plywood",decisionAnswers:record.pack.input.materialNeeds||{}},dimensions:{width:d.width,height:d.height,depth:d.depth,thickness:d.thickness,shelves:d.shelves},options,currentStep:progress.active+1,parts:d.parts,steps:steps.map(({id,title,parts,tools,spec,actions,check,detail})=>({id,title,parts,tools,spec,actions,check,detail})),supplies:workshopSupplies(d,options),sources:workshopSources};
}

export const bookcaseHelpInstructions=`This is help with an existing illustrated bookcase, not project discovery. Tailor the current step to the user's stated experience, tools and constraints, while keeping the guide's specifications. Give a practical adjustment or explain why a requested substitution will not work. Ask one focused question if essential details are missing. Answer directly in up to 150 words. Do not ask a follow-up unless an essential fact is missing; no preference questions after a complete answer. Refer to the relevant numbered step when useful.
The following current guide is authoritative for this build, including sanding grits, screw types, quantities, dimensions and finish-specific instructions. Earlier assistant replies may be wrong: correct them explicitly when they conflict with this guide. Do not silently substitute generic DIY advice or a different material, grit, fastener or product. If the user requests a change outside the guide, explain the difference and what needs checking; never claim the saved design or drawings have changed. Respect the named product's label and guide limitations. Do not invent load ratings or construction approval.
CURRENT ILLUSTRATED GUIDE: `;

export function conversationMessages(record,messages,owned=[]){
 const workshop=record?.guideId==='bookcase'&&record?.pack?.build?.version===1;
 const prefix=[{role:'user',content:(String(record.request||'')+(owned.length?'\nTools I have recorded in my toolbox: '+products.filter(p=>owned.includes(p.id)).map(p=>p.name).join(', '):'')).slice(0,2000)}];
 if(record.setup&&!workshop)prefix.push({role:'user',content:('My project setup: '+JSON.stringify(record.setup.answers)).slice(0,2000)});
 let budget=12000-prefix.reduce((n,m)=>n+m.content.length,0);const recent=[];
 for(const m of messages.slice(-(12-prefix.length)).reverse()){
  const content=String(m.content||'').slice(0,2000);if(content.length>budget)break;
  recent.unshift({role:m.role,content});budget-=content.length;
 }
 return [...prefix,...recent];
}
