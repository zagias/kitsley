import {workshopModel,workshopOptions,workshopTools,workshopSupplies,workshopSteps,workshopVersion} from './bookcase-workshop.mjs';
import {workshopArt} from './bookcase-workshop-art.mjs';
import {foundationVersion} from './diy-knowledge.mjs';
import {researchVersion} from './advice-research.mjs';
import {technicalAssessment} from './technical-assessment.mjs';

export const engineVersion='kitsley-project-engine-1';
export const engineCapabilities={
 explain:{scope:'All topics, subject to evidence and required facts',authority:'personal-guidance'},
 research:{scope:'Primary-source comparison, material and method assessment',authority:'provisional-evidence'},
 design:{'bookcase.uniform-panels.v1':{scope:'Existing indoor uniform-shelf bookcase within its dimensional and material limits',checks:['dimensional consistency','part quantities','artifact consistency'],excludes:['load certification','novel joints','individual shelf shapes','pet containment','wall-hung or structural use']}},
 learn:{scope:'Private project evidence and anonymous recurring-topic counts',authority:'candidate-only',automaticPublication:false}
};
const keys=['width','height','depth','thickness','shelves','material','edgeThickness'];
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
export function projectContextKey(record={}){
 // Exact context, not a fuzzy/semantic match. Different constraints invalidate a proposal.
 return JSON.stringify(canonical({engineVersion,foundationVersion,researchVersion,id:record.id,guide:record.guideId,request:record.request,answers:record.answers,setup:record.setup,notes:record.notes,clarifications:record.clarifications,input:record.pack?.input,build:record.pack?.build,stepAdvice:record.stepAdvice}));
}
export function engineContext(record={}){
 return {version:engineVersion,capabilities:engineCapabilities,project:{guide:record.guideId||null,request:String(record.request||'').slice(0,2000),facts:record.setup?.answers||record.answers||{},clarifications:(record.clarifications||[]).slice(-10),dimensions:record.pack?.input||null,currentStep:record.pack?.build?.active??null},previousAssessment:record.technicalAssessment||null,rule:'Explain and research are not permission to manufacture. Only registered deterministic builders can create dimensioned artifacts. Missing evidence or an unsupported operation stays a proposal.'};
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
 if(byId.A.length!==model.height||byId.B.length+2*model.thickness!==model.width||byId.C.length!==byId.B.length||byId.D.length!==model.height||byId.D.width!==model.width||Math.abs(model.panelDepth+6+model.edgeThickness-model.depth)>1e-6)throw Error('The drawing and part dimensions disagree.');
 const steps=workshopSteps(model,opts);
 return {version:engineVersion,builder:workshopVersion,key:model.key,checks:{dimensions:'passed',partQuantities:'passed',constructionApproval:false,loadRating:null},model,parts,tools:workshopTools(opts,model),materials:workshopSupplies(model,opts),steps,drawings:{overview:workshopArt('overview',model,opts,'engine'),parts:workshopArt('parts',model,opts,'engine'),steps:steps.map((s,i)=>workshopArt(s.visual,model,opts,'engine-step-'+i))}};
}


export function componentRequest(question){return /\b(top|bottom|upper|lower|middle|individual|one|single)\s+(shel(?:f|ves)|panel|side)\b|\b(tapered|taper|stepped|angled|dog|pet|cage|crate|aquarium|seat|bench|wall[- ]hung)\b/i.test(question.replace(/\b(?:add|remove) (?:a|one) shelf\b/gi,''));}
export function compileProposal(record,operation,question=''){
 if(!operation)return null;
 if(record?.guideId!=='bookcase'||record?.pack?.build?.version!==1||operation.builder!=='bookcase.uniform-panels.v1'||operation.target!=='whole-design'||componentRequest(question))return {status:'unsupported',reason:'This request needs a different design operation. The existing drawing has not changed.'};
 const patch={};for(const [k,v] of Object.entries(operation.changes||{})){if(!keys.includes(k))return {status:'unsupported',reason:'That design property is not supported.'};if(v!==null)patch[k]=v;}
 try{
  const input={...record.pack.input,...patch},bundle=compileBookcase(input,record.pack.build.options);
  const changes=Object.keys(patch).filter(k=>input[k]!==record.pack.input[k]).map(k=>({key:k,before:record.pack.input[k],after:input[k]}));
  if(!changes.length)return null;
  return {status:'review',builder:operation.builder,baseContext:projectContextKey(record),input,changes,checks:bundle.checks,partCount:bundle.model.partCount,reason:String(operation.reason||'Review this change before applying it.').slice(0,400)};
 }catch(e){return {status:'unsupported',reason:e.message};}
}
export function proposalCurrent(record,proposal){return proposal?.status==='review'&&proposal.baseContext===projectContextKey(record);}

export function engineDecision({record={},question='',raw={},result,research}){
 const assessment=technicalAssessment(raw.technicalAssessment,research);
 const proposal=research.status==='supported'?compileProposal(record,raw.designOperation,question):null;
 const blocked=research.status!=='supported'||assessment?.stage==='needs-checking'||proposal?.status==='unsupported';
 const phase=blocked?'needs-checking':proposal?.status==='review'?'review-design':assessment?'planning':'guidance';
 return {...result,stepUpdates:blocked||proposal?[]:result.stepUpdates||[],research,technicalAssessment:assessment,designProposal:proposal,engine:{version:engineVersion,phase,contextKey:projectContextKey(record),builder:proposal?.builder||null,authority:'personal-guidance',learning:{status:research.sources.length?'private-evidence':'needs-evidence',publication:'not-published',sourceUrls:research.sources.map(s=>s.url),checkedAt:research.checkedAt}}};
}
