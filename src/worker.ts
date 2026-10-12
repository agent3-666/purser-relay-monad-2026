import {privateKeyToAccount} from 'viem/accounts';
import {keccak256,type Hex} from 'viem';
import {callData,validateHandoff,eq,type Handoff,type Rpc} from './model.js';
import {reconcile} from './reconcile.js';
import type {Verified} from './verified.js';
import {readJson,durable,lease} from './journal.js';
export type Envelope={schema:'purser-worker-v1';orderId:string;worker:string;attempts:{state:'preparing'|'signed'|'broadcast'|'receipt';raw?:Hex;txHash?:Hex;gasLimit:string;maxFeePerGas:string;receipt?:any;chargedFee?:string;error?:string}[]};
export type Budget={maxAttempts:number;maxTotalFeeWei:bigint;gasLimit:bigint;maxFeePerGas:bigint};
export function guardBudget(previous:Envelope|null,b:Budget){if(b.maxAttempts<=0||b.gasLimit<21000n||b.maxFeePerGas<=0n)throw new Error('Invalid gas envelope');const attempts=previous?.attempts??[];if(attempts.length>=b.maxAttempts)throw new Error('Attempt cap reached');const reserved=attempts.reduce((s,a)=>s+BigInt(a.gasLimit)*BigInt(a.maxFeePerGas),0n);if(reserved+b.gasLimit*b.maxFeePerGas>b.maxTotalFeeWei)throw new Error('gasLimit fee envelope exceeded');}
export async function attempt(h:Handoff,key:Hex,journalPath:string,rpc:Rpc,budget:Budget,verified:Verified|null){
 validateHandoff(h);const gate=await reconcile(h,rpc,verified);if(gate.payment==='paid'||gate.payment==='cancelled')return undefined;if(gate.payment!=='unpaid')throw new Error('Payment gate: '+gate.reason);const account=privateKeyToAccount(key);const release=await lease(journalPath+'.lock');
 try{
  let j=await readJson<Envelope>(journalPath);if(j&&(!eq(j.orderId,h.orderId)||!eq(j.worker,account.address)||j.schema!=='purser-worker-v1'))throw new Error('Journal binding mismatch');
  if(j?.attempts.some(a=>a.state==='preparing'||!a.raw))throw new Error('Unknown signing boundary; human handoff required');
  const pending=j?.attempts.find(a=>a.state!=='receipt');if(pending?.raw){try{await rpc('eth_sendRawTransaction',[pending.raw]);}catch(e){pending.error=(e as Error).message;}await durable(journalPath,j);return pending.txHash;}
  if(Number(BigInt(await rpc('eth_chainId',[])))!==h.chainId)throw new Error('Wrong signing chain');
  // This client cannot create, cancel or replace orders; only exact consumeOrder calldata.
  guardBudget(j,budget);j??={schema:'purser-worker-v1',orderId:h.orderId,worker:account.address,attempts:[]};
  const a:Envelope['attempts'][number]={state:'preparing',gasLimit:budget.gasLimit.toString(),maxFeePerGas:budget.maxFeePerGas.toString()};j.attempts.push(a);await durable(journalPath,j);
  const nonce=Number(BigInt(await rpc('eth_getTransactionCount',[account.address,'pending'])));
  const raw=await account.signTransaction({chainId:h.chainId,to:h.contract,data:callData('consumeOrder',[h.orderId,h.requestHash]),value:0n,nonce,gas:budget.gasLimit,maxFeePerGas:budget.maxFeePerGas,maxPriorityFeePerGas:2_000_000_000n});
  a.raw=raw;a.txHash=keccak256(raw);a.state='signed';await durable(journalPath,j);
  try{await rpc('eth_sendRawTransaction',[raw]);a.state='broadcast';}catch(e){a.error=(e as Error).message;}
  await durable(journalPath,j);return a.txHash;
 }finally{await release();}
}
export async function recordReceipt(path:string,rpc:Rpc){const j=await readJson<Envelope>(path);if(!j)return;const release=await lease(path+'.lock');try{for(const a of j.attempts){if(!a.txHash)continue;const r=await rpc('eth_getTransactionReceipt',[a.txHash]);if(r){a.receipt=r;a.state='receipt';a.chargedFee=(BigInt(a.gasLimit)*BigInt(r.effectiveGasPrice)).toString();}}await durable(path,j);}finally{await release();}}
