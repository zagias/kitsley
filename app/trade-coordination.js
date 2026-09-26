import {coordinationContext} from '../lib/trade-coordination.mjs';
import {diyDomains} from '../lib/diy-domains.mjs';
export default function TradeCoordination({record}){
 const question=record.messages?.filter(m=>m.role==='user').at(-1)?.content||record.safetyQuestion||'';
 const context=coordinationContext(record,question);
 const review=record.messages?.filter(m=>m.role==='assistant').at(-1)?.specialistReview;
 const name=id=>diyDomains.find(d=>d.id===id)?.name||id;
 if(review)return <details className="bc-disclosure"><summary>Areas considered for this advice</summary><p>{name(review.lead)} coordinates this task.{review.status==='needs-checking'?' Next check: '+name(review.nextArea)+'.':''}</p><ul>{review.reviews.map(r=><li key={r.area}><strong>{name(r.area)}</strong> · {r.status==='evidence-found'?'Supporting references found':r.status==='site-assessment'?'Site assessment needed':r.status==='conflicting'?'Conflicting evidence':'Needs checking'}<p>{r.finding}</p></li>)}</ul><p className="small">Saved with this project. Reference evidence supports guidance; it does not verify site conditions.</p></details>;
 if(!context)return null;
 return <details className="bc-disclosure"><summary>Checks before opening this wall</summary><p>Your drywall task stays in this project while Kitsley considers concealed services and the wall construction together.</p><ol>{context.handoffs.map(h=><li key={h.to}>{h.purpose}</li>)}</ol><p className="small">Findings you report stay with the conversation. A clear detector reading does not establish a clear cutting path. Unresolved site conditions carry forward into the next step.</p></details>;
}
