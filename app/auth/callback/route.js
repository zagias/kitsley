import {cookies} from 'next/headers';
import {safeReturnPath} from '../../../lib/journey.mjs';
import {authClient,authConfig} from '../../../lib/auth.mjs';
export async function GET(request){const c=authConfig();if(!c.configured)return new Response('Sign-in is not configured.',{status:503});const code=new URL(request.url).searchParams.get('code');if(code)try{const client=await authClient();const {error}=await client.auth.exchangeCodeForSession(code);if(!error){const jar=await cookies(),path=safeReturnPath(jar.get('kitsley-return-to')?.value);jar.delete('kitsley-return-to');return Response.redirect(new URL(path,c.site),303);}}catch{}return Response.redirect(new URL('/?signin=failed',c.site),303);}
