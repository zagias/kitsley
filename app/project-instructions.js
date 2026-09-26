'use client';
import {manualFor,manualProgressKey,normalizeManualOptions} from '../lib/guide-manuals.mjs';
import ProjectCompletion from './project-completion';
import {relevantAreas} from '../lib/companion-profile.mjs';
import {library} from '../lib/library.mjs';
import {readiness} from '../lib/readiness.mjs';
import IllustratedGuide,{ManualSources} from './illustrated-guide';
import QuantityCalculator from './quantity-calculator';
export default function ProjectInstructions({record,onUpdate,owned=[],onToggleOwned}){
 const options=normalizeManualOptions(record.manualOptions),m=manualFor(record.guideId,options),key=manualProgressKey(record);
 if(!m)return null;
 const progress=record.instructionProgress?.key===key?record.instructionProgress:{key,active:0,done:[],scopeAccepted:false};
 const guide=library.find(g=>g.id===record.guideId),kit=guide?readiness(guide,owned,record.guideId==='planter'?'solid':'plywood'):{items:[]};
 function save(patch){onUpdate({instructionProgress:{...progress,...patch,key}});}
 return <section className="project-instructions"><IllustratedGuide key={record.guideId} id={record.guideId} options={options} onOptionsChange={manualOptions=>onUpdate({manualOptions,instructionProgress:null})} progress={progress} onProgressChange={save}/>{progress.done.length===m.steps.length&&<ProjectCompletion key={key} record={record} designKey={key} areas={relevantAreas(record)} tools={kit.items} owned={owned} onToggleOwned={onToggleOwned} onUpdate={onUpdate}/>}<QuantityCalculator id={record.guideId} values={record.quantityInputs||{}} onChange={quantityInputs=>onUpdate({quantityInputs})}/><ManualSources manual={m}/></section>;
}
