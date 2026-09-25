import {billingUser,billingAccountAllowed,billingTestMode,billingDB,billingReply,checkoutReady,grantsFor,billingEnabled} from '../../../lib/billing.mjs';
import {plans,liveGrants} from '../../../lib/plans.mjs';
export async function GET(){
 const user=await billingUser();
 if(!checkoutReady()||!billingAccountAllowed(user))return billingReply({ready:false,enforced:billingEnabled(),signedIn:!!user,plans});
 if(!user)return billingReply({ready:true,enforced:true,signedIn:false,plans,grants:[],usage:[]});
 try{const db=billingDB(),grants=await grantsFor(db,user.id);const {data:usage,error}=await db.from('billing_usage').select('bucket,feature,project_id').eq('user_id',user.id).gte('created_at',new Date(Date.now()-62*86400000).toISOString());if(error)throw error;
 const {data:account,error:accountError}=await db.from('billing_accounts').select('customer_id').eq('user_id',user.id).maybeSingle();if(accountError)throw accountError;
 return billingReply({ready:true,testMode:billingTestMode(),enforced:true,signedIn:true,plans,grants:liveGrants(grants),usage,portal:!!account?.customer_id});
 }catch{return billingReply({error:'Plans are temporarily unavailable. Please retry.'},503);}
}
