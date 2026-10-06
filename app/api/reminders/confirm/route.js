import { NextResponse } from "next/server";
import { createServerClient } from "../../../lib/pricing";
import { sendEmail } from "../../../lib/fulfilment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://www.giftingguru.co.za";

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function timingText(r) {
  const parts = [];
  if (r.monthly_digest) parts.push("at the start of the month");
  for (const d of [...(r.notice_days || [])].sort((a, b) => b - a)) parts.push(d === 1 ? "1 day before" : `${d} days before`);
  return parts.length ? parts.join(", ") : "no reminder times selected";
}

// Sends a "your reminders are saved" email to the signed-in user.
export async function POST(request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createServerClient();
  const { data: auth } = await db.auth.getUser(token);
  const user = auth?.user;
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: profile }, { data: reminders }] = await Promise.all([
    db.from("customer_profiles").select("first_name,unsubscribe_token").eq("user_id", user.id).maybeSingle(),
    db.from("gift_reminders").select("person_name,occasion,occasion_date,notice_days,monthly_digest,budget_min,budget_max").eq("user_id", user.id).eq("active", true).order("occasion_date"),
  ]);
  if (!reminders?.length) return NextResponse.json({ ok: true, sent: false });

  const rows = reminders.map((r) => {
    const when = new Date(r.occasion_date + "T12:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long", timeZone: "Africa/Johannesburg" });
    const budget = r.budget_min || r.budget_max ? ` · Budget R ${Number(r.budget_min || 0).toLocaleString("en-ZA")} to R ${Number(r.budget_max || r.budget_min).toLocaleString("en-ZA")}` : "";
    return `<tr><td style="padding:14px 18px;border-bottom:1px solid #e9ecef"><strong>${esc(r.person_name)}</strong> · ${esc(r.occasion)} · ${esc(when)}${budget}<br><span style="color:#59616a;font-size:14px">We'll email you ${esc(timingText(r))}.</span></td></tr>`;
  }).join("");
  const unsubscribe = profile?.unsubscribe_token ? `${SITE}/api/reminders/unsubscribe?token=${esc(profile.unsubscribe_token)}` : `${SITE}/gift-reminders`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;color:#111820">
<p style="text-align:center"><img src="${SITE}/giftingguru-logo.png" width="200" alt="GiftingGuru"></p>
<h2 style="margin:18px 0 6px">Your gift reminders are saved${profile?.first_name ? ", " + esc(profile.first_name) : ""}</h2>
<p style="color:#27313a;line-height:1.6">Here's what we'll remember for you. Reminder emails go out at about 8am South African time, with gift ideas that match your budget and are in stock.</p>
<table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e8eb;border-radius:10px">${rows}</table>
<p style="margin:22px 0"><a href="${SITE}/gift-reminders" style="background:#087eae;color:#fff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700">Manage my reminders</a></p>
<p style="color:#59616a;font-size:13px;line-height:1.6">This service is free. <a href="${unsubscribe}" style="color:#087eae">Unsubscribe</a> at any time.<br>GiftingGuru.co.za · hello@giftingguru.co.za</p></div>`;

  const day = new Date().toISOString().slice(0, 10);
  try {
    await sendEmail({
      to: [user.email],
      subject: "Your GiftingGuru reminders are saved",
      html,
      replyTo: "hello@giftingguru.co.za",
      idempotencyKey: `reminder-confirm-${user.id}-${day}-${reminders.length}`,
    });
    return NextResponse.json({ ok: true, sent: true });
  } catch (error) {
    console.error("reminder confirmation failed", error?.message);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
