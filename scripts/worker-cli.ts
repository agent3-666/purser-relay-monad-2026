import {readFile} from 'node:fs/promises';import {homedir} from 'node:os';import {join} from 'node:path';
import {httpRpc,type Handoff} from '../src/model.js';import {attempt,recordReceipt} from '../src/worker.js';import {reconcile} from '../src/reconcile.js';import {VerifiedTracker} from '../src/verified.js';import {durable} from '../src/journal.js';
const [action,role,handoffPath,journalPath,outputPath,killMode]=process.argv.slice(2);if(!['workerA','workerB','workerC'].includes(role))throw new Error('Only worker role allowed');
const h=JSON.parse(await readFile(handoffPath,'utf8')) as Handoff,rpc=httpRpc('https://testnet-rpc.monad.xyz');const tracker=new VerifiedTracker('wss://testnet-rpc.monad.xyz',outputPath+'.verified.json');await tracker.start();
try{
 const v=await tracker.next();
 if(action==='consume'){
  const keyfile=JSON.parse(await readFile(join(homedir(),'.config/agent3/purser-relay',role+'.json'),'utf8'));
  const price=BigInt(await rpc('eth_gasPrice',[]));const txHash=await attempt(h,keyfile.key,journalPath,rpc,{maxAttempts:2,maxTotalFeeWei:100000000000000000n,gasLimit:220000n,maxFeePerGas:price*2n+2000000000n},v);
  if(killMode==='kill-after-send'){process.kill(process.pid,'SIGKILL');}
  if(txHash){for(let i=0;i<40;i++){await recordReceipt(journalPath,rpc);const r=await rpc('eth_getTransactionReceipt',[txHash]);if(r){await tracker.next(BigInt(r.blockNumber));break;}await new Promise(r=>setTimeout(r,400));}}
 }
 const resolved=await reconcile(h,rpc,await tracker.next());await durable(outputPath,resolved);console.log(JSON.stringify({payment:resolved.payment,reason:resolved.reason}));
}finally{tracker.close();}
