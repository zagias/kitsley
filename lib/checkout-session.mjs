// Reopen an existing unpaid embedded session. Let Stripe set its standard expiry
// rather than deriving a payment deadline from our shorter retry reservation.
export async function embeddedSession(stripe,params,attempt){
 const sessions=await stripe('checkout/sessions?customer='+encodeURIComponent(params.customer)+'&status=open&limit=100');
 const existing=sessions.data?.find(s=>['embedded','embedded_page'].includes(s.ui_mode)&&s.status==='open'&&s.client_secret&&s.customer===params.customer&&s.mode===params.mode&&s.metadata?.kitsley_user===params['metadata[kitsley_user]']&&s.metadata?.plan===params['metadata[plan]']&&(s.metadata?.project_id||'')===(params['metadata[project_id]']||''));
 if(existing)return existing;
 return stripe('checkout/sessions',params,'kitsley-embedded-v2-'+attempt);
}
