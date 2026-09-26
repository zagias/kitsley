// Deterministic clarification, never an automatic correction of the user's dimensions.
export const feasibilityVersion='2026-09-26.1';
const units={mm:1,cm:10,m:1000,in:25.4,inch:25.4,inches:25.4,'"':25.4,ft:304.8,foot:304.8,feet:304.8,"'":304.8};
export function requestedMeasurements(text){
 const found={};const unit='mm|cm|m|inches|inch|in|feet|foot|ft|"|\'';
 const map={wide:'width',width:'width',tall:'height',high:'height',height:'height',deep:'depth',depth:'depth',thick:'thickness',thickness:'thickness'};
 const patterns=[new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unit})?\\s*(wide|width|tall|high|height|deep|depth|thick|thickness)\\b`,'gi'),new RegExp(`\\b(width|height|depth|thickness)\\s*(?:to|of|is|=|:)?\\s*(\\d+(?:\\.\\d+)?)\\s*(${unit})?(?![a-z])`,'gi')];
 for(let i=0;i<patterns.length;i++)for(const m of String(text).matchAll(patterns[i])){const value=Number(m[i?2:1]),u=m[i?3:2]?.toLowerCase(),axis=map[m[i?1:3].toLowerCase()];found[axis]={value,unit:u||null,mm:u?value*units[u]:null};}
 return found;
}
export function feasibilityQuestion(record,question){
 const text=String(question||'');
 if(/\b(miniature|dollhouse|scale model|model shelf|tiny decorative)\b/i.test(text))return null;
 // Part-level requests need their own design operation; don't confuse a thickness with overall width.
 if(/\b(top|bottom|upper|lower|individual|single)\s+(shelf|panel|side)\b/i.test(text))return null;
 const measurements=requestedMeasurements(text);
 const missing=Object.entries(measurements).find(([,m])=>!m.unit);
 if(missing)return {source:'logic',text:`You gave ${missing[1].value} for the ${missing[0]}, but not its unit. I haven’t changed the design.`,feasibility:{code:'unit-needed',question:'Which unit did you mean?',choices:[`${missing[1].value} inches ${missing[0]}`,`${missing[1].value} feet ${missing[0]}`,`${missing[1].value} mm ${missing[0]}`]},stepUpdates:[]};
 if(!/bookcase|bookshelf|book shelf/i.test([record?.guideId,record?.request,text].join(' ')))return null;
 const width=measurements.width?.mm;if(width===undefined)return null;
 const thickness=Number(record?.pack?.input?.thickness),clear=Number.isFinite(thickness)&&thickness>0?width-2*thickness:null;
 if(width>0&&width>=100&&(clear===null||clear>0))return null;
 const m=measurements.width,space=clear!==null?` With your ${thickness} mm side panels, that leaves ${Math.max(0,Math.round(clear*10)/10)} mm of inside width.`:' The side panels would reduce the usable space further.';
 return {source:'logic',text:`A bookshelf ${m.value} ${m.unit} wide would be unusually narrow for storing books.${space} Let’s check the measurement before designing it.`,feasibility:{code:clear!==null&&clear<=0?'no-internal-space':'unusual-scale',question:'Did you mean a wider shelf, a panel thickness, or a miniature?',choices:[...(m.unit==='inches'||m.unit==='inch'||m.unit==='in'||m.unit==='"'?[`Make the whole bookcase ${m.value} feet wide`]:[]),'I meant the panel thickness',`A miniature shelf ${m.value} ${m.unit} wide`]},stepUpdates:[]};
}
