// Routing describes the user's requested interaction, never its safety or authority.
// Unknown projects keep the broader assessment. Follow-ups inherit the original
// question only when they do not themselves introduce a new project/design.
const direct=/^(?:please\s+)?(?:how\b|why\b|what\b|which\b|explain\b|can\s+i\b|should\s+i\b|is\s+(?:it|this|there)\b)/i;
const design=/\b(?:design|cut\s*list|convert|conversion|load[- ]bearing|structural|custom|non[- ]standard)\b/i;
const problem=/\b(?:leak(?:s|ing)?|drip(?:s|ping)?|rubs?|trips?|tripping|orange peel|crack(?:s|ing)?|won[’']t|not working|uneven|leans?|leaning)\b/i;
export function advicePurpose(record={},question='',messages=[]){
 const latest=String(question||'').trim();
 const original=String(record.request||messages.find(m=>m.role==='user')?.content||latest).trim();
 const standalone=direct.test(latest)||design.test(latest);
 const focus=standalone?latest:original;
 if(design.test(focus))return {kind:'project-design',direct:false,assessmentRequired:true};
 if(direct.test(focus)||problem.test(focus))return {kind:problem.test(focus)?'troubleshoot':'explain-or-instruct',direct:true,assessmentRequired:false};
 return {kind:'project-planning',direct:false,assessmentRequired:true};
}
export const advicePurposeInstructions=` Match the interaction to the user's purpose. For explain-or-instruct, answer the question first; do not turn an explanation into project onboarding or ask for a brief confirmation. For troubleshoot, explain what is known, what remains uncertain, and the next useful observation without declaring a diagnosis from missing evidence. For project-design, clarify consequential ambiguity and use only supported design operations. When the user supplies a requested fact, advance using that answer; do not ask the same question again. A new direct question takes precedence over the previous planning agenda. A general explanation can be useful even when an installation-specific recommendation is not yet possible. Separate those scopes explicitly. Use technicalAssessment only when a material/method/design decision actually needs it; do not require all construction topics for a vocabulary or equipment explanation. Safety and evidence requirements apply to every purpose, including simple explanations.`;
