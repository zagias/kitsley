// Recognize a named finishing task before generic project discovery.
// This is initial orientation, not a coating specification or a structural approval.
export function finishingIntake(record={}){
 const request=String(record.request||'');
 if(!/\b(?:finish(?:ing)?|refinish(?:ing)?|paint(?:ing)?|stain(?:ing)?|varnish(?:ing)?|clear[- ]coat(?:ing)?)\b/i.test(request))return null;
 const material=request.match(/\b(plywood|solid wood|wood|veneer)\b/i)?.[0];
 if(!material)return null;
 const desired=/\bpaint(?:ed|ing)?\b/i.test(request)?'paint':/\bstain(?:ed|ing)?\b/i.test(request)?'stain':/\b(?:clear[- ]coat|varnish|natural finish)\b/i.test(request)?'clear':null;
 const condition=/\b(?:bare|raw|unfinished|already painted|previously painted|previously finished|old finish)\b/i.test(request);
 const environment=/\b(?:indoors?|outdoors?|exterior|interior)\b/i.test(request);
 const questions=[];
 if(!desired)questions.push({id:'scope',text:'What look do you want?',choices:['Painted — hide the grain','Stained — change the wood colour','Clear — keep the wood visible','Help me choose']});
 if(!condition||!environment)questions.push({id:'constraint',text:!condition&&!environment?'Is it bare or already finished, and will it be used indoors or outdoors?':!condition?'Is the surface bare or already finished?':'Will it be used indoors or outdoors?',hint:'These details determine preparation and which finish is suitable.'});
 const advice=`You’re asking about finishing ${material.toLowerCase()}. Choose the appearance first, then a compatible preparation and coating system for the surface and where it will be used.`;
 const steps=[
  material.toLowerCase()==='plywood'||material.toLowerCase()==='veneer'?'Keep the thin face veneer intact: don’t aggressively sand it or try to remove deep marks by sanding through the face. The exposed panel edges may need a different treatment from the face.':'Check the surface and exposed edges before choosing preparation products; MDF, solid wood and melamine need different finishing systems.',
  'Paint hides the grain; stain changes its colour; a clear finish keeps the wood visible. Test the complete chosen finish on a matching offcut before treating the whole piece.'
 ];
 return {advice,questions,title:`Finishing ${material.toLowerCase()}: start with the surface and finish`,steps};
}
