import {length,unitQuantity,measurementText} from './units.mjs';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import {parseDocument} from 'htmlparser2';
import serialize from 'dom-serializer';
import {workshopModel,workshopOptions,workshopShopping,workshopSteps,workshopScope,workshopSources} from './bookcase-workshop.mjs';
import {workshopArt} from './bookcase-workshop-art.mjs';
import {exportProject,shoppingRows} from './project-pack.mjs';
const mark='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2563EB"/><stop offset=".4" stop-color="#7C3AED"/><stop offset=".7" stop-color="#DB2777"/><stop offset="1" stop-color="#F97316"/></linearGradient></defs><path d="M10 9V27M10 37V55M20 9V27M20 37V55M28 27L46 9M55 14L37 32L55 50M28 37L46 55" fill="none" stroke="url(#g)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const text=s=>String(s??'').replace(/[\u2010-\u2014]/g,'-').replaceAll('→','>').replaceAll('✓','Reviewed: ').replaceAll('↗','').replaceAll('↓','');
const ink='#292135',accent='#783bdf';
export async function projectPDF(payload){
 const doc=new PDFDocument({size:'A4',margin:42,bufferPages:true,autoFirstPage:false,info:{Title:'Kitsley project '+payload.kind,Author:'Kitsley',Creator:'Kitsley'}}),chunks=[];
 const complete=new Promise((resolve,reject)=>{doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
 const units=payload.units==='imperial'?'imperial':'metric',measure=n=>length(n,units),display=v=>text(measurementText(v,units));
 let y=100;const width=511,bottom=776;
 const revision=Math.max(1,Number(payload.revision||payload.record?.pack?.build?.revision)||1);
 const date=new Date(payload.revisedAt||payload.record?.updatedAt||Date.now());
 const stamp=Number.isNaN(date.valueOf())?new Date().toISOString().slice(0,10):date.toISOString().slice(0,10);
 const meta=`Revision ${revision} | ${stamp}`;
 function page(label){doc.addPage();SVGtoPDF(doc,mark,40,28,{width:34,height:34});doc.font('Helvetica-Bold').fontSize(22).fillColor(ink).text('kitsley',82,34);doc.font('Helvetica').fontSize(9).fillColor('#625b6b').text(meta,320,38,{width:232,align:'right'});doc.strokeColor('#e4d9f4').moveTo(42,77).lineTo(553,77).stroke();y=98;if(label)heading(label);}
 function room(h){if(y+h>bottom)page();}
 function para(value,size=10.5,color=ink){const valueText=display(value);doc.font('Helvetica').fontSize(size);const h=doc.heightOfString(valueText,{width,lineGap:3});room(h+10);doc.fillColor(color).text(valueText,42,y,{width,lineGap:3});y+=h+10;}
 function heading(value){room(110);doc.font('Helvetica-Bold').fontSize(23).fillColor(ink).text(text(value),42,y,{width});y+=doc.heightOfString(text(value),{width})+15;}
 function art(svg,height=300){room(height+10);SVGtoPDF(doc,svg,42,y,{width,height,preserveAspectRatio:'xMidYMid meet',fontCallback:()=> 'Helvetica'});y+=height+12;}
 function table(headers,rows,cols){
  function row(values,isHead=false){doc.font(isHead?'Helvetica-Bold':'Helvetica').fontSize(9);let h=Math.max(...values.map((v,i)=>doc.heightOfString(display(v),{width:cols[i]-16,lineGap:2})))+18;if(y+h>bottom){page();row(headers,true);}if(isHead)doc.rect(42,y,width,h).fill('#f1e9fc');let x=42;values.forEach((v,i)=>{doc.fillColor(ink).text(display(v),x+8,y+8,{width:cols[i]-16,lineGap:2});x+=cols[i];});doc.strokeColor('#e4d9f4').moveTo(42,y+h).lineTo(553,y+h).stroke();y+=h;}
  row(headers,true);for(const r of rows)row(r);y+=16;
 }
 function shopping(rows){heading('Tools & materials');para('Check recorded ownership, quantities and condition before buying. Prices and store stock are not included.');table(['Item / specification','Quantity','Status'],rows.map(r=>[r.name+'\n'+(r.note||''),unitQuantity(r.qty,r.unit,units),r.owned?'Owned / allocated':'To source']),[323,85,103]);}
 if(payload.input){
  const d=workshopModel(payload.input),options=workshopOptions(payload.options),steps=workshopSteps(d,options);
  const dims=`${measure(d.width)} W × ${measure(d.height)} H × ${measure(d.depth)} D | ${measure(d.thickness)} ${d.materialName} | ${d.shelves} shelves`;
  const title={guide:'Your illustrated bookcase guide',drawings:'Bookcase drawings',cut:'Supplier cut list',shopping:'Bookcase shopping list'}[payload.kind];
  page(title);para(dims,11,accent);if(units==='imperial')para('Inches: exact fractions where possible; other values use decimal inches. Metric manufacturer sizes remain in parentheses. Do not round individual cut sizes to nominal board sizes.',9);para('Use this revision throughout the build. Check already-cut pieces if your design has changed.',9);
  if(payload.kind==='shopping')shopping(workshopShopping(d,options,payload.owned||[],payload.stock||[]));
  if(['cut','guide','drawings'].includes(payload.kind)){
   art(workshopArt(d,payload.kind==='guide'?'overview':'parts',{...options,units},'pdf'),270);
   if(payload.kind==='guide')page('Cut list');
   para(d.melamine?`Core cut sizes in ${units==='imperial'?'inches':'millimetres'} for ${d.materialName}. Add ${d.edgeThickness} mm front edging on A/B/C only; D remains 6 mm plywood. Do not subtract saw kerf. Request matching offcuts for a joint test.`:`Finished sizes in ${units==='imperial'?'inches':'millimetres'}. For plywood, grain runs along length. D remains 6 mm plywood. Do not subtract saw kerf. Request matching offcuts for a joint test.`,10);
   table(['Part','Qty','Length','Width','Thickness'],d.parts.map(p=>[p.id+' · '+p.name,p.qty,measure(p.length),measure(p.width),measure(p.thickness)]),[219,45,82,82,83]);
  }
  if(payload.kind==='guide'){page();shopping(workshopShopping(d,options,payload.owned||[],payload.stock||[]));}
  if(['guide','drawings'].includes(payload.kind))for(const [i,s] of steps.entries()){
   page(`${String(i+1).padStart(2,'0')}  ${s.title}`);para(dims,9,accent);para(s.parts,10);art(workshopArt(d,s.visual,{...options,units},'pdf-'+i),payload.kind==='drawings'?390:265);para(s.spec,11,accent);
   if(payload.kind==='guide'){para('Tools: '+s.tools.join(' · '),9);s.actions.forEach((a,n)=>para(`${n+1}. ${a}`));para('Check: '+s.check,10,accent);para(s.detail,9);}
   if(payload.kind==='guide'&&payload.designKey&&payload.stepAdvice?.[i]?.designKey===payload.designKey){para('Your saved tailored guidance',11,accent);para(payload.stepAdvice[i].text,10);}
   if(s.id==='back'){para(`Back screw centres (across, up), ${units==='imperial'?'inches':'mm'} from bottom-left:`,9);para(d.backScrews.map(p=>`(${measure(p.x)}, ${measure(p.y)})`).join(' · '),9);}
  }
  if(['guide','drawings'].includes(payload.kind)){page('Sources & design limits');para(workshopScope);para('These references support product use; they do not certify the original bookcase design. Drawings are not to scale.');for(const [label,url] of workshopSources){para(label,11,accent);para(url,8);}}
  else para(workshopScope,9);
 }else{
  const r=payload.record;page(r.title||'Your project');para('Project '+(payload.kind==='shopping'?'shopping list':'guide')+' | '+meta,10,accent);
  if(payload.kind==='shopping')shopping(shoppingRows(r,payload.items||[],payload.owned||[],payload.stock||[]));
  else {
   const html=exportProject(r,payload.items||[],payload.owned||[],payload.stock||[]),root=parseDocument(html,{decodeEntities:true});
   const plain=n=>n.type==='text'?n.data:n.name==='br'?'\n':(n.children||[]).map(plain).join('')+(n.name==='a'&&n.attribs?.href?' ('+n.attribs.href+')':'');
   const descendants=(n,name)=>{let out=[];for(const c of n.children||[]){if(c.name===name)out.push(c);else out.push(...descendants(c,name));}return out;};
   function walk(nodes){for(const n of nodes){if(n.name==='section'&&n.attribs?.style?.includes('break-inside:avoid'))page();if(['style','head','title','script','meta'].includes(n.name))continue;
    if(n.name==='svg'){art(serialize(n),300);continue;}
    if(n.name==='table'){const rs=descendants(n,'tr').map(tr=>(tr.children||[]).filter(c=>['th','td'].includes(c.name)).map(plain));if(rs.length){const count=rs[0].length;table(rs[0],rs.slice(1).map(row=>Array.from({length:count},(_,i)=>row[i]||'')),Array(count).fill(width/count));}continue;}
    if(['h1','h2','h3'].includes(n.name)){if(n.name!=='h1')heading(plain(n));continue;}
    if(['p','li','dt','dd','summary'].includes(n.name)&&!descendants(n,'svg').length){para((n.name==='li'?'• ':'')+plain(n));continue;}
    walk(n.children||[]);
   }}walk(root.children);
  }
 }
 const range=doc.bufferedPageRange();for(let i=0;i<range.count;i++){doc.switchToPage(i);doc.font('Helvetica').fontSize(8).fillColor('#625b6b').text(`Kitsley | ${meta}`,42,803,{lineBreak:false});doc.text(`${i+1} / ${range.count}`,510,803,{lineBreak:false});}
 doc.end();return complete;
}
