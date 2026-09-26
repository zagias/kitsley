import {methodCompatibility} from './method-compatibility.mjs';
import {directSafetyResponse} from './safety-policy.mjs';
import {instructionQuestion} from './question-intent.mjs';
import {domainsFor} from './diy-domains.mjs';
import {finishingIntake} from './finishing-intake.mjs';
import {pathSetup} from './project-paths.mjs';
import {isGfciTask,gfciStatusKnown} from './free-start.mjs';
// Deterministic discovery: no model calls, invented measurements or paid entitlement.
const profiles=[
 {match:/\b(?:bathrooms?|showers?|bath)\b/i,advice:'Keeping fixtures in their current positions can simplify a bathroom renovation. Start by choosing whether you want a surface refresh or a different layout.',question:'What would you like to change?',choices:['Surfaces and fixtures','The layout','Both','Not sure yet']},
 {match:/\bbasements?\b/i,advice:'Before planning a finished basement, note any visible dampness and how you want to use the space. Those details affect the scope of the project.',question:'What is the main goal for the basement?',choices:['Frame and finish rooms','Create storage','Refresh an existing room','Not sure yet']},
 {match:/\b(?:cabinets?|bookcases?|shel(?:f|ves)|bookshel(?:f|ves)|tables?|bench(?:es)?)\b/i,advice:'Start with the space the piece needs to fit and what it will hold. Record measurements with units; we can keep unknown details open for now.',question:'What kind of work are you planning?',choices:['Build something new','Modify an existing piece','Repair it','Refinish it']},
 {match:/\b(?:paint(?:ing)?|spray(?:ing|er)?|drywall)\b/i,advice:'The existing surface and its condition determine preparation and material choice. Identify the surface before selecting products.',question:'Which surface are you working on?',choices:['Walls or ceiling','Wood','Metal','Another surface / not sure']},
 {match:/\b(?:gardens?|plants?|planting|yards?|pavers?|patios?|raised\s+(?:garden\s+)?beds?)\b/i,advice:'Note the available space, sunlight and where water collects before choosing a design. Those observations help narrow the materials and layout.',question:'What do you want to achieve?',choices:['Grow plants or food','Create a seating area','Improve paths or drainage','Something else']},
 {match:/\bdoors?\b/i,advice:'Note where the door first catches without forcing it. That observation helps distinguish a fit problem from a latch problem.',question:'What kind of door is it?',choices:['Ordinary interior door','Exterior door','Fire or glazed door','Not sure yet']}
];
const fallback={advice:'Let’s start with the basics. Describe the outcome you want and any limits on space, time or spending.',question:'What is the main goal?',choices:['Build or install','Repair a problem','Refresh or decorate','Plan my options']};
export function setupFlow(record){
 const safety=directSafetyResponse(record.request||'');if(safety)return {advice:safety.text,questions:safety.question?[{id:'constraint',text:safety.question,choices:safety.choices}]:[]};
 const compatibility=methodCompatibility(record.request);if(compatibility)return {advice:compatibility.text,questions:[{id:'constraint',text:compatibility.question,choices:compatibility.choices}]};
 if(isGfciTask(record))return {advice:'Your GFCI and the reported problem are already noted.',questions:gfciStatusKnown(record)?[]:[{id:'constraint',text:'Did it trip once, or does it keep tripping?',choices:['It tripped once','It keeps tripping','I’m not sure']}]};
 const finishing=finishingIntake(record);if(finishing)return finishing;
 if(instructionQuestion(record)){
  const domains=domainsFor(record.request),primary=domains[0];
  const prompts={plumbing:'Which pipe/fitting system and tool are you using? Include the visible markings or say “not sure”.',electrical:'What device and symptoms can you observe safely, without opening it?',drywall:'What surface and damage are you working with, and is the cause known?',hvac:'What is the equipment model and the maintenance task or symptom?',materials:'What material or product do you have, and what will it be used for?',adhesives:'What are the two surfaces and the exact adhesive product?',fastening:'What will this hold, and what will the fixing attach to?',doors:'Is this an ordinary interior door, an exterior door or a rated assembly?',flooring:'Which flooring product and subfloor are involved?',maintenance:'What is the device model and the symptom or maintenance task?','wet-areas':'What backing and waterproofing system are you using?',cabinetry:'Which part of the build are you working on, and what material or hardware is involved?','cabinet-doors':'Which hinge or slide model and door arrangement are involved?',finishing:'What is the surface and your intended finish?',outdoor:'What structure or surface is involved, and what condition is it in?'};
  return {advice:'Your question is already noted. We only need the detail that changes the method.',questions:[{id:'constraint',text:prompts[primary.id]||primary.questions[0],hint:'Share what you know; “not sure” is fine. We can help identify it.'}]};
 }
 const tailored=pathSetup(record);if(tailored)return tailored;
 let profile=profiles.find(p=>p.match.test(record.request))||fallback;
 if(/\b(?:bookcases?|book\s?shel(?:f|ves))\b/i.test(record.request))profile={...profile,question:'What will it need to hold?',choices:['Mostly books','Light objects and decor','A mixture','Not sure yet']};
 else if(/\bcabinets?\b/i.test(record.request)&&/\b(?:build(?:ing)?|mak(?:e|ing)|new)\b/i.test(record.request))profile={...profile,question:'What kind of cabinet do you want?',choices:['Kitchen base cabinet','Wall cabinet','Freestanding storage','Not sure yet']};
 return {advice:profile.advice,questions:[{id:'scope',text:profile.question,choices:profile.choices},{id:'constraint',text:'What should we plan around?',hint:'Share the space, budget or existing problem. Add units to measurements. “Not sure yet” is fine.'},{id:'experience',text:'How experienced are you with this kind of work?',choices:['I’m new to DIY','I have some experience','I’ll work with a professional','Not sure yet']}]};
}
export function setupQuestion(record){return setupFlow(record).questions.find(q=>!record.setup?.answers?.[q.id]);}
export function beginSetup(record){const flow=setupFlow(record);return {...record,setup:{version:1,answers:{},originalRequest:record.request},messages:[...record.messages,{role:'assistant',content:flow.advice+(flow.questions[0]?'\n\n'+flow.questions[0].text:'')}],updatedAt:new Date().toISOString()};}
export function answerSetup(record,value){
 const q=setupQuestion(record),answer=value.trim();if(!q||!answer)return record;
 if(q.choices&&!q.choices.includes(answer)&&/^(yes|no|change|everything|ok)$/i.test(answer))throw Error('Which option do you mean? Choose one below, or describe what you want to do.');
 const next={...record,setup:{version:1,answers:{...record.setup.answers,[q.id]:answer}}};
 const pending=setupQuestion(next);
 return {...next,messages:[...record.messages,{role:'user',content:answer},{role:'assistant',content:pending?pending.text:'Your starting details are saved. Your free guide and first steps are available below.'}],updatedAt:new Date().toISOString()};
}
export function freeAllowance(state,projectId,now=new Date()){
 if(!state?.signedIn)return null;
 const bucket='free:'+now.toISOString().slice(0,7),usage=(state.usage||[]).filter(u=>u.bucket===bucket);
 const used=usage.filter(u=>u.feature==='answer'&&u.project_id===projectId).length;
 const projects=new Set(usage.map(u=>u.project_id));
 return projects.size>=3&&!projects.has(projectId)?0:Math.max(0,3-used);
}
