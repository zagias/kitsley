'use client';
import {manualFor,manualProgressKey,normalizeManualOptions} from '../lib/guide-manuals.mjs';
import IllustratedGuide,{ManualSources} from './illustrated-guide';
import QuantityCalculator from './quantity-calculator';
export default function ProjectInstructions({record,onUpdate}){
 const options=normalizeManualOptions(record.manualOptions),m=manualFor(record.guideId,options),key=manualProgressKey(record);
 if(!m)return null;
 const progress=record.instructionProgress?.key===key?record.instructionProgress:{key,active:0,done:[],scopeAccepted:false};
 function save(patch){onUpdate({instructionProgress:{...progress,...patch,key}});}
 return <section className="project-instructions"><IllustratedGuide key={record.guideId} id={record.guideId} options={options} onOptionsChange={manualOptions=>onUpdate({manualOptions,instructionProgress:null})} progress={progress} onProgressChange={save}/><QuantityCalculator id={record.guideId} values={record.quantityInputs||{}} onChange={quantityInputs=>onUpdate({quantityInputs})}/><ManualSources manual={m}/></section>;
}
