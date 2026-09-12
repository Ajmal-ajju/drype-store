import crypto from "node:crypto";
function json(body,status=200,headers={}){return {statusCode:status,headers:{"content-type":"application/json",...headers},body:JSON.stringify(body)}}
function sign(payload){const raw=Buffer.from(JSON.stringify(payload)).toString("base64url");const sig=crypto.createHmac("sha256",process.env.SESSION_SECRET).update(raw).digest("base64url");return raw+"."+sig}
export async function handler(event){
  if(event.httpMethod!=="POST") return json({error:"Method not allowed"},405);
  const {password}=JSON.parse(event.body||"{}");
  const expected=process.env.ADMIN_PASSWORD;
  if(!expected || !process.env.SESSION_SECRET) return json({error:"Admin security is not configured on the server."},503);
  const a=Buffer.from(String(password||"")); const b=Buffer.from(expected);
  if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return json({error:"Invalid password"},401);
  const token=sign({exp:Date.now()+8*60*60*1000});
  return json({ok:true},200,{"set-cookie":`drype_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`});
}