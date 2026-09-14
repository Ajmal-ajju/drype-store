import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
function verify(event){const c=event.headers.cookie||"";const m=c.match(/(?:^|;\s*)drype_admin=([^;]+)/);if(!m)return false;const [raw,sig]=m[1].split(".");if(!raw||!sig)return false;const expected=crypto.createHmac("sha256",process.env.SESSION_SECRET).update(raw).digest("base64url");if(sig!==expected)return false;try{return JSON.parse(Buffer.from(raw,"base64url").toString()).exp>Date.now()}catch{return false}}
async function handler(event){
 if(event.httpMethod!=="POST")return {statusCode:405,body:"Method not allowed"};
 if(!verify(event))return {statusCode:401,body:JSON.stringify({error:"Unauthorized"})};
 const {orderId,trackingId}=JSON.parse(event.body||"{}");
 if(!orderId||!trackingId)return {statusCode:400,body:JSON.stringify({error:"Order ID and DTDC tracking ID are required."})};
 const s=getStore({name:"drype-orders",siteID:process.env.SITE_ID,token:process.env.BLOBS_TOKEN}); const orders=await s.get("orders",{type:"json"})||{};
 orders[orderId]={...(orders[orderId]||{}),trackingId:String(trackingId).trim(),trackingUrl:`https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno=${encodeURIComponent(String(trackingId).trim())}`};
 await s.setJSON("orders",orders);
 return {statusCode:200,headers:{"content-type":"application/json"},body:JSON.stringify({ok:true})};
}
export {handler};