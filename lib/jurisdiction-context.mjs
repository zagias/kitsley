// Scope routing, not a building-code compliance checker. Local rules are never
// inferred from currency, browser location or a user's skill level.
export const jurisdictionVersion='2026-09-26.1';
const checkedAt='2026-09-26',reviewBy='2026-12-25';
const references=[
 {id:'ontario-building-code',match:/permit|building code|renovat|basement|structur|wall|addition/i,scope:'Ontario building work',url:'https://www.ontario.ca/page/ontarios-building-code',guidance:'Identify the applicable Ontario Building Code edition and amendments, project dates and municipality. The municipality administers building permits. Do not substitute a national code or another city’s permit exemptions.'},
 {id:'ontario-electrical',match:/electri|wiring|wire|outlet|receptacle|breaker|panel|gfci|afci/i,scope:'Ontario electrical work',url:'https://esasafe.com/compliance/what-you-need-to-know/',guidance:'Almost all electrical work requires ESA notification. A municipal building permit does not replace it. Hired electrical work requires a Licensed Electrical Contractor. Resolve ESA inspection requirements before concealing work; request the Certificate of Acceptance.'},
 {id:'ontario-electrical-edition',match:/electri|wiring|breaker|receptacle|code/i,scope:'Ontario electrical code edition',url:'https://esasafe.com/assets/files/esasafe/pdf/About_ESA/2024-OESC-FAQs.pdf',guidance:'The 2024 Ontario Electrical Safety Code took effect May 1, 2025. It includes Ontario amendments. Earlier notifications and plan reviews need project-specific edition checks; do not assume grandfathering or invent clause numbers.'},
 {id:'ontario-fuels',match:/gas|propane|furnace|combustion|fuel|boiler/i,scope:'Ontario fuels work',url:'https://www.tssa.org/fuels-contractor',guidance:'Verify the fuels business in TSSA’s registered-contractor directory and the technician’s appropriate qualifications. Registration is not a TSSA endorsement. Keep fuel-system work with qualified service.'},
 {id:'ontario-co-2026',match:/carbon monoxide|co alarms?|co detectors?/i,scope:'Ontario houses subject to CO-alarm requirements',url:'https://www.ontario.ca/page/carbon-monoxide-safety',guidance:'For qualifying houses, requirements from January 1, 2026 include alarms on every storey as well as adjacent to sleeping areas. Identify fuel appliances/fireplaces, attached garage or externally fuel-heated supply air. Apartment/condo conditions differ; verify the building type and current fire-authority guidance.'},
 {id:'toronto-permits',match:/permit|cabinet|millwork|plumb|basement|wall|renovat/i,city:'Toronto',scope:'City of Toronto only',url:'https://www.toronto.ca/services-payments/building-construction/building-permit/before-you-apply-for-a-building-permit/when-do-i-need-a-building-permit/',guidance:'Toronto lists cabinetry/millwork installation among work not requiring a building permit. That does not exempt related structural, plumbing or electrical alterations. Confirm the complete scope with Toronto Building; do not apply this list to another municipality.'}
];
const provinceNames=/\b(?:Ontario|Quebec|Québec|Alberta|British Columbia|Manitoba|Saskatchewan|Nova Scotia|New Brunswick|Newfoundland|Prince Edward Island)\b/gi;
const cities=['Toronto','Ottawa','Hamilton','London','Mississauga','Brampton','Windsor','Kingston','Waterloo','Kitchener'];
function hints(value){const text=String(value||'');return {provinces:[...new Set((text.match(provinceNames)||[]).map(x=>x.toLowerCase()))],cities:cities.filter(c=>new RegExp('\\b'+c+'\\b','i').test(text))};}
export function jurisdictionContext(record={},question='',{now=Date.now()}={}){
 const saved=String(record.safetyFacts?.location||'').slice(0,200),s=hints(saved),q=hints(question);
 // Question place names are possible context, not verified location. Conflicting
 // places (including quoted comparisons) require clarification, never precedence.
 const provinces=[...new Set([...s.provinces,...q.provinces])],cityNames=[...new Set([...s.cities,...q.cities])];
 const conflict=provinces.length>1||cityNames.length>1||provinces.some(p=>p!=='ontario')&&cityNames.length>0;
 const ontario=!conflict&&provinces.includes('ontario');
 const municipality=ontario&&cityNames.length===1?cityNames[0]:null;
 const topic=question||String(record.request||'');
 const regulated=/\b(?:permit|code|electrical|wiring|breaker|gas|structural|load.bearing|basement|plumbing|carbon monoxide|co alarm)\b/i.test(topic);
 const current=now>=Date.parse(checkedAt+'T00:00:00Z')&&now<=Date.parse(reviewBy+'T23:59:59Z');
 const applicable=ontario?references.filter(r=>r.match.test(topic)&&(!r.city||r.city===municipality)):[];
 return {version:jurisdictionVersion,status:conflict?'clarify-location':ontario?(saved?'saved-location':'confirm-mentioned-location'):'location-not-established',savedLocation:saved||null,province:ontario?'Ontario':null,municipality,locationNeeded:regulated||conflict,checkedAt,reviewBy,researchRequired:applicable.length>0||regulated,referenceStatus:current?'current-reference':'review-due',references:current?applicable.map(({match,city,...r})=>r):[],researchTargets:applicable.map(({id,url,scope})=>({id,url,scope})),rule:'Use these scoped references as research leads, not site approval. Confirm that a place mentioned in a question is the project location before applying local rules. If location conflicts, ask one focused clarification. For regulated advice verify current official provincial and municipal requirements and exact manufacturer instructions; do not invent code clauses, clearances or universal permit exemptions. Never infer concealed conditions or approval from a scan, photo, experience level or a second AI answer. For ordinary unregulated material/finish questions do not interrupt useful guidance merely to ask a location.'};
}
