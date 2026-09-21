const SITE_URL = "https://www.giftingguru.co.za";
const SUPABASE_URL = "https://xvzupsflasjdejgkcgrt.supabase.co";
const RETAIL_MULTIPLIER = 1.15 * 1.35;
const MAX_RECOMMENDATIONS = 3;

const relationshipTerms = {
  Spouse: ["gift", "audio", "wearable", "home", "lifestyle"],
  Partner: ["gift", "audio", "wearable", "home", "lifestyle"],
  Parent: ["home", "kitchen", "health", "audio", "lifestyle"],
  Child: ["toy", "gaming", "education", "school", "headphone", "speaker"],
  Friend: ["audio", "gaming", "lifestyle", "gift", "mobile"],
  Colleague: ["office", "work", "computer", "mobile", "charger", "bag"],
  Other: ["gift", "audio", "home", "mobile", "lifestyle"],
};

const occasionTerms = {
  Birthday: ["gift", "audio", "gaming", "lifestyle"],
  Anniversary: ["gift", "home", "audio", "lifestyle"],
  Graduation: ["computer", "office", "mobile", "bag", "audio"],
  Christmas: ["gift", "toy", "gaming", "home", "audio"],
  "Mother's Day": ["home", "kitchen", "health", "lifestyle"],
  "Father's Day": ["audio", "automotive", "tools", "outdoor", "office"],
  Other: ["gift", "lifestyle", "audio", "home"],
};

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

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function tokens(value) {
  return String(value || "").toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
}

function retailPrice(wholesale) {
  return Math.ceil(Number(wholesale) * RETAIL_MULTIPLIER);
}

function recommendationTerms(reminder) {
  return [...new Set([
    ...tokens(reminder.interests), ...tokens(reminder.relationship), ...tokens(reminder.occasion),
    ...(relationshipTerms[reminder.relationship] || relationshipTerms.Other),
    ...(occasionTerms[reminder.occasion] || occasionTerms.Other),
  ])];
}

function scoreProduct(product, terms, targetPrice) {
  const name = String(product.name || "").toLowerCase();
  const brand = String(product.brand || "").toLowerCase();
  const category = String(product.category_path || "").toLowerCase();
  const description = String(product.description || "").toLowerCase();
  let score = Math.min(Number(product.stock_qty || 0), 5000) / 5000;
  for (const term of terms) {
    if (name.includes(term)) score += 5;
    if (category.includes(term)) score += 4;
    if (brand.includes(term)) score += 2;
    if (description.includes(term)) score += 1;
  }
  const price = retailPrice(product.wholesale_price);
  if (targetPrice > 0) score += Math.max(0, 3 - Math.abs(price - targetPrice) / Math.max(targetPrice, 1) * 3);
  return score;
}

