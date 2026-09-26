import {domainContext} from './diy-domains.mjs';
// A single shared task with prerequisite checks, not independent chat histories.
// Neither a model response, checkbox nor detector result can clear a site hazard.
export const coordinationVersion='2026-09-26.1';
const wall=/\b(?:wall|ceiling|drywall|plaster|gypsum|partition)\b/i;
const penetrate=/\b(?:cut\w*|drill\w*|open\w*|hole\w*|saw\w*|demoli\w*|recess\w*|mount\w*)\b/i;
const detector=/\b(?:detectors?|scanners?|stud finder|cables?|wires?|pipes?|behind)\b/i;
export function coordinationContext(record={},question=''){
 const task=String(record.request||'');
 const current=String(question||'');
 const wallTask=(wall.test(current)&&penetrate.test(current))||(wall.test(task)&&penetrate.test(task)&&(!domainContext(current).domains.length||wall.test(current)||detector.test(current)));
 if(!wallTask)return null;
 return {version:coordinationVersion,task:'wall-opening',lead:'drywall',returnTo:'drywall',state:'site-checks-required',constructionApproval:false,
  sharedFacts:{request:task.slice(0,1000),guide:record.guideId||null,reportedConditions:record.safetyFacts?.conditions||'unknown',reportedAssembly:record.safetyFacts?.equipment||null},
  handoffs:[
   {from:'drywall',to:'electrical',purpose:'Assess concealed-cable risk in the exact proposed opening and tool path.',needed:['Opening position and intended penetration','Visible devices on both sides without removing covers','Available drawings and exact detector model/limitations','On-site assessment when the route or isolation is uncertain']},
   {from:'electrical',to:'plumbing',purpose:'Check other concealed services; an electrical check does not locate all pipes or ducts.',needed:['Nearby fixtures and known service routes','What is on the other side/above/below','Site confirmation of anything in the proposed path']},
   {from:'plumbing',to:'drywall',purpose:'Return the findings to the original repair or opening task.',needed:['Assembly/rating, moisture and suspect old materials','Whether framing is affected','A method appropriate to the verified opening; unresolved conditions remain a hold']}
  ],
  rule:'Maintain the original goal and all unresolved findings through every handoff. Ask only the next missing decisive fact; do not make the user restart. A detector with no signal, no nearby outlet, switched-off power, a photo, a user saying safe or a web reference cannot prove the path is clear. Never advise energizing unknown equipment as a detection shortcut. Do not give a blade depth or cut/penetration steps while the site is unresolved. A reported professional assessment can inform a conditional discussion of the next drywall step, but is user-reported evidence, not independent Kitsley approval. Changed location, opening size, depth or discovered services require renewed checks.'};
}
export function coordinationSummary(context){
 if(!context)return null;
 return {version:coordinationVersion,task:context.task,lead:context.lead,returnTo:context.returnTo,state:context.state,constructionApproval:false,handoffs:context.handoffs.map(({from,to,purpose})=>({from,to,purpose}))};
}
