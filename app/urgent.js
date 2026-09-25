'use client';
import {useId,useRef,useState} from 'react';
import {WorkspaceIcon} from './dashboard';
import {urgentTopics,emergencyNotice} from '../lib/urgent-topics.mjs';
import {manualIllustration} from '../lib/manual-illustrations.mjs';
import {safetyGuides} from '../lib/safety-guides.mjs';
export function UrgentActions({id}){
 const illustrationId=useId(),t=urgentTopics[id];if(!t)return null;
 return <><div className="urgent-focused"><figure dangerouslySetInnerHTML={{__html:manualIllustration(t.visual,t.title,illustrationId)}}/><ol>{t.actions.map(([title,body],i)=><li key={title}><span aria-hidden="true">{i+1}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol></div><details className="guide-manual-disclosure"><summary>After the immediate danger has passed</summary><p>{t.next}</p></details><details className="guide-manual-disclosure"><summary>Safety sources</summary><p className="small">Follow directions from emergency services and your utility. This guide cannot assess your home.</p>{(safetyGuides[id]?.sources||[['Canadian Red Cross · After a flood, including suspected gas leaks','https://www.redcross.ca/blog/2022/9/10-steps-to-take-after-a-flood']]).map(([label,url])=><p key={url}><a href={url} target="_blank" rel="noreferrer">{label} ↗</a></p>)}</details></>;
}
export default function Urgent(){
 const [selected,setSelected]=useState(null);const title=useRef(null);
 function choose(id){setSelected(id);requestAnimationFrame(()=>title.current?.focus());}
 return <section className="urgent-selector"><p className="page-kicker">Urgent help</p><h1 ref={title} tabIndex={-1}>{selected?urgentTopics[selected].title:'What’s happening?'}</h1><p className="urgent-callout">{emergencyNotice}</p>{selected?<><button className="quiet-link urgent-change" onClick={()=>choose(null)}>← Choose a different issue</button><UrgentActions id={selected}/></>:<div className="urgent-choices">{Object.entries(urgentTopics).map(([id,t])=><button key={id} onClick={()=>choose(id)}><span className="urgent-choice-icon"><WorkspaceIcon name={t.icon} size={26}/></span><span>{t.title}</span><span aria-hidden="true">→</span></button>)}</div>}</section>;
}
