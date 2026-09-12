import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
function clean(v,n=200){return String(v||"").trim().slice(0,n)}
async function handler(event){
 if(event.httpMethod!=="POST")return {statusCode:405,body:"Method not allowed"};
 const body=JSON.parse(event.body||"{}");
 const c=body.customer||{};
 if(!c.name||!c.phone||!c.address||!c.city||!c.state||!/^\d{6}$/.test(String(c.pincode))) return {statusCode:400,headers:{"content-type":"application/json"},body:JSON.stringify({error:"Complete delivery information is required."})};
 const total=Number(body.total); if(!Number.isFinite(total)||total<=0)return {statusCode:400,body:JSON.stringify({error:"Invalid order total."})};
 const orderId="DRYPE-"+Date.now().toString(36).toUpperCase()+"-"+crypto.randomBytes(3).toString("hex").toUpperCase();
 const store=getStore("drype-orders"); const orders=await store.get("orders",{type:"json"})||{};
 orders[orderId]={orderId,customer:{name:clean(c.name),phone:clean(c.phone,30),address:clean(c.address),city:clean(c.city,80),state:clean(c.state,80),pincode:clean(c.pincode,6)},items:Array.isArray(body.items)?body.items:[],subtotal:Number(body.subtotal)||0,discount:Number(body.discount)||0,total,paymentMethod:"prepaid_upi",paymentStatus:"pending",createdAt:new Date().toISOString()};
 await store.setJSON("orders",orders);
 const pa=process.env.UPI_ID;
 if(!pa)return {statusCode:503,headers:{"content-type":"application/json"},body:JSON.stringify({error:"UPI payment is not configured on the server."})};
 const note=encodeURIComponent(`DRYPE ${orderId}`);
 const upiUrl=`upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(process.env.UPI_NAME||"DRYPE")}&am=${total.toFixed(2)}&cu=INR&tn=${note}`;
 return {statusCode:200,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify({orderId,upiUrl})};
}
export {handler};