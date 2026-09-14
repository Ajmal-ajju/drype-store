const $=s=>document.querySelector(s);
let editingId=null;
async function api(path,options={}){const r=await fetch(path,{credentials:"include",...options});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||"Request failed");return d}
function showAdmin(){ $("#loginView").classList.add("hidden"); $("#adminView").classList.remove("hidden"); loadProducts(); loadOrders(); }
async function checkSession(){try{await api("/api/admin-session");showAdmin()}catch{}}
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();$("#loginError").textContent="";try{await api("/api/admin-login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:$("#password").value})});$("#password").value="";showAdmin()}catch(err){$("#loginError").textContent=err.message}});
$("#logoutButton").addEventListener("click",async()=>{await api("/api/admin-logout",{method:"POST"});location.reload()});
$("#productForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const fd=new FormData(e.target);const product=Object.fromEntries(fd.entries());product.price=Number(product.price);
  try{
    if(editingId){
      product.id=editingId;
      await api("/api/products",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(product)});
      editingId=null;
      e.target.querySelector("button.wide").textContent="Add product";
    }else{
      await api("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(product)});
    }
    e.target.reset();loadProducts();
  }catch(err){alert(err.message)}
});
async function loadProducts(){
  try{
    const d=await api("/api/products");
    $("#productCount").textContent=d.products.length;
    $("#productList").innerHTML=d.products.map(p=>`<div class="product-row"><div><strong>${escapeHtml(p.name)}</strong><br><small>${escapeHtml(p.category)} · ₹${p.price}</small></div><div><button class="edit" data-id="${p.id}">Edit</button> <button class="delete" data-id="${p.id}">Delete</button></div></div>`).join("")||"<p>No products yet.</p>";
    document.querySelectorAll(".delete").forEach(b=>b.onclick=async()=>{if(confirm("Delete this product?")){await api("/api/products",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:b.dataset.id})});loadProducts()}});
    document.querySelectorAll(".edit").forEach(b=>b.onclick=()=>{
      const p=d.products.find(x=>x.id===b.dataset.id);
      if(!p)return;
      const form=$("#productForm");
      form.name.value=p.name;form.category.value=p.category;form.price.value=p.price;form.image.value=p.image||"";form.description.value=p.description||"";
      editingId=p.id;
      form.querySelector("button.wide").textContent="Update product";
      form.scrollIntoView({behavior:"smooth"});
    });
  }catch(err){$("#productList").textContent=err.message}
}
async function loadOrders(){
  try{
    const d=await api("/api/payment");
    $("#orderCount").textContent=d.orders.length;
    $("#orderList").innerHTML=d.orders.map(o=>`<div class="product-row"><div><strong>${escapeHtml(o.orderId)}</strong><br><small>${escapeHtml(o.customer.name)} · ${escapeHtml(o.customer.phone)} · ₹${o.total}</small><br><small>${escapeHtml(o.customer.address)}, ${escapeHtml(o.customer.city)}, ${escapeHtml(o.customer.state)} - ${escapeHtml(o.customer.pincode)}</small><br><small>Payment: <b>${escapeHtml(o.paymentStatus)}</b> · Dispatched: <b>${o.dispatched?"Yes":"No"}</b></small></div><div><button class="mark-paid" data-id="${o.orderId}">Mark paid</button> <button class="mark-dispatched" data-id="${o.orderId}">Mark dispatched</button></div></div>`).join("")||"<p>No orders yet.</p>";
    document.querySelectorAll(".mark-paid").forEach(b=>b.onclick=async()=>{await api("/api/payment",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:b.dataset.id,paymentStatus:"paid"})});loadOrders()});
    document.querySelectorAll(".mark-dispatched").forEach(b=>b.onclick=async()=>{await api("/api/payment",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:b.dataset.id,dispatched:true})});loadOrders()});
  }catch(err){$("#orderList").textContent=err.message}
}
$("#trackingForm").addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.target);try{await api("/api/tracking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(fd.entries()))});$("#trackingMessage").textContent="Tracking ID saved."}catch(err){$("#trackingMessage").textContent=err.message}});
function escapeHtml(s=""){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
checkSession();