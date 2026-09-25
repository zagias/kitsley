import {mutateStore} from '../../../lib/store.mjs';
import {offers,offerVersion} from '../../../lib/project-experience.mjs';
export const runtime='nodejs';
export async function POST(request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Use this form from Kitsley.'},{status:403});
 if(Number(request.headers.get('content-length'))>1000)return Response.json({error:'Request too large.'},{status:413});
 let body;try{const text=await request.text();if(text.length>1000)return Response.json({error:'Request too large.'},{status:413});body=JSON.parse(text);if(!body||!['none',...offers.map(o=>o.id)].includes(body.offerId)||typeof body.clientId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.clientId))throw new Error();}catch{return Response.json({error:'Choose a listed offer with a valid browser identifier.'},{status:400});}
 try{const result=await mutateStore(s=>{s.offerInterests??=[];const prior=s.offerInterests.find(x=>x.clientId===body.clientId&&x.version===offerVersion);if(prior){prior.offerId=body.offerId;prior.updatedAt=new Date().toISOString();return true;}const day=new Date().toISOString().slice(0,10);if(s.offerInterests.filter(x=>x.at.startsWith(day)).length>=1000)return false;s.offerInterests.push({clientId:body.clientId,offerId:body.offerId,version:offerVersion,at:new Date().toISOString()});s.offerInterests=s.offerInterests.slice(-10000);return true;});return result?Response.json({ok:true},{headers:{'Cache-Control':'no-store'}}):Response.json({error:'Today’s research limit has been reached. Please try another day.'},{status:429});}catch{return Response.json({error:'Preferences cannot be saved right now. Please try again.'},{status:503});}
}
