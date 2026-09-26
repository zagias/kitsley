// Narrow, source-scoped diagnostic prompts. These never authorize construction,
// produce dimensions, or turn an incomplete assessment into a completed plan.
export const diagnosticGuidanceVersion='2026-09-26.1';
export function diagnosticGuidance(question=''){
 const q=String(question).toLowerCase();
 if(/\bcabinet\b/.test(q)&&/\b(wall|walls)\b/.test(q)&&/\b(lean|leans|leaning|uneven|plumb)\b/.test(q)&&/\b(pull|force|longer screws)\b/.test(q))return {
  text:'Keep the cabinet square, level and plumb; do not pull it out of shape to follow a leaning wall. The ENHET guide illustrates accommodating unevenness, but its mounting details do not establish the fixings for an unidentified cabinet.',
  question:'How is this cabinet supported: floor-standing, wall-hung on a rail, fixed through mounting rails or brackets, or unsure?',
  source:{title:'IKEA ENHET installation guide — system-specific example',url:'https://www.ikea.com/ca/en/files/pdf/e6/c6/e6c6ba46/enhet-kitchen-installation-guide-fy24-l1-en.pdf'}
 };
 return null;
}
