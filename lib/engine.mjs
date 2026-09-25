import {projects} from './catalog.mjs';
export function recommend(input, catalog, overrides={}) {
 const project = projects.find(p=>p.id===input.projectId);
 if(!project) throw new Error('Choose one of the supported projects.');
 if(!['mdf','plywood','solid'].includes(input.material)) throw new Error('Choose a supported material.');
 if(project.id==='planter' && input.material==='mdf') throw new Error('MDF is not suitable for an outdoor planter. Choose solid wood and an exterior-rated design.');
 const owned=new Set(input.owned ?? []), tiers=new Map();
 for(const tier of ['essential','recommended','optional']) for(const id of project[tier]) tiers.set(id,tier);
 if(input.finish==='paint' && !['pegboard','planter','paint-cabinets'].includes(project.id)) for(const id of ['primer','paint','roller']) tiers.set(id,'essential');
 if(input.finish==='clear' && !['pegboard','planter'].includes(project.id)) {tiers.set('clearcoat','essential');tiers.set('brush','essential');}
 for(const [id,tier] of Object.entries(overrides[project.id]??{})) if(['essential','recommended','optional'].includes(tier)) tiers.set(id,tier);
 // Safety controls cannot be downgraded by commercial scoring.
 for(const id of project.essential.filter(id=>['eye','hearing','respirator','extractor'].includes(id))) tiers.set(id,'essential');
 const items=[...tiers].map(([id,tier])=> {
   const p=catalog.find(p=>p.id===id); if(!p) throw new Error(`Catalog is missing required item: ${id}`);
   if(!p.enabled && !['eye','hearing','respirator','extractor'].includes(id)) return null;
   return {...p,tier,owned:owned.has(id),why:p.description};
 }).filter(Boolean);
 const toBuy=items.filter(p=>!p.owned), essential=toBuy.filter(p=>p.tier==='essential');
 const total=xs=>({min:xs.reduce((s,p)=>s+p.min,0),max:xs.reduce((s,p)=>s+p.max,0)});
 return {project,items,estimate:total(essential),fullEstimate:total(toBuy),ownedCount:items.filter(p=>p.owned).length,material:input.material,finish:input.finish};
}
