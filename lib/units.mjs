// Millimetres are canonical. Display changes must never round or resize a project.
export const unitPreferenceKey='kitsley-units';
export const normalizeUnits=value=>value==='metric'?'metric':'imperial';
const decimal=(n,places=4)=>Number(n.toFixed(places)).toString();
export function inches(mm){
 const value=Number(mm)/25.4, ticks=Math.round(value*64);
 if(Math.abs(value*64-ticks)<1e-7){let whole=Math.floor(ticks/64),n=ticks%64,d=64;while(n&&n%2===0){n/=2;d/=2;}return n?`${whole?whole+' ':''}${n}/${d}`:String(whole);}
 return decimal(value);
}
export function length(mm,units='metric'){return units==='imperial'?`${inches(mm)} in`:`${decimal(Number(mm))} mm`;}
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
// Manufacturer specifications keep their metric reference alongside conversions.
export function measurementText(value,units='metric'){
 if(units!=='imperial')return String(value);
 return String(value).replaceAll('dimensions in millimetres','dimensions in inches').replace(/(\d+(?:\.\d+)?(?:\s*(?:×|–|or|and|to|,|\/)\s*\d+(?:\.\d+)?)*)\s*mm\b/g,(match,numbers,offset,whole)=>whole[offset-1]==='('&&whole[offset+match.length]===')'?match:numbers.replace(/\d+(?:\.\d+)?/g,n=>inches(Number(n)))+' in ('+numbers+' mm)');
}

export function unitQuantity(qty,unit,units){return units==='imperial'&&unit.startsWith('metres')?`${decimal(qty/0.3048,2)} ${unit.replace('metres','ft')}`:`${qty} ${unit}`;}
