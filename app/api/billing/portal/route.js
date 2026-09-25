import {sameOrigin,authConfig} from '../../../../lib/auth.mjs';
import {billingUser,billingAccountAllowed,billingDB,billingReply,checkoutReady} from '../../../../lib/billing.mjs';
import {stripe} from '../../../../lib/stripe.mjs';
export async function POST(request){
 if(!sameOrigin(request))return billingReply({error:'Request not allowed.'},403);
 if(!checkoutReady())return billingReply({error:'Billing is not connected yet.'},503);
 const user=await billingUser();if(!user)return billingReply({error:'Sign in to manage your plan.'},401);
 if(!billingAccountAllowed(user))return billingReply({error:'Checkout is being tested privately and is not open yet.'},403);
 try{const {data,error}=await billingDB().from('billing_accounts').select('customer_id').eq('user_id',user.id).maybeSingle();if(error||!data?.customer_id)return billingReply({error:'There is no billing account to manage yet.'},404);
 const session=await stripe('billing_portal/sessions',{customer:data.customer_id,return_url:authConfig().site+'/offers'});return billingReply({url:session.url});
 }catch{return billingReply({error:'Could not open billing. Please retry.'},503);}
}
