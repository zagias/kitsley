import {guideLearning,rankedGuideQuestions} from '../../../lib/guide-learning.mjs';
import {library} from '../../../lib/library.mjs';
export const runtime='nodejs';
export async function GET(request){
 const id=new URL(request.url).searchParams.get('guide');
 if(!library.some(g=>g.id===id))return Response.json({error:'Unknown guide'},{status:404});
 // Only approved question templates leave this endpoint. No user text, counts or IDs.
 return Response.json({questions:rankedGuideQuestions(id,await guideLearning())},{headers:{'Cache-Control':'public, max-age=300'}});
}
