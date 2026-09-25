import {authClient,sameOrigin} from '../../../lib/auth.mjs';
import {validateEntities} from '../../../lib/workspace-sync.mjs';
export const dynamic='force-dynamic';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
async function session(){const client=await authClient();if(!client)return {};const {data:{user},error}=await client.auth.getUser();return error?{}:{client,user};}
export async function GET(){try{const {client,user}=await session();if(!user)return reply({error:'Sign in to sync your workspace.'},401);const {data,error}=await client.from('account_workspaces').select('revision,entities,updated_at').eq('user_id',user.id).maybeSingle();if(error)throw error;return reply({userId:user.id,...(data||{revision:0,entities:{},updated_at:null})});}catch{return reply({error:'Account storage is temporarily unavailable. Your device copy is safe.'},503);}}
export async function PUT(request){
 if(!sameOrigin(request))return reply({error:'Request not allowed.'},403);
 try{const {client,user}=await session();if(!user)return reply({error:'Sign in again to sync.'},401);
  if(Number(request.headers.get('content-length'))>3_100_000)return reply({error:'Workspace exceeds the sync limit.'},413);
  const raw=await request.text();if(raw.length>3_100_000)return reply({error:'Workspace exceeds the sync limit.'},413);
  let body;try{body=JSON.parse(raw);validateEntities(body.entities);if(!Number.isSafeInteger(body.revision)||body.revision<0)throw Error('Invalid workspace version.');}catch(e){return reply({error:e.message||'Invalid workspace.'},400);}
  if(body.userId!==user.id)return reply({error:'Account changed. Reload before continuing.'},409);
  const {data,error}=await client.rpc('save_account_workspace',{expected_revision:body.revision,next_entities:body.entities});if(error)throw error;
  if(!data?.length)return reply({error:'Workspace changed on another device. Retrying.',conflict:true},409);
  return reply({userId:user.id,revision:data[0].revision,entities:data[0].entities,updated_at:data[0].updated_at});
 }catch{return reply({error:'Could not sync. Your changes remain saved on this device.'},503);}
}
