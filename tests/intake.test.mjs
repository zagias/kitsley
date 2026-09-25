import test from 'node:test';
import assert from 'node:assert/strict';
import {parseIntake} from '../lib/intake.mjs';
const base={advice:'Keeping fixtures in place can simplify planning.',question:'Would you like to change the look or the layout?',choices:['The look','The layout','Not sure'],facts:[],unknowns:['Scope'],briefReady:false};
test('Discovery keeps actionable advice and choices separate from the transcript',()=>{const r=parseIntake(JSON.stringify(base));assert.match(r.text,/Keeping fixtures/);assert.equal(r.discovery.choices.length,3);assert.equal(r.discovery.briefReady,false);});
test('A claimed brief without enough facts cannot trigger confirmation',()=>{assert.equal(parseIntake(JSON.stringify({...base,briefReady:true})).discovery.briefReady,false);});
test('Long lectures, multiple questions and oversized choice lists are rejected',()=>{for(const patch of [{advice:'word '.repeat(81)},{question:'How big? What budget?'},{choices:['a','b','c','d','e']}])assert.throws(()=>parseIntake(JSON.stringify({...base,...patch})));});
test('A developed brief retains explicit unknowns',()=>{const r=parseIntake(JSON.stringify({...base,facts:['Bathroom renovation','Keep the layout','Budget CAD 5000'],briefReady:true}));assert.equal(r.discovery.briefReady,true);assert.deepEqual(r.discovery.unknowns,['Scope']);});
