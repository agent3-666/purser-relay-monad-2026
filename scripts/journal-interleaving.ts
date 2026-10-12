import {mkdtemp,readFile,writeFile,rm,access} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawn} from 'node:child_process';import {durable,lease,readJson} from '../src/journal.js';
const source=await readFile('src/worker.ts','utf8');const results=[];
for(const broken of [false,true]){
 const temp=await mkdtemp(join(tmpdir(),'relay-interleave-'));const path=join(temp,'journal.json'),marker=join(temp,'read-marker'),resume=join(temp,'resume');
 const initial={schema:'purser-worker-v1',orderId:'test',worker:'worker',attempts:[{state:'receipt',raw:'0x5678',txHash:'0x'+'b'.repeat(64),gasLimit:'100000',maxFeePerGas:'5'}]};const signed={...initial,attempts:[...initial.attempts,{state:'signed',raw:'0x1234',txHash:'0x'+'a'.repeat(64),gasLimit:'100000',maxFeePerGas:'5'}]};await durable(path,initial);
 let s=source;
 if(broken)s=s.replace("const release=await lease(path+'.lock');\n try{\n  const j=await readJson<Envelope>(path);if(!j)return;","const j=await readJson<Envelope>(path);if(!j)return;\n const release=await lease(path+'.lock');\n try{");
 // Insert a test-only barrier precisely after the journal read. On the fixed source the lease is already held.
 const readPoint='const j=await readJson<Envelope>(path);if(!j)return;';
 s=s.replace(readPoint,readPoint+` await (await import('node:fs/promises')).writeFile(${JSON.stringify(marker)},'read'); while(true){try{await (await import('node:fs/promises')).access(${JSON.stringify(resume)});break;}catch{await new Promise(r=>setTimeout(r,10));}} `);
 const module='src/.interleave-'+process.pid+(broken?'-bad':'-good')+'.ts';const childScript='scripts/.interleave-'+process.pid+(broken?'-bad':'-good')+'.ts';await writeFile(module,s);await writeFile(childScript,`import {recordReceipt} from '../${module.replace('.ts','.js')}'; await recordReceipt(${JSON.stringify(path)},async()=>null);`);
 let childOutput='';const child=spawn(process.execPath,['--import','tsx',childScript],{stdio:['ignore','pipe','pipe']});child.stderr.on('data',d=>childOutput+=d);const done=new Promise<number|null>(resolve=>child.on('exit',resolve));
 let ready=false;for(let i=0;i<300;i++){try{await access(marker);ready=true;break;}catch{await new Promise(r=>setTimeout(r,10));}}if(!ready)throw new Error('Interleave marker absent '+childOutput);
 let signerBlocked=false;try{const release=await lease(path+'.lock');await durable(path,signed);await release();}catch(e){if((e as any).code==='EEXIST')signerBlocked=true;else throw e;}
 await writeFile(resume,'resume');await done;
 if(signerBlocked){const release=await lease(path+'.lock');await durable(path,signed);await release();}
 const actual=await readJson<any>(path);const preserved=actual.attempts.length===2&&actual.attempts[0].raw==='0x5678'&&actual.attempts[0].txHash==='0x'+'b'.repeat(64)&&actual.attempts[1].raw==='0x1234'&&actual.attempts[1].txHash==='0x'+'a'.repeat(64);results.push({broken,signerBlocked,preserved,attemptsAfter:actual.attempts.length,preservedBothRawTransactions:preserved,fixture:'synthetic transaction placeholders, not live signed transactions'});await rm(module);await rm(childScript);await rm(temp,{recursive:true,force:true});
}
await durable('evidence/journal-interleaving.json',results);if(!results[0].preserved||results[1].preserved)throw new Error('Precise read/lease regression was not caught');console.log(results);
