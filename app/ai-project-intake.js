'use client';
import {useEffect,useRef,useState} from 'react';
import BrandMark from './brand-mark';
export default function AIProjectIntake({record,onUpdate,onNavigate,onGuided}){
 const [text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const started=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 async function ask(answer){
  if(busy)return;setBusy(true);setError('');
  const messages=answer?[...record.messages,{role:'user',content:answer}]:record.messages;
  try{
   const response=await fetch('/api/conversation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({guideId:record.guideId,intake:true,messages:[{role:'user',content:record.request},...messages.slice(-10)]})});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Please try again.');
   if(alive.current){onUpdate({...record,messages:[...messages,{role:'assistant',content:data.text}],urgent:!!data.urgent,discovery:data.discovery||null,briefConfirmed:false,updatedAt:new Date().toISOString()});setText('');}
  }catch(e){if(alive.current)setError(e.message);}finally{if(alive.current)setBusy(false);}
 }
 useEffect(()=>{if(!started.current){started.current=true;if(!record.messages.length)ask();}},[]);
 const discovery=record.discovery;
 const developed=discovery?.briefReady===true&&record.briefConfirmed===true;
 return <section className="conversation-workspace focused-conversation"><div className="conversation-heading"><div><span className="entry-kicker">LET’S SHAPE YOUR PROJECT</span><h1>{record.title||record.request}</h1></div><span className="local-save">Saved on this device</span></div>
 <div className="ai-intake-thread">{record.messages.map((m,i)=><div key={i} className={m.role==='assistant'?'latest-project-reply':'conversation-user'}>{m.role==='assistant'&&<BrandMark/>}<p style={{whiteSpace:'pre-wrap'}}>{m.content}</p></div>)}{busy&&<p role="status">Kitsley is working out your next step…</p>}</div>
 {error&&<div role="alert"><p className="error">{error}</p><button className="secondary" disabled={busy} onClick={()=>ask(text.trim()||undefined)}>Try again</button></div>}
 {discovery?.choices?.length>0&&!busy&&<div className="reply-options" aria-label="Suggested replies">{discovery.choices.map(choice=><button key={choice} onClick={()=>ask(choice)}>{choice}</button>)}</div>}
 {discovery?.briefReady&&!busy&&<section className="project-detail" aria-label="Your project brief"><h2>Your project brief</h2><ul>{discovery.facts.map(f=><li key={f}>{f}</li>)}</ul>{discovery.unknowns.length>0&&<><h3>Still to work out</h3><ul>{discovery.unknowns.map(f=><li key={f}>{f}</li>)}</ul></>}{!record.briefConfirmed&&<><button className="primary" onClick={()=>onUpdate({...record,briefConfirmed:true})}>Yes, that’s my project</button><p className="small">Something off? Tell me what to change below.</p></>}</section>}
 <form className="project-composer followup-composer" onSubmit={e=>{e.preventDefault();if(text.trim())ask(text.trim());}}><label className="sr-only" htmlFor="intake-reply">Tell Kitsley about your project</label><textarea id="intake-reply" rows="2" value={text} maxLength={2000} placeholder="Tell me a little more…" onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form.requestSubmit();}}}/><div><span>Free advice & project discovery</span><button className="primary" disabled={busy||!text.trim()}>{busy?'Thinking…':'Send ↑'}</button></div></form>
 {developed&&<section className="project-detail"><h2>Turn your brief into a plan.</h2><p>Kitsley Plus is planned to add custom guidance, drawings for supported projects, and a shopping list checked against your toolbox.</p><button className="primary" onClick={()=>onNavigate('/offers')}>Explore Kitsley Plus →</button><p className="small">Subscription preview. Checkout is not live. Drawings are currently limited to supported designs and still need construction review.</p></section>}
 {record.guideId&&<button className="text-button" onClick={onGuided}>Open related guide & project tools →</button>}
 </section>;
}
