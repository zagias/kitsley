import test from 'node:test';
import assert from 'node:assert/strict';
import {inches,length,displayLength,referenceLength,parseLength,measurementText} from '../lib/units.mjs';
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
 assert.equal(length(609.6,'imperial'),'24 in');assert.equal(measurementText('180 grit and 18 mm board','imperial'),'180 grit and 18 mm (≈ 11/16 in) board');
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

test('Readable tape fractions identify approximation and retain exact cutting references',()=>{
 assert.equal(displayLength(194,'imperial'),'≈ 7 5/8 in');
 assert.equal(referenceLength(194,'imperial'),'≈ 7 5/8 in (194 mm)');
 assert.equal(displayLength(19.05,'imperial'),'3/4 in');
 assert.equal(displayLength(609.6,'imperial'),'24 in');
 assert.equal(displayLength(0,'imperial'),'0 in');
 assert.equal(displayLength(0.5,'imperial'),'≈ 0.0197 in');
 assert.equal(inches(194),'7.6378');
 assert.equal(measurementText('Use a 3.5 mm bit','imperial'),'Use a 3.5 mm (≈ 1/8 in) bit');
 assert.equal(referenceLength(27.384375,'imperial'),'1 5/64 in (27.384375 mm)');
 const d=workshopModel({...workshopDefaults,shelfInsets:[0,100]});const before=JSON.stringify(d);
 for(const p of d.parts)for(const n of [p.length,p.width,p.thickness]){displayLength(n,'imperial');referenceLength(n,'imperial');}
 assert.equal(JSON.stringify(d),before);assert.equal(d.shelfPanels[1].width,194);
});
