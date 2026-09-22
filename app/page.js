import Storefront from "./storefront";
import { createClient } from "@supabase/supabase-js";
import { getCurrentStore, publicStoreConfig } from "./lib/store";

export const revalidate = 300;

export default async function Home(){
  const store=await getCurrentStore();
  const sb=createClient("https://xvzupsflasjdejgkcgrt.supabase.co","sb_publishable_ekMMmdmDw5YtFdhHUfh62g_Lz15Pwaf");
  const pages=await Promise.all([0,1000,2000].map(from=>sb.from("products").select("*").eq("active",true).order("synced_at",{ascending:false}).order("id",{ascending:true}).range(from,from+999)));
  const data=[...new Map(pages.flatMap(({data})=>data||[]).map(product=>[product.id,product])).values()];
  return <Storefront initialItems={data} store={publicStoreConfig(store)}/>;
}
