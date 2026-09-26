'use client';
import {mergeStepAdvice} from '../lib/workshop-advice.mjs';
import {proposeChange} from '../lib/project-actions.mjs';
import {workshopModel} from '../lib/bookcase-workshop.mjs';
import {conversationMessages} from '../lib/bookcase-ai-context.mjs';
import {syncNow} from '../lib/account-storage.mjs';
import {beginSetup,answerSetup,setupQuestion,setupFlow,freeAllowance} from '../lib/project-intake-flow.mjs';
import {setupLabels} from '../lib/journey.mjs';
import {projectAccess} from '../lib/plans.mjs';
import {urgentIntent} from '../lib/conversation.mjs';
import Account from './account';
import ProjectHeader from './project-header';
import BrandMark from './brand-mark';
import {useEffect,useRef,useState} from 'react';
export default function AIProjectIntake({record,onUpdate,onNavigate,aiEnabled=true,embedded=false,owned=[],onDesignProposal}){
 const [text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[planRequired,setPlanRequired]=useState(false),[paid,setPaid]=useState(false),[signInNeeded,setSignInNeeded]=useState(false),[remaining,setRemaining]=useState(null),[signedIn,setSignedIn]=useState(null),[custom,setCustom]=useState(false);
 const latestRecord=useRef(record);latestRecord.current=record;
 const started=useRef(false),alive=useRef(true),lock=useRef(false),current=useRef(null),pendingAnswer=useRef('');
 const workshop=record.guideId==='bookcase'&&record.pack?.build?.version===1;
 const setupActive=!workshop&&record.setup?.version===1&&!!setupQuestion(record),q=setupActive?setupQuestion(record):null;
 const hasAdvice=record.messages.some(m=>m.source==='ai')||!!record.discovery||(!record.setup&&record.messages.length>0);
 const exhausted=!setupActive&&(planRequired||(!paid&&remaining===0)),readyForAdvice=!workshop&&record.setup&&!setupActive&&!hasAdvice;
 const latest=record.messages.filter(m=>m.role==='assistant').at(-1),discovery=record.discovery;
 async function refreshAllowance(){try{const r=await fetch('/api/billing',{cache:'no-store'});if(!r.ok)return;const d=await r.json();if(!alive.current)return;const access=!!projectAccess(d.grants||[],record.id);setSignedIn(d.signedIn);setPaid(access);setRemaining(access?null:freeAllowance(d,record.id));if(access)setPlanRequired(false);}catch{}}
 useEffect(()=>{alive.current=true;refreshAllowance();window.addEventListener('focus',refreshAllowance);return()=>{alive.current=false;window.removeEventListener('focus',refreshAllowance);};},[]);
 useEffect(()=>{if(!started.current){started.current=true;if(!record.messages.length&&!workshop)onUpdate(beginSetup(record));}},[]);
 function focusStep(){setTimeout(()=>current.current?.focus({preventScroll:true}),0);}
 async function submit(answer){
  if(lock.current)return;setError('');
  if(urgentIntent(answer)){onUpdate({...record,urgent:true,messages:[...record.messages,{role:'user',content:answer}]});return;}
  if(setupActive){try{onUpdate(answerSetup(record,answer));setText('');setCustom(false);focusStep();}catch(e){setError(e.message);}return;}
  if(workshop&&onDesignProposal&&/\b(make|change|resize|add|remove|set)\b/i.test(answer)){
   try{const proposal=proposeChange(record,answer);if(proposal?.input){workshopModel(proposal.input);onDesignProposal(proposal);setText('');return;}if(proposal?.unsupported){setError(proposal.unsupported);return;}}catch(e){setError(e.message);return;}
  }
  if(!aiEnabled)return;
  if(exhausted){setPlanRequired(true);return;}
  if(signedIn===false){setSignInNeeded(true);pendingAnswer.current=answer;return;}
  lock.current=true;setBusy(true);pendingAnswer.current=answer;
  const messages=[...record.messages,{role:'user',content:answer}];
  try{
   await syncNow();const response=await fetch('/api/conversation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:record.id,guideId:record.guideId,intake:true,briefConfirmed:record.briefConfirmed===true,workshop:workshop?{input:record.pack.input,build:record.pack.build}:undefined,messages:conversationMessages(record,messages,owned)})});
   const data=await response.json();if(!response.ok){setPlanRequired(data.code==='plan_required');setSignInNeeded(data.code==='sign_in');throw Error(data.error||'Please try again.');}
   if(alive.current){setPaid(['plus','project-pass'].includes(data.plan));if(Number.isInteger(data.freeRemaining))setRemaining(data.freeRemaining);onUpdate({...latestRecord.current,...(workshop?{stepAdvice:mergeStepAdvice({...latestRecord.current,pack:record.pack},data,answer)}:{}),messages:[...latestRecord.current.messages,{role:'user',content:answer},{role:'assistant',content:data.text,source:'ai'}],urgent:!!data.urgent,discovery:data.discovery||null,briefConfirmed:data.discovery?false:record.briefConfirmed,updatedAt:new Date().toISOString()});setText('');setCustom(false);refreshAllowance();focusStep();}
  }catch(e){if(alive.current)setError(e.message);}finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 const offer=()=>onNavigate('/offers?project='+encodeURIComponent(record.id));
 const choices=setupActive?q.choices:workshop?[]:discovery?.briefReady?[]:discovery?.choices;
 const question=setupActive?q.text:workshop?null:record.briefConfirmed?'What would you like help with next?':discovery?.briefReady?'Does this describe your project?':discovery?.question;
 const showComposer=!busy&&!exhausted&&!readyForAdvice&&!(signInNeeded||signedIn===false&&!setupActive)&&(!choices?.length||custom)&&(aiEnabled||setupActive);
 return <section className={embedded?"bc-inline-ai":"project-page conversation-page"}>{!embedded&&<ProjectHeader record={record} onNavigate={onNavigate} bookcaseHelp={workshop}/>}
 <div className="next-step-surface">
 {setupActive&&<ol className="setup-progress" aria-label="Project setup progress">{setupFlow(record).questions.map((step,i)=><li key={step.id} aria-current={q.id===step.id?'step':undefined} className={record.setup.answers[step.id]?'is-done':''}><span>{record.setup.answers[step.id]?'✓':i+1}</span>{setupLabels[step.id]}</li>)}</ol>}
 <div className="step-eyebrow"><BrandMark/><span>{setupActive?'LET’S GET THE BASICS':readyForAdvice?'YOUR STARTING POINT':'KITSLEY · YOUR NEXT STEP'}</span>{setupActive?<small>Free setup</small>:paid?<small>Your plan</small>:remaining!==null&&<small>{remaining} free {remaining===1?'reply':'replies'} left</small>}</div>
 {setupActive?<><h2 ref={current} tabIndex={-1}>{q.text}</h2>{q.id==='scope'&&<p className="step-advice">{setupFlow(record).advice}</p>}{q.hint&&<p className="step-advice">{q.hint}</p>}</>:readyForAdvice?<><h2 ref={current} tabIndex={-1}>Here’s what we’ll work with.</h2><p className="step-advice">Your project details are ready. Kitsley can use them to suggest a practical starting point.</p><dl className="brief-summary">{Object.entries(record.setup.answers).map(([id,value])=><div key={id}><dt>{setupLabels[id]}</dt><dd>{value}</dd></div>)}</dl><a className="quiet-link" href={'/project/'+record.id+'?panel=plan'} onClick={e=>{e.preventDefault();onNavigate('/project/'+record.id+'?panel=plan');}}>Edit these details</a></>:<><h2 ref={current} tabIndex={-1}>{embedded?'Ask about this step':workshop&&!hasAdvice?'What would you like help with?':'Here’s where to focus.'}</h2><div className="step-advice" style={{whiteSpace:'pre-wrap'}}>{discovery?.advice||latest?.content||(workshop?'Your dimensions, finish and current build step are included. Ask about an instruction or a change you’re considering.':'Describe what you want to do, and we’ll work out a starting point.')}</div>{discovery?.briefReady&&(record.briefConfirmed?<details className="confirmed-brief"><summary>Your confirmed brief</summary><ul className="brief-facts">{discovery.facts.map(f=><li key={f}>{f}</li>)}</ul></details>:<ul className="brief-facts">{discovery.facts.map(f=><li key={f}>{f}</li>)}</ul>)}{question&&!exhausted&&<h3 className="next-question">{question}</h3>}</>}
 {busy&&<p className="thinking-state" role="status">Kitsley is preparing your advice…</p>}
 {!busy&&!exhausted&&choices?.length>0&&<div className="decision-options" aria-label="Choose your answer">{choices.map(choice=><button key={choice} onClick={()=>submit(choice)}><span>{choice}</span><span aria-hidden="true">→</span></button>)}</div>}
 {!busy&&!exhausted&&choices?.length>0&&<button className="quiet-link custom-answer-toggle" aria-expanded={custom} onClick={()=>setCustom(v=>!v)}>{custom?'Use an option above':'Answer in my own words'}</button>}
 {!setupActive&&(signInNeeded||signedIn===false)&&!busy?<div className="signin-next"><h3>Keep your project with you</h3><p>Sign in to get your free AI advice and save this project across devices.</p><Account triggerLabel="Sign in to continue"/></div>:readyForAdvice&&!busy&&!exhausted&&aiEnabled&&<div className="step-action"><button className="primary" onClick={()=>submit('Give me a useful starting approach based on these details.')}>Get my first advice →</button><p className="small">Uses 1 AI reply. Setup hasn’t used any.</p></div>}
 {discovery?.briefReady&&!record.briefConfirmed&&!busy&&!exhausted&&<button className="secondary" onClick={()=>onUpdate({...record,briefConfirmed:true,updatedAt:new Date().toISOString()})}>Yes, that’s my project</button>}
 {error&&!planRequired&&!signInNeeded&&<div className="inline-error" role="alert"><p>{error}</p>{!setupActive&&<button className="secondary" onClick={()=>submit(pendingAnswer.current)}>Try again</button>}</div>}
 {exhausted&&!setupActive&&<section className="upgrade-next"><h3>{paid?'Your included allowance is used':'Ready for help with the whole project?'}</h3><p>{paid?'Review your plan or continue with saved guidance.':'You’ve used your free AI allowance. Continue with tailored guidance, tool checks and drawings for supported designs.'}</p><button className="primary" onClick={offer}>{paid?'Review my plan':'Choose a plan'} →</button><p className="small">Your saved advice and free guides remain available.</p></section>}
 {!aiEnabled&&!setupActive&&<div className="step-action"><p>AI is temporarily unavailable. Your details are saved, and you can use the project library.</p><button className="secondary" onClick={()=>onNavigate('/library')}>Explore free guides →</button></div>}
 {showComposer&&<form className="project-composer next-step-composer" onSubmit={e=>{e.preventDefault();if(text.trim())submit(text.trim());}}><label className="sr-only" htmlFor="intake-reply">{setupActive?q.text:'Ask Kitsley about this project'}</label><textarea id="intake-reply" autoFocus={custom} rows="2" value={text} maxLength={2000} placeholder={setupActive?'Tell me what you know. “Not sure yet” is fine.':'Ask a follow-up or tell me what to change…'} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form.requestSubmit();}}}/><div><span>{setupActive?'No AI reply used':paid?'Included in your plan':'Uses 1 AI reply'}</span><button className="primary" disabled={!text.trim()}>{setupActive?'Continue':'Ask Kitsley'} ↑</button></div></form>}
 {!setupActive&&record.messages.length>1&&<details className="conversation-record"><summary>Earlier answers & advice</summary><div>{record.messages.slice(0,-1).map((m,i)=><article key={i}><strong>{m.role==='user'?'You':'Kitsley'}</strong><p>{m.content}</p></article>)}</div></details>}
 </div>{!embedded&&<div className="project-bottom-links"><a href="/urgent" onClick={e=>{e.preventDefault();onNavigate('/urgent');}}>Urgent safety help</a>{!setupActive&&<a href="/library" onClick={e=>{e.preventDefault();onNavigate('/library');}}>Explore free guides</a>}</div>}
 </section>;
}
