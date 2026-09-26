import test from 'node:test';
import assert from 'node:assert/strict';
import {inches,length,parseLength,measurementText} from '../lib/units.mjs';
import {workshopModel,workshopDefaults,workshopProgress} from '../lib/bookcase-workshop.mjs';
import {workshopArt} from '../lib/bookcase-workshop-art.mjs';
import {flatten} from '../lib/workspace-sync.mjs';
test('Imperial entry accepts fractions, feet and unicode tape-measure notation',()=>{
 for(const raw of ['23 1/2','23½','1 ft 11 1/2 in',`1′ 11½″`])assert.equal(parseLength(raw,'imperial'),596.9);
 assert.equal(parseLength('2 ft','imperial'),609.6);
 for(const raw of ['1/0','1/1','abc','-2','2 ft garbage'])assert.ok(Number.isNaN(parseLength(raw,'imperial')));
});
test('Display never substitutes nominal or rounded fractions for actual thickness',()=>{
 assert.equal(inches(19.05),'3/4');assert.equal(inches(19),'0.748');assert.equal(inches(18),'0.7087');
 assert.equal(length(609.6,'imperial'),'24 in');assert.equal(measurementText('180 grit and 18 mm board','imperial'),'180 grit and 0.7087 in (18 mm) board');
});
test('Fractional imperial dimensions preserve cut geometry and unit toggles preserve progress',()=>{
 const input={...workshopDefaults,width:parseLength('24','imperial'),height:parseLength('36','imperial'),depth:parseLength('12','imperial')};
 const d=workshopModel(input),copy=JSON.stringify(d),progress=workshopProgress(d,{},{});
 assert.equal(d.parts[1].length,573.6);
 assert.match(workshopArt(d,'overview',{units:'imperial'}),/24 in/);
 assert.match(workshopArt(d,'overview',{units:'metric'}),/609.6 mm/);
 assert.equal(JSON.stringify(d),copy);assert.equal(workshopProgress(d,{},progress).key,progress.key);
});
test('Measurement preference is included in account sync',()=>{
 const values={'kitsley-units':'imperial'},storage={getItem:k=>values[k]??null,length:1,key:()=> 'kitsley-units'};
 assert.equal(flatten(storage)['preference:kitsley-units'],'imperial');
});
