import WebSocket from 'ws';
import { writeFile,rename,mkdir } from 'node:fs/promises';
import {dirname} from 'node:path';
export type Verified={commitState:'Verified';hash:string;parentHash:string;number:string;blockId:string;observedAt:string;source:'monadNewHeads';endpoint:string};
export function parseVerified(result:any,endpoint:string):Verified|null {
 if(result?.commitState!=='Verified'|| !/^0x[0-9a-f]{64}$/i.test(result.hash)||!/^0x[0-9a-f]{64}$/i.test(result.parentHash)||!/^0x[0-9a-f]+$/i.test(result.number)||!/^0x[0-9a-f]{64}$/i.test(result.blockId))return null;
 return {...result,commitState:'Verified',observedAt:new Date().toISOString(),source:'monadNewHeads',endpoint};
}
export class VerifiedTracker {
 latest:Verified|null=null;history:Verified[]=[];connected=false;private ws?:WebSocket;private sub?:string;private writing=Promise.resolve();
 constructor(readonly endpoint:string,readonly evidenceFile?:string){}
 async start(){await new Promise<void>((resolve,reject)=>{
  const ws=this.ws=new WebSocket(this.endpoint);const timer=setTimeout(()=>{ws.terminate();reject(new Error('Verified subscription timeout'));},15000);
  ws.on('open',()=>ws.send(JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_subscribe',params:['monadNewHeads']})));
  ws.on('message',d=>{let j:any;try{j=JSON.parse(String(d));}catch{return;}if(j.id===1&&typeof j.result==='string'){this.sub=j.result;this.connected=true;clearTimeout(timer);resolve();}
   if(!this.connected||j.method!=='eth_subscription'||j.params?.subscription!==this.sub)return;
   const v=parseVerified(j.params.result,this.endpoint);if(!v)return;this.latest=v;this.history.push(v);this.history=this.history.slice(-1024);
   if(this.evidenceFile){const body=JSON.stringify(this.history,null,2);this.writing=this.writing.then(async()=>{await mkdir(dirname(this.evidenceFile!),{recursive:true});await writeFile(this.evidenceFile!+'.tmp',body);await rename(this.evidenceFile!+'.tmp',this.evidenceFile!);}).catch(()=>{});}
  });ws.on('error',e=>{clearTimeout(timer);reject(e);});ws.on('close',()=>{this.connected=false;clearTimeout(timer);});
 });}
 async next(after=0n,timeout=12000){const end=Date.now()+timeout;while(Date.now()<end){if(!this.connected)throw new Error('Verified stream disconnected');if(this.latest&&BigInt(this.latest.number)>=after)return this.latest;await new Promise(r=>setTimeout(r,100));}throw new Error('No observed Verified snapshot');}
 close(){this.connected=false;this.ws?.close();}
}
