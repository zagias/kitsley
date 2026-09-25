import {billingDB} from '../../../../lib/billing.mjs';
import {stripe,verifyStripeEvent} from '../../../../lib/stripe.mjs';
import {fulfillEvent} from '../../../../lib/billing-events.mjs';
export const runtime='nodejs';
export async function POST(request){
 if(!process.env.STRIPE_WEBHOOK_SECRET)return new Response('Not configured',{status:503});
 const raw=await request.text();if(raw.length>1000000)return new Response('Too large',{status:413});
 let event;try{event=verifyStripeEvent(raw,request.headers.get('stripe-signature'),process.env.STRIPE_WEBHOOK_SECRET);}catch{return new Response('Invalid signature',{status:400});}
 if(event.livemode!==(process.env.STRIPE_MODE==='live'))return new Response('Wrong mode',{status:400});
 try{await fulfillEvent(event,{db:billingDB(),stripe});return Response.json({received:true});}catch{console.error('Billing event needs retry',event.id,event.type);return new Response('Retry required',{status:500});}
}
