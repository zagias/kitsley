import {sameOrigin,authConfig} from '../../../../lib/auth.mjs';
import {billingUser,billingAccountAllowed,billingTestMode,billingDB,billingReply,checkoutReady,ownsProject,grantsFor} from '../../../../lib/billing.mjs';
import {plans,liveGrants} from '../../../../lib/plans.mjs';
import {stripe} from '../../../../lib/stripe.mjs';
export async function POST(request){
 if(!sameOrigin(request))return billingReply({error:'Request not allowed.'},403);
 if(!checkoutReady()||!/^pk_(test|live)_/.test(process.env.STRIPE_PUBLISHABLE_KEY||''))return billingReply({error:'Checkout is not open yet. No payment has been taken.'},503);
 const user=await billingUser();if(!user)return billingReply({error:'Sign in before choosing a plan.'},401);
 if(!billingAccountAllowed(user))return billingReply({error:'Sign in to continue to checkout.'},403);
 let body;try{const raw=await request.text();if(raw.length>1000)throw Error();body=JSON.parse(raw);if(!['plus','project-pass'].includes(body.plan))throw Error();}catch{return billingReply({error:'Choose a valid plan.'},400);}
 try{
  const db=billingDB();if(body.plan==='project-pass'&&!await ownsProject(db,user.id,body.projectId))return billingReply({error:'Open a saved project before buying its Project Pass.'},409);
  const grants=liveGrants(await grantsFor(db,user.id));
  if(grants.some(g=>g.plan===body.plan&&(g.plan==='plus'||g.project_id===body.projectId)))return billingReply({error:'You already have this plan. Continue your project or manage billing.'},409);
  const priceId=process.env[body.plan==='plus'?'STRIPE_PRICE_PLUS':'STRIPE_PRICE_PROJECT_PASS'];
  const price=await stripe('prices/'+encodeURIComponent(priceId));
  if(!price.active||price.currency!=='cad'||price.unit_amount!==plans[body.plan].cents||(body.plan==='plus'?price.recurring?.interval!=='month'||price.recurring?.interval_count!==1:!!price.recurring))throw Error('Price mismatch');
  const {data:slot,error}=await db.rpc('reserve_checkout',{owner:user.id,checkout_scope:body.plan==='plus'?'plus':'project:'+body.projectId});if(error)throw error;
  const {data:account,error:accountError}=await db.from('billing_accounts').select('customer_id').eq('user_id',user.id).single();if(accountError)throw accountError;
  const customer=account.customer_id?{id:account.customer_id}:await stripe('customers',{'metadata[kitsley_user]':user.id},'kitsley-customer-'+user.id);
  const {error:saveError}=await db.from('billing_accounts').update({customer_id:customer.id}).eq('user_id',user.id);if(saveError)throw saveError;
  if(body.plan==='plus'){
   const existing=await stripe('subscriptions?customer='+encodeURIComponent(customer.id)+'&status=all&limit=100');
   if(existing.data.some(s=>!['canceled','incomplete_expired'].includes(s.status)))return billingReply({error:'A subscription already exists. Use Manage billing to update it.'},409);
  }
  const site=authConfig().site,metadata={'metadata[kitsley_user]':user.id,'metadata[plan]':body.plan,'metadata[project_id]':body.plan==='project-pass'?body.projectId:''};
  const session=await stripe('checkout/sessions',{mode:body.plan==='plus'?'subscription':'payment',customer:customer.id,'payment_method_types[0]':'card','line_items[0][price]':priceId,'line_items[0][quantity]':'1',...metadata,...(body.plan==='plus'?{'subscription_data[metadata][kitsley_user]':user.id}:{'payment_intent_data[metadata][kitsley_user]':user.id}),ui_mode:'embedded',redirect_on_completion:'never',expires_at:String(Math.floor(Date.parse(slot.expires_at)/1000)-60),'automatic_tax[enabled]':process.env.STRIPE_AUTOMATIC_TAX==='true'?'true':'false','customer_update[address]':'auto'},'kitsley-embedded-checkout-'+slot.attempt);
  if(!session.client_secret)return billingReply({error:'This checkout has finished. Refresh your plan status before trying again.'},409);
  return billingReply({clientSecret:session.client_secret,publishableKey:process.env.STRIPE_PUBLISHABLE_KEY,testMode:billingTestMode()});
 }catch{return billingReply({error:'Checkout could not open. No plan was unlocked. Please retry shortly.'},503);}
}
