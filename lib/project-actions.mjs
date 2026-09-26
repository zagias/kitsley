import {shelfChange} from './shelf-changes.mjs';
import {compileProposal,componentRequest} from './project-engine.mjs';
import {bookcaseInput} from './conversation.mjs';
import {design} from './bookcase.mjs';

import {millimetres,parseDimensions} from './measurements.mjs';
export function proposeChange(record,text){
 if(record.guideId!=='bookcase')return null;
 const shelf=shelfChange(record,text);
 if(shelf?.insets){const p=compileProposal(record,{builder:'bookcase.recessed-shelves.v1',target:'interior-shelves',changes:{shelfInsets:shelf.insets}},text);return p?.status==='unsupported'?{unsupported:p.reason,handled:true}:p||{unchanged:true};}
 if(shelf)return {...shelf,handled:true};
 if(componentRequest(text))return {unsupported:'Individual parts and new uses need a custom design operation. Your overall dimensions have not changed.'};
 if(record.pack?.build?.version!==1&&/\b(mdf|melamine)\b/i.test(text))return {unsupported:'This older drawing supports plywood only. Open the illustrated bookcase workshop to choose another board material.'};
 const current=record.pack?.input||bookcaseInput(record),patch={},changes=[];
 if(/\b(oak|pine|solid wood|glass|metal)\b/i.test(text)&&/use|change|make|instead|switch/i.test(text))return {unsupported:'This drawing supports plywood, MDF and melamine-faced MDF or particleboard. I saved your request, but have not substituted another structural material.'};
 if(/\bmdf\b/i.test(text)&&!/melamine/i.test(text))patch.material='mdf';
 if(/\bplywood\b/i.test(text))patch.material='plywood';
 if(/melamine/i.test(text)){if(/mdf/i.test(text))patch.material='melamine-mdf';else if(/particleboard|chipboard/i.test(text))patch.material='melamine-particleboard';else return {unsupported:'Melamine is the surface. Choose MDF or particleboard core in Your design, or tell me which core your supplier lists.'};patch.edgeThickness=current.edgeThickness||1;}
 const dimensions=parseDimensions(text.replace(/^(make it|change (?:it )?to|resize to)\s+/i,''));if(dimensions)Object.assign(patch,dimensions);
 const pattern=/(\d+(?:\.\d+)?)\s*(mm|cm|m|inches|inch|in|feet|foot|ft|")?\s*(wide|width|tall|high|height|deep|depth|thick|thickness)\b/gi;
 for(const m of text.matchAll(pattern)){const key={wide:'width',width:'width',tall:'height',high:'height',height:'height',deep:'depth',depth:'depth',thick:'thickness',thickness:'thickness'}[m[3].toLowerCase()];patch[key]=millimetres(m[1],m[2]||'mm');}
 for(const m of text.matchAll(/\b(width|height|depth|thickness)\s*(?:to|of|is|=|:)?\s*(\d+(?:\.\d+)?)\s*(mm|cm|m|inches|inch|in|feet|foot|ft|")?/gi))patch[m[1].toLowerCase()]=millimetres(m[2],m[3]||'mm');
 const shelves=text.match(/\b([1-9])\s*(?:interior )?shel(?:f|ves)\b/i);if(shelves)patch.shelves=Number(shelves[1]);
 if(/\badd (?:a|one) shelf\b/i.test(text))patch.shelves=Number(current.shelves)+1;
 if(/\bremove (?:a|one) shelf\b/i.test(text))patch.shelves=Number(current.shelves)-1;
 if(!Object.keys(patch).length)return null;
 if(patch.shelves&&current.shelfInsets)patch.shelfInsets=Array.from({length:patch.shelves},(_,i)=>current.shelfInsets[i]||0);
 const next=design({...current,...patch});
 for(const key of Object.keys(patch))if(String(current[key])!==String(patch[key]))changes.push({key,before:current[key],after:patch[key]});
 if(!changes.length)return {unchanged:true};
 return {input:{...current,...Object.fromEntries(['width','height','depth','thickness','shelves'].map(k=>[k,next[k]])),...patch},changes};
}
export function applyChange(record,proposal){
 if(!proposal?.input)throw Error('No valid design change to apply.');design(proposal.input);
 const history=[...(record.revisions||[]),{at:new Date().toISOString(),answers:record.answers,pack:record.pack||null}].slice(-20);
 return {...record,revisions:history,answers:{...record.answers,dimensions:`${proposal.input.width} × ${proposal.input.height} × ${proposal.input.depth} mm`,shelves:String(proposal.input.shelves)},pack:{...(record.pack||{}),version:1,input:proposal.input,reviewed:[],finish:record.pack?.finish||{system:record.answers.finish==='Keep the wood visible'?'clear':record.answers.finish==='Decide later'?'undecided':'paint',method:record.answers.finish==='Spray paint'?'spray':'brush',notes:record.request}},updatedAt:new Date().toISOString()};
}
export function undoChange(record){const revisions=[...(record.revisions||[])],last=revisions.pop();return last?{...record,answers:last.answers,pack:last.pack,revisions,updatedAt:new Date().toISOString()}:record;}
