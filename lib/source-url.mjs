export function sourceUrl(value){
 try{if(typeof value!=='string'||value.length>2000)return null;const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port)return null;
 const h=u.hostname.toLowerCase();if(!h.includes('.')||h==='localhost'||h.endsWith('.local')||h.endsWith('.localhost')||h.includes(':')||/^\d+(?:\.\d+){3}$/.test(h))return null;
 // Ignore attribution tokens only; product/version query parameters still identify different sources.
 for(const k of [...u.searchParams.keys()])if(/^utm_/i.test(k)||/^(?:gclid|fbclid|srsltid)$/i.test(k))u.searchParams.delete(k);
 u.hash='';return u.href;
 }catch{return null;}
}

