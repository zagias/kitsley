'use client';
import {restoreAssessment} from '../lib/technical-assessment.mjs';
import './foundation.css';
const labels={established:'Source found','needs-details':'To check',conflicting:'Conflict','not-applicable':'Not needed'};
export default function TechnicalAssessment({assessment:raw,onAnswer,busy}){
 const assessment=restoreAssessment(raw);if(!assessment)return null;
 const relevant=assessment.checks.filter(c=>c.status!=='not-applicable');
 return <section className="technical-assessment" aria-label="Project decisions"><span className="assessment-status">{assessment.stage==='ready-for-planning'?'Ready for planning · design still to validate':'Let’s work out the details'}</span><h3>{assessment.summary}</h3><div className="assessment-checks">{relevant.slice(0,4).map(c=><Check key={c.topic} check={c}/>)}{relevant.length>4&&<details><summary>More project checks <span>{relevant.length-4}</span></summary>{relevant.slice(4).map(c=><Check key={c.topic} check={c}/>)}</details>}</div>{assessment.question&&<div className="assessment-question"><strong>{assessment.question}</strong>{onAnswer&&assessment.choices.length>0&&<div className="decision-options">{assessment.choices.map(c=><button key={c} disabled={busy} onClick={()=>onAnswer(c)}>{c} →</button>)}</div>}</div>}</section>;
}
function Check({check:c}){return <details><summary><strong>{c.topic}</strong><span>{labels[c.status]}</span></summary><p>{c.finding}</p>{c.references.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>)}</details>;}
