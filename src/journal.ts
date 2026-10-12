import {open,readFile,rename,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
export async function durable(path:string,value:unknown){await mkdir(dirname(path),{recursive:true});const tmp=path+'.tmp-'+process.pid;const f=await open(tmp,'wx',0o600);try{await f.writeFile(JSON.stringify(value,null,2));await f.sync();}finally{await f.close();}await rename(tmp,path);const dir=await open(dirname(path),'r');try{await dir.sync();}finally{await dir.close();}}
export async function readJson<T>(path:string):Promise<T|null>{try{return JSON.parse(await readFile(path,'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}}
// A crash leaves the lock for human inspection. Never silently steal another process's signing lease.
export async function lease(path:string){await mkdir(dirname(path),{recursive:true});const f=await open(path,'wx',0o600);await f.writeFile(String(process.pid));await f.sync();return async()=>{await f.close();const {unlink}=await import('node:fs/promises');await unlink(path);};}
