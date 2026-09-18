import{NextResponse}from"next/server";
async function login(username,password){
 const first=await fetch("https://za.smdtechnologies.com/account/login",{redirect:"manual",cache:"no-store"});
 const html=await first.text(); const token=(html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/i)||[])[1]||"";
 let cookie=(first.headers.get("set-cookie")||"").split(",").map(x=>x.split(";")[0]).join("; ");
 const form=new URLSearchParams({Email:username,Password:password}); if(token)form.set("__RequestVerificationToken",token);
 const r=await fetch("https://za.smdtechnologies.com/account/login",{method:"POST",redirect:"manual",cache:"no-store",headers:{"content-type":"application/x-www-form-urlencoded",cookie},body:form});
 const sc=r.headers.get("set-cookie")||""; if(sc)cookie+="; "+sc.split(",").map(x=>x.split(";")[0]).join("; "); return cookie;
}
function prices(s){const a=[...s.matchAll(/(?:R\s*|&nbsp;|price[^0-9]{0,30})([0-9]{1,6}(?:[ ,.][0-9]{3})*(?:[.,][0-9]{2})?)/gi)].map(x=>x[1]);return [...new Set(a)].slice(0,30)}
export async function POST(req){try{
 const{username,password}=await req.json();const cookie=await login(username,password);
 const urls=[
 "https://za.smdtechnologies.com/item?productId=3337",
 "https://za.smdtechnologies.com/ajax/store/item?productId=3337",
 "https://za.smdtechnologies.com/ajax/store/product/item?productId=3337",
 "https://za.smdtechnologies.com/api/store/product/item?productId=3337",
 "https://za.smdtechnologies.com/api/store/item?productId=3337",
 "https://za.smdtechnologies.com/bag/volkano-refine-156-laptop-backpack-blk-charc"
 ]; const out=[];
 for(const url of urls){const r=await fetch(url,{cache:"no-store",redirect:"manual",headers:{cookie,accept:"application/json,text/html,*/*","x-requested-with":"XMLHttpRequest"}});const txt=await r.text();out.push({url,status:r.status,type:r.headers.get("content-type"),length:txt.length,prices:prices(txt),sample:txt.slice(0,3500)})}
 return NextResponse.json({ok:true,message:"SMD price discovery completed.",results:out});
}catch(e){console.error("SMD_PRICE_ERROR",e);return NextResponse.json({error:e.message},{status:500})}}