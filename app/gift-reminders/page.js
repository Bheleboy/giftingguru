import GiftReminder from "../gift-reminder";

export const metadata = {
  title: "Free Gift Reminder | Never Forget Important Dates | GiftingGuru",
  description: "Save birthdays, anniversaries and special dates. GiftingGuru will remind you in time, for free.",
};

export default function GiftRemindersPage() {
  return (
    <main className="giftLanding">
      <GiftReminder landing />
      <section className="giftLandingProof">
        <div><b>100% free</b><span>No subscription or purchase required.</span></div>
        <div><b>Your timing</b><span>Monthly, 14-day, 7-day or 1-day reminders.</span></div>
        <div><b>Your control</b><span>Pause or unsubscribe whenever you want.</span></div>
      </section>
    </main>
  );
}
