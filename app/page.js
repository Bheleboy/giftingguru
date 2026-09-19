import Storefront from "./storefront";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;

export default async function Home(){
  const sb=createClient("https://xvzupsflasjdejgkcgrt.supabase.co","sb_publishable_ekMMmdmDw5YtFdhHUfh62g_Lz15Pwaf");
  const pages=await Promise.all([0,1000,2000].map(from=>sb.from("products").select("*").eq("active",true).order("synced_at",{ascending:false}).range(from,from+999)));
  const data=pages.flatMap(({data})=>data||[]);
  return <Storefront initialItems={data}/>;
}
