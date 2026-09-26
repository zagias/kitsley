import {billingDB} from './billing.mjs';
import {aggregateGuideLearning} from './internal-answers.mjs';
export const guideQuestions=[{topic:'steps',question:'Explain this step'},{topic:'tools',question:'What tools do I need?'},{topic:'sanding',question:'What grit should I use?'},{topic:'finish',question:'What paint should I use?'},{topic:'fasteners',question:'What screws do I need?'},{topic:'dimensions',question:'Show me the cut list'}];
let cached=[],expires=0,pending;
export async function guideLearning(){
 if(Date.now()<expires)return cached;
 if(pending)return pending;
 pending=(async()=>{try{const {data,error}=await billingDB().from('account_workspaces').select('entities').limit(500);if(error)throw error;cached=aggregateGuideLearning((data||[]).flatMap(r=>Object.entries(r.entities||{}).filter(([key])=>key.startsWith('conversation:')).map(([,value])=>value)));expires=Date.now()+300000;}catch{expires=Date.now()+30000;}finally{pending=null;}return cached;})();return pending;
}
export function rankedGuideQuestions(guideId,signals=[]){
 const scores=new Map(signals.filter(s=>s.guideId===guideId&&s.projects>=3).map(s=>[s.topic,s.questions]));
 return [...guideQuestions].sort((a,b)=>(scores.get(b.topic)||0)-(scores.get(a.topic)||0)).map(q=>q.question);
}
