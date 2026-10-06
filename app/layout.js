import "./globals.css";
import TrackingScripts from "./tracking-scripts";

export const metadata = {
  metadataBase: new URL("https://www.giftingguru.co.za"),
  title: "GiftingGuru",
  description: "Smart gifts. Great finds.",
  icons: { icon: "/favicon.webp", shortcut: "/favicon.webp", apple: "/favicon.webp" },
  verification: { google: "ZdvadmHbbkEhMK4WaS-ScjQrM4jzIA45jL3DJ8OVcko" },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}<TrackingScripts /></body></html>;
}
