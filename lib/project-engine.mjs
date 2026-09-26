import {jurisdictionContext,jurisdictionVersion} from './jurisdiction-context.mjs';
import {specialistContext,specialistReview,specialistVersion} from './specialist-review.mjs';
import {safetyContext} from './safety-policy.mjs';
import {workflowContext} from './project-paths.mjs';
import {workshopModel,workshopOptions,workshopTools,workshopSupplies,workshopSteps,workshopVersion} from './bookcase-workshop.mjs';
import {workshopArt} from './bookcase-workshop-art.mjs';
import {foundationVersion} from './diy-knowledge.mjs';
import {researchVersion} from './advice-research.mjs';
import {technicalAssessment} from './technical-assessment.mjs';
import {domainContext} from './diy-domains.mjs';
import {coordinationContext,coordinationSummary,coordinationVersion} from './trade-coordination.mjs';

export const engineVersion='kitsley-project-engine-1';
export const engineCapabilities={
 explain:{scope:'All topics, subject to evidence and required facts',authority:'personal-guidance'},
 research:{scope:'Primary-source comparison, material and method assessment',authority:'provisional-evidence'},
 design:{'bookcase.uniform-panels.v1':{scope:'Existing indoor uniform-shelf bookcase within its dimensional and material limits',checks:['dimensional consistency','part quantities','artifact consistency'],excludes:['load certification','novel joints','individual shelf widths','pet containment','wall-hung or structural use']}},
 learn:{scope:'Private project evidence and anonymous recurring-topic counts',authority:'candidate-only',automaticPublication:false}
};
engineCapabilities.design['bookcase.recessed-shelves.v1']={scope:'Back-aligned interior shelf depths, minimum 150 mm core depth, unchanged side-to-side width',checks:['dimensional consistency','per-panel pocket centres','back alignment','artifact consistency'],excludes:['load certification','individual shelf width','cantilevers','novel joints']};
const keys=['width','height','depth','thickness','shelves','material','edgeThickness','shelfInsets'];
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
export function projectContextKey(record={}){
 // Exact context, not a fuzzy/semantic match. Different constraints invalidate a proposal.
 return JSON.stringify(canonical({engineVersion,foundationVersion,researchVersion,coordinationVersion,specialistVersion,jurisdictionVersion,id:record.id,useCase:record.useCase,projectPhase:record.projectPhase,safetyFacts:record.safetyFacts,safetyQuestion:record.safetyQuestion,guide:record.guideId,request:record.request,answers:record.answers,setup:record.setup,notes:record.notes,clarifications:record.clarifications,input:record.pack?.input,build:record.pack?.build,stepAdvice:record.stepAdvice||{}}));
}
export function engineContext(record={},question=''){
 return {version:engineVersion,capabilities:engineCapabilities,jurisdiction:jurisdictionContext(record,question),knowledge:domainContext(question,record),specialists:specialistContext(record,question),coordination:coordinationContext(record,question),coordinationVersion,workflow:workflowContext(record),safety:safetyContext(record,question),project:{guide:record.guideId||null,request:String(record.request||'').slice(0,2000),facts:record.setup?.answers||record.answers||{},clarifications:(record.clarifications||[]).slice(-10),dimensions:record.pack?.input||null,currentStep:record.pack?.build?.active??null},previousAssessment:record.technicalAssessment||null,rule:'Explain and research are not permission to manufacture. Only registered deterministic builders can create dimensioned artifacts. Missing evidence or an unsupported operation stays a proposal.'};
}

// The same compiled model supplies drawings, parts, tools, materials and steps.
// This validates geometry consistency, not physical load capacity or construction approval.
export function compileBookcase(input,options={}){
 if(!input||!['plywood','mdf','melamine-mdf','melamine-particleboard'].includes(input.material))throw Error('Identify the actual board and core first.');
 for(const k of ['width','height','depth','thickness','shelves'])if(typeof input[k]!=='number'||!Number.isFinite(input[k]))throw Error('Dimensions must be finite numbers in millimetres.');
 const model=workshopModel(input),opts=workshopOptions({...options,finish:input.material==='mdf'?'paint':input.material.startsWith('melamine-')?'factory':options.finish});
 const parts=model.parts;
 if(parts.some(p=>![p.length,p.width,p.thickness,p.qty].every(n=>Number.isFinite(n)&&n>0))||parts.reduce((n,p)=>n+p.qty,0)!==model.partCount)throw Error('Part schedule is inconsistent.');
 const byId=Object.fromEntries(parts.map(p=>[p.id,p]));
 if(byId.A.length!==model.height||byId.B.length+2*model.thickness!==model.width||model.shelfPanels.some(p=>p.length!==byId.B.length||Math.abs(p.width+p.inset-model.panelDepth)>1e-6||p.holeOffsets.some(n=>n<15||n>p.finishedDepth-15))||byId.D.length!==model.height||byId.D.width!==model.width||Math.abs(model.panelDepth+6+model.edgeThickness-model.depth)>1e-6)throw Error('The drawing and part dimensions disagree.');
 const steps=workshopSteps(model,opts);
 return {version:engineVersion,builder:workshopVersion,key:model.key,checks:{dimensions:'passed',partQuantities:'passed',constructionApproval:false,loadRating:null},model,parts,tools:workshopTools(opts,model),materials:workshopSupplies(model,opts),steps,drawings:{overview:workshopArt(model,'overview',opts,'engine'),parts:workshopArt(model,'parts',opts,'engine'),steps:steps.map((s,i)=>workshopArt(model,s.visual,opts,'engine-step-'+i))}};
}


