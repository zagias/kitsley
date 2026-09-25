'use client';
import {syncNow} from '../lib/account-storage.mjs';
import {beginSetup,answerSetup,setupQuestion,freeAllowance} from '../lib/project-intake-flow.mjs';
import {projectAccess} from '../lib/plans.mjs';
import {urgentIntent} from '../lib/conversation.mjs';
import SyncStatus from './sync-status';
import Account from './account';
import {useEffect,useRef,useState} from 'react';
import BrandMark from './brand-mark';
import useChatViewport from './use-chat-viewport';
export default function AIProjectIntake({record,onUpdate,onNavigate,onGuided}){
 const [text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[planRequired,setPlanRequired]=useState(false),[paid,setPaid]=useState(false),[signInNeeded,setSignInNeeded]=useState(false);
 const [remaining,setRemaining]=useState(null);
 const setupActive=record.setup?.version===1&&!!setupQuestion(record);
 const setupNext=setupActive?setupQuestion(record):null;
 async function refreshAllowance(){try{const r=await fetch('/api/billing',{cache:'no-store'});if(!r.ok)return;const d=await r.json();if(!alive.current)return;const access=!!projectAccess(d.grants||[],record.id);setPaid(access);setRemaining(access?null:freeAllowance(d,record.id));if(access)setPlanRequired(false);}catch{}}
 const started=useRef(false),alive=useRef(true);
 const {shell,scrollArea,content,followLatest,onScroll,showLatest}=useChatViewport(record.messages.length,busy);
 useEffect(()=>{alive.current=true;refreshAllowance();const refresh=()=>refreshAllowance();window.addEventListener('focus',refresh);return()=>{alive.current=false;window.removeEventListener('focus',refresh);};},[]);
 async function ask(answer){
  if(busy)return;followLatest();setError('');
  if(answer&&urgentIntent(answer)){onUpdate({...record,urgent:true,messages:[...record.messages,{role:'user',content:answer}]});return;}
  if(setupActive){try{onUpdate(answerSetup(record,answer||''));setText('');}catch(e){setError(e.message);}return;}
  if(!paid&&(planRequired||remaining===0)){setPlanRequired(true);return;}
  setBusy(true);
  const messages=answer?[...record.messages,{role:'user',content:answer}]:record.messages;
  try{
   const response=await (await syncNow(),fetch('/api/conversation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:record.id,guideId:record.guideId,intake:true,briefConfirmed:record.briefConfirmed===true,messages:[{role:'user',content:record.request},...(record.setup? [{role:'user',content:('My project setup: '+JSON.stringify(record.setup.answers)).slice(0,2000)}]:[]),...messages.slice(-10)]})}));
   const data=await response.json();if(!response.ok){setPlanRequired(data.code==='plan_required');setSignInNeeded(data.code==='sign_in');throw Error(data.error||'Please try again.');}
   if(alive.current){setPaid(['plus','project-pass'].includes(data.plan));if(Number.isInteger(data.freeRemaining))setRemaining(data.freeRemaining);onUpdate({...record,messages:[...messages,{role:'assistant',content:data.text,source:'ai'}],urgent:!!data.urgent,discovery:data.discovery||record.discovery||null,briefConfirmed:data.discovery?false:record.briefConfirmed,updatedAt:new Date().toISOString()});setText('');refreshAllowance();}
  }catch(e){if(alive.current)setError(e.message);}finally{if(alive.current)setBusy(false);}
 }
 useEffect(()=>{if(!started.current){started.current=true;if(!record.messages.length)onUpdate(beginSetup(record));}},[]);
 const discovery=record.discovery;
 const developed=discovery?.briefReady===true&&record.briefConfirmed===true;
 return <section ref={shell} className="conversation-workspace focused-conversation ai-chat-shell"><div className="conversation-heading"><div><span className="entry-kicker">LET’S SHAPE YOUR PROJECT</span><h1>{record.title||record.request}</h1></div><span className="local-save"><SyncStatus/></span></div>
 <div ref={scrollArea} className="ai-chat-scroll" onScroll={onScroll} role="region" aria-label="Project conversation" tabIndex={0}><div ref={content}>
 <div className="ai-intake-thread">{record.messages.map((m,i)=><div key={i} className={m.role==='assistant'?'latest-project-reply':'conversation-user'}>{m.role==='assistant'&&<BrandMark/>}<p style={{whiteSpace:'pre-wrap'}}>{m.content}</p></div>)}{busy&&<p role="status">Kitsley is working out your next step…</p>}</div>
 {setupNext&&<section aria-label="Project setup"><p className="small">Free project setup · no AI replies used</p>{setupNext.hint&&<p>{setupNext.hint}</p>}{setupNext.choices&&<div className="reply-options">{setupNext.choices.map(choice=><button key={choice} disabled={busy} onClick={()=>ask(choice)}>{choice}</button>)}</div>}</section>}
 {record.setup&&!setupActive&&!record.messages.some(m=>m.source==='ai')&&!discovery&&!busy&&remaining!==0&&<button className="primary" onClick={()=>ask('Give me a useful starting approach based on these details.')}>Get advice for my project →</button>}
 {error&&!planRequired&&<div role="alert"><p className="error">{error}</p>{signInNeeded&&<Account/>}<button className="secondary" disabled={busy} onClick={()=>planRequired?onNavigate('/offers?project='+encodeURIComponent(record.id)):ask(text.trim()||undefined)}>{planRequired?'See plans →':'Try again'}</button></div>}
 {!setupActive&&!planRequired&&remaining!==0&&discovery?.choices?.length>0&&!busy&&<div className="reply-options" aria-label="Suggested replies">{discovery.choices.map(choice=><button key={choice} onClick={()=>ask(choice)}>{choice}</button>)}</div>}
 {discovery?.briefReady&&!busy&&<section className="project-detail" aria-label="Your project brief"><h2>Your project brief</h2><ul>{discovery.facts.map(f=><li key={f}>{f}</li>)}</ul>{discovery.unknowns.length>0&&<><h3>Still to work out</h3><ul>{discovery.unknowns.map(f=><li key={f}>{f}</li>)}</ul></>}{!record.briefConfirmed&&<><button className="primary" onClick={()=>onUpdate({...record,briefConfirmed:true})}>Yes, that’s my project</button><p className="small">Something off? Tell me what to change below.</p></>}</section>}

 {(developed||planRequired||remaining===0)&&!paid&&!setupActive&&<section className="project-detail"><h2>{planRequired||remaining===0?'Continue with a project plan':'Turn your brief into a plan.'}</h2>{(planRequired||remaining===0)&&<p>Your free AI allowance is used. Your saved advice, toolbox and project library remain available.</p>}<p>Choose a Project Pass for this job or Plus for regular projects. Get tailored follow-up help and retailer comparisons; drawings are available for supported designs.</p><button className="primary" onClick={()=>onNavigate('/offers?project='+encodeURIComponent(record.id))}>See plans →</button><p className="small">Check available outputs and allowances before choosing a plan.</p></section>}
 {record.guideId&&<button className="text-button" onClick={onGuided}>Open related guide & project tools →</button>}
 </div></div>
 {showLatest&&<button className="chat-jump-latest secondary" onClick={followLatest}>Latest reply ↓</button>}
 {!setupActive&&(planRequired||remaining===0)&&!paid?<div className="project-composer"><button className="primary" onClick={()=>onNavigate('/offers?project='+encodeURIComponent(record.id))}>Choose a plan to continue →</button><button className="text-button" onClick={()=>onNavigate('/library')}>Keep exploring free guides</button><button className="text-button" onClick={()=>onNavigate('/urgent')}>Urgent safety help</button></div>:<form className="project-composer followup-composer" onSubmit={e=>{e.preventDefault();if(text.trim())ask(text.trim());}}><label className="sr-only" htmlFor="intake-reply">Tell Kitsley about your project</label><textarea id="intake-reply" rows="2" value={text} maxLength={2000} placeholder="Tell me a little more…" onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form.requestSubmit();}}}/><div><span>{setupActive?'Free project setup':paid?'Your plan includes AI help':remaining===null?'Sign in for your free AI allowance':remaining+' free AI replies remaining'}</span><button className="primary" disabled={busy||!text.trim()}>{busy?'Thinking…':'Send ↑'}</button></div></form>}
 </section>;
}
