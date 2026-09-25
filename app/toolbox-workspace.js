'use client';
import {useState} from 'react';
import {products} from '../lib/catalog.mjs';
import {starterKit,toolGroups,toolGroup} from '../lib/toolbox.mjs';
import {WorkspaceIcon} from './dashboard';
import MaterialStock from './material-stock';

export default function ToolboxWorkspace({owned,toggleOwned,addStarter,query,onQuery}){
 const [mode,setMode]=useState(query?'add':'owned'),[category,setCategory]=useState(''),[page,setPage]=useState(0);
 const currentMode=query?'add':mode;
 const filtered=products.filter(p=>(currentMode!=='owned'||owned.includes(p.id))&&(!category||toolGroup(p)===category)&&(!query||(p.name+' '+p.category).toLowerCase().includes(query.toLowerCase())));
 const pageCount=Math.ceil(filtered.length/8),safePage=Math.min(page,Math.max(0,pageCount-1));
 function switchMode(next){setMode(next);setCategory('');setPage(0);onQuery('');}
 const categoryName=toolGroups.find(g=>g[0]===category)?.[1];
 return <section className="inner-page compact-toolbox">
  <div className="toolbox-heading"><div><h1>My toolbox</h1><p>Keep track of what you have. We’ll check it for every project.</p></div><button className="primary" onClick={()=>switchMode('add')}>＋ Add items</button></div>
  <div className="toolbox-switch" aria-label="Toolbox views">{[['owned','My items'],['add','Find items'],['materials','My materials']].map(([id,label])=><button key={id} aria-pressed={currentMode===id} onClick={()=>switchMode(id)}>{label}{id==='owned'&&owned.length>0?<span>{owned.length}</span>:null}</button>)}</div>
  {currentMode==='materials'?<><p className="toolbox-hint">Keep useful sheets and offcuts for your next build.</p><MaterialStock/></>:<>
   {currentMode==='add'&&<label className="toolbox-search">What do you have?<input autoFocus type="search" placeholder="Find a drill, tape measure, screws…" value={query} onChange={e=>{onQuery(e.target.value);setCategory('');setPage(0);}}/></label>}
   {currentMode==='add'&&!query&&!category?<>
    <details className="toolbox-starter"><summary>Start with an everyday kit <span>8 essentials ＋</span></summary><p>{products.filter(p=>starterKit.includes(p.id)).map(p=>p.name).join(', ')}.</p><button className="secondary" onClick={()=>{addStarter();switchMode('owned');}}>I own these 8 items</button></details>
    <p className="toolbox-hint">Or choose a category</p><div className="toolbox-categories">{toolGroups.map(([id,name,icon])=><button key={id} onClick={()=>{setCategory(id);setPage(0);}}><WorkspaceIcon name={icon}/><span>{name}</span><span aria-hidden="true">↗</span></button>)}</div>
   </>:<>
    <div className="toolbox-list-heading">{category?<button onClick={()=>{setCategory('');setPage(0);}}>← All categories</button>:<h2>{currentMode==='owned'?'What you have':'Search results'}</h2>}<span role="status">{filtered.length} items</span></div>
    {category&&<h2>{categoryName}</h2>}
    {filtered.length===0?<div className="toolbox-empty"><WorkspaceIcon name="tools"/><h2>{currentMode==='owned'?'Let’s build your toolbox.':'No items found.'}</h2><p>{currentMode==='owned'?'Add the tools and supplies you already own. We’ll help you avoid buying them twice.':'Try a shorter name, such as “drill” or “screws”.'}</p>{currentMode==='owned'&&<button className="primary" onClick={()=>switchMode('add')}>Add my first items →</button>}</div>:<div className="toolbox-items">{filtered.slice(safePage*8,safePage*8+8).map(p=><button key={p.id} className={owned.includes(p.id)?'is-owned':''} aria-pressed={owned.includes(p.id)} aria-label={`${p.name}: ${owned.includes(p.id)?'owned, tap to remove':'add to my items'}`} onClick={()=>toggleOwned(p.id)}><WorkspaceIcon name={toolGroups.find(g=>g[0]===toolGroup(p))?.[2]}/><span>{p.name}</span><span className="toolbox-item-action">{owned.includes(p.id)?'✓ Owned':'+ Add'}</span></button>)}</div>}
    {pageCount>1&&<div className="toolbox-pagination"><button disabled={safePage===0} onClick={()=>setPage(safePage-1)}>← Previous</button><span>Page {safePage+1} of {pageCount}</span><button disabled={safePage===pageCount-1} onClick={()=>setPage(safePage+1)}>Next →</button></div>}
   </>}
  </>}
  <p className="toolbox-footnote">Saved on this device · Project lists update automatically.</p>
 </section>;
}
