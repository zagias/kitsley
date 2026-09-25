// Fetch authoritative Stripe objects: delayed/replayed events cannot extend a
// purchase or reactivate a revoked grant. Each paid invoice has one immutable grant.
export async function fulfillEvent(event,{db,stripe,env=process.env}){
 const object=event.data?.object;if(!object?.id)return;
 const check=async result=>{if(result.error)throw result.error;return result.data;};
 const accountFor=async customer=>check(await db.from('billing_accounts').select('user_id').eq('customer_id',typeof customer==='string'?customer:customer.id).maybeSingle());
 const revoke=async source=>check(await db.rpc('revoke_billing_grant',{reference:source}));
 const grant=async row=>check(await db.rpc('apply_billing_grant',{payload:row}));
 if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
  const s=await stripe('checkout/sessions/'+encodeURIComponent(object.id));
  if(s.mode!=='payment'||s.payment_status!=='paid'||s.metadata?.plan!=='project-pass')return;
  const account=await accountFor(s.customer);if(!account||account.user_id!==s.metadata.kitsley_user)throw Error('Payment account mismatch');
  const lines=await stripe('checkout/sessions/'+encodeURIComponent(s.id)+'/line_items');
  if(lines.data.length!==1||lines.data[0].price?.id!==env.STRIPE_PRICE_PROJECT_PASS||lines.data[0].quantity!==1)throw Error('Unexpected purchase');
  const pi=await stripe('payment_intents/'+encodeURIComponent(s.payment_intent)+'?expand[]=latest_charge');
  const charge=pi.latest_charge;if(!charge||charge.refunded||charge.amount_refunded>0||charge.disputed){await revoke(s.payment_intent);return;}
  if(!s.metadata.project_id)throw Error('Missing project');
  const start=charge.created*1000;
  await grant({id:s.id,user_id:account.user_id,plan:'project-pass',project_id:s.metadata.project_id,starts_at:new Date(start).toISOString(),ends_at:new Date(start+30*86400000).toISOString(),active:true,source_id:s.payment_intent});
 }
 if(event.type==='invoice.paid'){
  const invoice=await stripe('invoices/'+encodeURIComponent(object.id));
  if(invoice.status!=='paid')return;
  const subId=invoice.parent?.subscription_details?.subscription||invoice.subscription;if(!subId)return;
  const subscription=await stripe('subscriptions/'+encodeURIComponent(subId));
  if(!['active','trialing'].includes(subscription.status))return;
  const account=await accountFor(subscription.customer);if(!account||subscription.metadata?.kitsley_user!==account.user_id)throw Error('Subscription account mismatch');
  const item=subscription.items.data.find(i=>i.price.id===env.STRIPE_PRICE_PLUS);if(!item)return;
  const line=invoice.lines.data.find(l=>(l.pricing?.price_details?.price||l.price?.id)===env.STRIPE_PRICE_PLUS);
  if(!line||line.period.end<=line.period.start||line.period.end*1000<=Date.now())return;
  const payments=await stripe('invoice_payments?invoice='+encodeURIComponent(invoice.id)+'&limit=100');
  for(const payment of payments.data){if(payment.payment?.type==='payment_intent'){const pi=await stripe('payment_intents/'+encodeURIComponent(payment.payment.payment_intent)+'?expand[]=latest_charge');if(pi.latest_charge?.refunded||pi.latest_charge?.amount_refunded>0||pi.latest_charge?.disputed)return;}}
  // Only the currently paid subscription period; old invoices must not add quotas.
  if(line.period.start!==item.current_period_start||line.period.end!==item.current_period_end)return;
  await grant({id:invoice.id,user_id:account.user_id,plan:'plus',project_id:null,starts_at:new Date(line.period.start*1000).toISOString(),ends_at:new Date(line.period.end*1000).toISOString(),active:true,source_id:subId});
 }
 if(['customer.subscription.updated','customer.subscription.deleted'].includes(event.type)){
  const s=await stripe('subscriptions/'+encodeURIComponent(object.id));
  if(['canceled','incomplete_expired'].includes(s.status))await revoke(s.id);
  else if(['unpaid','paused'].includes(s.status))await check(await db.from('billing_grants').update({active:false}).eq('source_id',s.id));
 }
 if(['charge.refunded','charge.dispute.created'].includes(event.type)){
  const charge=event.type==='charge.refunded'?object:await stripe('charges/'+encodeURIComponent(object.charge));
  if(charge.payment_intent)await revoke(charge.payment_intent);
  // Subscription refunds/disputes revoke the affected invoice period only.
  const invoiceIds=[];if(charge.invoice)invoiceIds.push(charge.invoice);
  if(charge.payment_intent){const payments=await stripe('invoice_payments?payment[type]=payment_intent&payment[payment_intent]='+encodeURIComponent(charge.payment_intent)+'&limit=100');for(const p of payments.data)invoiceIds.push(p.invoice);}
  for(const invoiceId of new Set(invoiceIds))await revoke(invoiceId);
 }
}
