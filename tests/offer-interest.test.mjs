import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {POST} from '../app/api/offer-interest/route.js';
import {readStore} from '../lib/store.mjs';
test('Offer research validates requests and replaces a browser preference rather than counting repeat votes',async()=>{const dir=await mkdtemp(join(tmpdir(),'kitsley-interest-test-'));process.env.KITSLEY_DATA_DIR=dir;const clientId=randomUUID();const request=(offerId,origin='http://localhost')=>new Request('http://localhost/api/offer-interest',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({clientId,offerId})});try{assert.equal((await POST(request('plus','https://outside.example'))).status,403);assert.equal((await POST(request('made-up'))).status,400);assert.equal((await POST(request('project-pass'))).status,200);assert.equal((await POST(request('plus'))).status,200);const data=await readStore();assert.equal(data.offerInterests.length,1);assert.equal(data.offerInterests[0].offerId,'plus');assert.equal(data.events.length,0);}finally{delete process.env.KITSLEY_DATA_DIR;await rm(dir,{recursive:true,force:true});}});
