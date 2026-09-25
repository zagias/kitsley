import {packLibrary} from '../../lib/pack-library.mjs';
import Home from '../workspace';
import {notFound} from 'next/navigation';
import {library} from '../../lib/library.mjs';
import {projects} from '../../lib/catalog.mjs';
export default async function Page({params}){const {screen=[]}=await params;const [area,id]=screen;if(area==='project'&&(!id||!/^[-a-zA-Z0-9]{1,80}$/.test(id)))notFound();if(screen.length>2||area&&!['library','guides','toolbox','projects','urgent','plan','offers','packs','project'].includes(area)||area==='guides'&&!library.some(p=>p.id===id)||area==='plan'&&!projects.some(p=>p.id===id)||area==='packs'&&id&&!packLibrary.some(p=>p.id===id)||id&&!['guides','plan','packs','project'].includes(area))notFound();return <Home/>;}

export async function generateMetadata({params}){const {screen=[]}=await params;const [area,id]=screen;const title=area==='guides'?library.find(p=>p.id===id)?.title:area==='plan'?projects.find(p=>p.id===id)?.name:{project:'Your project',library:'Project library',toolbox:'My toolbox',projects:'My projects',urgent:'Urgent help',offers:'Project help & pricing',packs:'Project packs'}[area];return {title:title?'Kitsley · '+title:'Kitsley — Your home, handled.'};}
