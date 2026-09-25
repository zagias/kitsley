import test from 'node:test';
import assert from 'node:assert/strict';
import {workshopDefaults,workshopModel,workshopOptions,workshopProgress,workshopTools,workshopSupplies,workshopShopping,workshopSteps} from '../lib/bookcase-workshop.mjs';
import {workshopArt} from '../lib/bookcase-workshop-art.mjs';
import {workshopHTML,workshopCutCSV} from '../lib/bookcase-workshop-export.mjs';
import {makeBackup,validateBackup} from '../lib/workspace-backup.mjs';
import {shoppingRows,exportProject} from '../lib/project-pack.mjs';

test('Workshop parts reconstruct the entered cabinet and preserve shelf datums across supported sizes',()=>{
 for(const width of [400,620,650])for(const height of [750,900,1000])for(const depth of [250,300,350])for(const thickness of [18,19])for(const shelves of [1,2,3]){
  const d=workshopModel({width,height,depth,thickness,shelves}),[a,b,c,back]=d.parts;
  assert.equal(a.thickness*2+b.length,width);assert.equal(a.width+back.thickness,depth);
  assert.equal(back.length,height);assert.equal(back.width,width);assert.equal(c.qty,shelves);
  assert.equal(d.parts.reduce((n,p)=>n+p.qty,0),d.partCount);
  assert.ok(Math.abs(d.opening*(shelves+1)+(shelves+2)*thickness-height)<1e-8);
  d.datums.forEach((datum,i)=>assert.ok(Math.abs(datum-(thickness+d.opening*(i+1)+thickness*i))<1e-8));
  assert.equal(d.pocketCount,6*(b.qty+c.qty));
  assert.ok(d.holeOffsets.every(x=>x>=25&&x<=d.panelDepth-25));
 }
});
test('Unsupported dimensions are rejected without altering existing input',()=>{
 for(const change of [{width:800},{height:1200},{depth:400},{thickness:21},{shelves:4},{width:'abc'},{thickness:18.5},{height:600,shelves:3}]){
  const input={...workshopDefaults,...change},before={...input};assert.throws(()=>workshopModel(input));assert.deepEqual(input,before);
 }
});
test('Back schedule lands on panel centrelines with unique screws, controlled spacing and matching purchase count',()=>{
 for(const input of [workshopDefaults,{width:650,height:1000,depth:350,thickness:19,shelves:3},{width:400,height:600,depth:250,thickness:18,shelves:1}]){
  const d=workshopModel(input),edge=d.thickness/2,rows=[edge,...d.datums.map(x=>x+edge),d.height-edge];
  assert.equal(new Set(d.backScrews.map(p=>`${p.x}:${p.y}`)).size,d.backScrews.length);
  for(const p of d.backScrews){assert.ok(p.x>0&&p.x<d.width&&p.y>0&&p.y<d.height);assert.ok(p.x===edge||p.x===d.width-edge||rows.includes(p.y));}
  for(const y of rows){const xs=d.backScrews.filter(p=>p.y===y).map(p=>p.x).sort((a,b)=>a-b);for(let i=1;i<xs.length;i++)assert.ok(xs[i]-xs[i-1]<=150.000001);}
  assert.equal(workshopSupplies(d).find(p=>p.id==='back-screws').qty,d.backScrews.length+4);
 }
});
test('Build progress survives unchanged geometry but resets after a design or method change',()=>{
 const d=workshopModel(),o=workshopOptions(),p=workshopProgress(d,o);Object.assign(p,{stage:'build',active:6,done:[0,1,1,2,-1,10,'3']});
 assert.deepEqual(workshopProgress(d,o,p).done,[0,1,2]);assert.equal(workshopProgress(d,o,p).active,6);
 for(const [model,options] of [[workshopModel({...workshopDefaults,width:620}),o],[d,{...o,finish:'paint'}],[d,{...o,cutting:'self'}]]){
  const next=workshopProgress(model,options,p);assert.deepEqual(next.done,[]);assert.equal(next.active,0);
 }
 assert.equal(workshopProgress(d,o,{...p,active:99}).active,8);
 assert.deepEqual(workshopOptions({finish:'<script>',cutting:'anything',wall:'unknown'}),o);
});
test('Shopping checks ownership and allocates stock once while retaining consumable quantities',()=>{
 const d=workshopModel(),stock=[{name:'Sound offcut',length:900,width:294,thickness:18,qty:1,sound:true}],rows=workshopShopping(d,{},['tape','pocket-screws'],stock);
 assert.equal(rows.find(r=>r.id==='tape').owned,true);assert.equal(rows.find(r=>r.id==='pocket-screws').owned,false);
 assert.equal(rows.find(r=>r.id==='wood-A').qty,1);assert.equal(rows.find(r=>r.id==='wood-B').qty,2);assert.equal(rows.find(r=>r.id==='wood-C').qty,2);
 assert.ok(!workshopTools().some(p=>p.id==='saw'));assert.ok(workshopTools({cutting:'self'}).some(p=>p.id==='saw'));
 assert.ok(workshopTools({wall:'stud'}).some(p=>p.id==='stud-finder'));
 for(const p of workshopTools({wall:'stud',cutting:'self'}))assert.ok(p.id&&p.name);
 assert.ok(workshopSupplies(d,{finish:'paint'}).some(p=>p.id==='wood-primer'));assert.ok(!workshopSupplies(d,{finish:'paint'}).some(p=>p.id==='clearcoat'));
});
test('Every build step has a unique usable illustration; print and shopping exports use the saved design',()=>{
 const input={...workshopDefaults,width:620,shelves:3},d=workshopModel(input),o={finish:'paint'},steps=workshopSteps(d,o),html=workshopHTML(input,o);
 assert.equal(steps.length,9);assert.equal(new Set(steps.map(s=>s.visual)).size,9);
 for(const s of steps){assert.equal(s.actions.length,2);const svg=workshopArt(d,s.visual,o,'test-'+s.id);assert.match(svg,/role="img"/);assert.doesNotMatch(svg,/NaN|undefined|Infinity/);assert.match(html,new RegExp(s.title));}
 assert.equal((html.match(/<svg /g)||[]).length,10);const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 assert.match(workshopCutCSV(d),/C,Interior shelf,3,584,294,18/);
 const record={guideId:'bookcase',answers:{},pack:{input,build:{version:1,options:o}}};
 assert.match(exportProject(record,[],[]),/620 W × 900 H/);assert.equal(shoppingRows(record,[],[]).find(r=>r.id==='wood-C').qty,3);
 assert.match(html,/180/);assert.match(html,/220/);assert.match(html,/1¼/);assert.match(html,/Bulls Eye/);
});
test('Backup preserves the workshop and sanitizes stale completion after dimensions change',()=>{
 const d=workshopModel(),build=workshopProgress(d,{});Object.assign(build,{stage:'build',active:4,done:[0,1]});
 const r={id:'book-test',version:1,guideId:'bookcase',request:'Bookcase',answers:{},messages:[],pack:{version:1,input:workshopDefaults,build}};
 const restored=validateBackup(makeBackup([r],[],[])).conversations[0];assert.deepEqual(restored.pack.build,build);
 const changed={...r,pack:{...r.pack,input:{...workshopDefaults,width:620}}};assert.deepEqual(validateBackup(makeBackup([changed],[],[])).conversations[0].pack.build.done,[]);
});
