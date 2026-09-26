// Ask for identifiers only when operation, compatibility or a rating depends on them.
const powered=new Set('extractor saw drill sander sprayer router stud-finder jigsaw miter-saw nailer'.split(' '));
const system=new Set('pocket-jig hinge-jig furniture-restraint hinges drawer-slides brackets anchors eye hearing respirator gloves blade forstner router-bit jigsaw-blades screws pocket-screws back-screws glue primer wood-primer paint filler degreaser stain clearcoat exterior-finish exterior-screws edge-band'.split(' '));
const hints={screwdriver:'e.g. PH2, PZ2, Robertson #2 or slotted 6 mm',handsaw:'e.g. crosscut, blade length and teeth per inch','utility-knife':'e.g. retractable, snap-off or fixed blade','caulk-gun':'e.g. manual, cartridge size or powered','drywall-knife':'e.g. 6 in flexible blade',tape:'e.g. feet/inches and mm, 5 m',clamps:'e.g. bar clamp, 24 in opening',level:'e.g. 24 in spirit level',wrench:'e.g. 8 in adjustable or torque wrench',square:'e.g. 12 in combination square'};
export function equipmentPolicy(toolId,details={}){
 const special=/\b(?:powered|electric|battery|pneumatic|torque|insulated|laser|digital|calibrat\w*)\b/i.test(details.variant||'');
 const modelRelevant=powered.has(toolId)||system.has(toolId)||special;
 return {modelRelevant,kind:powered.has(toolId)||special?'equipment':system.has(toolId)?'product':'basic',summary:modelRelevant?'Add make, model & accessories':'Add type or size (optional)',typeHint:hints[toolId]||'e.g. size, capacity or type',reason:modelRelevant?'The exact product helps Kitsley find matching instructions and check compatible accessories.':'For ordinary use, type and size are more useful than the brand. Add only details that affect the job.'};
}
export function equipmentLabel(item){return [item.make,item.model].filter(Boolean).join(' ')||item.variant||item.accessories||'Saved details';}
