import {domainsFor} from './diy-domains.mjs';
// A request for an explanation is not a request to complete a project brief.
export function instructionQuestion(record={}){
 const request=String(record.request||'');
 return /^(?:please\s+)?(?:how (?:do|can|should|would) (?:i|we)|how to|explain|what|which|why|can i|should i)\b/i.test(request.trim())&&domainsFor(request).length>0;
}
