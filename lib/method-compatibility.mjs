// Reviewed, narrowly matched method/material corrections. This is an extensible
// preflight registry, not a claim that unmatched combinations are compatible.
export const compatibilityVersion='2026-09-26.1';
const rules=[{
 id:'pex-is-not-soldered',match:q=>/\bpex(?:-[ab])?\b/i.test(q)&&/\b(?:solder\w*|sweat(?:ing)?)\b/i.test(q),
 title:'PEX itself isn’t soldered',
 text:'PEX is plastic tubing. It uses a compatible fitting system, not solder applied to the tubing. If you mean joining it to copper, that is a transition connection: the PEX side and copper side use their own specified connection methods. Keep torch heat away from PEX and heat-sensitive fittings.',
 question:q=>/\bcopper\b/i.test(q)?'Which transition fitting do you have, or are you still choosing one?':'What are you joining the PEX to?',
 choices:q=>/\bcopper\b/i.test(q)?undefined:['Another PEX pipe','Copper pipe','A fixture or valve','I’m not sure'],
 source:{title:'SharkBite PEX systems and connection methods',url:'https://www.sharkbite.com/us/en/pex-pipe-connectors'}
},{
 id:'slip-joint-not-cemented',match:q=>/\b(?:slip[- ]joint|nut.and.washer)\b/i.test(q)&&/\b(?:cement|glue)\b/i.test(q),
 title:'A slip joint seals with a washer',
 text:'For a washer-sealed tubular slip joint, the nut compresses a matching washer. PVC cement is not a repair for those threads. Identify the leaking connection and washer condition before choosing a repair; do not add cement to try to stop the drip.',
 question:()=> 'Is the leak at the removable nut-and-washer connection, or somewhere else?',
 source:{title:'Oatey slip-joint nuts and washers',url:'https://www.oatey.com/products/P_038753005140/oatey-slip-joint-nuts-and-washers'}
},{
 id:'plastic-pipe-no-air-test',match:q=>/\b(?:pvc|cpvc)\b/i.test(q)&&/\b(?:compressed air|air pressure|air[- ]test|test.{0,20}(?:with|using) air)\b/i.test(q),
 title:'Do not use compressed air to test PVC or CPVC',
 text:'Oatey prohibits testing PVC and CPVC pipe systems with compressed air or gas. Handling/set time is also different from full cure time. Use the applicable system manufacturer’s test method and cure requirements; a short waiting period alone does not establish readiness.',
 question:()=> 'Which pipe system and cement product are involved?',
 source:{title:'Oatey solvent-welding instructions and cure limits',url:'https://www.oatey.com/sites/default/files/2020-11/01_HowToSolventWeld_ProdInstructions_LCS358G_0.pdf'}
}];
export function methodCompatibility(question=''){
 const q=String(question),r=rules.find(r=>r.match(q));if(!r)return null;
 return {version:compatibilityVersion,id:r.id,title:r.title,text:r.text,question:r.question(q),choices:r.choices?.(q),source:r.source,reviewedAt:'2026-09-26',authority:'method-correction',constructionApproval:false};
}
export function compatibilityReply(question){const r=methodCompatibility(question);return r?{source:'compatibility',text:r.text+'\n\n'+r.question,compatibility:r,references:[r.source],stepUpdates:[],designProposal:null}:null;}
