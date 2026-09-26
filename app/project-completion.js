'use client';
import {useState} from 'react';
import {useCompanion} from './companion-profile';
import {ownedChoices} from '../lib/catalog.mjs';
import {experienceAreas} from '../lib/companion-profile.mjs';
import {cleanCompletion,completionLearning} from '../lib/project-learning.mjs';

export default function ProjectCompletion({record,designKey,areas,tools=[],owned=[],onToggleOwned,onUpdate}){
 const profile=useCompanion(),saved=cleanCompletion(record?.completionReview);
 const [editing,setEditing]=useState(false),[outcome,setOutcome]=useState(saved?.outcome||''),[practised,setPractised]=useState(saved?.areas||[]),[relationships,setRelationships]=useState(saved?.tools||{}),[promote,setPromote]=useState(false),[error,setError]=useState('');
 if(!record||!onUpdate)return null;
 const current=saved?.designKey===designKey;
 const unique=[...new Map(tools.filter(t=>ownedChoices.includes(t.id)).map(t=>[t.id,t])).values()];
 function save(){try{
  const review=cleanCompletion({version:1,eventId:saved?.eventId||crypto.randomUUID(),confirmed:true,designKey,outcome,areas:practised,tools:Object.fromEntries(unique.map(t=>[t.id,relationships[t.id]||(owned.includes(t.id)?'owned':'unused')])),completedAt:new Date().toISOString()});
  if(!review)throw Error('Choose how the project turned out.');
  const learning=completionLearning(review,profile.experience);
  // Required kit alone is never evidence of ownership. Only confirmed "owned".
  if(onToggleOwned)for(const id of learning.owned)if(!owned.includes(id))onToggleOwned(id);
  if(promote)for(const id of learning.suggestedAreas)profile.setExperience(id,'some');
  onUpdate({...record,completionReview:review,updatedAt:new Date().toISOString()});setEditing(false);setError('');
 }catch(e){setError(e.message);}}
 return <section className="project-completion"><h3>{current?'Your project experience is saved':'What did you learn on this project?'}</h3>{current&&!editing?<><p>This result contributes to your project history. Only tools you confirmed owning were added to your kit.</p><button className="quiet-link" onClick={()=>setEditing(true)}>Review or correct my experience →</button></>:<><p>Tell Kitsley what you actually did. Borrowed or rented tools stay separate from what you own.</p><label>How did it turn out?<select value={outcome} onChange={e=>setOutcome(e.target.value)}><option value="">Choose the result</option><option value="success">Completed successfully</option><option value="needs-work">Needs more work / help</option></select></label><fieldset><legend>Which work did you do yourself, including with guidance?</legend>{experienceAreas.filter(([id])=>areas.includes(id)).map(([id,label])=><label className="practice-choice" key={id}><input type="checkbox" checked={practised.includes(id)} onChange={e=>setPractised(v=>e.target.checked?[...v,id]:v.filter(x=>x!==id))}/>{label}</label>)}<p className="small">Leave work done entirely by someone else unchecked.</p></fieldset>{unique.length>0&&<details><summary>Tools used · confirm what you own</summary><div className="completion-tool-list">{unique.map(t=><label key={t.id}>{t.name}<select value={relationships[t.id]||(owned.includes(t.id)?'owned':'unused')} onChange={e=>setRelationships({...relationships,[t.id]:e.target.value})}><option value="unused">Not used / not recorded</option><option value="owned">I own it</option><option value="borrowed">Borrowed</option><option value="rented">Rented</option><option value="provided">Used by someone helping me</option></select></label>)}</div></details>}{outcome==='success'&&practised.length>0&&<label className="practice-choice"><input type="checkbox" checked={promote} onChange={e=>setPromote(e.target.checked)}/>Set these practised areas to at least “Some hands-on experience”</label>}<p className="small">This records your experience; it is not a trade qualification or a safety approval.</p><button className="primary" disabled={!outcome} onClick={save}>Save my project experience →</button>{error&&<p role="alert">{error}</p>}</>}</section>;
}
