import {workshopModel,workshopProgress} from './bookcase-workshop.mjs';
import {publicUrl} from './retailer-search.mjs';
import {library} from './library.mjs';
import {normalizeFinish} from './finishing.mjs';
import {validateQuote} from './project-experience.mjs';
import {ownedChoices} from './catalog.mjs';
import {design} from './bookcase.mjs';
import {contentFor,contentProgressKey} from './project-content.mjs';
import {manualFor,manualProgressKey,normalizeManualOptions} from './guide-manuals.mjs';
import {calculatorFor,calculatorFields} from './quantity-calculators.mjs';
import {constructionTopics} from './drawing-review.mjs';
import {parseIntake} from './intake.mjs';
function cleanReview(raw,includeHistory=true){
 if(!raw||typeof raw!=='object'||typeof raw.fingerprint!=='string')return null;
 const fields=[['fingerprint',200],['reviewer',250],...constructionTopics.map(([id])=>[id,1500])];
 const result=Object.fromEntries(fields.filter(([key])=>typeof raw[key]==='string').map(([key,max])=>[key,raw[key].slice(0,max)]));
 if(includeHistory)result.previous=Array.isArray(raw.previous)?raw.previous.slice(-5).map(r=>cleanReview(r,false)).filter(Boolean):[];
 return result;
}
function restoreContent(clean,raw){
 if(raw.setup?.version===1&&raw.setup.answers&&typeof raw.setup.answers==='object')clean.setup={version:1,answers:Object.fromEntries(['scope','constraint','experience'].filter(k=>typeof raw.setup.answers[k]==='string'&&raw.setup.answers[k].trim()).map(k=>[k,raw.setup.answers[k].slice(0,2000)]))};
 clean.messages=clean.messages.map((m,i)=>raw.messages[i]?.source==='ai'&&m.role==='assistant'?{...m,source:'ai'}:m);
 if(raw.discovery)try{clean.discovery=parseIntake(JSON.stringify(raw.discovery)).discovery;clean.briefConfirmed=raw.briefConfirmed===true&&clean.discovery.briefReady;}catch{}
 if(Array.isArray(raw.retailerShortlist))clean.retailerShortlist=raw.retailerShortlist.slice(-30).filter(o=>o&&publicUrl(o.url)).map(o=>({...Object.fromEntries(['retailer','product','specification','address','availability','delivery','unit','match','checkedAt'].map(k=>[k,typeof o[k]==='string'?o[k].slice(0,300):''])),url:publicUrl(o.url),currency:/^[A-Z]{3}$/.test(o.currency)?o.currency:null,price:typeof o.price==='number'&&Number.isFinite(o.price)&&o.price>=0?o.price:null,channel:o.channel==='local'?'local':'online',distanceVerified:false}));
 const type=calculatorFor(clean.guideId);
 if(type&&raw.quantityInputs&&typeof raw.quantityInputs==='object')clean.quantityInputs=Object.fromEntries(calculatorFields[type].filter(([key])=>['string','number'].includes(typeof raw.quantityInputs[key])).map(([key])=>[key,String(raw.quantityInputs[key]).slice(0,40)]));
 clean.manualOptions=normalizeManualOptions(raw.manualOptions);
 const progress=raw.instructionProgress,steps=manualFor(clean.guideId)?.steps.length;
 if(steps&&(progress?.key===manualProgressKey(clean)||progress?.key===contentProgressKey(clean)))clean.instructionProgress={key:progress.key,active:Number.isInteger(progress.active)&&progress.active>=0&&progress.active<steps?progress.active:0,done:[...new Set(Array.isArray(progress.done)?progress.done.filter(i=>Number.isInteger(i)&&i>=0&&i<steps):[])],scopeAccepted:progress.scopeAccepted===true};
 if(clean.pack&&raw.pack?.build?.version===1)try{clean.pack.build=workshopProgress(workshopModel(clean.pack.input),raw.pack.build.options,raw.pack.build);}catch{/* Keep the original dimensions; unsupported designs open for adjustment. */}
 if(raw.stepAdvice&&typeof raw.stepAdvice==='object')clean.stepAdvice=Object.fromEntries(Object.entries(raw.stepAdvice).filter(([i,s])=>/^[0-8]$/.test(i)&&s&&typeof s.text==='string'&&typeof s.designKey==='string').map(([i,s])=>[i,{text:s.text.slice(0,2000),question:String(s.question||'').slice(0,2000),designKey:s.designKey.slice(0,500),createdAt:String(s.createdAt||'').slice(0,40)}]));
 if(clean.pack&&raw.pack?.constructionReview)clean.pack.constructionReview=cleanReview(raw.pack.constructionReview);
 return clean;
}
export function validateBackup(raw){
 if(typeof raw!=='string'||raw.length>2_000_000)throw Error('Choose a Kitsley backup smaller than 2 MB.');
 let d;try{d=JSON.parse(raw);}catch{throw Error('This is not a valid JSON backup.');}
 if(d.format!=='kitsley-workspace'||d.version!==1||!Array.isArray(d.conversations)||d.conversations.length>300||!Array.isArray(d.owned)||!Array.isArray(d.stock))throw Error('This file is not a supported Kitsley workspace backup.');
 const text=(v,max)=>typeof v==='string'&&v.length<=max;
 for(const r of d.conversations){if(r.version!==1||!text(r.id,80)||!/^[-a-zA-Z0-9]+$/.test(r.id)||!text(r.request,2000)||r.guideId&&!library.some(g=>g.id===r.guideId)||!r.answers||Array.isArray(r.answers)||typeof r.answers!=='object'||Object.values(r.answers).some(v=>!text(v,4000))||!Array.isArray(r.messages)||r.messages.length>500||r.messages.some(m=>!['user','assistant'].includes(m.role)||!text(m.content,10000)))throw Error('A project in this backup has invalid data.');if(r.pack)design(r.pack.input);if(r.notes&&!text(r.notes,4000))throw Error('A project note is too large.');}
 if(d.stock.length>500||d.stock.some(s=>!text(s.name,80)||!text(s.id,80)||![s.length,s.width,s.thickness,s.qty].every(n=>Number.isFinite(n)&&n>0)||s.qty>100||!Number.isInteger(s.qty)))throw Error('Material stock has invalid measurements.');
 const ids=new Set();const clean=d.conversations.map(r=>{if(ids.has(r.id))throw Error('Duplicate project IDs in backup.');ids.add(r.id);return restoreContent({version:1,id:r.id,request:r.request,guideId:r.guideId||null,title:typeof r.title==='string'?r.title.slice(0,100):'',answers:r.answers,messages:r.messages.map(m=>({role:m.role,content:m.content})),notes:r.notes||'',archived:r.archived===true,urgent:r.urgent===true,createdAt:typeof r.createdAt==='string'?r.createdAt:new Date().toISOString(),updatedAt:typeof r.updatedAt==='string'?r.updatedAt:new Date().toISOString(),checks:Array.isArray(r.checks)?r.checks.filter(i=>Number.isInteger(i)&&i>=0&&i<30):[],quotes:Array.isArray(r.quotes)?r.quotes.slice(0,30).map((q,i)=>({...validateQuote(q,ownedChoices),id:String(q.id||i),at:String(q.at||new Date().toISOString())})):[],...(r.pack?{pack:{version:1,input:Object.fromEntries(['width','height','depth','thickness','shelves'].map(k=>[k,Number(r.pack.input[k])])),finish:normalizeFinish(r.pack.finish||{}),reviewed:Array.isArray(r.pack.reviewed)?r.pack.reviewed.filter(v=>typeof v==='string').slice(0,6):[]}}:{})},r);});
 return {conversations:clean,owned:d.owned.filter(id=>ownedChoices.includes(id)),stock:d.stock.map(s=>({id:s.id,name:s.name,length:s.length,width:s.width,thickness:s.thickness,qty:s.qty,sound:s.sound===true}))};
}
export function makeBackup(conversations,owned,stock){return JSON.stringify({format:'kitsley-workspace',version:1,exportedAt:new Date().toISOString(),conversations,owned,stock},null,2);}
export function mergeBackup(current,backup,newId){
 const existing=new Set(current.map(r=>r.id));return [...backup.conversations.map(r=>({...r,id:existing.has(r.id)?newId():r.id,title:r.title?String(r.title).slice(0,100):undefined})),...current];
}
