import "./globals.css";
import TrackingScripts from "./tracking-scripts";

const SITE = "https://www.giftingguru.co.za";

export const metadata = {
  metadataBase: new URL(SITE),
  title: { default: "GiftingGuru | Gifts and tech delivered across South Africa", template: "%s" },
  description: "Gifting Guru: gifts, tech and home essentials delivered across South Africa, plus free reminders for the dates that matter.",
  applicationName: "GiftingGuru",
  icons: { icon: "/favicon.webp", shortcut: "/favicon.webp", apple: "/favicon.webp" },
  verification: { google: "ZdvadmHbbkEhMK4WaS-ScjQrM4jzIA45jL3DJ8OVcko" },
  alternates: { types: { "text/plain": `${SITE}/llms.txt` } },
};

const siteLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: `${SITE}/`,
      name: "GiftingGuru",
      alternateName: ["Gifting Guru", "Gifting Guru South Africa", "giftingguru.co.za"],
      inLanguage: "en-ZA",
      publisher: { "@id": `${SITE}/#organization` },
    },
    {
      "@type": "OnlineStore",
      "@id": `${SITE}/#organization`,
      name: "GiftingGuru",
      alternateName: "Gifting Guru",
      url: `${SITE}/`,
      logo: `${SITE}/giftingguru-logo.png`,
      email: "hello@giftingguru.co.za",
      areaServed: { "@type": "Country", name: "South Africa" },
      parentOrganization: { "@type": "Organization", name: "Private Clients Advisory (Pty) Ltd", url: "https://privateclients.co.za" },
      sameAs: ["https://www.instagram.com/gifting_guru_za/", "https://www.facebook.com/GiftingGuruZa", "https://www.linkedin.com/company/gifting-guru-za"],
    },
  ],
};

export default function RootLayout({ children }) {
  return <html lang="en-ZA"><body>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd).replaceAll("<", "\\u003c") }} />
    {children}<TrackingScripts /></body></html>;
}
