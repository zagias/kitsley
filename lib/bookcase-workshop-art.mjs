import {displayLength as length} from './units.mjs';
import {fmt} from './bookcase.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ink='#292135',violet='#783bdf';
const text=(x,y,s,size=15,anchor='start',color=ink)=>`<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="${color}">${esc(s)}</text>`;
const line=(x,y,a,b,color=ink,dash=false)=>`<path d="M${x} ${y}L${a} ${b}" stroke="${color}" stroke-width="1.6" fill="none" ${dash?'stroke-dasharray="6 5"':''}/>`;
const tag=(x,y,s)=>`<circle cx="${x}" cy="${y}" r="15" fill="${violet}"/>${text(x,y+5,s,14,'middle','#fff')}`;
const panel=(x,y,w,h,color='#efe5ff')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="${color}" stroke="${ink}" stroke-width="1.5"/>`;
const dot=(x,y)=>`<circle cx="${x}" cy="${y}" r="3.5" fill="${violet}"/>`;
function box(p,x,y,z,w,h,depth,color='#ead9bf'){
 const poly=(points,fill)=>`<polygon points="${points.map(v=>p(...v).join(',')).join(' ')}" fill="${fill}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
 return poly([[x,y+h,z],[x+w,y+h,z],[x+w,y+h,z+depth],[x,y+h,z+depth]],'#f7eee1')+poly([[x+w,y,z],[x+w,y+h,z],[x+w,y+h,z+depth],[x+w,y,z+depth]],'#ccbaa5')+poly([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],color);
}
function cabinet(d,{flat=false,first=false,explode=false,paint=false}={}){
 const s=flat?Math.min(300/d.height,225/d.width):Math.min(310/d.height,270/(d.width+d.panelDepth*.6));
 const p=(x,y,z)=>[65+(x+z*.52)*s,397-(y+z*.32)*s];
 const {width:w,height:h,thickness:t,panelDepth:z}=d;
 const levels=[{y:0,inset:0,depth:z},...d.datums.map((y,i)=>({y,inset:d.shelfPanels[i].inset,depth:d.shelfPanels[i].width})),{y:h-t,inset:0,depth:z}];
 if(flat){let out=box(p,0,0,0,h,t,z);for(const v of levels)out+=box(p,v.y,t,v.inset,t,w-2*t,v.depth,'#d9c6fa');if(!first)out+=box(p,0,w-t+(explode?160:0),0,h,t,z);out+=text(80,443,first?'First A lies flat on a padded bench':'Second A lowers onto the panel ends',16);return out;}
 let out=box(p,0,0,z,w,h,6,paint?'#ddd2ee':'#e9dcc8');
 // The far side sits behind the shelves. Painting it last hides the joints
 // and makes a fixed side look like an open door.
 out+=box(p,0,0,0,t,h,z,paint?'#f4effc':'#efdfc7');
 for(const v of levels){out+=box(p,t,v.y,v.inset,w-2*t,t,v.depth,paint?'#efe9fa':'#ead9bf');if(v.inset){const a=p(t,v.y+t,v.inset),b=p(w-t,v.y+t,v.inset);out+=line(...a,...b,violet);}}
 out+=box(p,w-t,0,0,t,h,z,paint?'#f4effc':'#efdfc7');
 return out;
}
// Flat pieces share one scale on both axes; sizes never use decorative compression.
export function workshopPartsLayout(d){
 const scale=Math.min(220/Math.max(...d.parts.map(p=>p.length)),130/Math.max(...d.parts.map(p=>p.width)));
 let y=60;const rows=d.parts.map(p=>{const row={id:p.id,x:40,y,width:p.length*scale,height:p.width*scale};y+=Math.max(72,row.height)+20;return row;});
 return {scale,rows,height:y+56};
}
export function workshopArt(d,kind='overview',options={},namespace='bookcase'){
 if(!d?.parts||!d.shelfPanels)throw Error('A compiled bookcase model is required to draw this guide.');
 const units=options.units||'metric',measure=n=>length(n,units);
 const marker='bc-'+String(namespace).replace(/[^a-zA-Z0-9_-]/g,'')+'-'+kind;
 const arrow=(x,y,a,b)=>`<path d="M${x} ${y}L${a} ${b}" stroke="${violet}" stroke-width="2.5" fill="none" marker-end="url(#${marker})"/>`;
 const dim=(x,y,a,b,label,tx=(x+a)/2,ty=(y+b)/2-8)=>line(x,y,a,b,'#806f96')+line(x-4,y-4,x+4,y+4,'#806f96')+line(a-4,b-4,a+4,b+4,'#806f96')+text(tx,ty,label,15,'middle');
 let art='',title='Your bookcase design',canvasHeight=475;
 if(kind==='overview'){
  art=cabinet(d,{paint:options.finish==='paint'||options.finish==='factory'});
  art+=text(395,105,`${measure(d.width)}`,units==='imperial'?22:28)+text(395,130,'overall width')+text(395,184,`${measure(d.height)}`,units==='imperial'?22:28)+text(395,209,'overall height')+text(395,263,`${measure(d.depth)}`,units==='imperial'?22:28)+text(395,288,'overall depth')+text(65,443,`${d.shelves+1} openings · ${measure(fmt(d.opening))} clear height`,16);
  art+=text(65,465,'Fixed sides · shelves fit between them',12);
  if(d.customShelves){art+=text(395,326,'Interior shelf depths',15);d.shelfPanels.forEach((p,i)=>{art+=text(395,350+i*23,`${p.id}: ${measure(p.finishedDepth)}`,16);});}
 }else if(kind==='shelf-depths'){
  title='Interior shelves viewed from above, with back edges aligned';
  const scale=235/(d.width-2*d.thickness),rowHeight=d.panelDepth*scale+62;
  canvasHeight=75+d.shelves*rowHeight+38;
  art=text(35,30,'SHELF DEPTHS · LOOKING DOWN',18)+text(35,52,'Back at top · front at bottom',14);
  [...d.shelfPanels].reverse().forEach((p,i)=>{
   const y=75+i*rowHeight,w=p.length*scale,h=p.finishedDepth*scale,full=(d.depth-6)*scale;
   art+=`<rect x="40" y="${y}" width="${w}" height="${full}" fill="none" stroke="#9a87b2" stroke-width="1.5" stroke-dasharray="5 4"/>`;
   art+=panel(40,y,w,h,'#e5d5fc')+line(40,y+h,40+w,y+h,violet);
   art+=text(303,y+18,`${p.id} · ${p.name}`,17)+text(303,y+46,measure(p.finishedDepth)+' deep',20);
   if(units==='imperial')art+=text(303,y+68,`${length(p.finishedDepth,'metric')} exact`,14);
   if(p.inset){art+=arrow(40+w/2,y+full-4,40+w/2,y+h+5)+text(303,y+94,'Front setback: '+measure(p.inset),14);if(units==='imperial')art+=text(303,y+114,`${length(p.inset,'metric')} exact`,13);}
   else art+=text(303,y+94,'Full depth · no setback',14);
   art+=text(40,y+full+24,'Cabinet front',12);
  });
  art+=text(35,canvasHeight-15,'Dashed outline = full depth. Shelf width stays unchanged.',14);
 }else if(kind==='parts'){
  title='Labelled board parts drawn in proportion to their cut sizes';
  const layout=workshopPartsLayout(d);canvasHeight=layout.height;
  art=text(35,30,'CUT PIECES · length × depth × thickness',18);
  d.parts.forEach((p,i)=>{
   const r=layout.rows[i],values=[p.length,p.width,p.thickness];
   const sizes=values.map(n=>measure(n).replace(/ (in|mm)$/,'')).join(' × ')+(units==='imperial'?' in':' mm');
   art+=panel(r.x,r.y,r.width,r.height,p.id==='D'?'#f0e7d8':'#e8ddfa')+text(290,r.y+17,`${p.id} · ${p.name} × ${p.qty}`,17)+text(290,r.y+42,sizes,15);
   if(units==='imperial')art+=text(290,r.y+63,values.map(n=>length(n,'metric').replace(' mm','')).join(' × ')+' mm exact',14);
  });
  art+=text(35,canvasHeight-36,`A / B / C: ${d.materialName}. D: plywood.`,14)+text(35,canvasHeight-14,d.melamine?'Core sizes exclude front edging. Same drawing scale for every piece.':'Same drawing scale for every piece. Use the labelled cut sizes.',13);
 }else if(kind==='edging'||kind==='clean'){
 title=kind==='edging'?'Supplier-applied edging on front only':'Clean the factory-finished faces';
 art=panel(85,140,440,150,'#f1edf5')+panel(85,290,440,15,'#bd9aeb')+text(90,95,kind==='edging'?'Protect the exposed front edge':'Keep the factory finish',22)+arrow(320,370,320,312)+text(95,410,`${measure(d.edgeThickness)} edging · front of A, B and C`,17)+text(95,445,'No face sanding, primer or paint.',17);
 }else if(kind==='sand'){
  title=d.material==='mdf'?'Prepare MDF edges for primer':'Hand sanding plywood';
  art=panel(75,115,450,150,'#eddec9');if(d.material!=='mdf')for(let i=0;i<5;i++)art+=line(90,140+i*23,510,140+i*23,'#c6b497');
  art+=panel(225,157,100,36,'#dac5fa')+panel(236,137,78,20,'#ad8edf')+arrow(347,175,440,175)+arrow(204,175,125,175)+text(275,90,'180 grit · light pressure',21,'middle');
  art+=panel(75,265,450,18,'#c9b093');if(d.material!=='mdf')for(let i=1;i<4;i++)art+=line(76,265+i*4,524,265+i*4,'#eadfcf');art+=text(90,346,'220 grit on the sharp front edge',20)+line(120,321,120,282,violet)+text(90,402,d.material==='mdf'?'Seal MDF edges. Keep joining ends square.':'Keep veneer intact. Leave joint edges square.',16);
 }else if(kind==='pockets'){
  title='Pocket-hole centre lines on the underside of each horizontal panel';
  art=panel(90,80,400,260)+text(290,54,'UNDERSIDE OF B / C',20,'middle')+text(290,365,'FRONT EDGE',14,'middle');
  for(const offset of d.holeOffsets){const y=340-offset/(d.panelDepth+(d.edgeThickness||0))*260;art+=`<ellipse cx="122" cy="${y}" rx="18" ry="7" fill="#cbb2f5" stroke="${ink}"/><ellipse cx="458" cy="${y}" rx="18" ry="7" fill="#cbb2f5" stroke="${ink}"/>`+line(490,y,519,y,'#aa95c4',true)+text(526,y+5,`${measure(fmt(offset))}`,14);}
  art+=text(95,402,'Measure every centre from the front edge.',16)+text(95,429,'3 pockets at each end · drill through the jig.',16);
  if(d.customShelves){
   art=text(35,35,'POCKETS · underside of each panel',19);
   d.horizontalPanels.forEach((p,i)=>{const y=58+i*82,h=p.finishedDepth/d.depth*64;art+=panel(58,y,220,h)+text(301,y+16,`${p.id} · ${measure(p.finishedDepth)} deep`,16)+text(301,y+40,p.holeOffsets.map(n=>measure(fmt(n))).join(' / '),14);for(const n of p.holeOffsets){const py=y+h-n/p.finishedDepth*h;art+=dot(72,py)+dot(264,py);}art+=text(168,y+h+14,'FRONT',10,'middle');});
   art+=text(35,420,'Offsets from each panel’s own finished front edge.',14)+text(35,444,'3 pockets at each end. Reposition the jig for each centre.',14);
  }
 }else if(kind==='layout'){
  title='Shelf underside positions measured from the same bottom datum';
  const scale=300/d.height,base=375;
  for(const x of [95,228]){art+=panel(x,base-300,95,300)+text(x+48,52,'A · inside',15,'middle');for(const [i,datum] of d.datums.entries()){const y=base-datum*scale,inset=d.shelfPanels[i].inset/d.panelDepth*95;art+=line(x,y,x+95,y,violet)+panel(x+inset,y-d.thickness*scale,95-inset,d.thickness*scale,'#d7c0fc');}if(d.customShelves)art+=text(x,399,'Front → back',12);}
  for(const datum of d.datums){const y=base-datum*scale;art+=line(328,y,379,y,'#ab97c6',true)+text(391,y+5,`${measure(fmt(datum))}`,19);}
  art+=line(65,375,365,375)+text(375,379,'0 · BOTTOM',16)+arrow(74,362,74,102)+text(85,429,'Marks show the underside of each C shelf.',16);
  if(d.customShelves)art+=text(85,452,'Keep backs aligned; front setbacks follow the cut plan.',14);
 }else if(kind==='first-side'||kind==='second-side'){
  title=kind==='first-side'?'First side on the bench with perpendicular horizontal panels':'Second side aligned above the panel ends';
  art=cabinet(d,{flat:true,first:kind==='first-side',explode:kind==='second-side'});
  if(kind==='second-side')art+=arrow(273,82,273,134);
  art+=text(440,187,'A',20)+text(440,221,'B + C',20)+text(440,285,'3 screws',18)+text(440,309,'per joint',18);
  // A separate corner close-up makes the screw direction unambiguous.
  art+=panel(433,45,18,88)+panel(451,115,119,18)+line(477,126,443,116,violet)+dot(477,126)+text(441,156,'Joint section',13);
 }else if(kind==='back'){
  title='Back panel screw pattern and diagonal squareness check';
  const scale=Math.min(290/d.height,275/d.width),x=112,y=66,w=d.width*scale,h=d.height*scale;
  art=panel(x,y,w,h,'#eee4d3');
  for(const a of d.backScrews)art+=dot(x+a.x*scale,y+(d.height-a.y)*scale);
  art+=line(x,y,x+w,y+h,'#918198',true)+line(x+w,y,x,y+h,'#918198',true)+dim(x,y+h+27,x+w,y+h+27,`${measure(d.width)}`,x+w/2,y+h+53)+text(422,135,'Both diagonals',18)+text(422,160,'must match.',18)+text(422,215,`${d.backScrews.length} screws`,23)+text(422,241,'Purple dots = centres',13)+text(65,429,'Back facing up. Centre the screws on the panel edges.',16);
 }else if(kind==='finish'){
  title=options.finish==='paint'?'Painting the assembled bookcase with a brush':'Applying a clear finish to the bookcase';art=cabinet(d,{paint:options.finish==='paint'||options.finish==='factory'});
  art+=panel(430,213,86,82,options.finish==='paint'?'#dec5fc':'#f0dfbd')+text(473,245,options.finish==='paint'?'PAINT':'CLEAR',15,'middle')+text(473,270,options.finish==='paint'?'2 coats':'3 coats',14,'middle');
  art+=`<path d="M407 108h25v60h-25z" fill="#ba90ef" stroke="${ink}"/><path d="M396 168h46v22h-46z" fill="#eee5dd" stroke="${ink}"/><path d="M396 190h46v35h-46z" fill="#bcaa98" stroke="${ink}"/>`+text(383,346,'Thin, even coats',18)+text(65,443,'Allow the finish to cure before putting anything on it.',15);
 }else if(kind==='anchor'){
  title='Full-height side view: bookcase upright at the wall, restraint fixed to solid carcass';
  const scale=300/d.height,base=382,wallX=299,backX=wallX-6*scale,frontX=wallX-d.depth*scale,top=base-d.height*scale,thick=d.thickness*scale;
  // Side elevation uses the actual height/depth ratio. The back meets the wall;
  // the enlarged restraint detail is schematic, not a drilling specification.
  art=text(46,35,'SIDE VIEW · UPRIGHT AT THE WALL',17)+panel(wallX,58,15,324,'#ddd6e9')+line(46,base,360,base,'#806f96');
  art+=panel(frontX,top,backX-frontX,d.height*scale,'#ecdec9')+panel(backX,top,6*scale,d.height*scale,'#d7c3a4');
  art+=panel(frontX,top,backX-frontX,thick,'#f7eee1')+panel(frontX,base-thick,backX-frontX,thick,'#f7eee1');
  d.datums.forEach((y,i)=>{art+=line(frontX+d.shelfPanels[i].inset*scale,base-y*scale,backX,base-y*scale,'#a08665',true);});
  art+=`<path d="M${backX-24} ${top+3} L${backX-24} ${top-12} L${wallX} ${top-12}" fill="none" stroke="${violet}" stroke-width="5"/>`;
  art+=dot(backX-24,top+3)+dot(wallX,top-12)+text(321,77,'Wall',14)+text(46,417,`${measure(d.height)} high · ${measure(d.depth)} deep`,17);
  art+=text(378,125,'RESTRAINT DETAIL',16)+panel(394,224,143,18,'#ecdec9')+panel(529,242,8,86,'#d7c3a4')+panel(558,166,15,160,'#ddd6e9');
  art+=`<path d="M500 225 L500 201 Q500 190 513 188 L558 180" stroke="${violet}" stroke-width="6" fill="none"/>`+dot(500,229)+dot(560,180);
  art+=text(378,276,'Fix to sound carcass',14)+arrow(473,259,500,233)+text(378,314,'Never only the thin back',14)+line(524,280,542,296,'#b42332')+line(542,280,524,296,'#b42332');
  art+=text(46,454,'Follow the restraint kit for fixings and any skirting gap. Detail not to scale.',13);

 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 ${canvasHeight}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><defs><marker id="${marker}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="${violet}"/></marker></defs><rect width="640" height="${canvasHeight}" rx="18" fill="#faf7ff"/><g font-family="Arial,sans-serif">${art}</g></svg>`;
}
