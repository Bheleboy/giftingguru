import Storefront from "./storefront";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;

export default async function Home(){
  const sb=createClient("https://xvzupsflasjdejgkcgrt.supabase.co","sb_publishable_ekMMmdmDw5YtFdhHUfh62g_Lz15Pwaf");
  const {data}=await sb.from("products").select("*").eq("active",true).order("synced_at",{ascending:false}).limit(5000);
  return <Storefront initialItems={data||[]}/>;
}