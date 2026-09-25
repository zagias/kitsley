import {advisor} from '../../../lib/advisor.mjs';
import {recommend} from '../../../lib/engine.mjs';
import {readStore,recordEvent} from '../../../lib/store.mjs';
import {validateInput} from '../../../lib/validation.mjs';
export const runtime='nodejs';
export async function POST(request){
 let input;try {if(Number(request.headers.get('content-length'))>12000)return Response.json({error:'Request too large.'},{status:413});input=validateInput(await request.json());input.projectId=input.projectId||await advisor.interpret(input.description);if(!input.projectId)return Response.json({error:'I could not match that project yet. Choose a project from the list below.'},{status:422});}catch(e){return Response.json({error:e.message},{status:400});}
 try{const store=await readStore();const result=recommend(input,store.products,store.overrides);let tracking=true;try{await recordEvent('recommendation',{projectId:input.projectId,productIds:result.items.map(p=>p.id)});}catch{tracking=false;}return Response.json({...result,tracking});}catch(e){if(e.message.includes('MDF is not suitable'))return Response.json({error:e.message},{status:422});return Response.json({error:'The catalog is unavailable. Please try again.'},{status:503});}
}
