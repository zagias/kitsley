import {runPilotPair} from '../lib/learning-pilot.mjs';
const encoded=process.argv[2]||'';
if(!/^[A-Za-z0-9+/=]+$/.test(encoded)||encoded.length>30000)throw Error('Provide a bounded base64 evidence packet');
try{const packet=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));console.log(JSON.stringify(await runPilotPair(packet,{apiKey:process.env.OPENAI_API_KEY})));}
catch(e){console.log(JSON.stringify({status:'failed',error:e.message,publication:'not-published',retry:'Requires a new budget reservation'}));process.exitCode=1;}
