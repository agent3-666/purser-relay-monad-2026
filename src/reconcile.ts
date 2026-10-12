import { decodeEventLog,keccak256,type Hex } from 'viem';
import {abi,callData,decode,eq,hex,validateHandoff,type Handoff,type Order,type Rpc} from './model.js';
import type {Verified} from './verified.js';
export type Resolution={payment:'unknown'|'unpaid'|'paid'|'cancelled';reason:string;order?:Order;receipt?:any;event?:any;snapshot?:Verified;ancestry?:{number:string;hash:string;parentHash:string}[];fee?:string};
export function feeFor(tx:any,receipt:any,chainId:number){const gasLimit=BigInt(tx.gas),price=BigInt(receipt.effectiveGasPrice);return (chainId===10143?gasLimit:BigInt(receipt.gasUsed))*price;}
// Fail-closed, RPC-trusting evidence reconciliation. No signing or order creation capability.
export async function reconcile(h:Handoff,rpc:Rpc,v:Verified|null,maxAncestry=256):Promise<Resolution>{
 try{
  validateHandoff(h);if(!v||v.commitState!=='Verified'||v.source!=='monadNewHeads'||!v.endpoint.startsWith('wss://'))throw new Error('No actual Verified signal');
  if(Number(BigInt(await rpc('eth_chainId',[])))!==h.chainId)throw new Error('Wrong chain');
  const f=await rpc('eth_getBlockByNumber',[v.number,false]);if(!f||!eq(f.hash,v.hash)||!eq(f.parentHash,v.parentHash))throw new Error('Noncanonical Verified snapshot');
  const code=await rpc('eth_getCode',[h.contract,v.number]);if(!code||code==='0x'||!eq(keccak256(code),h.codehash))throw new Error('Codehash mismatch');
  const mapped=decode('orderForIntent',await rpc('eth_call',[{to:h.contract,data:callData('orderForIntent',[h.owner,h.intent])},v.number]));if(!eq(mapped,h.orderId))throw new Error('Intent binding mismatch');
  const o=decode('getOrder',await rpc('eth_call',[{to:h.contract,data:callData('getOrder',[h.orderId])},v.number])) as Order;
  if(!eq(o.owner,h.owner)||!eq(o.intent,h.intent)||!eq(o.requestHash,h.requestHash)||!eq(o.seller,h.seller)||o.amount!==BigInt(h.amount)||o.expiry!==BigInt(h.expiry)||o.createdBlock!==BigInt(h.createdBlock))throw new Error('Order terms mismatch');
  const created=await rpc('eth_getTransactionReceipt',[h.createdTx]);if(!created||created.status!=='0x1'||BigInt(created.blockNumber)!==o.createdBlock||!eq(created.to,h.contract))throw new Error('Missing creation receipt');
  const createdBlock=await rpc('eth_getBlockByNumber',[created.blockNumber,false]);if(!createdBlock||!eq(createdBlock.hash,created.blockHash))throw new Error('Creation noncanonical');
  let creationMatch=false;for(const l of created.logs??[]){if(!eq(l.address,h.contract)||l.removed)continue;try{const e=decodeEventLog({abi,data:l.data,topics:l.topics}) as any;if(e.eventName==='OrderCreated'&&eq(e.args.orderId,h.orderId)&&eq(e.args.owner,h.owner)&&eq(e.args.intent,h.intent)&&eq(e.args.requestHash,h.requestHash)&&eq(e.args.seller,h.seller)&&e.args.amount===o.amount&&e.args.expiry===o.expiry)creationMatch=true;}catch{}}
  if(!creationMatch)throw new Error('Creation event mismatch');
  if(o.status===1){if(o.balance!==o.amount||o.paidBlock!==0n)throw new Error('Unpaid balance mismatch');return {payment:'unpaid',reason:'Verified snapshot: held principal; no automatic payment',order:o,snapshot:v};}
  if(o.status===3){if(o.balance!==0n||o.paidBlock!==0n)throw new Error('Cancelled state mismatch');return {payment:'cancelled',reason:'Verified snapshot cancelled; intent remains reserved',order:o,snapshot:v};}
  if(o.status!==2||o.balance!==0n||o.paidBlock<=0n)throw new Error('Missing paid state');
  const n=o.paidBlock;if(BigInt(v.number)<n||BigInt(v.number)-n>BigInt(maxAncestry))throw new Error('Recovery ancestry outside supported bound');
  const logs=await rpc('eth_getLogs',[{address:h.contract,fromBlock:hex(n),toBlock:hex(n)}]);
  const paid=[];for(const l of logs){if(l.removed||!eq(l.address,h.contract))continue;try{const e=decodeEventLog({abi,data:l.data,topics:l.topics}) as any;if(e.eventName==='OrderPaid'&&eq(e.args.orderId,h.orderId))paid.push({l,e});}catch{}}
  if(paid.length!==1)throw new Error('Need exactly one canonical OrderPaid');const {l,e}=paid[0];const a=e.args;
  if(!eq(a.requestHash,h.requestHash)||!eq(a.seller,h.seller)||a.amount!==o.amount||!eq(a.winner,o.winner))throw new Error('Payment event terms mismatch');
  const receipt=await rpc('eth_getTransactionReceipt',[l.transactionHash]);if(!receipt||receipt.status!=='0x1'||BigInt(receipt.blockNumber)!==n||!eq(receipt.blockHash,l.blockHash)||!eq(receipt.to,h.contract))throw new Error('Missing/mismatched successful payment receipt');
  const receiptLog=(receipt.logs??[]).find((x:any)=>eq(x.address,l.address)&&eq(x.data,l.data)&&JSON.stringify(x.topics)===JSON.stringify(l.topics)&&eq(x.logIndex,l.logIndex)&&!x.removed);if(!receiptLog)throw new Error('Payment not in receipt');
  const tx=await rpc('eth_getTransactionByHash',[l.transactionHash]);if(!tx||!eq(tx.to,h.contract)||!eq(tx.from,o.winner)||!eq(tx.input,callData('consumeOrder',[h.orderId,h.requestHash]))||BigInt(tx.value)!==0n||!eq(tx.blockHash,receipt.blockHash))throw new Error('Payment transaction domain mismatch');
  const ancestry=[];let cursor=f;for(let height=BigInt(v.number);height>=n;height--){if(!cursor||BigInt(cursor.number)!==height)throw new Error('Missing ancestry header');ancestry.push({number:cursor.number,hash:cursor.hash,parentHash:cursor.parentHash});if(height===n){if(!eq(cursor.hash,receipt.blockHash))throw new Error('Noncanonical payment');break;}const parent=await rpc('eth_getBlockByNumber',[hex(height-1n),false]);if(!parent||!eq(parent.hash,cursor.parentHash))throw new Error('Broken canonical ancestry');cursor=parent;}
  const again=await rpc('eth_getBlockByNumber',[v.number,false]);if(!eq(again?.hash,v.hash))throw new Error('Snapshot changed during reconciliation');
  return {payment:'paid',reason:'Successful canonical receipt/event/order linked to observed Verified snapshot; RPC trust, not light-client proof',order:o,receipt,event:e,snapshot:v,ancestry,fee:feeFor(tx,receipt,10143).toString()};
 }catch(e){return {payment:'unknown',reason:(e as Error).message};}
}
