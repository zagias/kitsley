import {sourceUrl} from './source-url.mjs';

export const assessmentTopics=['material','cutting','damage prevention','strength','joining','tools','finish','environment','safety','dimensions','assembly'];
export const factualQuestions={
  "product_identity": "What exact product or model do you have? A label or purchase listing is useful; it is fine to say you are unsure.",
  "cabinet_mounting": "How is the cabinet supported: floor-standing, wall-hung on a rail, fixed through mounting brackets or rails, or unsure?",
  "pipe_markings": "What material and size are marked on the pipe and fittings?",
  "joint_type": "Is the leaking connection a removable nut-and-washer joint, a glued socket, or another type?",
  "leak_location": "Where is the water first appearing: at a joint, through the material, or from somewhere you cannot see?",
  "cement_identity": "What is the exact cement product on the container, and what pipe material and service does its label list?",
  "cure_conditions": "What were the temperature, pipe size and exact cement product when the joint was made?",
  "equipment_model": "What is the exact make and model on the equipment label?",
  "coating_identity": "What is the exact coating product and what surface is it going onto?",
  "adhesive_identity": "What is the exact adhesive or sealant product, including the formulation on its label?",
  "wall_assembly": "What is known about the wall construction and concealed pipes or cables? Please leave uncertain details marked unknown.",
  "load_support": "What will the item support, and how will it be supported?",
  "actual_dimensions": "What are the measured dimensions and actual material thickness, including units?",
  "hinge_identity": "What are the hinge and mounting-plate identifiers, and is the door inset or overlapping the cabinet?",
  "flooring_product": "What is the exact flooring product, and is the subfloor concrete or wood?",
  "waterproofing_system": "Which waterproofing system and backing material are you planning to use?",
  "jurisdiction": "Which province and municipality is the work in? An exact home address is not needed.",
  "finish_goal": "Do you want the wood visible, a stained colour, or an opaque painted finish?",
  "environment": "Will the finished item be indoors, outdoors, or exposed to regular water or heat?",
  "door_assembly": "Is this an ordinary interior door, an exterior door, or a fire-rated door assembly?",
  "condition_observation": "What changed, and what can you observe without opening equipment or disturbing the material?"
};
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
        "establishedPrinciples",
        "missingFact",
        "question",
        "choices",
        "checks"
      ],
      "properties": {
        "establishedPrinciples": {"type":"array","maxItems":2,"items":{"type":"object","additionalProperties":false,"required":["text","urls"],"properties":{"text":{"type":"string","maxLength":600},"urls":{"type":"array","items":{"type":"string"}}}}},
        "missingFact": {"type":["string","null"],"enum":[...Object.keys(factualQuestions),null]},
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
export const assessmentInstructions=` For an unfamiliar material, substitution, fabrication problem or custom design request, include a technicalAssessment rather than just an essay. For routine guide explanations use null. Assess the facts relevant to this task. For material fabrication, establish material/core/facing, intended use, thickness and environment; do not apply that questionnaire to every plumbing, door or equipment question. Never equate an ambiguous material name with a specific product. Choose missingFact from the provided factual categories for the ONE decisive missing fact; use null if no category applies. Do not select a fact already supplied. The application renders a factual question for that category. Ask ONE decisive question, offer 2–4 helpful choices only when appropriate, and let the user say they are unsure. Use their earlier answers; do not repeat questions already resolved.
Consider material identity, what cuts it, cutting damage (tearing, chipping, crushing or heat), strength/load/support, compatible glue/fasteners, tools, finish, environment, safety, dimensions and assembly order. Keep established general principles separate from unresolved product-specific methods: an unknown mounting system does not erase a documented alignment principle. Use establishedPrinciples for up to two independently supported facts that answer the user’s actual question even while a method remains unresolved. Cite retrieved primary sources for each. These principles must not contain an installation procedure, unsupported numeric setting or a recommendation dependent on the missing fact. For example, explain the sealing role of a slip-joint washer without prescribing a repair to an unidentified joint. Do not hide that established fact in a needs-details finding. Include each topic once and mark irrelevant topics not-applicable; keep each finding to two short sentences. Establish product-dependent methods only from retrieved primary documentation, with exact URLs. Distinguish user-supplied facts from independently sourced claims. If load, thickness, material or product is unknown, name the missing information. Check fire, fumes/dust, electrical contact, skin/food/pet contact and solvent compatibility when relevant; never prescribe heating an unidentified material. A manufacturer's compressive rating is not automatically a shelf span or assembly load rating. A trial on scrap checks compatibility/finish, not structural strength. Do not invent a blade, speed, adhesive, span, joint capacity or dimension to fill a gap.
The assessment is a saved planning document, not validated geometry. Once facts are established, outline the supported approach and remaining checks. A construction drawing and cut list may only come from supported deterministic design operations; do not claim a new illustrated design exists. New evidence must revise affected decisions and identify conflicts with earlier advice. Never promote this project's research directly to shared rules.`;

const nextChecks={material:'Can you identify the product from a label or purchase listing? If not, describe its core and facing.',cutting:'Which cutting tool and blade do you have, and is there a manufacturer instruction for this material?', 'damage prevention':'What does the material manufacturer say about avoiding edge damage?',strength:'What will this support, and how will it be supported?',joining:'Which exact adhesive or fastener are you considering?',tools:'Which exact tool and accessory will you use?',finish:'Which exact coating and surface are involved?',environment:'Where will the finished item be used?',safety:'Which site or material condition still needs checking?',dimensions:'What are the confirmed measurements, including units?',assembly:'Which joining method and assembly sequence are supported for this design?'};
export function technicalAssessment(raw,research){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.checks))return null;
 const sources=research?.sources||[],allowed=new Map(sources.map(s=>[sourceUrl(s.url),s]));
 const establishedPrinciples=(Array.isArray(raw.establishedPrinciples)?raw.establishedPrinciples:[]).slice(0,2).flatMap(p=>{
  if(!p||typeof p.text!=='string'||!p.text.trim()||p.text.length>600)return [];
  const references=[...new Set((Array.isArray(p.urls)?p.urls:[]).map(sourceUrl))].map(u=>allowed.get(u)).filter(Boolean);
  return references.length?[{text:p.text.trim(),references}]:[];
 });
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
 // Missing evidence cannot be resolved by asking the customer to approve a method.
 // Only factual questions from the application are shown while decisions remain open.
 const missingFact=Object.hasOwn(factualQuestions,raw.missingFact)?raw.missingFact:null;
 return {version:1,missingFact,establishedPrinciples,summary:ready?String(raw.summary||'Project decisions').slice(0,400):'Check before choosing a method',question:ready?String(raw.question||'').slice(0,240):factualQuestions[missingFact]||nextChecks[gap?.topic]||'Which exact product or condition should we check next?',choices:ready?(Array.isArray(raw.choices)?raw.choices:[]).filter(s=>typeof s==='string'&&s.trim()).slice(0,4).map(s=>s.slice(0,120)):[],checks,checkedAt:research?.checkedAt||null,stage:ready?'ready-for-planning':'needs-checking'};
}

export function restoreAssessment(raw){
 if(raw?.version!==1||!Array.isArray(raw.checks))return null;
 const sources=[...raw.checks,...(Array.isArray(raw.establishedPrinciples)?raw.establishedPrinciples:[])].flatMap(c=>Array.isArray(c?.references)?c.references:[]).filter(s=>s&&sourceUrl(s.url)).map(s=>({url:sourceUrl(s.url),title:String(s.title||'Reference').slice(0,180)}));
 return technicalAssessment({...raw,establishedPrinciples:(raw.establishedPrinciples||[]).map(p=>({...p,urls:p.references?.map(s=>s.url)||[]})),checks:raw.checks.map(c=>({...c,urls:c?.references?.map(s=>s?.url)||[]}))},{sources,checkedAt:raw.checkedAt,status:raw.stage==='ready-for-planning'?'supported':'limited'});
}
