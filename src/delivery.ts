import type {Handoff} from './model.js';
import type {Resolution} from './reconcile.js';
export type Delivery={status:'held'|'undelivered'|'rejected'|'complete';artifact?:unknown;reason:string};
export function acceptDelivery(h:Handoff,payment:Resolution,body:unknown):Delivery {
 if(payment.payment!=='paid')return {status:'held',reason:'Verified payment gate not satisfied'};
 if(body==null)return {status:'undelivered',reason:'Paid, no seller artifact. Human handoff; never repay.'};
 const b=body as any;if(b.orderId!==h.orderId||b.requestHash!==h.requestHash||b.synthetic!==true||typeof b.report!=='string'||b.report.length<10)return {status:'rejected',reason:'Paid, artifact schema rejected. Does not attest factual quality; never repay.'};
 return {status:'complete',reason:'Controlled synthetic artifact accepted; not external seller availability or truth guarantee',artifact:body};
}
