// Deterministic discovery: no model calls, invented measurements or paid entitlement.
const profiles=[
 {match:/bathroom|shower|\bbath\b/i,advice:'Keeping fixtures in their current positions can simplify a bathroom renovation. Start by choosing whether you want a surface refresh or a different layout.',question:'What would you like to change?',choices:['Surfaces and fixtures','The layout','Both','Not sure yet']},
 {match:/basement/i,advice:'Before planning a finished basement, note any visible dampness and how you want to use the space. Those details affect the scope of the project.',question:'What is the main goal for the basement?',choices:['Frame and finish rooms','Create storage','Refresh an existing room','Not sure yet']},
 {match:/cabinet|bookcase|shelf|bookshelf|table|bench/i,advice:'Start with the space the piece needs to fit and what it will hold. Record measurements with units; we can keep unknown details open for now.',question:'What kind of work are you planning?',choices:['Build something new','Modify an existing piece','Repair it','Refinish it']},
 {match:/paint|spray|drywall/i,advice:'The existing surface and its condition determine preparation and material choice. Identify the surface before selecting products.',question:'Which surface are you working on?',choices:['Walls or ceiling','Wood','Metal','Another surface / not sure']},
 {match:/garden|plant|yard|paver|patio|raised.*bed/i,advice:'Note the available space, sunlight and where water collects before choosing a design. Those observations help narrow the materials and layout.',question:'What do you want to achieve?',choices:['Grow plants or food','Create a seating area','Improve paths or drainage','Something else']},
 {match:/door/i,advice:'Note where the door first catches without forcing it. That observation helps distinguish a fit problem from a latch problem.',question:'What kind of door is it?',choices:['Ordinary interior door','Exterior door','Fire or glazed door','Not sure yet']}
];
const fallback={advice:'We can collect the basics before using an AI reply. Describe the outcome you want and any limits on space, time or spending.',question:'What is the main goal?',choices:['Build or install','Repair a problem','Refresh or decorate','Plan my options']};
export function setupFlow(record){
 const profile=profiles.find(p=>p.match.test(record.request))||fallback;
 return {advice:profile.advice,questions:[{id:'scope',text:profile.question,choices:profile.choices},{id:'constraint',text:'What size, budget or existing condition should we plan around?',hint:'Share what you know, including units for measurements. “Not sure yet” is fine.'},{id:'experience',text:'How much of this do you want to do yourself?',choices:['I’m new to DIY','I have some experience','I’ll work with a professional','Not sure yet']}]};
}
export function setupQuestion(record){return setupFlow(record).questions.find(q=>!record.setup?.answers?.[q.id]);}
export function beginSetup(record){const flow=setupFlow(record);return {...record,setup:{version:1,answers:{}},messages:[...record.messages,{role:'assistant',content:flow.advice+'\n\n'+flow.questions[0].text}],updatedAt:new Date().toISOString()};}
export function answerSetup(record,value){
 const q=setupQuestion(record),answer=value.trim();if(!q||!answer)return record;
 if(q.choices&&!q.choices.includes(answer)&&/^(yes|no|change|everything|ok)$/i.test(answer))throw Error('Which option do you mean? Choose one below, or describe what you want to do.');
 const next={...record,setup:{version:1,answers:{...record.setup.answers,[q.id]:answer}}};
 const pending=setupQuestion(next);
 return {...next,messages:[...record.messages,{role:'user',content:answer},{role:'assistant',content:pending?pending.text:'Your starting details are saved. You can now use a free AI reply to get advice based on your project.'}],updatedAt:new Date().toISOString()};
}
export function freeAllowance(state,projectId,now=new Date()){
 if(!state?.signedIn)return null;
 const bucket='free:'+now.toISOString().slice(0,7),usage=(state.usage||[]).filter(u=>u.bucket===bucket);
 const used=usage.filter(u=>u.feature==='answer'&&u.project_id===projectId).length;
 const projects=new Set(usage.map(u=>u.project_id));
 return projects.size>=3&&!projects.has(projectId)?0:Math.max(0,3-used);
}
