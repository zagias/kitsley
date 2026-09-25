'use client';
import {useId,useRef,useState} from 'react';
import {manualFor,isPaintManual,finishSurfaces,cabinetPaint,normalizeManualOptions} from '../lib/guide-manuals.mjs';
import {manualIllustration} from '../lib/manual-illustrations.mjs';
import {contentSources} from '../lib/content-sources.mjs';
export function ManualSources({manual,entry}){
 return <details className="guide-manual-disclosure"><summary>Sources & guide limits</summary><p className="small">Pictures explain the action; they are not to scale. Follow the instructions for your exact product. System planning guides need the selected design’s dimensions and fixings before building.</p>{manual.sources.map(id=><p key={id}><a href={contentSources[id].url} target="_blank" rel="noreferrer">{contentSources[id].title} ↗</a><br/><small>{contentSources[id].scope}</small></p>)}{entry?.source&&<p><a href={entry.source[1]} target="_blank" rel="noreferrer">{entry.source[0]} ↗</a></p>}{!manual.sources.length&&!entry?.source&&<p className="small">These are observation and planning checks. Obtain the instructions for the identified product before a repair or installation.</p>}</details>;
}
export default function IllustratedGuide({id,options,onOptionsChange,progress,onProgressChange,stop}){
 const [localActive,setLocalActive]=useState(0),[localOptions,setLocalOptions]=useState({surface:'unknown'});
 const fieldId=useId();
 const heading=useRef(null),frame=useRef(null),opts=normalizeManualOptions(options||localOptions),m=manualFor(id,opts);
 if(!m)return null;
 const active=Math.min(progress?.active??localActive,m.steps.length-1),step=m.steps[active],surface=finishSurfaces[opts.surface],paint=isPaintManual(id);
 function move(i){if(onProgressChange)onProgressChange({active:i});else setLocalActive(i);requestAnimationFrame(()=>{heading.current?.focus({preventScroll:true});frame.current?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});}
 function choose(surface){const next={surface};if(onOptionsChange)onOptionsChange(next);else setLocalOptions(next);}
 return <div className="guide-manual">
  {paint&&<div className="guide-surface-picker"><label htmlFor={fieldId+'-surface'}>What are you painting?</label><select id={fieldId+'-surface'} value={opts.surface} onChange={e=>choose(e.target.value)}>{Object.entries(finishSurfaces).map(([value,s])=><option value={value} key={value}>{s.label}</option>)}</select><details><summary>Help me identify the surface</summary><p>{surface.identify}</p></details></div>}
  <div className="guide-manual-toolbar"><label>Jump to a step<select aria-label="Choose a guide step" value={active} onChange={e=>move(Number(e.target.value))}>{m.steps.map((s,i)=><option value={i} key={s.title}>{i+1}. {s.title}</option>)}</select></label><span>{active+1} / {m.steps.length}</span></div>
  <article ref={frame} className="guide-manual-step" aria-labelledby={fieldId+'-step'}>
   <figure><div dangerouslySetInnerHTML={{__html:manualIllustration(step.visual,step.title+' — instructional diagram',fieldId)}}/><figcaption>Illustration · not to scale</figcaption></figure>
   <div className="guide-manual-copy"><h2 ref={heading} tabIndex={-1} id={fieldId+'-step'}>{step.title}</h2><p className="guide-manual-action">{step.action}</p>{step.caution&&<p className="guide-step-caution">{step.caution}</p>}<dl><div><dt>Have ready</dt><dd>{step.tools.join(' · ')}</dd></div><div><dt>{paint&&active===(id==='paint-cabinets'?1:3)?'Sandpaper':'Key detail'}</dt><dd>{step.spec}</dd></div></dl><div className="guide-manual-check"><span aria-hidden="true">✓</span><div><strong>Ready to move on?</strong><p>{step.check}</p></div></div>{step.more&&step.more!==step.action&&<details className="guide-step-more" key={active}><summary>More help with this step</summary><p>{step.more}</p></details>}{progress&&<label className="guide-step-complete"><input type="checkbox" checked={progress.done?.includes(active)||false} onChange={()=>onProgressChange({done:progress.done?.includes(active)?progress.done.filter(i=>i!==active):[...(progress.done||[]),active]})}/> I’ve checked this step</label>}</div>
  </article>
  <div className="guide-manual-navigation"><button className="secondary" disabled={active===0} onClick={()=>move(active-1)}>← Back</button><span aria-live="polite">{progress?`${progress.done?.length||0} of ${m.steps.length} checked`:`Step ${active+1} of ${m.steps.length}`}</span><button className={active===m.steps.length-1?'secondary':'primary'} onClick={()=>move(active===m.steps.length-1?0:active+1)}>{active===m.steps.length-1?'Back to first step':'Next step →'}</button></div>
  {paint&&<details className="guide-manual-disclosure guide-paint-buy"><summary>What paint & primer should I buy?</summary><div className="guide-paint-facts"><div><h3>Primer for your surface</h3><p>{surface.primer}</p></div><div><h3>{cabinetPaint.title}</h3><p>{cabinetPaint.description}</p><p className="small">Examples to compare; check local availability and compatibility.</p>{cabinetPaint.examples.map(([label,id])=><a key={id} href={contentSources[id].url} target="_blank" rel="noreferrer">{label} ↗</a>)}</div><div><h3>Brush or roller</h3><p>{cabinetPaint.application}</p></div><div><h3>Recoat & cure</h3><p>{cabinetPaint.timing}</p></div></div></details>}
  <details className="guide-manual-disclosure"><summary>Before you start · check this guide fits</summary><p>{m.scope}</p>{(m.stop||stop)&&<p className="guide-caution">{m.stop||stop}</p>}</details>
 </div>;
}
