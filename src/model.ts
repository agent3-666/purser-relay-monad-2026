import { encodeAbiParameters, keccak256, stringToHex, type Hex, type Address, type Abi, decodeFunctionResult, encodeFunctionData } from 'viem';
import fs from 'node:fs';
export const artifact=JSON.parse(fs.readFileSync(new URL('../out/PurserRelay.sol/PurserRelay.json',import.meta.url),'utf8'));
export const abi=artifact.abi as Abi;
export const SCHEMA='purser-relay-v1';
export type Handoff={schema:typeof SCHEMA;chainId:number;contract:Address;codehash:Hex;owner:Address;intent:Hex;requestHash:Hex;request:unknown;seller:Address;amount:string;expiry:string;orderId:Hex;createdTx:Hex;createdBlock:string};
export type Order={owner:Address;intent:Hex;requestHash:Hex;seller:Address;amount:bigint;balance:bigint;expiry:bigint;createdBlock:bigint;paidBlock:bigint;winner:Address;status:number;workers:Address[]};
export function canonical(x:unknown):string {if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';return '{'+Object.keys(x as object).sort().map(k=>JSON.stringify(k)+':'+canonical((x as Record<string,unknown>)[k])).join(',')+'}';}
export const requestHash=(x:unknown)=>keccak256(stringToHex(canonical(x)));
export const orderId=(h:Pick<Handoff,'chainId'|'contract'|'owner'|'intent'>)=>keccak256(encodeAbiParameters([{type:'uint256'},{type:'address'},{type:'address'},{type:'bytes32'}],[BigInt(h.chainId),h.contract,h.owner,h.intent]));
export function eq(a:unknown,b:unknown) {return String(a).toLowerCase()===String(b).toLowerCase();}
export function validateHandoff(h:Handoff){if(h.schema!==SCHEMA || h.chainId!==10143 || h.orderId!==orderId(h) || !eq(h.requestHash,requestHash(h.request)) || BigInt(h.amount)<=0n)throw new Error('Invalid handoff domain/request/schema');}
export function callData(name:string,args:unknown[]){return encodeFunctionData({abi,functionName:name,args} as any);}
export function decode(name:string,data:Hex){return decodeFunctionResult({abi,functionName:name,data} as any);}
export type Rpc=(method:string,params:unknown[])=>Promise<any>;
export function httpRpc(url:string):Rpc {return async(method,params)=>{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json() as any;if(j.error)throw new Error(JSON.stringify(j.error));return j.result;};}
export const hex=(n:bigint|string)=>'0x'+BigInt(n).toString(16);
