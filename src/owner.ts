import {privateKeyToAccount} from 'viem/accounts';import {keccak256,type Hex,type Address} from 'viem';import {durable,readJson} from './journal.js';import {hex,type Rpc} from './model.js';
export async function ownerTx(rpc:Rpc,key:Hex,journalPath:string,chainId:number,input:{to?:Address;data?:Hex;value?:bigint;gas?:bigint}){
 if(await readJson(journalPath))throw new Error('Owner transaction journal exists; inspect/rebroadcast exact raw, do not create another order');
 if(Number(BigInt(await rpc('eth_chainId',[])))!==chainId)throw new Error('Wrong owner signing chain');
 const account=privateKeyToAccount(key),nonce=Number(BigInt(await rpc('eth_getTransactionCount',[account.address,'pending']))),price=BigInt(await rpc('eth_gasPrice',[]));
 const gas=input.gas??(BigInt(await rpc('eth_estimateGas',[{from:account.address,to:input.to,data:input.data,value:hex(input.value??0n)}]))*12n/10n+10000n);
 const maxFee=price*2n+2_000_000_000n;if(gas*maxFee>100000000000000000n)throw new Error('Owner testnet fee cap 0.1 MON exceeded');
 await durable(journalPath,{state:'preparing',nonce,gas:gas.toString(),maxFee:maxFee.toString()});
 const raw=await account.signTransaction({chainId,nonce,to:input.to,data:input.data,value:input.value??0n,gas,maxFeePerGas:maxFee,maxPriorityFeePerGas:2_000_000_000n});const txHash=keccak256(raw);
 await durable(journalPath,{state:'signed',raw,txHash,nonce,gas:gas.toString(),maxFee:maxFee.toString()});
 await rpc('eth_sendRawTransaction',[raw]);let receipt:any;for(let i=0;i<80;i++){receipt=await rpc('eth_getTransactionReceipt',[txHash]);if(receipt)break;await new Promise(r=>setTimeout(r,500));}if(!receipt)throw new Error('Owner receipt unknown; keep signed journal');
 const fee=(chainId===10143?gas:BigInt(receipt.gasUsed))*BigInt(receipt.effectiveGasPrice);await durable(journalPath,{state:'receipt',raw,txHash,nonce,gas:gas.toString(),maxFee:maxFee.toString(),fee:fee.toString(),receipt});return {txHash,receipt,fee:fee.toString(),gasLimit:gas.toString()};
}
