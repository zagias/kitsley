import {library,searchLibrary,searchTerms} from './library.mjs';
import {packLibrary} from './pack-library.mjs';
import {parseDimensions} from './measurements.mjs';
import {defaults,design} from './bookcase.mjs';
export const conversationKey='kitsley-conversations-v1';
export function urgentIntent(text){return /gas\s*(smell|leak)|smell.*gas|hissing.*gas|sparking|burning smell|smoke|flood|burst pipe|water.*(outlet|electri|ceiling)/i.test(text);}
export function matchProject(text){
 if(urgentIntent(text)||!searchTerms(text).length)return null;
 if(/bookcase|bookshelf|book shelf/i.test(text))return 'bookcase';
 if(/door/i.test(text)&&/stick|rub|jam|won.t close|not clos/i.test(text))return 'sticking-door';
 if(/raised.*bed|planting bed|garden bed/i.test(text))return 'raised-bed';
 const matches=searchLibrary({query:text});return matches[0]?.id||null;
}
export function createConversation(request,id,guideId){const matchedId=guideId||matchProject(request);return {version:1,id,request,guideId:matchedId,answers:{},messages:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),urgent:urgentIntent(request)||library.find(p=>p.id===matchedId)?.mode==='urgent'};}
export function questionsFor(record){
 if(record.urgent)return [];
 if(record.guideId==='bookcase')return [
 {id:'use',text:'What will you keep on the shelves?',choices:['Books','Decor and light objects','A mixture']},
 {id:'dimensions',text:'How much space should it fill?',hint:'Enter width × height × depth with mm, cm or inches. The drawing prototype supports widths 400–800, heights 600–1200 and depths 250–400 mm.',placeholder:'e.g. 720 × 1000 × 300 mm'},
 {id:'shelves',text:'How many interior shelves would you like?',choices:['1','2','3','4']},
 {id:'finish',text:'How would you like it finished?',choices:['Paint with a brush or roller','Spray paint','Keep the wood visible','Decide later']}
 ];
 if(record.guideId==='sticking-door')return [{id:'type',text:'What kind of door is it?',choices:['Ordinary interior door','Exterior, fire or glazed door',"I’m not sure"]},...(record.answers.type==='Ordinary interior door'?[{id:'contact',text:'When you close it gently, what happens?',choices:['The edge rubs the frame','It swings freely but will not latch','It changes with damp weather',"I can’t tell"]}]:[])];
 if(record.guideId==='raised-bed')return [{id:'location',text:'Where will the bed sit?',choices:['On soil','On a patio or paving','On a balcony or roof',"I’m not sure"]},{id:'size',text:'What length, width and growing depth do you have in mind?',hint:'Use internal length × width × growing depth with units, for example 2 × 1 × 0.3 m.',placeholder:'e.g. 2 × 1 × 0.3 m'},{id:'plants',text:'What would you like to grow?',choices:['Vegetables and herbs','Flowers','A mixture']},{id:'material',text:'Do you already have material for the sides?',choices:['No, help me choose','Yes, I have timber','Yes, another material']}];
 const pack=packLibrary.find(p=>p.id===record.guideId);
 if(pack)return pack.questions.map((text,i)=>({id:'detail-'+i,text,placeholder:'Tell me what you know, or say “not sure”'}));
 const guide=library.find(p=>p.id===record.guideId);
 return guide?[{id:'observation',text:guide.observe||'What have you noticed so far?',placeholder:'Describe what you can see without taking anything apart'}]:[];
}
export function nextQuestion(record){return questionsFor(record).find(q=>!record.answers[q.id]);}
export function applyAnswer(record,text){const q=nextQuestion(record);if(!q)return record;
 if(q.id==='dimensions'){
 const dimensions=parseDimensions(text);
 if(!dimensions)throw Error('Use width × height × depth with units, for example 72 × 100 × 30 cm.');
 design({...defaults,...dimensions});text=`${dimensions.width} × ${dimensions.height} × ${dimensions.depth} mm`;
 }
 if(q.id==='shelves')design({...bookcaseInput(record),shelves:Number(text)});
 return {...record,answers:{...record.answers,[q.id]:text.trim()},updatedAt:new Date().toISOString()};}
export function bookcaseInput(record){if(record.pack?.input)return record.pack.input;const n=record.answers.dimensions?.match(/\d+/g)?.map(Number);return {...defaults,...(n?{width:n[0],height:n[1],depth:n[2]}:{}),shelves:Number(record.answers.shelves||defaults.shelves)};}
export function nextAction(record){
 if(record.urgent)return 'Keep clear of the hazard. Open urgent guidance before inspecting or working on the project.';
 if(record.guideId==='sticking-door'){
 if(record.answers.type!=='Ordinary interior door')return 'Confirm the door type with its manufacturer or a qualified installer before adjusting it. Keep its safety and security function intact.';
 const contact=record.answers.contact;
 if(contact==='The edge rubs the frame')return 'With the door open and stable, inspect the hinge screws. Gently snug a visibly loose screw with a correctly fitting hand screwdriver, keeping the hinges attached. Test after each small adjustment. Stop if a screw spins or the wood is damaged; do not start by trimming the door.';
 if(contact==='It swings freely but will not latch')return 'Check for hinge looseness or sag first. Record where the latch meets the strike before moving or filing hardware. Use the hardware manufacturer’s alignment instructions.';
 if(contact==='It changes with damp weather')return 'Look for visible dampness and note when the fit changes. Resolve moisture and reassess before removing wood.';
 return 'Watch the gaps while moving the door slowly without forcing it. Note the first point of contact. New cracking, frame movement or dampness calls for assessment before adjustment.';
 }
 if(record.guideId==='bookcase')return 'Your dimensions can now drive a measured drawing and cut list. Shelf loads, joints, hardware and wall anchoring still need review before building.';
 if(record.guideId==='raised-bed')return record.answers.location==='On a balcony or roof'?'Pause the design until the structure, saturated soil load, drainage and permissions have been checked by a qualified professional.':'Check the site, drainage and access before choosing the bed system. Your recorded dimensions and planting preferences form the brief; material quantities still need confirmation.';
 return library.find(p=>p.id===record.guideId)?.next||'I have saved your idea. Choose a starting project below, or add more detail. This preview does not have a validated design for every kind of job.';
}
