export function sourceUrl(value){
 try{if(typeof value!=='string'||value.length>2000)return null;const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port)return null;
 const h=u.hostname.toLowerCase();if(!h.includes('.')||h==='localhost'||h.endsWith('.local')||h.endsWith('.localhost')||h.includes(':')||/^\d+(?:\.\d+){3}$/.test(h))return null;
 u.hash='';return u.href;
 }catch{return null;}
}

