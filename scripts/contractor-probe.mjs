// Bounded live reasoning probes, not a product readiness score or HTTP end-to-end test.
// Run on the application host; credentials never leave its environment.
import {companionInstructions} from '../lib/companion-profile.mjs';
import {engineContext,engineDecision} from '../lib/project-engine.mjs';
import {researchInstructions,researchFormat,researchEvidence} from '../lib/advice-research.mjs';
import {foundationContext} from '../lib/diy-knowledge.mjs';
import {directSafetyResponse,safetyDecision,constrainSafetyResult} from '../lib/safety-policy.mjs';
import {contractorScenarios as scenarios} from './contractor-scenarios.mjs';
const start=Number(process.argv[2]||0),count=Number(process.argv[3]||1);
if(!Number.isInteger(start)||!Number.isInteger(count)||start<0||count<1||count>6||start+count>scenarios.length)throw Error('Choose a valid start and count 1..6 within '+scenarios.length+' probes.');
if(!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL)throw Error('Run on a configured Kitsley host. Do not paste credentials into this script.');
for(const [domain,question,expectation] of scenarios.slice(start,start+count)){
 const record={request:question,safetyFacts:{location:'Ontario, Canada'}},local=directSafetyResponse(question);
 try{
  if(local){console.log(JSON.stringify({domain,question,expectation,mode:'deterministic-safety-response',answer:local}));continue;}
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:AbortSignal.timeout(90000),headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL,store:false,max_output_tokens:4000,tools:[{type:'web_search',search_context_size:'medium'}],tool_choice:'required',include:['web_search_call.action.sources'],text:{format:researchFormat(null,{assessmentRequired:true})},instructions:companionInstructions+' '+researchInstructions+' PROJECT ENGINE: '+JSON.stringify(engineContext(record,question))+' FOUNDATION: '+JSON.stringify(foundationContext(question,record))+' You are Kitsley, a concise DIY project assistant. Answer the actual question with one useful next action. Ask at most one consequential question, not something already answered. Text at most 150 words. Do not invent specifications, claim to update drawings or approve a safe load. No invasive electrical, gas, structural or hazardous-material procedures.',input:[{role:'user',content:question}]})});
  if(!response.ok)throw Error('API HTTP '+response.status);
  const data=await response.json();if(data.status==='incomplete')throw Error('Incomplete response');
  const raw=JSON.parse(data.output?.flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n'));
  const research=researchEvidence(data,raw.research,{required:true});
  const answer=constrainSafetyResult(engineDecision({record,question,raw,result:{text:raw.text},research}),safetyDecision(record,question));
  console.log(JSON.stringify({domain,question,expectation,mode:'core-engine-probe-not-http-flow',model:data.model,responseId:data.id,usage:data.usage,answer:{text:answer.text,research:answer.research,technicalAssessment:answer.technicalAssessment||null,phase:answer.engine?.phase},rawText:raw.text,rawAssessment:raw.technicalAssessment}));
 }catch(e){console.log(JSON.stringify({domain,question,status:'failed-to-evaluate',error:e.message}));process.exitCode=1;}
}
