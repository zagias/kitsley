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
 if(flat){let out=box(p,0,0,0,h,t,z);for(const y of [0,...d.datums,h-t])out+=box(p,y,t,0,t,w-2*t,z,'#d9c6fa');if(!first)out+=box(p,0,w-t+(explode?160:0),0,h,t,z);out+=text(80,443,first?'First A lies flat on a padded bench':'Second A lowers onto the panel ends',16);return out;}
 let out=box(p,0,0,z,w,h,6,paint?'#ddd2ee':'#e9dcc8');
 for(const y of [0,...d.datums,h-t])out+=box(p,t,y,0,w-2*t,t,z,paint?'#efe9fa':'#ead9bf');
 out+=box(p,0,0,0,t,h,z,paint?'#f4effc':'#efdfc7')+box(p,w-t,0,0,t,h,z,paint?'#f4effc':'#efdfc7');
 return out;
}
export function workshopArt(d,kind='overview',options={},namespace='bookcase'){
 const marker='bc-'+String(namespace).replace(/[^a-zA-Z0-9_-]/g,'')+'-'+kind;
 const arrow=(x,y,a,b)=>`<path d="M${x} ${y}L${a} ${b}" stroke="${violet}" stroke-width="2.5" fill="none" marker-end="url(#${marker})"/>`;
 const dim=(x,y,a,b,label,tx=(x+a)/2,ty=(y+b)/2-8)=>line(x,y,a,b,'#806f96')+line(x-4,y-4,x+4,y+4,'#806f96')+line(a-4,b-4,a+4,b+4,'#806f96')+text(tx,ty,label,15,'middle');
 let art='',title='Your bookcase design';
 if(kind==='overview'){
  art=cabinet(d,{paint:options.finish==='paint'||options.finish==='factory'});
  art+=text(395,105,`${d.width} mm`,28)+text(395,130,'overall width')+text(395,184,`${d.height} mm`,28)+text(395,209,'overall height')+text(395,263,`${d.depth} mm`,28)+text(395,288,'overall depth')+text(65,443,`${d.shelves+1} openings · ${fmt(d.opening)} mm clear height`,16);
 }else if(kind==='parts'){
  title='Labelled board parts and their exact sizes';
  art=panel(65,55,45,230)+panel(126,55,45,230)+tag(86,90,'A')+tag(147,90,'A');
  let y=55;for(let i=0;i<d.shelves+2;i++){art+=panel(215,y,200,24,i<2?'#eee2ff':'#ddd0f4')+tag(237,y+12,i<2?'B':'C');y+=43;}
  art+=panel(457,55,114,230,'#f0e7d8')+tag(481,90,'D');
  art+=text(116,318,`${d.height} × ${d.panelDepth}`,14,'middle')+text(315,318,`${d.width-2*d.thickness} × ${d.panelDepth}`,14,'middle')+text(514,318,`${d.height} × ${d.width}`,14,'middle')+text(65,351,`A / B / C: ${d.thickness} mm ${d.materialName}`,d.melamine?13:15)+text(65,383,'D: 6 mm plywood')+text(65,420,d.melamine?`Core sizes exclude ${d.edgeThickness} mm front edging.`:'Plywood grain follows the first dimension.',14)+text(65,443,'D remains plywood. All sizes in mm.',14);
 }else if(kind==='edging'||kind==='clean'){
 title=kind==='edging'?'Supplier-applied edging on front only':'Clean the factory-finished faces';
 art=panel(85,140,440,150,'#f1edf5')+panel(85,290,440,15,'#bd9aeb')+text(90,95,kind==='edging'?'Protect the exposed front edge':'Keep the factory finish',22)+arrow(320,370,320,312)+text(95,410,`${d.edgeThickness} mm edging · front of A, B and C`,17)+text(95,445,'No face sanding, primer or paint.',17);
 }else if(kind==='sand'){
  title=d.material==='mdf'?'Prepare MDF edges for primer':'Hand sanding plywood';
  art=panel(75,115,450,150,'#eddec9');if(d.material!=='mdf')for(let i=0;i<5;i++)art+=line(90,140+i*23,510,140+i*23,'#c6b497');
  art+=panel(225,157,100,36,'#dac5fa')+panel(236,137,78,20,'#ad8edf')+arrow(347,175,440,175)+arrow(204,175,125,175)+text(275,90,'180 grit · light pressure',21,'middle');
  art+=panel(75,265,450,18,'#c9b093');if(d.material!=='mdf')for(let i=1;i<4;i++)art+=line(76,265+i*4,524,265+i*4,'#eadfcf');art+=text(90,346,'220 grit on the sharp front edge',20)+line(120,321,120,282,violet)+text(90,402,d.material==='mdf'?'Seal MDF edges. Keep joining ends square.':'Keep veneer intact. Leave joint edges square.',16);
 }else if(kind==='pockets'){
  title='Pocket-hole centre lines on the underside of each horizontal panel';
  art=panel(90,80,400,260)+text(290,54,'UNDERSIDE OF B / C',20,'middle')+text(290,365,'FRONT EDGE',14,'middle');
  for(const offset of d.holeOffsets){const y=340-offset/(d.panelDepth+(d.edgeThickness||0))*260;art+=`<ellipse cx="122" cy="${y}" rx="18" ry="7" fill="#cbb2f5" stroke="${ink}"/><ellipse cx="458" cy="${y}" rx="18" ry="7" fill="#cbb2f5" stroke="${ink}"/>`+line(490,y,519,y,'#aa95c4',true)+text(526,y+5,`${fmt(offset)} mm`,14);}
  art+=text(95,402,'Measure every centre from the front edge.',16)+text(95,429,'3 pockets at each end · drill through the jig.',16);
 }else if(kind==='layout'){
  title='Shelf underside positions measured from the same bottom datum';
  const scale=300/d.height,base=375;
  for(const x of [95,228]){art+=panel(x,base-300,95,300)+text(x+48,52,'A · inside',15,'middle');for(const datum of d.datums){const y=base-datum*scale;art+=line(x,y,x+95,y,violet)+panel(x,y-d.thickness*scale,95,d.thickness*scale,'#d7c0fc');}}
  for(const datum of d.datums){const y=base-datum*scale;art+=line(328,y,379,y,'#ab97c6',true)+text(391,y+5,`${fmt(datum)} mm`,19);}
  art+=line(65,375,365,375)+text(375,379,'0 · BOTTOM',16)+arrow(74,362,74,102)+text(85,429,'Marks show the underside of each C shelf.',16);
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
  art+=line(x,y,x+w,y+h,'#918198',true)+line(x+w,y,x,y+h,'#918198',true)+dim(x,y+h+27,x+w,y+h+27,`${d.width} mm`,x+w/2,y+h+53)+text(422,135,'Both diagonals',18)+text(422,160,'must match.',18)+text(422,215,`${d.backScrews.length} screws`,23)+text(422,241,'Purple dots = centres',13)+text(65,429,'Back facing up. Centre the screws on the panel edges.',16);
 }else if(kind==='finish'){
  title=options.finish==='paint'?'Painting the assembled bookcase with a brush':'Applying a clear finish to the bookcase';art=cabinet(d,{paint:options.finish==='paint'||options.finish==='factory'});
  art+=panel(430,213,86,82,options.finish==='paint'?'#dec5fc':'#f0dfbd')+text(473,245,options.finish==='paint'?'PAINT':'CLEAR',15,'middle')+text(473,270,options.finish==='paint'?'2 coats':'3 coats',14,'middle');
  art+=`<path d="M407 108h25v60h-25z" fill="#ba90ef" stroke="${ink}"/><path d="M396 168h46v22h-46z" fill="#eee5dd" stroke="${ink}"/><path d="M396 190h46v35h-46z" fill="#bcaa98" stroke="${ink}"/>`+text(383,346,'Thin, even coats',18)+text(65,443,'Allow the finish to cure before putting anything on it.',15);
 }else if(kind==='anchor'){
  title='Furniture restraint connects the carcass to suitable wall structure';
  art=panel(455,62,25,310,'#ddd6e9')+panel(146,183,230,190,'#ecdec9')+panel(146,168,230,18,'#f2e7d7');
  art+=`<path d="M350 170L350 132Q350 115 371 113L455 93" fill="none" stroke="${violet}" stroke-width="9"/>`+dot(350,173)+dot(456,94)+text(295,62,'Furniture restraint',20,'middle')+line(301,70,362,111,violet)+text(490,206,'Wall',18)+text(150,235,'Sound carcass panel',17)+text(150,266,'Not the thin back',16)+text(73,424,'The fixing method must match your wall and restraint kit.',15);
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 475" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><defs><marker id="${marker}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="${violet}"/></marker></defs><rect width="640" height="475" rx="18" fill="#faf7ff"/><g font-family="Arial,sans-serif">${art}</g></svg>`;
}
