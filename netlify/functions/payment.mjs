import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
function clean(v,n=200){return String(v||"").trim().slice(0,n)}
function verify(event){const c=event.headers.cookie||"";const m=c.match(/(?:^|;\s*)drype_admin=([^;]+)/);if(!m)return false;const [raw,sig]=m[1].split(".");if(!raw||!sig)return false;const expected=crypto.createHmac("sha256",process.env.SESSION_SECRET).update(raw).digest("base64url");if(sig!==expected)return false;try{return JSON.parse(Buffer.from(raw,"base64url").toString()).exp>Date.now()}catch{return false}}
function store(){return getStore({name:"drype-orders",siteID:process.env.SITE_ID,token:process.env.BLOBS_TOKEN})}
async function handler(event){
 if(event.httpMethod==="GET"){
  if(!verify(event)) return {statusCode:401,body:JSON.stringify({error:"Unauthorized"})};
  const st=store(); const orders=await st.get("orders",{type:"json"})||{};
  const list=Object.values(orders).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return {statusCode:200,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify({orders:list})};
 }
 if(event.httpMethod==="PATCH"){
  if(!verify(event)) return {statusCode:401,body:JSON.stringify({error:"Unauthorized"})};
  const {orderId,paymentStatus,dispatched}=JSON.parse(event.body||"{}");
  if(!orderId)return {statusCode:400,body:JSON.stringify({error:"Order ID is required."})};
  const st=store(); const orders=await st.get("orders",{type:"json"})||{};
  if(!orders[orderId])return {statusCode:404,body:JSON.stringify({error:"Order not found."})};
  if(paymentStatus)orders[orderId].paymentStatus=String(paymentStatus).slice(0,30);
  if(typeof dispatched==="boolean")orders[orderId].dispatched=dispatched;
  await st.setJSON("orders",orders);
  return {statusCode:200,headers:{"content-type":"application/json"},body:JSON.stringify(orders[orderId])};
 }
 if(event.httpMethod!=="POST")return {statusCode:405,body:"Method not allowed"};
 const body=JSON.parse(event.body||"{}");
 const c=body.customer||{};
 if(!c.name||!c.phone||!c.address||!c.city||!c.state||!/^\d{6}$/.test(String(c.pincode))) return {statusCode:400,headers:{"content-type":"application/json"},body:JSON.stringify({error:"Complete delivery information is required."})};
 const total=Number(body.total); if(!Number.isFinite(total)||total<=0)return {statusCode:400,body:JSON.stringify({error:"Invalid order total."})};
 const orderId="DRYPE-"+Date.now().toString(36).toUpperCase()+"-"+crypto.randomBytes(3).toString("hex").toUpperCase();
 const st=store(); const orders=await st.get("orders",{type:"json"})||{};
 orders[orderId]={orderId,customer:{name:clean(c.name),phone:clean(c.phone,30),address:clean(c.address),city:clean(c.city,80),state:clean(c.state,80),pincode:clean(c.pincode,6)},items:Array.isArray(body.items)?body.items:[],subtotal:Number(body.subtotal)||0,discount:Number(body.discount)||0,total,paymentMethod:"prepaid_upi",paymentStatus:"pending",dispatched:false,createdAt:new Date().toISOString()};
 await st.setJSON("orders",orders);
 const pa=process.env.UPI_ID;
 if(!pa)return {statusCode:503,headers:{"content-type":"application/json"},body:JSON.stringify({error:"UPI payment is not configured on the server."})};
 const note=encodeURIComponent(`DRYPE ${orderId}`);
 const upiUrl=`upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(process.env.UPI_NAME||"DRYPE")}&am=${total.toFixed(2)}&cu=INR&tn=${note}`;
 return {statusCode:200,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify({orderId,upiUrl})};
}
export {handler};