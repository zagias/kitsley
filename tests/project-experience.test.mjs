import test from 'node:test';
import assert from 'node:assert/strict';
import {validateQuote,quoteTotal,compareQuotes,budgetLabel} from '../lib/project-experience.mjs';
const base={itemId:'drill',retailer:'Store A',spec:'Model 123',quantity:2,price:10,delivery:5,tax:2,compatible:true};
test('Compare the delivered total, not the lower sticker price',()=>{const a={...base,id:'a'},b={...base,id:'b',retailer:'Store B',price:8,delivery:20};assert.equal(quoteTotal(a),27);const result=compareQuotes([a,b]);assert.equal(result[0].best.id,'a');assert.equal(result[0].difference,11);});
test('Different quantities, specifications or unchecked suitability cannot win a comparison',()=>{for(const patch of [{quantity:3},{spec:'Model 999'},{compatible:false},{itemId:'saw'}])assert.equal(compareQuotes([base,{...base,...patch}]).length,0);});
test('Quote validation rejects missing amounts, unknown items, negative values and fractional quantities',()=>{assert.equal(validateQuote(base,['drill']).retailer,'Store A');for(const patch of [{itemId:'unknown'},{price:-1},{delivery:''},{tax:Infinity},{quantity:1.5},{spec:''}])assert.throws(()=>validateQuote({...base,...patch},['drill']));});
test('No-cost kit uses plain language without promising a free project',()=>{assert.equal(budgetLabel({min:0,max:0},true),'You have the preparation tools');assert.equal(budgetLabel({min:10,max:20}),'C$10–20');});
