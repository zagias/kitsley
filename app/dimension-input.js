'use client';
import {useEffect,useState,useId} from 'react';
import {inches,lengthRange,parseLength} from '../lib/units.mjs';
export default function DimensionInput({label,value,min,max,units,onChange}){
 const id=useId();
 const display=()=>units==='imperial'?inches(Number(value)):String(value);
 const [draft,setDraft]=useState(display);
 useEffect(()=>setDraft(display()),[value,units]);
 function validate(el){const n=parseLength(el.value,units);el.setCustomValidity(!Number.isFinite(n)?'Enter a measurement, such as 24, 23 1/2, or 2 ft.':n<min||n>max?`Use ${lengthRange(min,max,units)}.`:'');return n;}
 return <label htmlFor={id}>{label} <span>{units==='imperial'?'inches or feet':'mm'}</span><input id={id} aria-label={label} aria-describedby={id+'-range'} required type="text" value={draft} onChange={e=>{setDraft(e.target.value);const n=validate(e.target);if(Number.isFinite(n)&&n>=min&&n<=max)onChange(n);}} onBlur={e=>validate(e.target)} placeholder={units==='imperial'?'e.g. 23 1/2 or 2 ft':'e.g. 600'}/><small id={id+'-range'}>{lengthRange(min,max,units)}</small></label>;
}
