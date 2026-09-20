const SITE_URL = "https://www.giftingguru.co.za";
const SUPABASE_URL = "https://xvzupsflasjdejgkcgrt.supabase.co";

function json(data, status = 200) {
  return Response.json(data, { status });
}

function zaToday() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Johannesburg" }));
}

function nextOccurrence(dateString, now) {
  const [, month, day] = dateString.split("-").map(Number);
  let next = new Date(now.getFullYear(), month - 1, day, 12);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  if (next < today) next = new Date(now.getFullYear() + 1, month - 1, day, 12);
  return next;
}

function differenceInDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

async function supabase(path, options = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    ...options,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error("Supabase " + response.status + ": " + body);
  return body ? JSON.parse(body) : null;
}

function emailHtml(profile, due) {
  const rows = due.map(({ reminder, days }) => {
    const when = new Date(reminder.occasion_date + "T12:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long" });
    const timing = days === 0 ? "This month" : days === 1 ? "Tomorrow" : "In " + days + " days";
    const query = encodeURIComponent(reminder.interests || reminder.relationship || "gifts");
    return `<tr><td style="padding:16px;border-bottom:1px solid #e9ecef"><strong style="font-size:17px">${reminder.person_name}</strong><br><span style="color:#59616a">${reminder.occasion} · ${when} · ${timing}</span></td><td style="padding:16px;border-bottom:1px solid #e9ecef;text-align:right"><a href="${SITE_URL}/?q=${query}#shop" style="display:inline-block;background:#111820;color:#fff;text-decoration:none;border-radius:7px;padding:10px 14px;font-weight:700">Find a gift</a></td></tr>`;
  }).join("");
  return `<!doctype html><html><body style="margin:0;background:#f4f6f7;font-family:Arial,sans-serif;color:#111"><div style="max-width:620px;margin:0 auto;padding:28px 14px"><div style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px #00000012"><div style="padding:22px 24px;background:linear-gradient(110deg,#ffd51b,#59bced)"><img src="${SITE_URL}/giftingguru-logo.png" width="190" alt="GiftingGuru"><h1 style="font-size:28px;line-height:1.1;margin:18px 0 5px">A special day is coming up.</h1><p style="margin:0">Hi ${profile.first_name}, here are the gifts you asked us to help you remember.</p></div><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table><div style="padding:22px 24px;color:#59616a;font-size:13px;line-height:1.55"><p>These reminders are free. You can manage your dates whenever you want.</p><p><a href="${SITE_URL}/gift-reminders" style="color:#087eae">Manage reminders</a> · <a href="${SITE_URL}/api/reminders/unsubscribe?token=${profile.unsubscribe_token}" style="color:#087eae">Unsubscribe from all reminder emails</a></p><p>GiftingGuru · South Africa · <a href="mailto:hello@giftingguru.co.za">hello@giftingguru.co.za</a></p></div></div></div></body></html>`;
}

export async function GET(request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RESEND_API_KEY) {
    return json({ error: "Reminder email environment variables are not configured" }, 503);
  }

  const now = zaToday();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const reminders = await supabase("gift_reminders?select=*,customer_profiles!inner(first_name,email,reminder_enabled,unsubscribe_token)&active=eq.true&customer_profiles.reminder_enabled=eq.true");
  const grouped = new Map();

  for (const reminder of reminders || []) {
    const next = nextOccurrence(reminder.occasion_date, now);
    const days = differenceInDays(next, today);
    const dueTypes = [];
    if (reminder.monthly_digest && now.getDate() === 1 && next.getMonth() === now.getMonth() && next.getFullYear() === now.getFullYear()) {
      dueTypes.push({ type: "monthly", key: `monthly-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, days: 0 });
    }
    if ((reminder.notice_days || []).includes(days)) {
      dueTypes.push({ type: "notice", key: `notice-${days}-${next.getFullYear()}`, days });
    }

    for (const due of dueTypes) {
      try {
        const delivery = await supabase("reminder_deliveries", {
          method: "POST",
          body: JSON.stringify({ reminder_id: reminder.id, user_id: reminder.user_id, delivery_key: due.key, status: "processing" }),
        });
        const entry = grouped.get(reminder.user_id) || { profile: reminder.customer_profiles, due: [] };
        entry.due.push({ reminder, days: due.days, deliveryId: delivery[0].id });
        grouped.set(reminder.user_id, entry);
      } catch (error) {
        if (!String(error.message).includes("23505")) console.error(error);
      }
    }
  }

  let sent = 0;
  let failed = 0;
  for (const [, entry] of grouped) {
    try {
      const subject = entry.due.length === 1
        ? `Gift reminder: ${entry.due[0].reminder.person_name}'s ${entry.due[0].reminder.occasion}`
        : `You have ${entry.due.length} important gift dates coming up`;
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json",
          "Idempotency-Key": "gift-reminders-" + entry.due.map((d) => d.deliveryId).sort().join("-"),
        },
        body: JSON.stringify({
          from: "GiftingGuru Reminders <hello@giftingguru.co.za>",
          to: [entry.profile.email],
          subject,
          html: emailHtml(entry.profile, entry.due),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Resend failed");
      for (const item of entry.due) {
        await supabase("reminder_deliveries?id=eq." + item.deliveryId, {
          method: "PATCH",
          body: JSON.stringify({ status: "sent", sent_at: new Date().toISOString(), email_provider_id: result.id || null }),
        });
      }
      sent += 1;
    } catch (error) {
      failed += 1;
      for (const item of entry.due) {
        await supabase("reminder_deliveries?id=eq." + item.deliveryId, {
          method: "PATCH",
          body: JSON.stringify({ status: "failed", error_message: String(error.message).slice(0, 500) }),
        }).catch(() => {});
      }
    }
  }

  return json({ ok: true, customersEmailed: sent, failed, checked: reminders?.length || 0 });
}
