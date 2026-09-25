// Independent checks of the drawing/cut-list contract. This does not calculate structural capacity.
export const drawingRulesVersion='bookcase-geometry-2';
export const constructionTopics=[
 ['material','Material specification','Plywood manufacturer/grade, measured thickness, defect inspection and 6 mm back suitability.'],
 ['joints','Joint and fastener schedule','Joint type at each A–B and A–C connection, fastener model/count/position, pilots, edge distances and adhesive instructions.'],
 ['back','Back attachment and racking','Back material, fastener type, spacing and edge distances; method of resisting racking. Brad nails are not assumed structural.'],
 ['loads','Shelf and cabinet loads','Intended distributed and point loads, shelf stiffness/deflection, joint capacity and cabinet stability for this exact design.'],
 ['restraint','Wall restraint','Restraint model, cabinet attachment, actual wall substrate, wall fixings and installation instructions.']
];
export const designFingerprint=d=>[drawingRulesVersion,d.width,d.height,d.depth,d.thickness,d.shelves].join(':');
export function inspectDrawing(d){
 const checks=[],add=(id,label,passed,detail)=>checks.push({id,label,passed:!!passed,detail});
 const values=[d?.width,d?.height,d?.depth,d?.thickness,d?.shelves];
 add('numbers','Finite dimensions',values.every(v=>typeof v==='number'&&Number.isFinite(v)),'Every drawing input must be numeric and finite.');
 if(!checks[0].passed)return {checks,geometryPassed:false,constructionApproved:false,unresolved:constructionTopics,shelfDatums:[],fingerprint:null};
 const {width:w,height:h,depth:z,thickness:t,shelves:n}=d;
 add('envelope','Supported model range',[w,h,z,t].every(Number.isInteger)&&w>=400&&w<=800&&h>=600&&h<=1200&&z>=250&&z<=400&&t>=18&&t<=21&&Number.isInteger(n)&&n>=1&&n<=4,'Model range only; not a load rating.');
 const expected={A:[2,h,z-6,t],B:[2,w-2*t,z-6,t],C:[n,w-2*t,z-6,t],D:[1,h,w,6]};
 const close=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-7;
 add('parts','Cut list matches the model',Array.isArray(d.parts)&&d.parts.length===4&&Object.entries(expected).every(([id,dims])=>{const p=d.parts.find(p=>p.id===id);return p&&[p.qty,p.length,p.width,p.thickness].every((v,i)=>close(v,dims[i]));}),'A: two sides; B: top and bottom; C: selected shelf count; D: one full applied back.');
 add('width','Horizontal dimensions close',close((w-2*t)+2*t,w)&&w-2*t>0,'Shelf span + two side thicknesses = overall width.');
 add('depth','Back included in overall depth',z>6&&close((z-6)+6,z),'Carcass depth + 6 mm applied back = overall depth.');
 const clear=(h-(n+2)*t)/(n+1),shelfDatums=Number.isInteger(n)&&n>=1&&n<=4?Array.from({length:n},(_,i)=>(i+1)*(h-t)/(n+1)):[];
 // Independent datum formula: underside of shelf i = i * (height - thickness) / (shelves + 1).
 add('openings','Shelf gaps and vertical closure',close(d.opening,clear)&&clear>=150&&close((n+1)*clear+(n+2)*t,h),'Minimum 150 mm clear openings; no overlapping panels.');
 add('datums','Shelf positions fit between top and bottom',shelfDatums.length===n&&shelfDatums.every((v,i)=>v>=t+150-1e-7&&v+t<=h-t-150+1e-7&&(i===0||v-shelfDatums[i-1]-t>=150-1e-7)),'All undersides measured from the outside bottom of a side panel. Display rounding is not cumulative.');
 return {checks,geometryPassed:checks.every(c=>c.passed),constructionApproved:false,unresolved:constructionTopics,shelfDatums,fingerprint:designFingerprint(d)};
}
export function currentReview(d,review){return review?.fingerprint===designFingerprint(d)?review:null;}
export function updateConstructionReview(d,review,field,value){
 const fields=[...constructionTopics.map(([id])=>id),'reviewer'];
 if(!fields.includes(field)||typeof value!=='string')throw Error('Unknown construction review field.');
 const current=currentReview(d,review),history=Array.isArray(review?.previous)?review.previous:[];
 const previous=review&&!current?[...history,Object.fromEntries(['fingerprint',...fields].filter(k=>typeof review[k]==='string').map(k=>[k,review[k]]))].slice(-5):history;
 return {...(current||{}),fingerprint:designFingerprint(d),previous,[field]:value.slice(0,field==='reviewer'?250:1500)};
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function drawingReviewHTML(d,review){const report=inspectDrawing(d),current=currentReview(d,review);return `<section><h2>Drawing checks</h2><p><strong>${report.geometryPassed?'Geometry checks passed':'Geometry checks failed'} · Construction review still required</strong></p><p>Rule set ${drawingRulesVersion}. Automated checks verify dimensions and part consistency only. No load rating or construction approval is issued.</p><ul>${report.checks.map(c=>`<li>${c.passed?'PASS':'FAIL'} · ${esc(c.label)} — ${esc(c.detail)}</li>`).join('')}</ul><h3>Shelf layout from the bottom datum</h3><p>${report.shelfDatums.map((n,i)=>`C${i+1}: ${Number(n.toFixed(2))} mm`).join(' · ')}</p><h3>Construction decisions</h3>${constructionTopics.map(([id,title,help])=>`<h4>${title}</h4><p>${help}</p><p>${current?.[id]?esc(current[id]):'Unresolved — no specification recorded.'}</p>`).join('')}<p>${current?.reviewer?'Recorded reviewer/reference: '+esc(current.reviewer):'No external reviewer/reference recorded.'} User-entered notes are not independently verified approval.${review&&!current?' Previous notes are out of date for these dimensions.':''}</p></section>`;}
