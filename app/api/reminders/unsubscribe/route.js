const SUPABASE_URL = "https://xvzupsflasjdejgkcgrt.supabase.co";
export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return Response.redirect(new URL("/gift-reminders/unsubscribed?status=invalid", request.url));
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return Response.redirect(new URL("/gift-reminders/unsubscribed?status=error", request.url));
  const response = await fetch(SUPABASE_URL + "/rest/v1/customer_profiles?unsubscribe_token=eq." + encodeURIComponent(token), {
    method: "PATCH",
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ reminder_enabled: false, updated_at: new Date().toISOString() }),
  });
  return Response.redirect(new URL(response.ok ? "/gift-reminders/unsubscribed" : "/gift-reminders/unsubscribed?status=error", request.url));
}