async function recommendationsFor(reminder) {
  const min = Number(reminder.budget_min || 0);
  const max = Number(reminder.budget_max || 0);
  const target = min && max ? (min + max) / 2 : max || min || 750;
  const minimum = min || Math.max(0, target * 0.45);
  const maximum = max || Math.max(target * 1.55, minimum + 300);
  const wholesaleMin = Math.max(0, minimum / RETAIL_MULTIPLIER);
  const wholesaleMax = maximum / RETAIL_MULTIPLIER;
  const path = "products?select=sku,name,brand,category_path,description,image_urls,wholesale_price,stock_qty"
    + "&active=eq.true&stock_qty=gt.0&wholesale_price=not.is.null"
    + `&wholesale_price=gte.${wholesaleMin.toFixed(2)}&wholesale_price=lte.${wholesaleMax.toFixed(2)}`
    + "&order=stock_qty.desc&limit=120";
  const products = await supabase(path);
  const terms = recommendationTerms(reminder);
  const ranked = (products || []).map((product) => ({
    ...product,
    retail_price: retailPrice(product.wholesale_price),
    score: scoreProduct(product, terms, target),
  })).sort((a, b) => b.score - a.score || Number(b.stock_qty) - Number(a.stock_qty));
  const selected = [];
  const categories = new Set();
  for (const product of ranked) {
    const category = product.category_path || "other";
    if (categories.has(category) && ranked.length > MAX_RECOMMENDATIONS) continue;
    selected.push(product);
    categories.add(category);
    if (selected.length === MAX_RECOMMENDATIONS) break;
  }
  if (selected.length < MAX_RECOMMENDATIONS) {
    for (const product of ranked) {
      if (selected.some((item) => item.sku === product.sku)) continue;
      selected.push(product);
      if (selected.length === MAX_RECOMMENDATIONS) break;
    }
  }
  return selected;
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

function recommendationCards(reminder, recommendations) {
  if (!recommendations.length) return "";
  const cards = recommendations.map((product) => {
    const image = Array.isArray(product.image_urls) ? product.image_urls[0] : "";
    const campaign = encodeURIComponent(reminder.occasion.toLowerCase().replaceAll(" ", "_"));
    const href = `${SITE_URL}/products/${encodeURIComponent(product.sku)}?utm_source=gift_reminder&utm_medium=email&utm_campaign=${campaign}`;
    return `<td width="33.33%" valign="top" style="padding:6px"><a href="${href}" style="color:#111;text-decoration:none"><div style="border:1px solid #e5e8eb;border-radius:10px;padding:10px;background:#fff;height:100%">${image ? `<img src="${escapeHtml(image)}" width="150" height="150" alt="${escapeHtml(product.name)}" style="display:block;width:100%;height:150px;object-fit:contain">` : ""}<strong style="display:block;font-size:14px;line-height:1.3;margin-top:8px">${escapeHtml(product.name)}</strong><span style="display:block;color:#087eae;font-size:17px;font-weight:700;margin-top:6px">R ${product.retail_price.toLocaleString("en-ZA")}</span><span style="display:block;color:#07883f;font-size:12px;margin-top:4px">In stock</span></div></a></td>`;
  }).join("");
  return `<tr><td colspan="2" style="padding:0 10px 18px"><p style="margin:10px 6px 5px;font-weight:700">Gift ideas selected for ${escapeHtml(reminder.person_name)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${cards}</tr></table></td></tr>`;
}

function emailHtml(profile, due) {
  const rows = due.map(({ reminder, days, recommendations }) => {
    const when = new Date(reminder.occasion_date + "T12:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long" });
    const timing = days === 0 ? "This month" : days === 1 ? "Tomorrow" : "In " + days + " days";
    const query = encodeURIComponent(reminder.interests || reminder.relationship || "gifts");
    const budget = reminder.budget_min || reminder.budget_max
      ? ` · Budget R ${Number(reminder.budget_min || 0).toLocaleString("en-ZA")}–R ${Number(reminder.budget_max || reminder.budget_min).toLocaleString("en-ZA")}`
      : "";
    return `<tr><td style="padding:16px;border-bottom:1px solid #e9ecef"><strong style="font-size:17px">${escapeHtml(reminder.person_name)}</strong><br><span style="color:#59616a">${escapeHtml(reminder.occasion)} · ${escapeHtml(when)} · ${escapeHtml(timing)}${budget}</span></td><td style="padding:16px;border-bottom:1px solid #e9ecef;text-align:right"><a href="${SITE_URL}/?q=${query}#shop" style="display:inline-block;background:#111820;color:#fff;text-decoration:none;border-radius:7px;padding:10px 14px;font-weight:700">See more gifts</a></td></tr>${recommendationCards(reminder, recommendations || [])}`;
  }).join("");
  return `<!doctype html><html><body style="margin:0;background:#f4f6f7;font-family:Arial,sans-serif;color:#111"><div style="max-width:680px;margin:0 auto;padding:28px 14px"><div style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px #00000012"><div style="padding:22px 24px;background:linear-gradient(110deg,#ffd51b,#59bced)"><img src="${SITE_URL}/giftingguru-logo.png" width="190" alt="GiftingGuru"><h1 style="font-size:28px;line-height:1.1;margin:18px 0 5px">A special day is coming up.</h1><p style="margin:0">Hi ${escapeHtml(profile.first_name)}, here are the dates and personalised gift ideas you asked us to remember.</p></div><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table><div style="padding:22px 24px;color:#59616a;font-size:13px;line-height:1.55"><p>Recommendations use the budget, interests and relationship you saved, together with current GiftingGuru stock. Prices and availability may change.</p><p>These reminders are free. You can manage your dates whenever you want.</p><p><a href="${SITE_URL}/gift-reminders" style="color:#087eae">Manage reminders</a> · <a href="${SITE_URL}/api/reminders/unsubscribe?token=${escapeHtml(profile.unsubscribe_token)}" style="color:#087eae">Unsubscribe from all reminder emails</a></p><p>GiftingGuru · South Africa · <a href="mailto:hello@giftingguru.co.za">hello@giftingguru.co.za</a></p></div></div></div></body></html>`;
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
      entry.due = await Promise.all(entry.due.map(async (item) => ({
        ...item,
        recommendations: await recommendationsFor(item.reminder),
      })));
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
