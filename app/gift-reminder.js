"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xvzupsflasjdejgkcgrt.supabase.co",
  "sb_publishable_ekMMmdmDw5YtFdhHUfh62g_Lz15Pwaf",
);

const emptyReminder = () => ({
  person_name: "",
  occasion: "Birthday",
  occasion_date: "",
  relationship: "Partner",
  interests: "",
  budget_min: "",
  budget_max: "",
  monthly_digest: true,
  notice_days: [14, 7],
});

const occasionIcons = {
  Birthday: "🎂",
  Anniversary: "💝",
  Graduation: "🎓",
  Christmas: "🎄",
  "Mother's Day": "🌷",
  "Father's Day": "🎁",
  Other: "✨",
};

export default function GiftReminder({ landing = false }) {
  const [open, setOpen] = useState(landing);
  const [step, setStep] = useState(1);
  const [reminders, setReminders] = useState([emptyReminder()]);
  const [saved, setSaved] = useState([]);
  const [profile, setProfile] = useState({ first_name: "", email: "", phone: "", marketing_consent: false });
  const [consent, setConsent] = useState(false);
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [manage, setManage] = useState(false);

  useEffect(() => {
    let timer;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      if (data.session) completePending(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      if (nextSession) setTimeout(() => completePending(nextSession), 0);
    });
    if (!landing && !localStorage.getItem("gg-reminder-prompted")) {
      timer = setTimeout(() => setOpen(true), 6500);
    }
    return () => {
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadSaved(userId) {
    const { data } = await supabase
      .from("gift_reminders")
      .select("*")
      .eq("user_id", userId)
      .order("occasion_date");
    setSaved(data || []);
  }

  async function completePending(activeSession) {
    const raw = localStorage.getItem("gg-reminder-pending");
    if (!raw) {
      await loadSaved(activeSession.user.id);
      return;
    }
    try {
      const pending = JSON.parse(raw);
      const userId = activeSession.user.id;
      const customer = {
        user_id: userId,
        first_name: pending.profile.first_name.trim(),
        email: activeSession.user.email || pending.profile.email.trim().toLowerCase(),
        phone: pending.profile.phone.trim() || null,
        reminder_enabled: true,
        marketing_consent: Boolean(pending.profile.marketing_consent),
        reminder_consent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error: profileError } = await supabase
        .from("customer_profiles")
        .upsert(customer, { onConflict: "user_id" });
      if (profileError) throw profileError;
      const rows = pending.reminders.map((r) => ({
        user_id: userId,
        person_name: r.person_name.trim(),
        occasion: r.occasion,
        occasion_date: r.occasion_date,
        relationship: r.relationship || null,
        interests: r.interests.trim() || null,
        budget_min: r.budget_min ? Number(r.budget_min) : null,
        budget_max: r.budget_max ? Number(r.budget_max) : null,
        monthly_digest: Boolean(r.monthly_digest),
        notice_days: r.notice_days,
      }));
      const { error: reminderError } = await supabase.from("gift_reminders").insert(rows);
      if (reminderError) throw reminderError;
      localStorage.removeItem("gg-reminder-pending");
      localStorage.setItem("gg-reminder-prompted", "saved");
      setMessage("Your free reminders are active.");
      setStep(4);
      await loadSaved(userId);
    } catch (error) {
      setMessage(error.message || "We could not finish saving your reminders.");
    }
  }

  const validDates = useMemo(
    () => reminders.every((r) => r.person_name.trim() && r.occasion_date),
    [reminders],
  );

  function updateReminder(index, field, value) {
    setReminders((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function toggleDay(index, day) {
    setReminders((current) =>
      current.map((item, i) => {
        if (i !== index) return item;
        const next = item.notice_days.includes(day)
          ? item.notice_days.filter((d) => d !== day)
          : [...item.notice_days, day].sort((a, b) => b - a);
        return { ...item, notice_days: next };
      }),
    );
  }

  function dismiss() {
    setOpen(false);
    if (!landing) localStorage.setItem("gg-reminder-prompted", "dismissed");
  }

  async function activate() {
    if (!profile.first_name.trim() || !/^\S+@\S+\.\S+$/.test(profile.email) || !consent) {
      setMessage("Please add your name, a valid email address and accept reminder emails.");
      return;
    }
    setBusy(true);
    setMessage("");
    const pending = { profile, reminders };
    localStorage.setItem("gg-reminder-pending", JSON.stringify(pending));
    if (session) {
      await completePending(session);
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: profile.email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "https://www.giftingguru.co.za/gift-reminders?confirmed=1",
        data: { first_name: profile.first_name.trim() },
      },
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setStep(3);
  }

  async function toggleSaved(item) {
    const { error } = await supabase
      .from("gift_reminders")
      .update({ active: !item.active, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    if (!error) await loadSaved(session.user.id);
  }

  async function removeSaved(id) {
    if (!window.confirm("Remove this reminder?")) return;
    const { error } = await supabase.from("gift_reminders").delete().eq("id", id);
    if (!error) await loadSaved(session.user.id);
  }

  function begin() {
    setManage(false);
    setStep(1);
    setOpen(true);
  }

  function manageReminders() {
    setManage(true);
    setOpen(true);
    if (session) loadSaved(session.user.id);
  }

  const wizard = (
    <div className="giftReminderBackdrop" onClick={landing ? undefined : dismiss}>
      <section className="giftReminderModal" onClick={(e) => e.stopPropagation()}>
        {!landing && <button className="giftReminderClose" onClick={dismiss} aria-label="Close">×</button>}
        <img src="/giftingguru-logo.png" alt="GiftingGuru" className="giftReminderLogo" />
        {manage ? (
          <>
            <p className="giftEyebrow">MY GIFT REMINDERS</p>
            <h2>Your important dates</h2>
            {!session ? (
              <div className="giftEmpty">
                <p>Sign in using the email address connected to your reminders.</p>
                <button onClick={() => { setManage(false); setStep(2); }}>Sign in or create account</button>
              </div>
            ) : saved.length ? (
              <div className="savedReminderList">
                {saved.map((item) => (
                  <article key={item.id}>
                    <span>{occasionIcons[item.occasion] || "🎁"}</span>
                    <div><b>{item.person_name}</b><small>{item.occasion} · {new Date(item.occasion_date + "T12:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long" })}</small></div>
                    <button onClick={() => toggleSaved(item)}>{item.active ? "Pause" : "Resume"}</button>
                    <button className="removeReminder" onClick={() => removeSaved(item.id)}>Remove</button>
                  </article>
                ))}
              </div>
            ) : <div className="giftEmpty"><p>You do not have any saved dates yet.</p><button onClick={begin}>Add a reminder</button></div>}
            <button className="giftPrimary" onClick={begin}>＋ Add another important date</button>
          </>
        ) : step === 1 ? (
          <>
            <p className="giftEyebrow">FREE GIFT REMINDER SERVICE</p>
            <h2>Never forget an important gift again.</h2>
            <p className="giftLead">Save birthdays, anniversaries and special dates. We’ll remind you early and help you find the right gift.</p>
            <div className="giftBenefits"><span>✓ Free to use</span><span>✓ You choose when</span><span>✓ Cancel anytime</span></div>
            <button className="giftPrimary" onClick={() => setStep(2)}>Set my free reminders</button>
            {session && <button className="giftTextButton" onClick={manageReminders}>Manage my reminders</button>}
            <small className="giftTrust">No spam. Reminder emails only unless you separately opt in to offers.</small>
          </>
        ) : step === 2 ? (
          <>
            <div className="giftProgress"><span className="active">1 Dates</span><span>2 Account</span><span>3 Done</span></div>
            <h2>Who do you never want to forget?</h2>
            <div className="reminderForms">
              {reminders.map((reminder, index) => (
                <fieldset key={index}>
                  <legend>{occasionIcons[reminder.occasion]} Reminder {index + 1}</legend>
                  <div className="giftFormGrid">
                    <label>Person’s name<input value={reminder.person_name} onChange={(e) => updateReminder(index, "person_name", e.target.value)} placeholder="e.g. Thandi" /></label>
                    <label>Occasion<select value={reminder.occasion} onChange={(e) => updateReminder(index, "occasion", e.target.value)}>{Object.keys(occasionIcons).map((o) => <option key={o}>{o}</option>)}</select></label>
                    <label>Date<input type="date" value={reminder.occasion_date} onChange={(e) => updateReminder(index, "occasion_date", e.target.value)} /></label>
                    <label>Relationship<select value={reminder.relationship} onChange={(e) => updateReminder(index, "relationship", e.target.value)}>{["Spouse","Partner","Parent","Child","Friend","Colleague","Other"].map((r) => <option key={r}>{r}</option>)}</select></label>
                    <label className="wide">Gift interests, optional<input value={reminder.interests} onChange={(e) => updateReminder(index, "interests", e.target.value)} placeholder="Tech, music, fitness, home..." /></label>
                    <label>Budget from<input type="number" min="0" value={reminder.budget_min} onChange={(e) => updateReminder(index, "budget_min", e.target.value)} placeholder="R 300" /></label>
                    <label>Budget to<input type="number" min="0" value={reminder.budget_max} onChange={(e) => updateReminder(index, "budget_max", e.target.value)} placeholder="R 1 000" /></label>
                  </div>
                  <div className="reminderRules"><b>Remind me:</b><label><input type="checkbox" checked={reminder.monthly_digest} onChange={(e) => updateReminder(index, "monthly_digest", e.target.checked)} /> Start of the month</label>{[14,7,1].map((d) => <label key={d}><input type="checkbox" checked={reminder.notice_days.includes(d)} onChange={() => toggleDay(index, d)} /> {d} day{d > 1 ? "s" : ""} before</label>)}</div>
                  {reminders.length > 1 && <button className="giftRemove" onClick={() => setReminders((r) => r.filter((_, i) => i !== index))}>Remove this date</button>}
                </fieldset>
              ))}
            </div>
            <button className="giftAddAnother" onClick={() => setReminders((r) => [...r, emptyReminder()])}>＋ Add another important date</button>
            <button className="giftPrimary" disabled={!validDates} onClick={() => setStep(2.5)}>Continue</button>
          </>
        ) : step === 2.5 ? (
          <>
            <div className="giftProgress"><span>1 Dates</span><span className="active">2 Account</span><span>3 Done</span></div>
            <h2>Where should we send your reminders?</h2>
            <p className="giftLead">Your free account keeps every date together and lets you pause or cancel reminders whenever you want.</p>
            <div className="accountFields">
              <label>First name<input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} /></label>
              <label>Email address<input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></label>
              <label>Mobile number, optional<input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="For future WhatsApp reminders" /></label>
              <label className="consentCheck"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I agree to receive the gift reminders I selected. I can pause or unsubscribe at any time.</label>
              <label className="consentCheck"><input type="checkbox" checked={profile.marketing_consent} onChange={(e) => setProfile({ ...profile, marketing_consent: e.target.checked })} /> Also send me occasional GiftingGuru offers. Optional.</label>
            </div>
            {message && <p className="giftMessage">{message}</p>}
            <button className="giftPrimary" disabled={busy} onClick={activate}>{busy ? "Saving..." : session ? "Activate my reminders" : "Email my secure sign-in link"}</button>
            <button className="giftTextButton" onClick={() => setStep(2)}>Back to dates</button>
          </>
        ) : step === 3 ? (
          <>
            <div className="giftSuccessIcon">✉</div>
            <h2>Check your inbox</h2>
            <p className="giftLead">We sent a secure sign-in link to <b>{profile.email}</b>. Click it to confirm your free account and activate your reminders.</p>
            <small className="giftTrust">You can close this window. Your dates are safely waiting on this device.</small>
          </>
        ) : (
          <>
            <div className="giftSuccessIcon">✓</div>
            <h2>You’re covered.</h2>
            <p className="giftLead">{message || "Your gift reminders are active."} We’ll email you according to the schedule you chose.</p>
            <a className="giftPrimary giftLink" href="/#shop">Find a great gift</a>
            <button className="giftTextButton" onClick={manageReminders}>Manage my reminders</button>
          </>
        )}
      </section>
    </div>
  );

  if (landing) return wizard;

  return (
    <>
      <section className="giftLeadBanner">
        <div className="giftLeadIcon">🎁</div>
        <div><span>FREE GIFT REMINDER</span><h3>Never forget her anniversary. Or anyone’s special day.</h3><p>Tell us the dates. We’ll remind you in time, for free.</p></div>
        <button onClick={begin}>Set my reminders</button>
      </section>
      <button className="giftReminderFloat" onClick={session ? manageReminders : begin}>🎁 <span>{session ? "My reminders" : "Free gift reminders"}</span></button>
      {open && wizard}
    </>
  );
}
