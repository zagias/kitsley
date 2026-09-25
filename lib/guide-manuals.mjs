import {contentFor,contentProgressKey} from './project-content.mjs';
import {stepDetails,finishSurfaces,cabinetPaint,manualVersion} from './manual-details.mjs';
import {libraryChecks} from './library-checks.mjs';
import {contentSources} from './content-sources.mjs';
import {manualIllustration} from './manual-illustrations.mjs';
export {finishSurfaces,cabinetPaint,manualVersion};
export const hasManual=id=>Boolean(stepDetails[id]||libraryChecks[id]);
export const isPaintManual=id=>id==='paint-cabinets'||id==='refinish';
export const normalizeManualOptions=options=>({surface:Object.hasOwn(finishSurfaces,options?.surface)?options.surface:'unknown'});
const paintTitles=['Label, remove & clean','Sand the right way','Prime & test a sample','Paint the doors','Let it cure & refit'];
const paintChecks=['Labels match each opening; the surface is grease-free and dry.','The face is evenly dull, with no damaged edges or exposed core.','The complete primer-and-paint sample adheres without peeling or stain bleed.','Coverage is even, without runs or paint in hinge cups.','The coating has reached the stated handling time and doors close without sticking.'];
const extraSources={
 'paint-cabinets':['cabinetHowTo','cabinetSanding','laminateHowTo','mdfPaint','advance','emerald'],
 refinish:['cabinetHowTo','cabinetSanding','laminateHowTo','mdfPaint','advance','emerald'],
 'small-wall-hole':['drywallSanding'], 'sticking-door':['hingeRepair'], 'squeaky-hinge':['hingeRepair'],
 'dripping-faucet':['faucetParts'], 'large-drywall-patch':['drywall','drywallSanding'], 'drywall-seam':['drywall','drywallSanding']
};
export function manualFor(id,options={}){
 const base=contentFor(id),check=libraryChecks[id],details=stepDetails[id];
 if(!base&&!check)return null;
 const surface=finishSurfaces[normalizeManualOptions(options).surface];
 const steps=base?base.steps.map((s,i)=>({...s,...details[i],action:details[i].how,more:s.action})):check.steps.map(s=>({...s,more:''}));
 const categoryScenes={
  'dripping-faucet':'cartridge','running-toilet':'toilet','showerhead':'shower','leaking-pipe':'plumbing','sink-trap':'plumbing','pex-line':'plumbing',
  'light-fixture':'electrical','smart-switch':'electrical','flickering-light':'electrical','outdoor-lighting':'electrical',
  'large-drywall-patch':'patch','drywall-sheet':'patch','drywall-seam':'patch','drywall-anchor':'mount','wall-texture':'patch',
  'bath-fan':'appliance','dryer-vent':'appliance','washer-hoses':'appliance','dishwasher-drain':'appliance','fridge-seal':'seal',
  'loose-tile':'pavers','backsplash':'pavers','floor-scratch':'inspect','cabinet-doors':'hinge','door-handle':'hinge','curtain-rail':'mount',
  'hose-leak':'hose','lawn-bare-patch':'plants','plant-selection':'plants','paver-path':'pavers','paver-patio':'pavers','paver-edging':'pavers'
 };
 for(const step of steps){if(step.visual==='parts'&&categoryScenes[id])step.visual=categoryScenes[id];if(id==='showerhead')step.visual='shower';if(id==='paint-room'&&['prime','paint'].includes(step.visual))step.visual='wallpaint';if(id==='small-wall-hole'&&step.visual==='sand')step.visual='wallsand';if(id==='small-wall-hole'&&step.visual==='paint')step.visual='wallpaint';}
 if(id==='paint-cabinets')steps.forEach((s,i)=>{s.title=paintTitles[i];s.check=paintChecks[i];s.more='';});
 if(isPaintManual(id)){
  const sand=id==='paint-cabinets'?1:3;
  steps[sand]={...steps[sand],visual:['laminate','mdf','unknown'].includes(normalizeManualOptions(options).surface)?'sand-surface':'sand',spec:surface.grit,action:surface.sand,caution:'Unknown old paint may contain lead. Resolve coating hazards before sanding; use dust extraction and the product’s protective equipment.'};
  if(id==='refinish'){steps[2].title='Choose a furniture paint';steps[2].action='For an opaque finish, choose a cabinet or furniture enamel and a primer compatible with the surface. Test the complete coating on a hidden area first.';steps[2].spec='This route covers painting. Clear finishes and stripping need a separate product-specific method.';}
  if(id==='paint-cabinets'){
   steps[2].spec=surface.primer;
   steps[3].spec='Cabinet & trim enamel · satin or semi-gloss';
   steps[4].more=cabinetPaint.timing;
  }
 }
 if(id==='small-wall-hole')steps[3].caution='Resolve old-paint or suspect material hazards before abrasion. Do not sand a damp or mouldy repair.';
 return {id,version:manualVersion,level:base?.level||'check',label:base?.level==='procedure'?'Step-by-step':base?.level==='design'?'Design & preparation':base?'System planning':'Check & plan',scope:base?.scope||check.need,stop:base?.stop||'',need:check?.need,steps,sources:[...new Set([...(base?.sources||[]),...(extraSources[id]||[])])]};
}
export function manualProgressKey(record){return JSON.stringify([contentProgressKey(record),manualVersion,isPaintManual(record.guideId)?normalizeManualOptions(record.manualOptions):null]);}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function manualHTML(id,options={}){
 const m=manualFor(id,options);if(!m)return '';
 const surface=finishSurfaces[normalizeManualOptions(options).surface];
 return `<section class="export-manual"><h2>${esc(m.label)}</h2><p>${esc(m.scope)}</p>${m.stop?`<p><strong>Before starting:</strong> ${esc(m.stop)}</p>`:''}${isPaintManual(id)?`<h3>Surface: ${esc(surface.label)}</h3><p>${esc(surface.grit)}</p><p>${esc(surface.primer)}</p><h3>Paint to look for</h3><p>${esc(cabinetPaint.description)}</p><p>${esc(cabinetPaint.timing)}</p>`:''}${m.steps.map((s,i)=>`<section style="break-inside:avoid;margin:2rem 0"><h3>${i+1}. ${esc(s.title)}</h3><div style="max-width:420px">${manualIllustration(s.visual,s.title)}</div><p><strong>Have ready:</strong> ${s.tools.map(esc).join(', ')}</p><p><strong>Size / setting:</strong> ${esc(s.spec)}</p><p>${esc(s.action)}</p>${s.caution?`<p><strong>Before this action:</strong> ${esc(s.caution)}</p>`:''}${s.more&&s.more!==s.action?`<p>${esc(s.more)}</p>`:''}<p><strong>Check:</strong> ${esc(s.check)}</p></section>`).join('')}<h3>References and scope</h3><p>Illustrations explain the action; they are not to scale. Use the exact product instructions for fixing sizes, loads and coating times.</p><ul>${m.sources.map(id=>{const s=contentSources[id];return `<li><a href="${esc(s.url)}">${esc(s.title)}</a> — ${esc(s.scope)}</li>`;}).join('')}</ul></section>`;
}
