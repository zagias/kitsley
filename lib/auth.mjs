import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export function authConfig(){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY,site=process.env.APP_URL;
 let configured=false;try{const parsed=new URL(site);configured=!!url&&!!key&&(parsed.protocol==='https:'||(['localhost','127.0.0.1'].includes(parsed.hostname)&&parsed.protocol==='http:'));}catch{}
 return {url,key,site,configured,providers:{google:configured&&process.env.AUTH_GOOGLE_ENABLED==='true',apple:configured&&process.env.AUTH_APPLE_ENABLED==='true'}};
}
export function sameOrigin(request){try{return new URL(request.headers.get('origin')).origin===new URL(authConfig().site).origin;}catch{return false;}}
export async function authClient(){const c=authConfig();if(!c.configured)return null;const jar=await cookies();return createServerClient(c.url,c.key,{cookies:{getAll(){return jar.getAll();},setAll(values){for(const {name,value,options} of values)jar.set(name,value,options);}}});}
