import {publicationSummary} from './managed-knowledge.mjs';
import {diyDomains,aggregateDomainLearning} from './diy-domains.mjs';
import {foundationKnowledge,foundationCurrent,foundationVersion} from './diy-knowledge.mjs';
export function knowledgeCoverage(records=[],now=Date.now()){
 const demand=aggregateDomainLearning(records);
 return {version:foundationVersion,kind:'reference-coverage',modelTraining:false,expertCertification:false,publicationWorkflow:publicationSummary,
  total:foundationKnowledge.length,current:foundationKnowledge.filter(e=>foundationCurrent(e,now)).length,
  domains:diyDomains.map(d=>{const entries=foundationKnowledge.filter(e=>d.categories.includes(e.category)),current=entries.filter(e=>foundationCurrent(e,now));return {id:d.id,name:d.name,status:current.length?'partial-reference-coverage':'research-required',references:current.length,reviewDue:entries.length-current.length,questions:demand.find(s=>s.id===d.id)?.questions||0,boundary:d.boundary};}),
  nextReview:foundationKnowledge.filter(e=>foundationCurrent(e,now)).map(e=>e.reviewBy).sort()[0]||null,
  publication:'Versioned editorial catalog with reviewed revisions, expiry and revocation. Research produces quarantined or awaiting-review candidates; no automatic publication or model-weight training.'};
}
