import {products} from './catalog.mjs';
import {recommend} from './engine.mjs';
import {procedureKits} from './content-kits.mjs';
const preparation={woodworking:['tape','square'],plumbing:['flashlight','tape'],electrical:['flashlight'],drywall:['tape','flashlight'],finishes:['tape','drop-cloth'],doors:['tape','screwdriver'],maintenance:['flashlight'],yard:['tape','gloves'],pavers:['tape','level','stakes-string'],garden:['tape','gloves','trowel'],safety:[]};
const extra={
'small-wall-hole':['drywall-knife','sanding-block'], 'large-drywall-patch':['square','utility-knife'], 'drywall-seam':['drywall-knife'], 'drywall-anchor':['stud-finder'], 'wall-texture':['drywall-knife'],
'paint-room':['roller','brush'], 'caulk-bath':['caulk-gun'], 'curtain-rail':['level','stud-finder','drill'], 'door-handle':['screwdriver'], 'paver-path':['rake','rubber-mallet'], 'paver-patio':['rake','wheelbarrow'], 'raised-bed':['level','square'], 'in-ground-bed':['shovel','rake'], 'mulch-bed':['rake','wheelbarrow'], 'plant-selection':[], 'garden-trellis':['square'], 'bed-edging':['stakes-string'], 'fence-panel':['level']};
const alternatives={sander:{id:'sanding-block',note:'For small finishing areas, hand sanding may be practical. Keep the same dust controls and coating preparation requirements.'},sprayer:{id:'roller',note:'A compatible fine-finish roller may suit flat surfaces when the coating allows it; the texture will differ.'},'miter-saw':{id:'miter-box',note:'For a few small trim cuts, a compatible miter box and handsaw may suffice. Check capacity and required angles.'},'flush-trim':{id:'utility-knife',note:'Some edge-banding products permit careful manual trimming. Follow that product’s instructions and test on scrap.'}};
export function readiness(entry,owned=[],material='plywood'){
 if(entry.mode==='urgent'||entry.category==='electrical')return {blocked:true,items:[],scope:'Safety and diagnosis come before selecting tools.'};
 let items,scope;
 if(procedureKits[entry.id]){items=procedureKits[entry.id].map(id=>({...products.find(p=>p.id===id),tier:'core',owned:owned.includes(id)}));scope='Core tools for this guide. Check the materials list and selected product instructions for consumables, access equipment and task-specific protection.';}
 else if(entry.kind==='plan'){items=recommend({projectId:entry.projectId,material,finish:'none',owned},products).items;scope='Base project kit. Finish, dimensions, design and material quantities still need confirmation.';}
 else {const ids=[...new Set([...(preparation[entry.category]||[]),...(extra[entry.id]||[])])];items=ids.map(id=>({...products.find(p=>p.id===id),tier:'preparation',owned:owned.includes(id)}));scope='Preparation tools only. This brief does not have a complete installation or repair kit yet.';}
 return {blocked:false,scope,items:items.map(p=>({...p,alternative:alternatives[p.id]?{...alternatives[p.id],name:products.find(x=>x.id===alternatives[p.id].id).name,owned:owned.includes(alternatives[p.id].id)}:null})),covered:items.filter(p=>p.owned).length,missing:items.filter(p=>!p.owned).length};
}
