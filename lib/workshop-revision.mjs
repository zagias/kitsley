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
