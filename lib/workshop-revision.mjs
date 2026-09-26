import {workshopModel,workshopOptions,workshopProgress} from './bookcase-workshop.mjs';
export function designChanged(previous,input,options){
 if(!previous?.build)return false;
 try{return workshopModel(previous.input).key!==workshopModel(input).key||JSON.stringify(workshopOptions(previous.build.options))!==JSON.stringify(workshopOptions(options));}catch{return true;}
}
export function reviseWorkshop(previous,input,options,progress,now=new Date().toISOString()){
 const changed=designChanged(previous,input,options),old=previous?.build||{};
 const clean=workshopProgress(workshopModel(input),options,progress);
 const review=changed?[...new Set([...(old.done||[]),...(old.review||[])])]:clean.review;
 return {...clean,revision:Math.max(1,Number(old.revision)||1)+(changed?1:0),revisedAt:changed||!old.revisedAt?now:old.revisedAt,review:review.filter(i=>Number.isInteger(i)&&i>=0&&i<9),...(changed?{active:0,done:[]}:{} )};
}

export function workshopInput(input){
 const d=workshopModel(input);
 return {...Object.fromEntries(['width','height','depth','thickness','shelves'].map(k=>[k,d[k]])),material:d.material,edgeThickness:d.edgeThickness,...(input.shelfInsets!==undefined?{shelfInsets:[...d.shelfInsets]}:{}),materialNeeds:input.materialNeeds||{}};
}
export function workshopHistory(entries){
 if(!Array.isArray(entries))return [];
 return entries.slice(-10).map(r=>({input:workshopInput(r.input),options:workshopOptions(r.options),revision:Math.max(1,Number(r.revision)||1),at:String(r.at||'').slice(0,40)}));
}
export function commitWorkshop(previous,input,options,progress,now=new Date().toISOString()){
 const cleanInput=workshopInput(input),cleanOptions=workshopOptions(options),changed=designChanged(previous,cleanInput,cleanOptions);
 const revisions=workshopHistory(previous?.revisions);
 if(changed&&previous?.build)revisions.push({input:workshopInput(previous.input),options:workshopOptions(previous.build.options),revision:previous.build.revision||1,at:previous.build.revisedAt||now});
 return {...previous,version:1,input:cleanInput,revisions:revisions.slice(-10),reviewed:[],finish:{...previous?.finish,system:cleanOptions.finish,surface:cleanInput.material,method:'brush'},build:reviseWorkshop(previous,cleanInput,cleanOptions,progress,now)};
}
export function workshopChanges(previous,input,options){
 const a=workshopModel(previous.input),b=workshopModel(input),changes=[];
 for(const key of ['width','height','depth','thickness','materialName','edgeThickness','shelves'])if(a[key]!==b[key])changes.push({label:{materialName:'Material',edgeThickness:'Front edging',shelves:'Interior shelves'}[key]||key[0].toUpperCase()+key.slice(1),before:a[key],after:b[key],dimension:!['materialName','shelves'].includes(key)});
 for(let i=0;i<Math.min(a.shelves,b.shelves);i++)if(a.shelfPanels[i].finishedDepth!==b.shelfPanels[i].finishedDepth)changes.push({label:b.shelfPanels[i].name+' depth',before:a.shelfPanels[i].finishedDepth,after:b.shelfPanels[i].finishedDepth,dimension:true});
 for(const key of ['cutting','finish','wall'])if(workshopOptions(previous.build.options)[key]!==workshopOptions(options)[key])changes.push({label:{cutting:'Panel cutting',finish:'Finish',wall:'Wall fixing'}[key],before:workshopOptions(previous.build.options)[key],after:workshopOptions(options)[key]});
 return changes;
}
