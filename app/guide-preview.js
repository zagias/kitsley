'use client';
import {useState} from 'react';
import {manualFor} from '../lib/guide-manuals.mjs';
import {categories} from '../lib/library.mjs';
import PackKit from './pack-kit';
import IllustratedGuide,{ManualSources} from './illustrated-guide';
import {readiness} from '../lib/readiness.mjs';
export default function GuidePreview({entry,owned,onToggleOwned,onStart,onBack,onSave,isSaved}){
 const [options,setOptions]=useState({surface:'unknown'});
 const manual=manualFor(entry.id,options);let kit={items:[],blocked:true};try{kit=readiness(entry,owned,entry.id==='planter'?'solid':'plywood');}catch{}
 return <section className="guide-preview guide-preview-visual"><a className="quiet-link" href="/library" onClick={e=>{e.preventDefault();onBack();}}>← Library</a><header className="guide-preview-heading"><div><p className="page-kicker">{categories.find(c=>c.id===entry.category)?.name} · {manual?.label||'Guide'}</p><h1>{entry.title}</h1><p className="intro">{entry.summary}</p></div><div className="guide-action-row"><button className="primary" onClick={()=>onStart(options)}>Start my project →</button><button className="text-button" aria-pressed={isSaved} onClick={onSave}>{isSaved?'✓ Saved':'Save guide'}</button></div></header>
 {manual?<><IllustratedGuide key={entry.id} id={entry.id} options={options} onOptionsChange={setOptions} stop={entry.stop}/>{!kit.blocked&&kit.items.length>0&&<details className="guide-manual-disclosure"><summary>Check my toolbox <span>{kit.covered} of {kit.items.length} owned</span></summary><PackKit items={kit.items} owned={owned} onToggleOwned={onToggleOwned} scope={kit.scope}/></details>}<ManualSources manual={manual} entry={entry}/></>:<p>{entry.observe}</p>}
 </section>;
}
