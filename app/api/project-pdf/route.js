import {projectPDF} from '../../../lib/project-pdf.mjs';
import {isAppOrigin} from '../../../lib/request-origin.mjs';
export const runtime='nodejs';
export async function POST(request){
 if(!isAppOrigin(request))return Response.json({error:'Download from Kitsley.'},{status:403});
 try{const raw=await request.text();if(raw.length>150000)return Response.json({error:'This project is too large to export.'},{status:413});const input=JSON.parse(raw);
 if(!['cut','shopping','guide','drawings'].includes(input.kind)||(!input.input&&!input.record))throw Error('Choose a project document.');
 for(const key of ['owned','stock','items'])if(input[key]&&(!Array.isArray(input[key])||input[key].length>300))throw Error('Invalid project list.');
 const pdf=await projectPDF(input);return new Response(new Uint8Array(pdf),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="kitsley-${input.kind}.pdf"`,'Cache-Control':'no-store'}});
 }catch(e){console.error('Project PDF failed',e.name);return Response.json({error:'Could not prepare this PDF. Check your project dimensions and try again.'},{status:400});}
}
