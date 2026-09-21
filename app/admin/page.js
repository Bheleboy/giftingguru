"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://xvzupsflasjdejgkcgrt.supabase.co", "sb_publishable_ekMMmdmDw5YtFdhHUfh62g_Lz15Pwaf");
const CATS = ["audio","networking","bags","devices","baby-toddler","furniture","computer-peripherals","mobile-accessories","electrical","gaming","lighting","smart-home","health-and-wellness","education-and-learning","computer-accessories","luggage","photography","toys-and-games","fashion-and-beauty","televisions","wearables","electronics","sports-and-fitness","software","kitchen-and-home"];

export default function Admin() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("embhele@gmail.com");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Sign in to manage the supplier catalogue.");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  async function signIn(event) {
    event.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/admin` } });
    setMessage(error ? error.message : "Secure sign-in link sent. Check your email."); setBusy(false);
  }
  async function sync(event) {
    event.preventDefault(); setBusy(true); let total = 0; let done = 0;
    try {
      for (const category of CATS) {
        setMessage(`Importing ${category} (${done + 1}/${CATS.length})... ${total} products synchronized.`);
        const response = await fetch("/api/smd/sync", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ username, password, category }) });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(`${category}: ${result.error || "Import failed"}`);
        total += Number(result.products || 0); done += 1;
      }
      setMessage(`Catalogue import complete. ${total} records synchronized. Automated updates continue every 30 minutes.`); setPassword("");
    } catch (error) { setMessage(`Import stopped after ${done} categories: ${error.message}`); }
    finally { setBusy(false); }
  }
  if (!session) return <div className="admin"><main className="adminmain"><section className="panel"><h1>GiftingGuru Admin</h1><p>Authorised access only.</p><form onSubmit={signIn}><div className="field"><label>Admin email</label><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div><button className="btn" disabled={busy}>{busy ? "Sending..." : "Email secure sign-in link"}</button></form><div className="status">{message}</div><a href="/">← Storefront</a></section></main></div>;
  return <div className="admin"><main className="adminmain"><section className="panel"><h1>GiftingGuru Admin</h1><p>Signed in as {session.user.email}</p><button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button> <a href="/">← Storefront</a></section><section className="panel"><h2>SMD Technologies</h2><form onSubmit={sync}><div className="field"><label>SMD reseller email / username</label><input required value={username} onChange={(event) => setUsername(event.target.value)} disabled={busy} /></div><div className="field"><label>SMD password</label><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} /></div><button className="btn" disabled={busy}>{busy ? "Importing catalogue..." : "Connect & Import Full Catalogue"}</button></form><div className="status">{message}</div></section><section className="panel"><h2>Retail pricing</h2><p>SMD excl-VAT price + 15% VAT, then 35% markup.</p><p>Protected stock and price updates run every 30 minutes.</p></section></main></div>;
}
