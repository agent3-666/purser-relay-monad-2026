import {readFile,mkdir,writeFile} from 'node:fs/promises';import {homedir} from 'node:os';import {join} from 'node:path';import {keccak256} from 'viem';
import {artifact,httpRpc} from '../src/model.js';import {ownerTx} from '../src/owner.js';import {durable,readJson} from '../src/journal.js';import {VerifiedTracker} from '../src/verified.js';
const rpc=httpRpc('https://testnet-rpc.monad.xyz'),dir=join(homedir(),'.config/agent3/purser-relay');const owner=JSON.parse(await readFile(join(dir,'owner.json'),'utf8'));
await mkdir('runtime/testnet',{recursive:true});const tracker=new VerifiedTracker('wss://testnet-rpc.monad.xyz','evidence/testnet-verified-heads.json');await tracker.start();
try{
 let deployment:any=await readJson('evidence/testnet-deployment.json');
 if(!deployment){const r=await ownerTx(rpc,owner.key,'runtime/testnet/deploy.json',10143,{data:artifact.bytecode.object,gas:2000000n});if(r.receipt.status!=='0x1')throw new Error('Deploy reverted');await tracker.next(BigInt(r.receipt.blockNumber));const contract=r.receipt.contractAddress;const code=await rpc('eth_getCode',[contract,'latest']);deployment={...r,chainId:10143,contract,codehash:keccak256(code),owner:owner.address,verifiedSnapshot:tracker.latest};await durable('evidence/testnet-deployment.json',deployment);}
 for(const role of ['workerA','workerB','workerC']){
  const wallet=JSON.parse(await readFile(join(dir,role+'.json'),'utf8'));const balance=BigInt(await rpc('eth_getBalance',[wallet.address,'latest']));
  if(balance<10000000000000000n&&!await readJson('runtime/testnet/fund-'+role+'.json')){const r=await ownerTx(rpc,owner.key,'runtime/testnet/fund-'+role+'.json',10143,{to:wallet.address,value:100000000000000000n,gas:21000n});await durable('evidence/fund-'+role+'.json',r);}
 }
 console.log(JSON.stringify({contract:deployment.contract,chainId:10143,owner:owner.address,ownerBalance:await rpc('eth_getBalance',[owner.address,'latest'])}));
}finally{tracker.close();}
