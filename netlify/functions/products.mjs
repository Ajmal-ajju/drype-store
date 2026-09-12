import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
function verify(event){const c=event.headers.cookie||"";const m=c.match(/(?:^|;\s*)drype_admin=([^;]+)/);if(!m)return false;const [raw,sig]=m[1].split(".");if(!raw||!sig)return false;const expected=crypto.createHmac("sha256",process.env.SESSION_SECRET).update(raw).digest("base64url");if(sig!==expected)return false;try{return JSON.parse(Buffer.from(raw,"base64url").toString()).exp>Date.now()}catch{return false}}
async function store(){return getStore("drype-catalog")}
async function handler(event){
  const s=await store();
  if(event.httpMethod==="GET"){const products=await s.get("products",{type:"json"})||[];return {statusCode:200,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify({products})}}
  if(!verify(event)) return {statusCode:401,body:JSON.stringify({error:"Unauthorized"})};
  const products=await s.get("products",{type:"json"})||[];
  if(event.httpMethod==="POST"){
    const p=JSON.parse(event.body||"{}"); if(!p.name||!p.category||!Number.isFinite(Number(p.price))) return {statusCode:400,body:JSON.stringify({error:"Name, category and valid price are required."})};
    const item={id:crypto.randomUUID(),name:String(p.name).slice(0,120),category:String(p.category),price:Number(p.price),type:String(p.category).replace(/s$/,""),image:p.image||"",description:String(p.description||"").slice(0,500)};
    products.push(item); await s.setJSON("products",products); return {statusCode:201,headers:{"content-type":"application/json"},body:JSON.stringify(item)}
  }
  if(event.httpMethod==="DELETE"){const {id}=JSON.parse(event.body||"{}");const next=products.filter(p=>p.id!==id);await s.setJSON("products",next);return {statusCode:200,body:JSON.stringify({ok:true})}}
  return {statusCode:405,body:"Method not allowed"};
}
export { handler };