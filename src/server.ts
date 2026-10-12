import http from 'node:http';import {readFile} from 'node:fs/promises';import {httpRpc,type Handoff} from './model.js';import {reconcile} from './reconcile.js';import {acceptDelivery} from './delivery.js';import {VerifiedTracker} from './verified.js';import {durable} from './journal.js';
const tracker=new VerifiedTracker('wss://testnet-rpc.monad.xyz','evidence/ui-verified-heads.json');await tracker.start();const rpc=httpRpc('https://testnet-rpc.monad.xyz');
const json=(res:http.ServerResponse,x:unknown,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v));};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url??'/', 'http://127.0.0.1:18813');
 if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'"});res.end(await readFile('ui/index.html'));return;}
 if(req.method==='GET'&&url.pathname==='/api/evidence'){const demo=JSON.parse(await readFile('evidence/testnet-demo.json','utf8'));const fees=JSON.parse(await readFile('evidence/testnet-fee-audit.json','utf8'));return json(res,{demo,fees,stream:{connected:tracker.connected,latest:tracker.latest},mode:'Recorded real Monad testnet run + current read-only reconciliation. Controlled synthetic seller. No public production deployment.'});}
 if(req.method==='POST'&&['/api/recover','/api/artifact'].includes(url.pathname)){
  if(req.headers.origin && req.headers.origin!=='http://127.0.0.1:18813')return json(res,{error:'Origin blocked'},403);
  let body='';for await(const chunk of req){body+=chunk;if(body.length>1024)return json(res,{error:'Request too large'},413);}const key=JSON.parse(body).case;if(!['race','replace','missing'].includes(key))return json(res,{error:'Unknown case'},400);
  const demo=JSON.parse(await readFile('evidence/testnet-demo.json','utf8')),h=demo[key].handoff as Handoff;
  if(url.pathname==='/api/recover'){const v=tracker.connected?await tracker.next():null;const result=await reconcile(h,rpc,v);await durable('evidence/ui-last-recovery.json',{at:new Date().toISOString(),case:key,result});return json(res,result);}
  // Synthetic artifact retrieval uses an already recorded actual Verified acceptance result.
  // No external side effect or new payment; replay is clearly labelled as recorded evidence.
  const artifact=key==='missing'?null:{orderId:h.orderId,requestHash:h.requestHash,synthetic:true,report:'Controlled synthetic report: TEST example data, no external factual attestation.'};return json(res,{basis:'Recorded real testnet Verified result; current live check is separate',delivery:acceptDelivery(h,demo[key].result,artifact)});
 }
 json(res,{error:'Read-only operator workbench: no signing/create/replace/wallet-key API'},404);
}catch(e){json(res,{error:(e as Error).message},500);}});
server.listen(18813,'127.0.0.1',()=>console.log('Purser Relay local workbench http://127.0.0.1:18813 (no wallet keys/signing endpoint)'));
process.on('SIGTERM',()=>{tracker.close();server.close();});
