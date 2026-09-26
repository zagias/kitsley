import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSearch,normalizeResults,publicUrl,sortOffers,suitableOffer} from '../lib/retailer-search.mjs';
const input={query:'18V drill',country:'CA',location:'M5V 2T6',radius:25,quantity:1,mode:'both'};
test('retailer input requires location and bounds radius and quantity',()=>{assert.equal(validateSearch(input).radius,25);for(const patch of [{location:''},{radius:0},{radius:201},{quantity:0},{country:''},{mode:'bad'}])assert.throws(()=>validateSearch({...input,...patch}));assert.deepEqual(validateSearch({...input,location:'',coordinates:{latitude:43.123456,longitude:-79.123456}}).coordinates,{latitude:43.123,longitude:-79.123});});
test('only retrieved public source URLs appear in offers; unknown prices stay unknown',()=>{const url='https://retailer.example/drill';const data={output:[{action:{sources:[{url}]}},{content:[{type:'output_text',text:JSON.stringify({offers:[{url,retailer:'Store',price:null,currency:'CAD',channel:'online'},{url:'https://invented.example/drill',price:5,currency:'CAD'}]})}]}]};const result=normalizeResults(data,input);assert.equal(result.offers.length,1);assert.equal(result.offers[0].price,null);assert.equal(result.offers[0].availability,'Check with retailer');assert.equal(result.offers[0].distanceVerified,false);});
test('unsafe retailer links are rejected',()=>{for(const url of ['javascript:alert(1)','https://127.0.0.1/foo','https://10.1.1.1/foo','https://user:pass@store.example/','http://store.example/'])assert.equal(publicUrl(url),null);});
test('price sort groups currency and puts unknown prices last',()=>{const sorted=sortOffers([{price:null,currency:'CAD'},{price:3,currency:'USD'},{price:10,currency:'CAD'},{price:5,currency:'CAD'}],'price');assert.deepEqual(sorted.map(o=>o.price),[5,10,null,3]);});
test('online results cannot leak into local-only results',()=>{const url='https://retailer.example/item';const data={output:[{action:{sources:[{url}]}},{content:[{type:'output_text',text:JSON.stringify({offers:[{url,channel:'online'}]})}]}]};assert.equal(normalizeResults(data,{...input,mode:'local'}).offers.length,0);});
test('Small bookcase purchases exclude bulk packs and incompatible joint screws',()=>{
 const q={...input,query:'1¼ in (32 mm) coarse-thread pocket screws',quantity:28};
 const good={product:'Kreg 1-1/4 inch coarse pocket-hole screws',unit:'pack of 100'};
 assert.equal(suitableOffer(good,q),true);
 for(const patch of [{unit:'pack of 5000'},{unit:'1,200-count'},{product:'Precision #10 hex head washer screws'},{product:'Kreg 2 inch coarse pocket-hole screws'},{product:'Kreg 1-1/4 inch fine pocket-hole screws'},{match:'Thread size differs from requested specification.'}])assert.equal(suitableOffer({...good,...patch},q),false);
 assert.equal(suitableOffer({...good,unit:'pack of 5000'},{...q,quantity:900}),true);
});
