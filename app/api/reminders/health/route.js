const SUPABASE_URL = "https://xvzupsflasjdejgkcgrt.supabase.co";
const SENDER_DOMAIN = "send.giftingguru.co.za";

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

  const database = await fetch(`${SUPABASE_URL}/rest/v1/gift_reminders?select=id&limit=1`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: "no-store",
  });
  // Sending-only Resend keys intentionally cannot list domains.
  const emailProvider = resendKey.startsWith("re_");
  const senderDomain = SENDER_DOMAIN;
  const ok = database.ok && emailProvider;

  return Response.json({
    ok,
    database: database.ok,
    emailProvider,
    scheduler: true,
    senderDomain,
  }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
