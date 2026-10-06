import Storefront from "./storefront";
import { createClient } from "@supabase/supabase-js";
import { getCurrentStore, publicStoreConfig } from "./lib/store";
import { getPricingContext, priceCatalogue } from "./lib/pricing";

export const revalidate = 300;

export default async function Home(){
  const store=await getCurrentStore();
  const sb=createClient("https://xvzupsflasjdejgkcgrt.supabase.co","sb_publishable_ekMMmdmDw5YtFdhHUfh62g_Lz15Pwaf");
  // Load the whole catalogue in 1,000-row pages (Supabase caps each request at 1,000).
  const { count } = await sb.from("products").select("id",{count:"exact",head:true}).eq("active",true);
  const offsets=Array.from({length:Math.max(1,Math.ceil((count||0)/1000))},(_,i)=>i*1000);
  const pages=await Promise.all(offsets.map(from=>sb.from("products").select("*").eq("active",true).order("synced_at",{ascending:false}).order("id",{ascending:true}).range(from,from+999)));
  const data=[...new Map(pages.flatMap(({data})=>data||[]).map(product=>[product.id,product])).values()];
  const pricing=await getPricingContext(store.id);
  return <Storefront initialItems={priceCatalogue(data,pricing)} store={publicStoreConfig(store)}/>;
}
