import {readFile,open} from 'node:fs/promises';import {homedir} from 'node:os';import {join} from 'node:path';
const d=join(homedir(),'.config/agent3/purser-relay');const x=JSON.parse(await readFile(join(d,'testnet-wallets.json'),'utf8'));
for(const [role,wallet] of Object.entries(x)){try{const f=await open(join(d,role+'.json'),'wx',0o600);await f.writeFile(JSON.stringify(wallet));await f.sync();await f.close();}catch(e){if((e as any).code!=='EEXIST')throw e;}}
console.log('Independent role credential files created; worker CLI reads only its own role file.');
