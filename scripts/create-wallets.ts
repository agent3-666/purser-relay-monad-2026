import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {homedir} from 'node:os';import {join} from 'node:path';import {mkdir,open,readFile,chmod} from 'node:fs/promises';
const dir=join(homedir(),'.config/agent3/purser-relay');await mkdir(dir,{recursive:true,mode:0o700});await chmod(dir,0o700);const path=join(dir,'testnet-wallets.json');
let wallets:any;try{wallets=JSON.parse(await readFile(path,'utf8'));}catch(e){if((e as any).code!=='ENOENT')throw e;wallets={};for(const role of ['owner','workerA','workerB','workerC','seller']){const key=generatePrivateKey();wallets[role]={key,address:privateKeyToAccount(key).address};}const f=await open(path,'wx',0o600);await f.writeFile(JSON.stringify(wallets));await f.sync();await f.close();}
console.log(JSON.stringify({secretPath:path,addresses:Object.fromEntries(Object.entries(wallets).map(([k,v]:any)=>[k,v.address]))},null,2));
