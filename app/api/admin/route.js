import {billingDB} from '../../../lib/billing.mjs';
import {aggregateGuideLearning} from '../../../lib/internal-answers.mjs';
import {timingSafeEqual} from 'node:crypto';
import {readStore,mutateStore} from '../../../lib/store.mjs';
import {validLink} from '../../../lib/validation.mjs';
import {merchants,projects} from '../../../lib/catalog.mjs';
export const runtime='nodejs';
function authorized(req){const secret=process.env.ADMIN_TOKEN;if(!secret||secret.length<24)return false;const token=req.headers.get('authorization')?.replace(/^Bearer /,'')??'';return Buffer.byteLength(secret)===Buffer.byteLength(token)&&timingSafeEqual(Buffer.from(secret),Buffer.from(token));}
export async function GET(req){if(!authorized(req))return Response.json({error:'A valid admin token is required.'},{status:401});try{const store=await readStore();try{const {data,error}=await billingDB().from('account_workspaces').select('entities').limit(500);if(error)throw error;store.guideLearning=aggregateGuideLearning((data||[]).flatMap(row=>Object.entries(row.entities||{}).filter(([key])=>key.startsWith('conversation:')).map(([,value])=>value)));store.guideLearningScope='Up to 500 account workspaces';}catch{store.guideLearning=[];store.guideLearningScope='Learning summary unavailable';}return Response.json(store,{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Storage unavailable.'},{status:503});}}
export async function POST(req){if(!authorized(req))return Response.json({error:'Unauthorized'},{status:401});try{
 const body=await req.json();
 await mutateStore(s=>{
 if(body.action==='product'){const p=s.products.find(p=>p.id===body.id);if(!p)throw new Error('Unknown product');if(typeof body.name!=='string'||!body.name.trim()||body.name.length>100||typeof body.description!=='string'||body.description.length>500||typeof body.enabled!=='boolean'||!Number.isFinite(body.min)||!Number.isFinite(body.max)||body.min<0||body.max<body.min||body.max>100000)throw new Error('Invalid product values');Object.assign(p,{name:body.name.trim(),description:body.description,min:body.min,max:body.max,enabled:body.enabled});}
 else if(body.action==='link'){if(!s.products.some(p=>p.id===body.productId)||!merchants.some(m=>m.id===body.merchantId)||typeof body.url!=='string'||body.url.length>2000||(body.url&&!validLink(body.url,body.merchantId)))throw new Error('Use an HTTPS URL on the selected merchant’s domain.');if(body.url)s.links[`${body.productId}:${body.merchantId}`]=body.url;else delete s.links[`${body.productId}:${body.merchantId}`];}
 else if(body.action==='priority'){if(!projects.some(p=>p.id===body.projectId)||!s.products.some(p=>p.id===body.productId)||!['essential','recommended','optional'].includes(body.tier))throw new Error('Invalid priority');(s.overrides[body.projectId]??={})[body.productId]=body.tier;}
 else throw new Error('Unknown action');
 });return Response.json({ok:true});
 }catch(e){return Response.json({error:e.code?'Storage unavailable.':e.message},{status:e.code?503:400});}}
