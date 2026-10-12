import {recordReceipt} from '../src/worker.js';
// Test helper for exact OS-process contention, never a public network endpoint.
const [path,endpoint]=process.argv.slice(2);let count=0;await recordReceipt(path,async()=>{count++;const r=await fetch(endpoint);return r.json();});console.log(JSON.stringify({calls:count}));
