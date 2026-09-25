'use client';
import SyncStatus from './sync-status';
import {projectTitle} from '../lib/journey.mjs';
export default function ProjectHeader({record,panel='conversation',onNavigate,bookcaseHelp=false}){
 const root='/project/'+encodeURIComponent(record.id);
 return <header className="project-header"><a className="quiet-link" href={bookcaseHelp?root:"/projects"} onClick={e=>{e.preventDefault();onNavigate(bookcaseHelp?root:'/projects');}}>{bookcaseHelp?'← Back to my bookcase':'← My projects'}</a><div className="project-title-line"><h1>{bookcaseHelp?'Bookcase help':projectTitle(record)}</h1><span className="small"><SyncStatus/></span></div>{!bookcaseHelp&&<nav className="section-nav" aria-label="This project">{[['conversation','Your next step'],['plan','Project details']].map(([id,label])=><a key={id} href={root+(id==='conversation'?'':'?panel='+id)} aria-current={(id==='conversation'?panel==='conversation':panel!=='conversation')?'page':undefined} onClick={e=>{e.preventDefault();onNavigate(root+(id==='conversation'?'':'?panel='+id));}}>{label}</a>)}</nav>}</header>;
}