export function componentRequest(question){return /\b(top|bottom|upper|lower|middle|individual|one|single)\s+(shel(?:f|ves)|panel|side)\b|\b(tapered|taper|stepped|angled|dog|pet|cage|crate|aquarium|seat|bench|wall[- ]hung)\b/i.test(question.replace(/\b(?:add|remove) (?:a|one) shelf\b/gi,''));}
export function compileProposal(record,operation,question=''){
 if(!operation)return null;
 if(record?.guideId!=='bookcase'||record?.pack?.build?.version!==1||!['bookcase.uniform-panels.v1','bookcase.recessed-shelves.v1'].includes(operation.builder)||!['whole-design','interior-shelves'].includes(operation.target)||(operation.target==='whole-design'&&componentRequest(question)))return {status:'unsupported',reason:'This request needs a different design operation. The existing drawing has not changed.'};
 const patch={};for(const [k,v] of Object.entries(operation.changes||{})){if(!keys.includes(k))return {status:'unsupported',reason:'That design property is not supported.'};if(v!==null)patch[k]=v;}
 if(operation.target==='interior-shelves'&&(operation.builder!=='bookcase.recessed-shelves.v1'||Object.keys(patch).some(k=>k!=='shelfInsets')||!Array.isArray(patch.shelfInsets)))return {status:'unsupported',reason:'An interior shelf operation must specify only its front setbacks.'};
 if(operation.target==='whole-design'&&Array.isArray(patch.shelfInsets)&&!Object.keys(patch).some(k=>k!=='shelfInsets'))return {status:'unsupported',reason:'Use an interior-shelf operation for individual shelf depths.'};
 if(operation.target==='interior-shelves'&&/\b(narrow|narrower|width|wide|taper|angled|top shelf|top panel|dog|pet|cage|crate|aquarium|seat|bench|wall.hung)\b/i.test(question))return {status:'unsupported',reason:'Clarify the axis and support arrangement before changing one shelf.'};
 try{
  const input={...record.pack.input,...patch},bundle=compileBookcase(input,record.pack.build.options);
  const changes=Object.keys(patch).filter(k=>JSON.stringify(input[k])!==JSON.stringify(record.pack.input[k])).map(k=>({key:k,before:record.pack.input[k],after:input[k]}));
  if(!changes.length)return null;
  return {status:'review',builder:operation.builder,baseContext:projectContextKey(record),input,changes,checks:bundle.checks,partCount:bundle.model.partCount,reason:String(operation.reason||'Review this change before applying it.').slice(0,400)};
 }catch(e){return {status:'unsupported',reason:e.message};}
}
export function proposalCurrent(record,proposal){return proposal?.status==='review'&&proposal.baseContext===projectContextKey(record);}

export function engineDecision({record={},question='',raw={},result,research}){
 const coordination=coordinationSummary(coordinationContext(record,question));
 const specialists=specialistReview(raw.specialistReview,research);
 const assessment=technicalAssessment(raw.technicalAssessment,research);
 // A registered depth-only edit reuses this guide's existing construction method.
 // Its dimensional preview is checked by our compiler, not certified by web search.
 // Missing/conflicting project facts and all new materials/methods still require evidence.
 const geometryOnly=!assessment&&['supported','limited','needs-details'].includes(research.status)&&raw.designOperation?.factsComplete===true&&raw.designOperation?.builder==='bookcase.recessed-shelves.v1'&&raw.designOperation?.target==='interior-shelves';
 const proposal=!coordination&&specialists?.status!=='needs-checking'&&((research.status==='supported'&&raw.designOperation?.factsComplete!==false)||geometryOnly?compileProposal(record,raw.designOperation,question):null);
 const blocked=!!coordination||specialists?.status==='needs-checking'||research.status!=='supported'||assessment?.stage==='needs-checking'||proposal?.status==='unsupported';
 const phase=proposal?.status==='review'?'review-design':blocked?'needs-checking':assessment?'planning':'guidance';
 let presentation=result;
 if(geometryOnly&&proposal?.status==='review')presentation={...result,text:'Your shelf-depth change is ready to preview. Review the current and proposed drawings and cut sizes below. Applying it will update the guide together; check any already-cut pieces first. The dimensions are checked for consistency, not a certified load rating.'};
 if(assessment?.stage==='needs-checking'){
  // Surface the bounded findings already shown in the assessment, rather than
  // replacing every partially resolved question with the same generic message.
  // Unverified raw prose is still withheld; no steps or design change are enabled.
  const established=assessment.checks.filter(c=>c.status==='established'&&c.references.length&&c.finding.length<=350).slice(0,2);
  const facts=established.map(c=>c.finding+' ['+c.references[0].title+']('+c.references[0].url+')').join('\n\n');
  const advice=(facts?facts+'\n\n':'')+'Before choosing the method: '+assessment.question;
  presentation={...result,text:advice,...(result.discovery?{discovery:{...result.discovery,advice,question:assessment.question,choices:[],briefReady:false}}:{})};
 }
 return {...presentation,stepUpdates:blocked||proposal?[]:result.stepUpdates||[],research,coordination,specialistReview:specialists,technicalAssessment:assessment,designProposal:proposal||null,engine:{version:engineVersion,phase,coordination,contextKey:projectContextKey(record),builder:proposal?.builder||null,authority:'personal-guidance',learning:{status:research.sources.length?'private-evidence':'needs-evidence',publication:'not-published',sourceUrls:research.sources.map(s=>s.url),checkedAt:research.checkedAt}}};
}
