'use client';
import {useEffect,useRef,useState} from 'react';
import BrandMark from './brand-mark';
import {plans} from '../lib/plans.mjs';
let stripeScript;
function loadStripeScript(){
 if(window.Stripe)return Promise.resolve();
 if(!stripeScript)stripeScript=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://js.stripe.com/v3/';script.async=true;
  const timer=setTimeout(()=>{script.remove();stripeScript=null;reject(Error('The secure payment form took too long to load. Please retry.'));},20000);
  script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();stripeScript=null;reject(Error('The secure payment form could not load. Please retry.'));};document.head.appendChild(script);
 });return stripeScript;
}
export default function EmbeddedCheckout({session,plan,projectId,onClose,onActivated}){
 const dialog=useRef(null),mount=useRef(null),callbacks=useRef({onClose,onActivated});callbacks.current={onClose,onActivated};
 const [status,setStatus]=useState('loading'),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);const p=plans[plan];
 useEffect(()=>{const el=dialog.current,previous=document.activeElement,overflow=document.body.style.overflow;el.showModal();document.body.style.overflow='hidden';return()=>{el.close();document.body.style.overflow=overflow;previous?.focus?.();};},[]);
 useEffect(()=>{let disposed=false,checkout,timer;
  async function verify(count=0){
   if(disposed)return;
   try{const r=await fetch('/api/billing',{cache:'no-store'}),data=await r.json();if(r.ok&&data.grants?.some(g=>g.plan===plan&&(plan==='plus'||g.project_id===projectId))){setStatus('active');callbacks.current.onActivated();return;}}catch{}
   if(disposed)return;if(count<12)timer=setTimeout(()=>verify(count+1),1500);else setStatus('pending');
  }
  async function start(){try{setError('');setStatus('loading');await loadStripeScript();if(disposed)return;
   checkout=await window.Stripe(session.publishableKey).initEmbeddedCheckout({clientSecret:session.clientSecret,onComplete:()=>{checkout?.destroy();checkout=null;if(!disposed){setStatus('verifying');verify();}}});
   if(disposed){checkout.destroy();return;}checkout.mount(mount.current);setStatus('ready');
  }catch(e){if(!disposed){setError(e.message||'Unable to open checkout. Please retry.');setStatus('error');}}}
  start();return()=>{disposed=true;clearTimeout(timer);checkout?.destroy();};
 },[session,plan,projectId,attempt]);
 return <dialog ref={dialog} className="kitsley-checkout" aria-labelledby="checkout-title" onCancel={e=>{e.preventDefault();callbacks.current.onClose();}}>
  <header className="checkout-header"><div className="checkout-brand"><BrandMark/><strong>kitsley</strong></div><button className="checkout-close" aria-label="Close checkout" onClick={onClose}>×</button></header>
  <div className="checkout-body"><aside className="checkout-summary"><span className="eyebrow">YOUR NEXT STEP</span><h2 id="checkout-title">{p.name}</h2><p className="checkout-amount">C${p.cents/100}<small>{plan==='plus'?' / month':' once'}</small></p><p>{plan==='plus'?'Help for up to 3 projects each month.':'30 days of help for this project.'}</p><ul><li>{p.answers} AI follow-up replies</li><li>Tailored guidance and tool checks</li><li>Drawings for supported designs</li><li>{p.searches} retailer comparisons</li></ul><p className="small">{plan==='plus'?'Renews monthly. Cancel renewal any time.':'One payment. No automatic renewal.'} Prices in CAD, before applicable tax.</p>{session.testMode&&<p className="notice">Sandbox test · no real charges</p>}<p className="small checkout-security">Secure payment powered by Stripe.</p></aside>
  <section className="checkout-payment" aria-label="Secure payment"><div role="status" aria-live="polite">{status==='loading'&&<p>Loading secure checkout…</p>}{status==='verifying'&&<p>Payment received. Confirming your plan…</p>}{status==='pending'&&<><h3>Payment submitted</h3><p>Your plan is still being confirmed. Close this panel and refresh your plan status shortly.</p></>}{status==='active'&&<><h3>You’re ready to go.</h3><p>Your {p.name} is active and saved to your account.</p>{projectId?<a className="primary" href={'/project/'+encodeURIComponent(projectId)}>Continue my project →</a>:<a className="primary" href="/projects">Go to my projects →</a>}</>}</div>
   {error&&<div role="alert"><p>{error}</p><button className="secondary" onClick={()=>setAttempt(x=>x+1)}>Retry secure checkout</button></div>}<div ref={mount} hidden={['active','pending','verifying'].includes(status)}/>
  </section></div>
 </dialog>;
}
