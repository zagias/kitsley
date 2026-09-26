// Millimetres are canonical. Display changes must never round or resize a project.
export const unitPreferenceKey='kitsley-units';
export const normalizeUnits=value=>value==='metric'?'metric':'imperial';
const decimal=(n,places=4)=>Number(n.toFixed(places)).toString();
export function inches(mm){
 const value=Number(mm)/25.4, ticks=Math.round(value*64);
 if(Math.abs(value*64-ticks)<1e-7){let whole=Math.floor(ticks/64),n=ticks%64,d=64;while(n&&n%2===0){n/=2;d/=2;}return n?`${whole?whole+' ':''}${n}/${d}`:String(whole);}
 return decimal(value);
}
export function length(mm,units='metric'){return units==='imperial'?`${inches(mm)} in`:`${decimal(Number(mm),6)} mm`;}
// Presentation only: never feed rounded tape fractions into the design or inputs.
export function displayLength(mm,units='metric'){
 if(units!=='imperial')return length(mm,units);
 const n=Number(mm),exact=inches(n);
 if(Math.abs(n/25.4*64-Math.round(n/25.4*64))<1e-7)return `${exact} in`;
 const ticks=Math.round(n/25.4*32);
 // Thin edging must not appear as zero thickness.
 if(n&&n<25.4/32)return `≈ ${exact} in`;
 const whole=Math.floor(ticks/32);let numerator=ticks%32,denominator=32;
 while(numerator&&numerator%2===0){numerator/=2;denominator/=2;}
 return `≈ ${numerator?`${whole?whole+' ':''}${numerator}/${denominator}`:whole} in`;
}
// Round range endpoints inward so a displayed limit is always valid to enter.
export function lengthRange(min,max,units='metric'){
 if(units!=='imperial')return `${decimal(min,6)}–${decimal(max,6)} mm`;
 const lower=Math.ceil(min/25.4*32-1e-8)/32*25.4,upper=Math.floor(max/25.4*32+1e-8)/32*25.4;
 return `${inches(lower)}–${inches(upper)} in`;
}
export function cutMeasurementNote(units='metric',cutting='supplier'){
 if(units!=='imperial')return 'Give these finished mm sizes to your supplier. Do not subtract saw kerf.';
 return '≈ means rounded to the nearest 1/32 inch, for reference. '+(cutting==='self'?'For cutting and marking, use the exact mm figures with a dual-scale tape or rule. This keeps joints matched to the actual panel thickness.':'Give the exact mm sizes below to your supplier. Rounding each part separately can change the fit.');
}
export function referenceLength(mm,units='metric'){return units==='imperial'?`${displayLength(mm,units)} (${length(mm,'metric')})`:length(mm,'metric');}
export function parseLength(raw,units='metric'){
 let s=String(raw).trim().replace(/[″”]/g,'"').replace(/[′’]/g,"'");
 const vulgar={'½':'1/2','¼':'1/4','¾':'3/4','⅛':'1/8','⅜':'3/8','⅝':'5/8','⅞':'7/8'};
 s=s.replace(/[½¼¾⅛⅜⅝⅞]/g,m=>' '+vulgar[m]).trim();
 if(units==='metric'){if(!/^\d+(?:\.\d+)?$/.test(s))return NaN;return Number(s);}
 let feet=0;const f=s.match(/^(\d+)\s*(?:'|ft|feet)\s*/i);if(f){feet=Number(f[1]);s=s.slice(f[0].length).trim();}
 s=s.replace(/\s*(?:"|in|inches)$/i,'').trim();
 if(!s&&f)return feet*304.8;
 const m=s.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);let value;
 if(m){if(!Number(m[3])||Number(m[2])>=Number(m[3]))return NaN;value=Number(m[1]||0)+Number(m[2])/Number(m[3]);}
 else if(/^\d+(?:\.\d+)?$/.test(s))value=Number(s);else return NaN;
 return Number(((feet*12+value)*25.4).toFixed(6));
}
// Keep source specifications first: an approximate fraction is not a replacement bit or board size.
export function measurementText(value,units='metric'){
 if(units!=='imperial')return String(value);
 return String(value).replaceAll('dimensions in millimetres','dimensions in inches').replace(/(\d+(?:\.\d+)?(?:\s*(?:×|–|or|and|to|,|\/)\s*\d+(?:\.\d+)?)*)\s*mm\b/g,(match,numbers,offset,whole)=>whole[offset-1]==='('&&whole[offset+match.length]===')'?match:numbers+' mm ('+numbers.replace(/\d+(?:\.\d+)?/g,n=>displayLength(Number(n),'imperial').replace(/ in$/,''))+' in)');
}

export function unitQuantity(qty,unit,units){return units==='imperial'&&unit.startsWith('metres')?`${decimal(qty/0.3048,2)} ${unit.replace('metres','ft')}`:`${qty} ${unit}`;}
