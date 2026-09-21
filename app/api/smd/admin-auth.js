const SUPABASE_URL = "https://xvzupsflasjdejgkcgrt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ekMMmdmDw5YtFdhHUfh62g_Lz15Pwaf";
const ADMIN_EMAILS = new Set(["embhele@gmail.com", "admin@giftingguru.co.za"]);

export async function requireAdmin(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, authorization }, cache: "no-store",
  });
  if (!response.ok) return null;
  const user = await response.json();
  return ADMIN_EMAILS.has(String(user.email || "").toLowerCase()) ? user : null;
}
