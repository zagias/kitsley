'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';

export default function useChatViewport(messageCount,busy){
 const shell=useRef(null),scrollArea=useRef(null),content=useRef(null),following=useRef(true);
 const [showLatest,setShowLatest]=useState(false);
 function followLatest(){following.current=true;setShowLatest(false);const el=scrollArea.current;if(el)el.scrollTop=el.scrollHeight;}
 function onScroll(){const el=scrollArea.current;if(!el)return;following.current=el.scrollHeight-el.scrollTop-el.clientHeight<80;setShowLatest(!following.current);}
 useLayoutEffect(()=>{if(following.current)followLatest();else setShowLatest(true);},[messageCount,busy]);
 useEffect(()=>{
  const header=document.querySelector('.header'),viewport=window.visualViewport;
  function size(){
   if(!shell.current)return;
   const offset=viewport?.offsetTop||0,top=Math.max(offset,header?.getBoundingClientRect().bottom||0);
   shell.current.style.setProperty('--chat-top',top+'px');
   shell.current.style.setProperty('--chat-height',Math.max(180,(viewport?.height||window.innerHeight)+offset-top)+'px');
   if(following.current)followLatest();
  }
  const resize=new ResizeObserver(size);if(header)resize.observe(header);
  const messages=new ResizeObserver(()=>{if(following.current)followLatest();});if(content.current)messages.observe(content.current);
  window.addEventListener('resize',size);viewport?.addEventListener('resize',size);viewport?.addEventListener('scroll',size);size();
  return()=>{resize.disconnect();messages.disconnect();window.removeEventListener('resize',size);viewport?.removeEventListener('resize',size);viewport?.removeEventListener('scroll',size);};
 },[]);
 return {shell,scrollArea,content,followLatest,onScroll,showLatest};
}
