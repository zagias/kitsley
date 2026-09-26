import {sourceUrl} from './source-url.mjs';

export const assessmentTopics=['material','cutting','damage prevention','strength','joining','tools','finish','environment','safety','dimensions','assembly'];
export const assessmentSchema={
  "anyOf": [
    {
      "type": "null"
    },
    {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "summary",
        "question",
        "choices",
        "checks"
      ],
      "properties": {
        "summary": {
          "type": "string"
        },
        "question": {
          "type": "string"
        },
        "choices": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "checks": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "topic",
              "finding",
              "status",
              "urls"
            ],
            "properties": {
              "topic": {
                "type": "string",
                "enum": [
                  "material",
                  "cutting",
                  "damage prevention",
                  "strength",
                  "joining",
                  "tools",
                  "finish",
                  "environment",
                  "safety",
                  "dimensions",
                  "assembly"
                ]
              },
              "finding": {
                "type": "string"
              },
              "status": {
                "type": "string",
                "enum": [
                  "established",
                  "needs-details",
                  "conflicting",
                  "not-applicable"
                ]
              },
              "urls": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    }
  ]
};
export const assessmentInstructions=` For an unfamiliar material, substitution, fabrication problem or custom design request, include a technicalAssessment rather than just an essay. For routine guide explanations use null. Start with the exact material/core/facing, intended object/use, thickness and environment. Never equate an ambiguous material name with a specific product. Ask ONE decisive question, offer 2–4 helpful choices only when appropriate, and let the user say they are unsure. Use their earlier answers; do not repeat questions already resolved.
Consider material identity, what cuts it, cutting damage (tearing, chipping, crushing or heat), strength/load/support, compatible glue/fasteners, tools, finish, environment, safety, dimensions and assembly order. Include each topic once and mark irrelevant topics not-applicable; keep each finding to two short sentences. Establish product-dependent methods only from retrieved primary documentation, with exact URLs. Distinguish user-supplied facts from independently sourced claims. If load, thickness, material or product is unknown, name the missing information. Check fire, fumes/dust, electrical contact, skin/food/pet contact and solvent compatibility when relevant; never prescribe heating an unidentified material. A manufacturer's compressive rating is not automatically a shelf span or assembly load rating. A trial on scrap checks compatibility/finish, not structural strength. Do not invent a blade, speed, adhesive, span, joint capacity or dimension to fill a gap.
The assessment is a saved planning document, not validated geometry. Once facts are established, outline the supported approach and remaining checks. A construction drawing and cut list may only come from supported deterministic design operations; do not claim a new illustrated design exists. New evidence must revise affected decisions and identify conflicts with earlier advice. Never promote this project's research directly to shared rules.`;

const nextChecks={material:'Can you identify the product from a label or purchase listing? If not, describe its core and facing.',cutting:'Which cutting tool and blade do you have, and is there a manufacturer instruction for this material?', 'damage prevention':'What does the material manufacturer say about avoiding edge damage?',strength:'What will this support, and how will it be supported?',joining:'Which exact adhesive or fastener are you considering?',tools:'Which exact tool and accessory will you use?',finish:'Which exact coating and surface are involved?',environment:'Where will the finished item be used?',safety:'Which site or material condition still needs checking?',dimensions:'What are the confirmed measurements, including units?',assembly:'Which joining method and assembly sequence are supported for this design?'};
const approvalQuestion=/\b(?:should|can|could|may)\s+(?:i|we)\s+(?:use|proceed|cut|build|start|apply|install)\b/i;
const approvalChoice=/\b(?:proceed|go ahead|start (?:cutting|building|work)|accept (?:the )?risk|ignore|skip|continue (?:with|anyway))\b/i;
export function technicalAssessment(raw,research){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.checks))return null;
 const sources=research?.sources||[],allowed=new Map(sources.map(s=>[sourceUrl(s.url),s]));
 const seen=new Set(),checks=[];
 for(const item of raw.checks){
  if(!item||!assessmentTopics.includes(item.topic)||seen.has(item.topic))continue;seen.add(item.topic);
  const references=[...new Set((Array.isArray(item.urls)?item.urls:[]).map(sourceUrl).filter(Boolean))].map(u=>allowed.get(u)).filter(Boolean);
  let status=['established','needs-details','conflicting','not-applicable'].includes(item.status)?item.status:'needs-details';
  const missingEvidence=status==='established'&&!references.length;
  if(missingEvidence)status='needs-details';
  checks.push({topic:item.topic,finding:missingEvidence||status==='needs-details'&&!references.length?(nextChecks[item.topic]||'This decision needs applicable evidence.'):String(item.finding||'More information is needed.').slice(0,600),status,references});
 }
 // Omissions cannot silently become approval for a novel project.
 for(const topic of assessmentTopics)if(!seen.has(topic))checks.push({topic,finding:'Not assessed yet.',status:'needs-details',references:[]});
 const ready=research?.status==='supported'&&checks.every(c=>['established','not-applicable'].includes(c.status));
 const gap=checks.find(c=>['needs-details','conflicting'].includes(c.status));
 const question=String(raw.question||'').slice(0,240),unsafeQuestion=approvalChoice.test(question)||approvalQuestion.test(question)||/\b(?:is|are|would|will|can|does|do)\b.*\b(?:suitable|compatible|safe|work|fit|adequate|strong enough)\b/i.test(question);
 return {version:1,summary:ready?String(raw.summary||'Project decisions').slice(0,400):'Check before choosing a method',question:!ready&&(unsafeQuestion||!question)?nextChecks[gap?.topic]||'Which exact product or condition should we check next?':question,choices:unsafeQuestion&&!ready?[]:(Array.isArray(raw.choices)?raw.choices:[]).filter(s=>typeof s==='string'&&s.trim()&&(ready||!approvalChoice.test(s))).slice(0,4).map(s=>s.slice(0,120)),checks,checkedAt:research?.checkedAt||null,stage:ready?'ready-for-planning':'needs-checking'};
}

export function restoreAssessment(raw){
 if(raw?.version!==1||!Array.isArray(raw.checks))return null;
 const sources=raw.checks.flatMap(c=>Array.isArray(c?.references)?c.references:[]).filter(s=>s&&sourceUrl(s.url)).map(s=>({url:sourceUrl(s.url),title:String(s.title||'Reference').slice(0,180)}));
 return technicalAssessment({...raw,checks:raw.checks.map(c=>({...c,urls:c?.references?.map(s=>s?.url)||[]}))},{sources,checkedAt:raw.checkedAt,status:raw.stage==='ready-for-planning'?'supported':'limited'});
}
