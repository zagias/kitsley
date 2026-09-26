import {projectPath} from './project-paths.mjs';
export const safetyVersion='kitsley-safety-2026-09-26.3';
const rules=[
 {id:'electrical',match:/\b(?:electrical|rewir\w*|wiring|gfci|gfi|breakers?|outlets?|receptacles?|sockets?)\b/i,title:'Electrical safety',stop:'Stop for moisture, heat, visible damage or repeated trips. Do not remove covers, touch wiring or keep resetting a protective device.',need:'Exact device/model, symptoms and a dry, undamaged location; wiring and panel work need qualified assessment.',jurisdiction:true},
 {id:'plumbing',match:/\b(?:plumbing|pex|pipes?|drainage|water supply)\b/i,title:'Water & plumbing',stop:'Stop for uncontrolled leaks, contamination, damaged connections or uncertain shutoff access.',need:'Identify the pipe/system, location, existing damage and a suitable isolation plan.',jurisdiction:true},
 {id:'mounting',match:/\b(?:floating shelves?|wall[- ]?(?:mount|hung)|tv\s+mount|mount\w*\s+(?:a\s+)?tv)\b/i,title:'Wall support & concealed services',stop:'Do not drill until the wall, concealed services and mounting system are confirmed. An unknown support cannot be assigned a safe load.',need:'Exact bracket/mount, item weight, wall construction and applicable manufacturer fixing instructions.'},
 {id:'existing-assembly',match:/\b(?:drywall|demolition|demolish|old paint|lead paint|asbestos|wall removal)\b/i,title:'Existing materials & hidden services',stop:'Do not disturb suspect hazardous material, concealed services or an unassessed structural assembly.',need:'Identify the assembly, age/condition, moisture and services; arrange assessment where any of these remain uncertain.',jurisdiction:true},
 {id:'gas',match:/\b(?:gas line|gas pipe|gas fitting|gas appliance|gas valve)\b/i,title:'Gas equipment',stop:'Leave gas connections and repairs to qualified service. For suspected leakage, leave the area and seek emergency help from outside.',need:'Exact equipment and a qualified service plan.',jurisdiction:true,professional:true},
 {id:'structure',match:/\b(?:load[- ]bearing|structural (?:work|alteration|repair|wall|support|beam|damage)|foundation wall|roof truss|support beam)\b/i,title:'Structural work',stop:'Do not remove, cut or alter structural support without a competent site-specific assessment.',need:'A qualified designer’s assessment and local requirements.',jurisdiction:true,professional:true}
];
const highRiskProcedure=/\b(?:rewire|rewiring)\b|\b(?:replac(?:e|ing)|chang(?:e|ing)|install(?:ing)?|wir(?:e|ing)|connect(?:ing)?|open(?:ing)?|remov(?:e|ing)|repair(?:ing)?)\b.{0,60}\b(?:breaker|electrical panel|outlet|receptacle|electrical wiring|gas line|gas pipe|load[- ]bearing wall)\b|\b(?:bypass(?:ing)?|disabl(?:e|ing)|defeat(?:ing)?)\b.{0,50}\b(?:gfci|breaker|interlock|guard|safety)\b|\b(?:sand|cut|remove)\b.{0,40}\b(?:asbestos|lead paint)\b/i;
const requestForProcedure=/\b(?:how (?:do|can|should|to)|show me|tell me how|steps? to|instructions? for|walk me through)\b/i;
export function safetyProfile(record={},question=''){
 const text=[record.request,record.safetyQuestion,...Object.values(record.setup?.answers||{}),question].join(' ');
 const matched=rules.filter(r=>r.match.test(text));
 const path=projectPath(record);
 if(!matched.length&&!highRiskProcedure.test(text)&&!['trade','big-project'].includes(path?.id))return null;
 const professional=matched.some(r=>r.professional)||highRiskProcedure.test(text);
 return {version:safetyVersion,ids:matched.map(r=>r.id),level:professional?'professional-scope':'check-first',title:professional?'Keep this part with a qualified professional':'Check the job before starting',risks:matched.map(({id,title,stop,need})=>({id,title,stop,need})),needsLocation:matched.some(r=>r.jurisdiction)||['trade','big-project'].includes(path?.id),scope:professional?'Kitsley can help you understand the job, gather information and prepare questions for a qualified professional. It will not provide the hazardous procedure.':'Kitsley can research and explain your next step. Site conditions, product instructions and any required permissions still need checking.'};
}
export function safetyKey(record,profile){return JSON.stringify([safetyVersion,record.request,record.safetyQuestion,record.useCase,record.projectPhase,record.pack?.input,profile?.ids,profile?.level,record.safetyFacts]);}
export function safetyDecision(record={},question=''){
 const profile=safetyProfile(record,question);if(!profile)return {mode:'ordinary',profile:null};
 const facts=record.safetyFacts||{},missing=[];
 if(!String(facts.equipment||'').trim())missing.push('Identify the equipment, material or assembly, or record that it is unknown.');
 if(profile.needsLocation&&!String(facts.location||'').trim())missing.push('Record your city/region and country, or say the location is not yet known.');
 if(!['clear','concern','unknown'].includes(facts.conditions))missing.push('Record whether you have noticed damage, moisture or other concerns.');
 const current=record.safetyAcknowledgment?.key===safetyKey(record,profile)&&record.safetyAcknowledgment?.version===safetyVersion;
 if(!current)missing.push('Review the scope and stop conditions for this task.');
 const mode=missing.length?'needs-checks':profile.level==='professional-scope'||facts.conditions!=='clear'?'planning-only':'research-only';
 return {mode,profile,missing,constructionApproval:false,procedureApproved:false,acknowledged:current,rule:'User answers and acknowledgment are not inspection, product verification or permission to perform hazardous work. No permit or professional approval may be inferred.'};
}
export function directSafetyResponse(question,context=''){
 const penetration=/\b(?:cut(?:ting)?|drill(?:ing)?|saw(?:ing)?|penetrat\w*)\b/i.test(question);
 const existingSurface=/\b(?:wall|drywall|ceiling|floor)\b/i.test(question)&&! /\b(?:loose|offcut|spare|uninstalled)\b/i.test(question);
 const hiddenRisk=/\b(?:stud finder|scanner|detector|wire|wires|wiring|cable|cables|socket|outlet|receptacle|pipe|pipes)\b/i.test(question);
 if(penetration&&existingSurface&&hiddenRisk){
  const profile=safetyProfile({request:question});
  return {source:'safety',text:'A clear detector reading does not prove the cutting or drilling path is free of cables or pipes. Do not penetrate the surface while the route is uncertain. Look for existing plans and visible service routes without removing covers; have concealed services and appropriate isolation checked by a qualified professional before work proceeds. A detector model can explain its limitations, but cannot certify this wall is clear.',question:'What is already known about the services behind this part of the wall?',choices:['I have plans or visible routes','Only a detector reading','Nothing is known yet'],references:[{title:'Zircon SuperScan A2 instructions — detection limitations',url:'https://www.zircon.com/wp-content/uploads/2022/05/72105-02RevA0-SuperScan-A2-Instructions.pdf'}],safety:{version:safetyVersion,mode:'planning-only',profile,constructionApproval:false,procedureApproved:false},stepUpdates:[],designProposal:null};
 }

 const electricalAlteration=/\b(?:remov(?:e|ing)|replac(?:e|ing)|rewir(?:e|ing)|install(?:ing)?)\b.{0,50}\b(?:gfci|gfi|afci|rcd|outlet|receptacle|breaker|electrical panel)\b/i.test(question);
 if(electricalAlteration){const profile=safetyProfile({request:question});return {source:'safety',text:'Removing or replacing this device involves electrical wiring. Kitsley can help identify the problem and plan the work, but will not guide disconnecting or reconnecting wires. Do not remove covers or defeat the protection; arrange a qualified professional for the electrical work.',question:'What are you trying to achieve?',choices:['Replace a faulty device','Move the device','Understand what it does','Something else'],safety:{version:safetyVersion,mode:'planning-only',profile,constructionApproval:false,procedureApproved:false},stepUpdates:[],designProposal:null};}
 const protectionPattern=/\b(?:gfci|gfi|afci|rcd|breaker|interlock|blade guard|safety guard)\b/i;
 const protective=protectionPattern.test(question)||(protectionPattern.test(context)&&/\b(?:bypass|disable|defeat|override)\s+(?:it|that|this|the protection)\b/i.test(question));
 const defeat=/\b(?:bypass(?:ing)?|disabl(?:e|ing)|defeat(?:ing)?|override|tape\s+(?:it|the\s+\w+)\s+(?:on|down))\b/i.test(question);
 if(protective&&defeat){
  const electrical=/\b(?:gfci|gfi|afci|rcd|breaker)\b/i.test(question+' '+context);
  const profile=safetyProfile({request:question+' '+context});
  return {source:'safety',text:electrical?'Do not bypass or disable the protection. Stop using the affected circuit or outlet and do not keep resetting it. Arrange a licensed electrical contractor to investigate; note what was connected and when it trips without opening covers or touching wiring.':'Do not bypass or disable the guard or interlock. Stop using the tool until its protective system works as intended; use the manufacturer’s service guidance or qualified repair service.',safety:{version:safetyVersion,mode:'planning-only',profile,constructionApproval:false,procedureApproved:false},stepUpdates:[],designProposal:null};
 }
 if(!highRiskProcedure.test(question)||!requestForProcedure.test(question))return null;
 const profile=safetyProfile({request:question});
 return {source:'safety',text:profile.scope+' '+(profile.risks[0]?.stop||'Arrange a qualified assessment before starting.'),safety:{version:safetyVersion,mode:'planning-only',profile,constructionApproval:false,procedureApproved:false},stepUpdates:[],designProposal:null};
}
export function safetyMustPause(record,question){return safetyDecision(record,question).mode==='needs-checks'&&/\b(?:how|steps?|instructions?|drill|cut|wire|connect|reset|what (?:size|screws?|anchors?|bits?))\b/i.test(question);}
export function safetyContext(record,question){const decision=safetyDecision(record,question);return {...decision,facts:record.safetyFacts||{},responseRule:decision.profile?'Only give planning, observations from a safe place, applicable source research and clarification. Never treat this safety form as permission to execute. Do not output wiring, gas, structural alteration, hazardous-material removal, repeated reset or unverified mounting steps. Clear conditions are user-reported, not independently verified.':'Apply task-specific precautions and check missing facts. Absence of a matched rule is not safety certification.'};}
export function constrainSafetyResult(result,decision){
 if(!decision?.profile)return result;
 const unsafe=String(result.text||'').split(/[.!?\n]+/).some(sentence=>!/^\s*(?:do not|don't|never|avoid|stop|leave)\b/i.test(sentence)&&/\b(?:connect|attach|strip|touch)\b.{0,45}\b(?:live|conductor|terminal|wire)\b|\b(?:remove|open)\b.{0,30}\b(?:panel cover|breaker cover|dead front)\b|\b(?:bypass(?:ing)?|disabl(?:e|ing)|defeat(?:ing)?)\b.{0,30}\b(?:gfci|breaker|interlock|guard)\b|\b(?:keep|repeatedly)\s+reset/i.test(sentence));
 const safeResult=unsafe?{text:'That response would cross the safe scope of this task. Keep the equipment or assembly unchanged and have a qualified professional assess it. Kitsley can help you prepare the project details and questions for them.',source:'safety'}:result;
 return {...safeResult,safety:{version:safetyVersion,mode:decision.mode,profile:decision.profile,constructionApproval:false,procedureApproved:false},stepUpdates:[],designProposal:null,engine:result.engine?{...result.engine,phase:decision.mode==='needs-checks'?'needs-checking':'planning',authority:'planning-only'}:undefined};
}
export function restoreSafety(raw){
 const facts=raw?.safetyFacts||{};
 return {safetyQuestion:String(raw?.safetyQuestion||'').slice(0,2000),safetyFacts:{equipment:String(facts.equipment||'').slice(0,700),location:String(facts.location||'').slice(0,200),conditions:['clear','concern','unknown'].includes(facts.conditions)?facts.conditions:''}};
 // A restored backup requires a fresh acknowledgment; it is never an approval token.
}
