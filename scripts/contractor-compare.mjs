// Bounded operator evaluation. No production model or customer data is mutated.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const start=Number(process.argv[2]||0),count=Number(process.argv[3]||1),benchmark=process.env.KITSLEY_BENCHMARK_MODEL||'gpt-6-astra';
if(!Number.isInteger(start)||!Number.isInteger(count)||start<0||count<1||count>6||start+count>6)throw Error('Choose a start and count within the six pilot probes; maximum twelve model calls.');
if(!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL)throw Error('Run on a configured Kitsley host.');
if(!/^gpt-6(?:[.-]|$)/.test(benchmark))throw Error('This comparison requires GPT-6. No silent substitute is allowed.');
const catalog=await fetch('https://api.openai.com/v1/models',{signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY}});
if(!catalog.ok)throw Error('Cannot verify benchmark model access: HTTP '+catalog.status);
const models=(await catalog.json()).data||[];
if(!models.some(m=>m.id===benchmark))throw Error('GPT-6 comparison blocked: configured benchmark model is not available to this API account.');
const probe=fileURLToPath(new URL('./contractor-probe.mjs',import.meta.url));
async function run(model,index){return new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[probe,String(index),'1'],{env:{...process.env,OPENAI_MODEL:model},stdio:['ignore','pipe','pipe']});let output='';
 const timer=setTimeout(()=>child.kill('SIGTERM'),110000);
 child.stdout.on('data',chunk=>{output+=chunk;if(output.length>250000)child.kill('SIGTERM');});
 child.stderr.on('data',()=>{}); // Do not accidentally forward environment or credential diagnostics.
 child.on('error',error=>{clearTimeout(timer);reject(error);});
 child.on('close',code=>{clearTimeout(timer);try{const lines=output.trim().split('\n').filter(Boolean);if(code!==0||lines.length!==1)throw Error('Probe execution failed; no score assigned.');const result=JSON.parse(lines[0]);if(result.status==='failed-to-evaluate')throw Error(result.error);resolve(result);}catch(e){reject(e);}});
 });}
console.log(JSON.stringify({kind:'comparison-start',appModel:process.env.OPENAI_MODEL,benchmark,start,count,automaticGrade:false,scope:'Six pilot core-engine probes, not the full contractor or browser benchmark.'}));
for(let index=start;index<start+count;index++){
 try{
  const baseline=await run(process.env.OPENAI_MODEL,index),reference=await run(benchmark,index);
  if(baseline.question!==reference.question)throw Error('Mismatched scenario inputs');
  console.log(JSON.stringify({kind:'paired-result',index,baseline,reference,review:{status:'awaiting-review',criticalError:null,practicalUsefulness:null,technicalAccuracy:null,scopeAndOntarioRules:null,pass:null}}));
 }catch(e){console.log(JSON.stringify({kind:'comparison-error',index,error:e.message,pass:null}));process.exitCode=1;}
}
