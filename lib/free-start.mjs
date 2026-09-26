import {finishingIntake} from './finishing-intake.mjs';
import {library} from './library.mjs';
import {matchProject,urgentIntent} from './conversation.mjs';
import {directSafetyResponse} from './safety-policy.mjs';

// Public, bounded starting guidance. No account, model request or allowance needed.
// A match is a navigation aid, never verification of the user's installation.
const gfci=/\b(?:gfci|gfi|rcd)\b/i;
export function repeatedTrip(text=''){
 return /\b(?:keep(?:s)?|repeated(?:ly)?|continual(?:ly)?|constant(?:ly)?|always)\b.{0,24}\btripp?\w*\b|\btripp?\w*\b.{0,24}\b(?:again|repeatedly|every time)\b|\b(?:won[’']?t|will not|cannot|can[’']?t)\s+(?:stay|reset)\b/i.test(text);
}
export function isGfciTask(record){return gfci.test(record.request||'')&&/\b(?:trip\w*|reset|not working|stopped working|no power)\b/i.test(record.request||'');}
export function gfciStatusKnown(record){return repeatedTrip(record.request)||/\b(?:once|one time|first time)\b/i.test(record.request||'');}
export function freeStartingPoint(record={}){
 const request=String(record.request||'');if(record.urgent||urgentIntent(request))return null;
 const guide=library.find(g=>g.id===(record.guideId||matchProject(request)));
 const blocked=directSafetyResponse(request);
 if(blocked)return {title:'Start by defining the work for a qualified professional',steps:[blocked.text],guide};
 if(/\bpex\b/i.test(request)&&/\b(?:crimp\w*|clamp\w*|connect\w*)\b/i.test(request))return {title:'First, match the PEX connection system',steps:['Crimp rings and clamp rings use different tools and checks. The tubing, fitting, ring and tool must be compatible; the word “PEX” alone does not identify the connection method.','Read the markings on the tubing and the ring/fitting packaging, and note the tool model. We can use those details to find the matching method and inspection check.'],note:'Identify the system before working on a connected or pressurized water line.',guide,source:{title:'SharkBite PEX guide — separate crimp and clamp systems',url:'https://www.sharkbite.com/sites/default/files/files/sharkbite-pex-install-guide-2021-02.pdf'}};
 const finishing=finishingIntake(record);
 if(finishing)return {title:finishing.title,steps:finishing.steps};
 if(isGfciTask(record)){
  const repeated=repeatedTrip(request+' '+(record.setup?.answers?.constraint||''));
  return {title:repeated?'A GFCI that keeps tripping needs checking':'Before touching RESET',steps:repeated?[
   'Stop using the affected outlet and leave it tripped. Do not keep pressing RESET; arrange a licensed electrician to find the cause.',
   'For the electrician, note what was plugged in, when it tripped and any visible moisture or damage. Observe from a dry, safe place; do not open the outlet or touch wiring.'
  ]:[
   'From a dry, safe place, look for moisture, visible damage or signs of overheating at the outlet and connected equipment. Do not touch anything wet or damaged.',
   'Find the device’s brand and user instructions without removing its cover. If the cause is unclear, it will not reset, or it trips again, stop using it and contact a licensed electrician.'
  ],note:'Smoke, sparks, burning or immediate danger? Leave the area and call your local emergency service from a safe place.',guide:library.find(g=>g.id==='gfci-trip'),source:{title:'Leviton: what to do when a GFCI trips',url:'https://leviton.com/support/literature/blogs/what-to-do-when-your-gfci-trips--a-homeowner-s-guide'}};
 }
 if(guide?.observe&&guide?.next)return {title:'Your first step',steps:[guide.observe,guide.next],guide};
 // Unsupported requests still get a useful planning action, without a fabricated procedure.
 return {title:'Start with what you can check',steps:[guide?.id==='bookcase'?'Measure the available width, height and depth, including skirting and nearby doors. Record units and what you want the shelves to hold.':guide?.id==='paint-cabinets'?'Identify whether a door front is solid wood, veneer, MDF or laminate before choosing primer. Photograph an existing exposed edge; don’t sand to find out.':'Write down the outcome you want and photograph the current condition from a safe, accessible place. Keep unknown dimensions, materials and model numbers marked “unknown”.'],guide};
}
