import {companionFromEntities} from './companion-profile.mjs';
import {createClient} from '@supabase/supabase-js';
import {validProjectId} from './plans.mjs';
export const billingEnabled=()=>process.env.BILLING_ENABLED==='true';
export const checkoutReady=()=>billingEnabled()&&!!(process.env.STRIPE_SECRET_KEY&&process.env.STRIPE_WEBHOOK_SECRET&&process.env.STRIPE_PRICE_PROJECT_PASS&&process.env.STRIPE_PRICE_PLUS&&process.env.SUPABASE_SECRET_KEY);
export const billingTestMode=()=>process.env.STRIPE_MODE!=='live';
export const billingAccountAllowed=user=>!!user?.id;
export function billingDB(){if(!process.env.SUPABASE_SECRET_KEY||!process.env.SUPABASE_URL)throw Error('Billing database unavailable');return createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function billingUser(){const {authClient}=await import('./auth.mjs');const client=await authClient();if(!client)return null;const {data,error}=await client.auth.getUser();return error?null:data.user;}
async function ownedContext(db,userId,projectId){
 if(!validProjectId(projectId))return null;
 const {data,error}=await db.from('account_workspaces').select('entities').eq('user_id',userId).maybeSingle();if(error)throw error;
 const project=data?.entities?.['conversation:'+projectId]||null;return project?{project,companion:companionFromEntities(data.entities)}:null;
}
export async function ownedProject(db,userId,projectId){return (await ownedContext(db,userId,projectId))?.project||null;}
export async function ownsProject(db,userId,projectId){return !!await ownedProject(db,userId,projectId);}
export async function grantsFor(db,userId){const {data,error}=await db.from('billing_grants').select('*').eq('user_id',userId);if(error)throw error;return data||[];}
export const billingReply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
// All paid usage is reserved atomically before an external API call. Client counters
// and checkout return URLs are never evidence of entitlement.
export async function reserveUsage(projectId,kind){
 if(!billingEnabled())return {preview:true};
 const user=await billingUser();if(!user)return {response:billingReply({error:'Sign in to keep your free allowance and project together.',code:'sign_in'},401)};
 try{
  const db=billingDB(),context=await ownedContext(db,user.id,projectId);if(!context)return {response:billingReply({error:'Save this project to your account before continuing.',code:'sync_required'},409)};
  const {data,error}=await db.rpc('reserve_project_usage',{owner:user.id,project:projectId,feature:kind});if(error)throw error;
  if(!data.ok)return {response:billingReply({error:data.message,code:'plan_required',projectId},402)};
  return {db,user,...context,id:data.id,plan:data.plan};
 }catch{return {response:billingReply({error:'Your plan could not be checked. No allowance was used. Please retry.'},503)};}
}
export async function releaseUsage(ticket){if(!ticket?.id)return;const {error}=await ticket.db.from('billing_usage').delete().eq('id',ticket.id).eq('user_id',ticket.user.id);if(error)console.error('Billing usage release failed',ticket.id);}

export async function recordUsage(ticket,usage){if(!ticket?.id)return;const {error}=await ticket.db.from('billing_usage').update({input_tokens:Math.max(0,Number(usage?.input_tokens)||0),output_tokens:Math.max(0,Number(usage?.output_tokens)||0)}).eq('id',ticket.id);if(error)console.error('Usage metering failed',ticket.id);}

// Read the server ledger after a successful response so the third reply can show
// the purchase prompt immediately, without spending a fourth request.
export async function freeRemaining(ticket,projectId){
 if(ticket.plan!=='free')return undefined;
 const {count,error}=await ticket.db.from('billing_usage').select('id',{count:'exact',head:true}).eq('user_id',ticket.user.id).eq('project_id',projectId).eq('feature','answer').eq('bucket','free:'+new Date().toISOString().slice(0,7));
 return error?undefined:Math.max(0,3-count);
}
