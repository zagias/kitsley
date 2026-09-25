// Launch hypothesis. Change prices in Stripe and this catalog together before sales.
export const plans = {
 free: {id:'free',name:'Free',cents:0,projects:3,answers:3,searches:0,days:null},
 'project-pass': {id:'project-pass',name:'Project Pass',cents:1900,projects:1,answers:30,searches:6,days:30},
 plus: {id:'plus',name:'Kitsley Plus',cents:2900,projects:3,answers:90,searches:18,days:null}
};
export function validProjectId(id){return typeof id==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(id);}
export function liveGrants(grants,now=Date.now()){
 return grants.filter(g=>g.active&&Date.parse(g.starts_at)<=now&&Date.parse(g.ends_at)>now);
}
export function projectAccess(grants,projectId,now=Date.now()){
 return liveGrants(grants,now).find(g=>g.plan==='project-pass'&&g.project_id===projectId)||liveGrants(grants,now).find(g=>g.plan==='plus')||null;
}
