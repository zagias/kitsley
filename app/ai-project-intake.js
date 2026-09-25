'use client';
import {syncNow} from '../lib/account-storage.mjs';
import SyncStatus from './sync-status';
import Account from './account';
import {useEffect,useRef,useState} from 'react';
import BrandMark from './brand-mark';
import useChatViewport from './use-chat-viewport';
export default function AIProjectIntake({record,onUpdate,onNavigate,onGuided}){
 const [text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[planRequired,setPlanRequired]=useState(false),[paid,setPaid]=useState(false),[signInNeeded,setSignInNeeded]=useState(false);
 const started=useRef(false),alive=useRef(true);
 const {shell,scrollArea,content,followLatest,onScroll,showLatest}=useChatViewport(record.messages.length,busy);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 async function ask(answer){
  if(busy)return;followLatest();setBusy(true);setError('');
  const messages=answer?[...record.messages,{role:'user',content:answer}]:record.messages;
  try{
   const response=await (await syncNow(),fetch('/api/conversation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:record.id,guideId:record.guideId,intake:true,briefConfirmed:record.briefConfirmed===true,messages:[{role:'user',content:record.request},...messages.slice(-10)]})}));
   const data=await response.json();if(!response.ok){setPlanRequired(data.code==='plan_required');setSignInNeeded(data.code==='sign_in');throw Error(data.error||'Please try again.');}
   if(alive.current){setPaid(['plus','project-pass'].includes(data.plan));onUpdate({...record,messages:[...messages,{role:'assistant',content:data.text}],urgent:!!data.urgent,discovery:data.discovery||record.discovery||null,briefConfirmed:data.discovery?false:record.briefConfirmed,updatedAt:new Date().toISOString()});setText('');}
  }catch(e){if(alive.current)setError(e.message);}finally{if(alive.current)setBusy(false);}
 }
 useEffect(()=>{if(!started.current){started.current=true;if(!record.messages.length)ask();}},[]);
 const discovery=record.discovery;
 const developed=discovery?.briefReady===true&&record.briefConfirmed===true;
 return <section ref={shell} className="conversation-workspace focused-conversation ai-chat-shell"><div className="conversation-heading"><div><span className="entry-kicker">LET’S SHAPE YOUR PROJECT</span><h1>{record.title||record.request}</h1></div><span className="local-save"><SyncStatus/></span></div>
 <div ref={scrollArea} className="ai-chat-scroll" onScroll={onScroll} role="region" aria-label="Project conversation" tabIndex={0}><div ref={content}>
 <div className="ai-intake-thread">{record.messages.map((m,i)=><div key={i} className={m.role==='assistant'?'latest-project-reply':'conversation-user'}>{m.role==='assistant'&&<BrandMark/>}<p style={{whiteSpace:'pre-wrap'}}>{m.content}</p></div>)}{busy&&<p role="status">Kitsley is working out your next step…</p>}</div>
 {error&&<div role="alert"><p className="error">{error}</p>{signInNeeded&&<Account/>}<button className="secondary" disabled={busy} onClick={()=>planRequired?onNavigate('/offers?project='+encodeURIComponent(record.id)):ask(text.trim()||undefined)}>{planRequired?'See plans →':'Try again'}</button></div>}
 {discovery?.choices?.length>0&&!busy&&<div className="reply-options" aria-label="Suggested replies">{discovery.choices.map(choice=><button key={choice} onClick={()=>ask(choice)}>{choice}</button>)}</div>}
 {discovery?.briefReady&&!busy&&<section className="project-detail" aria-label="Your project brief"><h2>Your project brief</h2><ul>{discovery.facts.map(f=><li key={f}>{f}</li>)}</ul>{discovery.unknowns.length>0&&<><h3>Still to work out</h3><ul>{discovery.unknowns.map(f=><li key={f}>{f}</li>)}</ul></>}{!record.briefConfirmed&&<><button className="primary" onClick={()=>onUpdate({...record,briefConfirmed:true})}>Yes, that’s my project</button><p className="small">Something off? Tell me what to change below.</p></>}</section>}

 {developed&&!paid&&<section className="project-detail"><h2>Turn your brief into a plan.</h2><p>Choose a Project Pass for this job or Plus for regular projects. Get tailored follow-up help and retailer comparisons; drawings are available for supported designs.</p><button className="primary" onClick={()=>onNavigate('/offers?project='+encodeURIComponent(record.id))}>See plans →</button><p className="small">Check available outputs and allowances before choosing a plan.</p></section>}
 {record.guideId&&<button className="text-button" onClick={onGuided}>Open related guide & project tools →</button>}
 </div></div>
 {showLatest&&<button className="chat-jump-latest secondary" onClick={followLatest}>Latest reply ↓</button>}
 <form className="project-composer followup-composer" onSubmit={e=>{e.preventDefault();if(text.trim())ask(text.trim());}}><label className="sr-only" htmlFor="intake-reply">Tell Kitsley about your project</label><textarea id="intake-reply" rows="2" value={text} maxLength={2000} placeholder="Tell me a little more…" onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form.requestSubmit();}}}/><div><span>Project advice & next steps</span><button className="primary" disabled={busy||!text.trim()}>{busy?'Thinking…':'Send ↑'}</button></div></form>
 </section>;
}
