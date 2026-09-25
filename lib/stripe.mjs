import {createHmac,timingSafeEqual} from 'node:crypto';
export function verifyStripeEvent(raw,signature,secret,now=Date.now()){
 if(!secret||!signature)throw Error('Missing signature');
 const parts=signature.split(',').map(x=>x.split('='));
 const ts=parts.find(([k])=>k==='t')?.[1];
 if(!/^\d+$/.test(ts||'')||Math.abs(now/1000-Number(ts))>300)throw Error('Expired signature');
 const expected=createHmac('sha256',secret).update(ts+'.'+raw).digest();
 if(!parts.some(([k,v])=>k==='v1'&&/^[a-f0-9]{64}$/.test(v||'')&&timingSafeEqual(Buffer.from(v,'hex'),expected)))throw Error('Invalid signature');
 return JSON.parse(raw);
}
export async function stripe(path,params=null,idempotencyKey){
 const response=await fetch('https://api.stripe.com/v1/'+path,{method:params?'POST':'GET',signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+process.env.STRIPE_SECRET_KEY,'Stripe-Version':'2025-06-30.basil',...(params?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...(idempotencyKey?{'Idempotency-Key':idempotencyKey}:{})},...(params?{body:new URLSearchParams(params)}:{})});
 const data=await response.json();if(!response.ok)throw Error('Payment provider unavailable');return data;
}
