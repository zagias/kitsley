// Narrow, source-scoped diagnostic prompts. These never authorize construction,
// produce dimensions, or turn an incomplete assessment into a completed plan.
export const diagnosticGuidanceVersion='2026-09-26.2';
export function diagnosticGuidance(question=''){
 const q=String(question).toLowerCase();
 if(/\bcabinet\b/.test(q)&&/\b(wall|walls)\b/.test(q)&&/\b(lean|leans|leaning|uneven|plumb)\b/.test(q)&&/\b(pull|force|longer screws)\b/.test(q))return {
  text:'Keep the cabinet square, level and plumb; do not pull it out of shape to follow a leaning wall. The ENHET guide illustrates accommodating unevenness, but its mounting details do not establish the fixings for an unidentified cabinet.',
  question:'How is this cabinet supported: floor-standing, wall-hung on a rail, fixed through mounting rails or brackets, or unsure?',
  source:{title:'IKEA ENHET installation guide — system-specific example',url:'https://www.ikea.com/ca/en/files/pdf/e6/c6/e6c6ba46/enhet-kitchen-installation-guide-fy24-l1-en.pdf'}
 };
 if(/\b(?:furnace|hvac|air filter|merv)\b/.test(q)&&/\b(?:merv|higher|upgrade|replace)\b/.test(q)&&/\bfilter\b/.test(q))return {
  text:'Matching filter dimensions does not establish that a higher-efficiency filter suits your system. EPA says the system fan and filter slot must accommodate it; a technician may need to determine the suitable rating. Hold off on the change until that compatibility is checked.',
  question:'Can you find the furnace model in service paperwork or on an externally accessible label, without opening service compartments?',
  source:{title:'EPA — What is a MERV rating?',url:'https://www.epa.gov/indoor-air-quality-iaq/what-merv-rating'}
 };
 if(/\bdoor\b/.test(q)&&/\b(?:rub\w*|swings? shut|swings? closed)\b/.test(q)&&/\b(?:plane|planing|trim|cut)\b/.test(q))return {
  text:'Check alignment before removing material. Masonite’s interior prehung-door guidance calls for a hinge jamb that is plumb in both directions and an even gap at the top. This supports checking alignment first; it does not diagnose this door or establish a trimming allowance. Keep rated-door alterations with the appropriate specialist.',
  question:'Without removing trim, does a spirit level show the hinge-side jamb is vertical in both directions?',
  source:{title:'Masonite — interior prehung door installation',url:'https://www.masonite.com/discover-and-learn/how-to-install-interior-doors/'}
 };
 return null;
}
