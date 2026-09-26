import test from 'node:test';import assert from 'node:assert/strict';
import {jurisdictionContext} from '../lib/jurisdiction-context.mjs';
import {engineContext} from '../lib/project-engine.mjs';
const at={now:Date.parse('2026-09-26T18:00:00Z')},record=location=>({safetyFacts:{location}});
test('Toronto exception does not spread across Ontario or to other cities',()=>{
 for(const location of ['Ontario','Ottawa, Ontario','Hamilton, Ontario','Vancouver, British Columbia'])assert.ok(!jurisdictionContext(record(location),'Do my cabinet renovations need a permit?',at).references.some(r=>r.id==='toronto-permits'));
 assert.ok(jurisdictionContext(record('Toronto, Ontario'),'Do cabinets need a permit?',at).references.some(r=>r.id==='toronto-permits'));
});
test('location conflicts require clarification, including place comparisons',()=>{
 for(const question of ['I moved to Alberta; can I wire this?','Does Ottawa have Toronto permit rules?']){const c=jurisdictionContext(record('Toronto, Ontario'),question,at);assert.equal(c.status,'clarify-location');assert.deepEqual(c.references,[]);}
});
test('currency and ordinary finishing do not trigger a location interrogation',()=>{
 const c=jurisdictionContext({currency:'CAD'},'How do I finish plywood?',at);assert.equal(c.province,null);assert.equal(c.locationNeeded,false);
});
test('current question place names remain unconfirmed',()=>{
 assert.equal(jurisdictionContext({},'Ontario electrical code?',at).status,'confirm-mentioned-location');
});
test('expired technical statements are withheld but primary research targets remain',()=>{
 const c=jurisdictionContext(record('Ontario'),'Where are CO alarms required?',{now:Date.parse('2027-01-01')});assert.equal(c.referenceStatus,'review-due');assert.deepEqual(c.references,[]);assert.ok(c.researchTargets.some(r=>r.id==='ontario-co-2026'));
});
test('Ontario electrical case keeps permit, inspection and edition checks',()=>{
 const c=jurisdictionContext(record('Ontario'),'Can I close drywall over the new wiring?',at);assert.ok(c.references.some(r=>r.id==='ontario-electrical'));assert.ok(c.references.some(r=>r.id==='ontario-electrical-edition'));assert.equal(c.researchRequired,true);
});
test('production engine includes jurisdiction without changing design authority',()=>{
 const c=engineContext(record('Ontario'),'electrical wiring');assert.equal(c.jurisdiction.province,'Ontario');assert.equal(c.capabilities.learn.automaticPublication,false);
});

test('ambiguous city names alone do not establish Ontario',()=>{for(const city of ['London','Kingston','Toronto'])assert.equal(jurisdictionContext(record(city),'Do I need a building permit?',at).province,null);});
