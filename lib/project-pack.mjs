import {library} from './library.mjs';
import {packLibrary} from './pack-library.mjs';
import {questionsFor,nextAction,bookcaseInput} from './conversation.mjs';
import {design,packHTML,matchStock,caveat} from './bookcase.mjs';
import {parseDimensions} from './measurements.mjs';
import {contentHTML,contentFor} from './project-content.mjs';
import {calculatorFor,calculateQuantity,calculatorFields} from './quantity-calculators.mjs';
import {finishHTML} from './finishing.mjs';
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function gardenQuantities(record){
 if(record.guideId!=='raised-bed')return null;
 const size=parseDimensions(record.answers.size||'');if(!size)return null;
 const {width:length,height:width,depth}=size;
 if(length>20000||width>10000||depth>2000)throw Error('Check the bed measurements and units before calculating soil.');
 if(record.answers.location==='On a balcony or roof')return {blocked:true};
 const litres=Math.round(length*width*depth/1e6);
 return {length,width,depth,litres,cubicMetres:litres/1000,bags40:Math.ceil(litres/40)};
}
export function projectChecks(record){
 if(record.guideId==='bookcase')return ['Confirm the space and finished dimensions','Confirm plywood thickness and condition','Review shelf loads, joints and fasteners with a competent furniture maker','Confirm wall structure and suitable tip-over restraint','Confirm the coating system and ventilation'];
 return packLibrary.find(p=>p.id===record.guideId)?.checks||['Identify the problem and relevant manufacturer instructions','Confirm that the work is safe to undertake','Confirm tools, parts and material suitability'];
}
export function shoppingRows(record,items,owned,stock=[]){
 const rows=items.map(p=>({id:p.id,name:p.name,qty:1,unit:'item',kind:'tool',owned:owned.includes(p.id),note:p.why||p.scope||'Confirm suitability for this task',productId:p.id}));
 if(record.guideId==='bookcase'&&record.answers.dimensions){const d=design(bookcaseInput(record)),matched=matchStock(d,stock);for(const p of d.parts){const used=matched.filter(m=>m.id===p.id&&m.stock).length;rows.push({id:'part-'+p.id,name:p.name+' · '+p.length+' × '+p.width+' × '+p.thickness+' mm plywood',qty:p.qty-used,unit:'cut piece',kind:'material',owned:used===p.qty,note:used?`${used} of ${p.qty} fit recorded stock; check condition and allow for saw kerf.`:'Finished size. Supplier cut-to-size service may be useful.'});}}
 else if(record.guideId==='raised-bed'){const q=gardenQuantities(record);if(q&&!q.blocked)rows.push({id:'soil',name:'Growing medium suitable for your plants',qty:q.litres,unit:'litre',kind:'material',owned:false,note:'Geometric internal volume only; subtract existing fill. No allowance for settlement.'});}
 return rows;
}
export function shoppingCSV(rows){const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';return '\ufeffItem,Quantity,Unit,Status,Notes\n'+rows.map(r=>[r.name,r.qty,r.unit,r.owned?'Already owned':'To source',r.note].map(cell).join(',')).join('\n');}
export function exportProject(record,items,owned,stock=[]){
 const title=record.title||library.find(p=>p.id===record.guideId)?.title||'Your project',pack=packLibrary.find(p=>p.id===record.guideId),questions=questionsFor(record),rows=shoppingRows(record,items,owned,stock);
 const brief=`<section><h2>Your brief</h2><p>${escapeHTML(record.request)}</p><dl>${questions.filter(q=>record.answers[q.id]).map(q=>`<dt>${escapeHTML(q.text)}</dt><dd>${escapeHTML(record.answers[q.id])}</dd>`).join('')}</dl></section>`;
 const check=`<section><h2>Before you begin</h2><ul>${projectChecks(record).map((c,i)=>`<li>${record.checks?.includes(i)?'Reviewed: ':'To review: '}${escapeHTML(c)}</li>`).join('')}</ul></section>`;
 const shopping=`<section><h2>Tools & materials</h2><p>Recorded ownership and stock fit are not a compatibility or strength certification. No live retailer prices.</p><table><tr><th>Item</th><th>Qty</th><th>Status</th></tr>${rows.map(r=>`<tr><td>${escapeHTML(r.name)}<br><small>${escapeHTML(r.note)}</small></td><td>${r.qty} ${escapeHTML(r.unit)}</td><td>${r.owned?'Owned / allocated':'To source'}</td></tr>`).join('')}</table></section>`;
 let quantities='';const calculator=calculatorFor(record.guideId);if(calculator&&record.quantityInputs){try{const q=calculateQuantity(calculator,record.quantityInputs);quantities='<section><h2>Quantity worksheet</h2><p>'+escapeHTML(q.containers+' '+q.unit)+'</p><dl>'+calculatorFields[calculator].map(([k,label])=>'<dt>'+escapeHTML(label)+'</dt><dd>'+escapeHTML(record.quantityInputs[k])+'</dd>').join('')+'</dl><p>'+escapeHTML(q.formula)+'</p><p>'+escapeHTML(q.note)+'</p></section>';}catch{quantities='<p>Quantity worksheet incomplete; do not use for ordering.</p>';}}
 const supplies=pack?.materials.length?`<section><h2>Materials & supplies to specify</h2><p>Select actual products and confirm quantities and compatibility before ordering.</p><ul>${pack.materials.map(m=>'<li>'+escapeHTML(m)+'</li>').join('')}</ul><h3>Other equipment to confirm</h3><ul>${pack.tools.map(t=>'<li>'+escapeHTML(t)+'</li>').join('')}</ul></section>`:'';
 const notes=`<section><h2>Project notes</h2><p>${escapeHTML(record.notes||'No additional notes.').replaceAll('\n','<br>')}</p></section>`;
 if(record.guideId==='bookcase'&&record.answers.dimensions){const d=design(bookcaseInput(record));return packHTML(d,record.pack?.constructionReview).replace('</html>',brief+check+shopping+finishHTML(record.pack?.finish||{system:record.answers.finish==='Keep the wood visible'?'clear':record.answers.finish==='Decide later'?'undecided':'paint',method:record.answers.finish==='Spray paint'?'spray':'brush',notes:record.answers.finish||''})+notes+'</html>');}
 return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHTML(title)} · Kitsley</title><style>body{font:16px/1.6 system-ui;max-width:900px;margin:40px auto;padding:24px;color:#17212b}table{width:100%;border-collapse:collapse}td,th{padding:12px;border-bottom:1px solid #ddd;text-align:left}dt{font-weight:600}dd{margin:0 0 16px}section{break-inside:avoid}li{margin:12px 0}@media print{body{margin:0}}</style><h1>${escapeHTML(title)}</h1><p>Kitsley project guide · ${escapeHTML(new Date().toLocaleDateString())}</p><p>${contentFor(record.guideId)?'Use within the stated guide scope. Confirm the actual products and conditions before work.':'Planning draft. Confirm specifications and manufacturer instructions before work.'}</p>${brief}<h2>Your next step</h2><p>${escapeHTML(nextAction(record))}</p>${check}${contentHTML(record.guideId)}${quantities}${shopping}${supplies}${notes}</html>`;
}
