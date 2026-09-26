// A customer's chosen path controls presentation, never permission for hazardous work.
export const projectPaths=[
 {id:'build',name:'Build something',examples:'Cabinets, drawers, bookcases & floating shelves',placeholder:'I want to build a bookcase for this space…',summary:'Shape the design, choose materials, then work through the build.',steps:['Design','Tools & materials','Build']},
 {id:'household',name:'Household DIY',examples:'HVAC filters, GFCI resets & TV mounts',placeholder:'I need to change my HVAC filter…',summary:'Identify the equipment, check the conditions, then tackle one task.',steps:['Identify','Check','Do the task']},
 {id:'trade',name:'DIY trade work',examples:'Electrical, plumbing & drywall',placeholder:'I want to replace damaged drywall in my bathroom…',summary:'Define the job and check what needs specialist help before planning work.',steps:['Define the work','Check requirements','Plan the safe scope']},
 {id:'big-project',name:'Big projects',examples:'Basements, bathrooms & built-in cupboards',placeholder:'I want to finish my basement from the ground up…',summary:'Break the project into phases, dependencies and work you can take on.',steps:['Scope','Plan phases','Coordinate the work']}
];
export const pathById=id=>projectPaths.find(p=>p.id===id)||null;
export function projectPath(record={}){
 if(pathById(record.useCase))return pathById(record.useCase);
 const text=String(record.request||'');
 if(/\b(?:basement|bathroom)\b.*\b(?:renovat\w*|remodel\w*|finish\w*|ground up)\b|\b(?:renovat\w*|remodel\w*|finish\w*|reno)\b.*\b(?:basement|bathroom)\b|\b(?:built[- ]in|coat)\s+(?:cupboard|closet)\b/i.test(text))return pathById('big-project');
 if(/\b(?:hvac|filters?|gfci|gfi|reset|tv\s+(?:wall\s*)?mount|mount\s+(?:a\s+)?tv)\b/i.test(text))return pathById('household');
 if(/\b(?:electrical|rewir\w*|plumbing|drywall|pex)\b/i.test(text))return pathById('trade');
 if(/\b(?:cabinets?|drawers?|bookcases?|bookshel(?:f|ves)|shel(?:f|ves)|benches|tables?)\b/i.test(text))return pathById('build');
 return null;
}
export const projectPhases=[
 {id:'scope',name:'Scope & survey',detail:'Record the outcome, measurements, existing conditions and budget.',before:'Clarify unknown conditions before choosing a construction approach.'},
 {id:'requirements',name:'Requirements & specialists',detail:'Identify local requirements and work that needs qualified trades.',before:'Confirm permits, inspections and specialist responsibilities where applicable.'},
 {id:'design',name:'Design & sequence',detail:'Coordinate the layout, material choices, services and order of work.',before:'Resolve conflicting measurements, access and service routes before buying or cutting.'},
 {id:'work',name:'Carry out the work',detail:'Use a task-specific plan for each part of the project.',before:'Do not cover work that still needs an inspection or unresolved check.'},
 {id:'finish',name:'Finish & handover',detail:'Check the finished work and save manuals and maintenance tasks.',before:'Confirm required testing and inspections with the responsible professionals.'}
];
export const phaseById=id=>projectPhases.find(p=>p.id===id)||projectPhases[0];
export function workflowContext(record={}){
 const path=projectPath(record),text=[record.request,...Object.values(record.setup?.answers||{}),...(record.messages||[]).filter(m=>m.role==='user').slice(-4).map(m=>m.content)].join(' ');
 const checks=[];
 if(/\b(?:electrical|breaker|gfci|gfi|rewir\w*|outlets?|sockets?)\b/i.test(text))checks.push('Identify exact device and symptoms; distinguish manufacturer user reset/test from wiring or panel work. Moisture, heat, damage, repeated trips or unknown isolation means stop troubleshooting and seek qualified help. Never infer safety from a successful reset.');
 if(/\b(?:plumbing|pipes?|pex|drain|water supply)\b/i.test(text))checks.push('Identify the system, isolation, material and local requirements. Unknown isolation, contamination, concealed damage or uncontrolled leakage needs qualified assessment.');
 if(/\b(?:drywall|demolition|sanding|cutting)\b/i.test(text))checks.push('Check hidden services, old-material hazards, fire/acoustic function and moisture before disturbing an existing assembly.');
 if(/\b(?:tv|wall[- ]?mount|floating|wall[- ]hung)\b/i.test(text))checks.push('Confirm wall construction, supported load, exact mount or bracket, fasteners and hidden services. Do not guess an anchor, screw size or load capacity.');
 return {path:path?.id||'unclassified',name:path?.name||'Project discovery',steps:path?.steps||['Clarify the task'],phase:path?.id==='big-project'?phaseById(record.projectPhase):null,requiredChecks:checks,
 approach:({build:'Use a canonical design model for supported shapes. Clarify dimensions, purpose, material and joining; generate consistent drawings and parts only within the registered builder.',household:'Keep the journey short and equipment-specific. Ask only details needed for this task; do not demand a renovation brief. Offer a user-maintenance task only within the exact manufacturer scope.',trade:'Collect job location/jurisdiction, exact scope, existing system and user role. Explain permitted planning and non-invasive preparation; identify professional work and inspection hold points. A disclaimer or user confidence never authorizes a dangerous procedure.','big-project':'Coordinate phases and dependencies. Start with current phase, site facts, budget and intended DIY versus professional roles. Research local requirements. Keep unverified quantities and task plans provisional.'})[path?.id]||'Clarify the task without forcing a loosely related library guide.',authority:'The selected category is not a safety clearance. Apply checks based on actual task content in every path.'};
}
export function pathSetup(record){
 const path=projectPath(record);
 const experience={id:'experience',text:'What is your experience with this work?',choices:['I’m new to DIY','I have some experience','I’ll work with a professional','Not sure yet']};
 if(path?.id==='household')return {advice:'We’ll focus on one task. The device or fixing, its condition and the manufacturer’s instructions determine the next step.',questions:[{id:'scope',text:'What kind of household task is this?',choices:['Routine care or replacement','Something stopped working','Install or mount an item','Not sure yet']},{id:'constraint',text:'Which item are you working on, and what have you noticed?',hint:'Share its brand/model if known. For a mount, include the item and wall type. Don’t remove covers or touch wiring to find details.'},experience]};
 if(path?.id==='trade')return {advice:'Start with the exact job. Kitsley can help plan the work and identify checks or tasks that need a qualified professional.',questions:[{id:'scope',text:'Which kind of work are you planning?',choices:['Electrical','Plumbing','Drywall','A combination / not sure']},{id:'constraint',text:'What is the job, and where will it take place?',hint:'Describe the existing system and intended change. City or region helps check local requirements; no street address is needed.'},experience]};
 if(path?.id==='big-project')return {advice:'We’ll organize the work into phases. Begin with the outcome and current condition, then identify dependencies and who will do each part.',questions:[{id:'scope',text:'Where are you with this project?',choices:['Exploring the idea','Planning the layout and budget','Work has started','Fixing a stalled project']},{id:'constraint',text:'What should the finished space do for you?',hint:'Add approximate size, city or region, current condition and budget if known. Leave undecided details open.'},{...experience,text:'How will you organize the work?',choices:['Mostly DIY','DIY with selected trades','A contractor will lead it','Not sure yet']}]};
 return null;
}
export function pathLabels(record){return projectPath(record)?.id==='household'?{scope:'The task',constraint:'Equipment & conditions',experience:'Your experience'}:projectPath(record)?.id==='trade'?{scope:'Type of work',constraint:'Job & location',experience:'Your role'}:projectPath(record)?.id==='big-project'?{scope:'Starting point',constraint:'Project brief',experience:'Who will do the work'}:{scope:'The job',constraint:'Your space',experience:'Your experience'};}
