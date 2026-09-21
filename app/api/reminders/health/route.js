const SUPABASE_URL = "https://xvzupsflasjdejgkcgrt.supabase.co";

export const dynamic = "force-dynamic";

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const cronSecret = process.env.CRON_SECRET;
  if (!serviceKey || !resendKey || !cronSecret) {
    return Response.json({
      ok: false,
      database: Boolean(serviceKey),
      emailProvider: Boolean(resendKey),
      scheduler: Boolean(cronSecret),
      senderDomain: false,
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const [database, domains] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/gift_reminders?select=id&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    }),
    fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${resendKey}` },
      cache: "no-store",
    }),
  ]);
  const domainBody = domains.ok ? await domains.json() : null;
  const senderDomain = Boolean(domainBody?.data?.some((domain) =>
    domain.name === "giftingguru.co.za" && domain.status === "verified"));
  const ok = database.ok && domains.ok && senderDomain;

  return Response.json({
    ok,
    database: database.ok,
    emailProvider: domains.ok,
    scheduler: true,
    senderDomain,
  }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
