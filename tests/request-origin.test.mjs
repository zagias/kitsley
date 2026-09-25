import test from 'node:test';
import assert from 'node:assert/strict';
import {isAppOrigin} from '../lib/request-origin.mjs';
const req=(origin,headers={})=>new Request('http://localhost:1234/api/conversation',{headers:{...(origin?{origin}:{}),...headers}});
test('public HTTPS origin works through an internal HTTP proxy',()=>assert.equal(isAppOrigin(req('https://kitsley.example'),'https://kitsley.example'),true));
test('foreign and missing origins remain rejected',()=>{for(const origin of ['https://evil.example','null',null])assert.equal(isAppOrigin(req(origin),'https://kitsley.example'),false);});
test('forwarded headers cannot bypass the configured origin',()=>assert.equal(isAppOrigin(req('https://evil.example',{'x-forwarded-host':'evil.example'}),'https://kitsley.example'),false));
test('local preview uses its direct origin when no public URL is configured',()=>assert.equal(isAppOrigin(req('http://localhost:1234'),''),true));
