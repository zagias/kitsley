'use client';
import {useId,useState} from 'react';
import {foundationCategories,findFoundation,foundationReferences} from '../lib/diy-knowledge.mjs';
import './foundation.css';
export default function FoundationBrowser(){
 const id=useId(),[query,setQuery]=useState(''),[category,setCategory]=useState('Materials');
 const entries=findFoundation(query,{category:category||undefined,limit:20});
 return <section className="foundation-browser" aria-label="Materials and tools reference">
 <header><span className="page-kicker">KITSLEY KNOW-HOW</span><h2>Choose with a reason.</h2><p>Find the right starting point for your material, joint or tool.</p></header>
 <div className="foundation-controls"><label htmlFor={id}>Find a detail<input id={id} type="search" value={query} placeholder="Try MDF screws, glue or saw blade…" onChange={e=>{setQuery(e.target.value);setCategory('');}}/></label><label>Topic<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All topics</option>{foundationCategories.map(c=><option key={c}>{c}</option>)}</select></label></div>
 <p className="small" role="status">{entries.length?`${entries.length} reference${entries.length===1?'':'s'} · open one for the details`:'No matching reference yet. Ask Kitsley in your project with the material and product details.'}</p>
 <div className="foundation-entries">{entries.map(e=><details key={e.id} className="foundation-entry"><summary><span><small>{e.category}</small><strong>{e.title}</strong></span><span aria-hidden="true">＋</span></summary><div className="foundation-detail"><p className="small">Applies to: {e.scope}</p><ul>{e.facts.map(f=><li key={f}>{f}</li>)}</ul><div className="foundation-needed"><strong>Before choosing for your project</strong><p>{e.required.join(' · ')}</p></div><p>{e.limits.join(' ')}</p><div className="foundation-sources">{foundationReferences(e.sources).map(s=><a key={s.id} href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>)}<small>Source checked {e.checkedAt} · Selection guidance</small></div></div></details>)}</div>
 </section>;
}
