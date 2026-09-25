import {merchants} from '../../../lib/catalog.mjs';
import {readStore,recordEvent} from '../../../lib/store.mjs';
import {validLink} from '../../../lib/validation.mjs';
export const runtime='nodejs';
export async function GET(request,{params}){
 const {id}=await params;const merchantId=new URL(request.url).searchParams.get('merchant')||'amazon';const merchant=merchants.find(m=>m.id===merchantId);
 if(!merchant)return new Response('Unknown merchant',{status:404});
 try {const store=await readStore();const product=store.products.find(p=>p.id===id&&p.enabled);if(!product)return new Response('Unknown product',{status:404});
 const affiliate=store.links[`${id}:${merchant.id}`];const destination=affiliate&&validLink(affiliate,merchant.id)?affiliate:merchant.search+encodeURIComponent(product.name);
 try{await recordEvent('click',{productId:id,merchantId:merchant.id,affiliate:!!affiliate});}catch{/* A tracking failure should not prevent navigation. */}
 return new Response(null,{status:302,headers:{Location:destination,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 }catch{return new Response('Catalog unavailable',{status:503});}
}
