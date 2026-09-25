import {isAppOrigin} from '../../../lib/request-origin.mjs';
import {validateSearch,normalizeResults,retailerPrompt} from '../../../lib/retailer-search.mjs';
import {mutateStore} from '../../../lib/store.mjs';
export const runtime='nodejs';
const active=()=>process.env.KITSLEY_AI_ENABLED==='true'&&!!process.env.OPENAI_API_KEY;
export async function GET(){return Response.json({enabled:active(),mode:'web-listed'},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request){
 if(!isAppOrigin(request))return Response.json({error:'Please search from Kitsley.'},{status:403});
 if(!active())return Response.json({error:'Retailer search is not connected on this server. Use the live Kitsley site.'},{status:503});
 let q;try{const raw=await request.text();if(raw.length>3000)throw Error('Search is too long.');q=validateSearch(JSON.parse(raw));}catch(e){return Response.json({error:e.message||'Check your search details.'},{status:400});}
 const allowed=await mutateStore(s=>{const day=new Date().toISOString().slice(0,10);if(s.retailerBudget?.day!==day)s.retailerBudget={day,used:0};const limit=Math.min(50,Math.max(1,Number(process.env.KITSLEY_RETAILER_DAILY_LIMIT)||10));if(s.retailerBudget.used>=limit)return false;s.retailerBudget.used++;return true;});
 if(!allowed)return Response.json({error:'Today’s retailer-search preview allowance is used. Saved results and retailer links still work.'},{status:429});
 try{
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:AbortSignal.timeout(24000),headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_RETAILER_MODEL||process.env.OPENAI_MODEL,store:false,max_output_tokens:2400,tools:[{type:'web_search',search_context_size:'medium',user_location:{type:'approximate',country:q.country,...(q.location?{city:q.location}:{})}}],tool_choice:'required',include:['web_search_call.action.sources'],input:retailerPrompt(q)})});
  if(!response.ok){console.error('Retailer provider status',response.status);throw Error('provider');}const data=await response.json();if(data.status==='incomplete')throw Error('incomplete');
  return Response.json(normalizeResults(data,q),{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e.name==='TimeoutError'?'The search took too long. Try a more specific product or one retailer.':'Retailer search could not finish. Try a specific brand or model in a moment.'},{status:502});}
}
