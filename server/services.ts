import 'dotenv/config';
import {PrismaClient, Prisma} from '@prisma/client';
import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
export const db=new PrismaClient();
export const demo=process.env.DEMO_MODE==='true';
if(process.env.NODE_ENV==='production' && demo) throw new Error('DEMO_MODE must be false in production');
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export const safeEqual=(a:string,b:string)=>a.length===b.length && timingSafeEqual(Buffer.from(a),Buffer.from(b));
export const signature=(text:string,secret:string)=>createHmac('sha256',secret).update(text).digest('hex');
export async function serial<T>(fn:(tx:Prisma.TransactionClient)=>Promise<T>):Promise<T>{
  for(let i=0;;i++){try{return await db.$transaction(fn,{isolationLevel:'Serializable'});}catch(e:any){if(e.code==='P2034' && i<3)continue;throw e;}}
}
export async function razor(path:string,body?:unknown){
  if(!process.env.RAZORPAY_KEY_ID||!process.env.RAZORPAY_KEY_SECRET)throw new Error('Online payments are not configured. Choose cash on delivery.');
  const r=await fetch('https://api.razorpay.com/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:'Basic '+Buffer.from(process.env.RAZORPAY_KEY_ID+':'+process.env.RAZORPAY_KEY_SECRET).toString('base64'),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error('Payment provider unavailable. Please retry from your order.');
  return r.json() as Promise<any>;
}
export async function settle(providerOrderId:string,paymentId:string){
  const remote=await razor('payments/'+encodeURIComponent(paymentId));
  return serial(async tx=>{
    const p=await tx.payment.findUnique({where:{providerOrderId},include:{order:true}});
    if(!p||remote.order_id!==providerOrderId||remote.currency!=='INR'||remote.amount!==p.amount||remote.status!=='captured')throw new Error('Payment is not captured yet. Check your order again shortly.');
    if(p.status==='PAID')return p.order;
    if(p.order.status==='CANCELLED')throw new Error('Cancelled order requires staff reconciliation.');
    await tx.payment.update({where:{id:p.id},data:{status:'PAID',providerPaymentId:paymentId}});
    const order=await tx.order.update({where:{id:p.orderId},data:{paymentStatus:'PAID',status:'CONFIRMED'}});
    await tx.notification.create({data:{userId:order.userId,subject:'Payment received',text:'Order '+order.id+' is confirmed.'}});
    return order;
  });
}
export async function deliverEmails(){
  const jobs=await db.notification.findMany({where:{emailState:'QUEUED',attempts:{lt:5}},include:{user:{select:{email:true}}},take:20});
  for(const job of jobs){
    if(!process.env.RESEND_API_KEY){if(demo)await db.notification.update({where:{id:job.id},data:{emailState:'DEMO_INBOX'}});continue;}
    try{
      const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':job.id},body:JSON.stringify({from:process.env.EMAIL_FROM,to:job.user.email,subject:job.subject,text:job.text}),signal:AbortSignal.timeout(15000)});
      await db.notification.update({where:{id:job.id},data:{emailState:r.ok?'SENT':job.attempts>=4?'FAILED':'QUEUED',attempts:{increment:1}}});
    }catch{await db.notification.update({where:{id:job.id},data:{attempts:{increment:1}}});}
  }
}
