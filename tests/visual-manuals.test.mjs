import test from 'node:test';
import assert from 'node:assert/strict';
import {library} from '../lib/library.mjs';
import {manualFor,manualHTML,manualProgressKey,normalizeManualOptions} from '../lib/guide-manuals.mjs';
import {manualIllustration,illustrationKinds} from '../lib/manual-illustrations.mjs';
import {urgentTopics,emergencyNotice} from '../lib/urgent-topics.mjs';
import {contentSources} from '../lib/content-sources.mjs';
import {createConversation} from '../lib/conversation.mjs';
import {validateBackup,makeBackup} from '../lib/workspace-backup.mjs';
import {exportProject} from '../lib/project-pack.mjs';
test('Every library entry has an illustrated manual or a focused urgent flow',()=>{
 assert.equal(library.length,77);
 for(const entry of library){const m=manualFor(entry.id);if(!m){assert.ok(urgentTopics[entry.id],entry.id);continue;}
  assert.ok(m.steps.length>=3,entry.id);
  for(const s of m.steps){assert.ok(illustrationKinds.includes(s.visual),entry.id+': '+s.visual);assert.ok(s.tools.length>0);for(const key of ['title','spec','action','check'])assert.ok(s[key]?.trim(),entry.id+': '+key);assert.match(manualIllustration(s.visual,s.title),/role="img"/);}
  for(const id of m.sources)assert.ok(contentSources[id]?.url.startsWith('https://'),id);
 }
});
test('Cabinet instructions actually branch by material and expose coating choices in the export',()=>{
 assert.match(manualFor('paint-cabinets',{surface:'wood'}).steps[1].spec,/150.*220/);
 assert.match(manualFor('paint-cabinets',{surface:'laminate'}).steps[1].spec,/220.*finer/);
 assert.match(manualFor('paint-cabinets',{surface:'laminate'}).steps[2].spec,/bonding primer/);
 assert.equal(manualFor('paint-cabinets',{surface:'laminate'}).steps[1].visual,'sand-surface');
 assert.match(manualFor('paint-cabinets',{surface:'mdf'}).steps[1].spec,/120/);
 assert.match(manualFor('paint-cabinets').steps[1].spec,/Identify/);
 assert.deepEqual(normalizeManualOptions({surface:'<script>'}),{surface:'unknown'});
 const html=manualHTML('paint-cabinets',{surface:'laminate'});assert.match(html,/Cabinet|cabinet/);assert.match(html,/16-hour/);assert.match(html,/STIX/);assert.equal((html.match(/<svg/g)||[]).length,5);assert.match(html,/old paint may contain lead/);
 assert.doesNotMatch(manualIllustration('sand','<script>alert(1)</script>'),/<script>/);
});
test('Selected material and completed steps survive backup; changed material invalidates progress',()=>{
 let r={...createConversation('Paint cabinets','manual-backup'),guideId:'paint-cabinets',manualOptions:{surface:'laminate'}};
 const key=manualProgressKey(r);r.instructionProgress={key,active:2,done:[0,1],scopeAccepted:true};
 const clean=validateBackup(makeBackup([r],[],[])).conversations[0];assert.deepEqual(clean.manualOptions,{surface:'laminate'});assert.deepEqual(clean.instructionProgress.done,[0,1]);
 const changed={...r,manualOptions:{surface:'wood'}};assert.notEqual(manualProgressKey(changed),key);assert.equal(validateBackup(makeBackup([changed],[],[])).conversations[0].instructionProgress,undefined);
 const check={...createConversation('dripping faucet','check-backup'),guideId:'dripping-faucet'};check.instructionProgress={key:manualProgressKey(check),active:1,done:[0],scopeAccepted:true};assert.equal(validateBackup(makeBackup([check],[],[])).conversations[0].instructionProgress.active,1);
});
test('Saved project exports include the same illustrated actions and no duplicate SVG IDs',()=>{
 const r={...createConversation('Paint cabinets','manual-export'),guideId:'paint-cabinets',manualOptions:{surface:'veneer'}};
 const html=exportProject(r,[],[]);assert.match(html,/220 grit for a light hand scuff/);assert.equal((html.match(/<svg/g)||[]).length,5);const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);
 assert.match(manualHTML('dripping-faucet'),/Moen/);assert.match(manualHTML('small-wall-hole'),/150-grit/);
});
test('Urgent flows keep all immediate actions together without unsafe shortcuts',()=>{
 assert.match(emergencyNotice,/Leave now/);
 for(const t of Object.values(urgentTopics)){assert.equal(t.actions.length,3);assert.ok(illustrationKinds.includes(t.visual));}
 const flood=JSON.stringify(urgentTopics['basement-flood']);assert.match(flood,/Stay out/);assert.match(flood,/electric utility/);assert.match(flood,/dry, safe/);
 const gas=JSON.stringify(urgentTopics.gas);assert.match(gas,/No switches, appliances, flames or phone calls indoors/);assert.match(gas,/Do not attempt the gas shutoff/);
 assert.match(JSON.stringify(urgentTopics['ceiling-leak']),/Do not poke/);
});
