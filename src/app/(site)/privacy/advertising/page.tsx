import Link from "next/link";
import { AdvertisingPreferences } from "@/features/advertising/preferences";

export default function AdvertisingNotice() {
  return <main className="mx-auto max-w-3xl space-y-5 px-6 py-12 text-slate-900">
    <h1 className="text-3xl font-semibold">Advertising privacy</h1>
    <p>Advertising is optional. When enabled by Caretekk and allowed by you, Meta Pixel measures a page view on the public homepage only. Your choice does not affect consultations or other Caretekk services.</p>
    <p>Meta may receive your IP address, browser and device information, the homepage address, and advertising cookie identifiers. No patient identity, clinical information, booking details or payment details are intentionally sent. Account and healthcare pages are excluded. Landing addresses with query parameters, unknown fragments or an unapproved referrer are not tracked. Only the homepage’s fixed public section links are allowed.</p>
    <p>We do not enable advanced matching, automatic events, conversion events or Conversions API. Your advertising choice is stored on this browser for up to 180 days. You may reject or withdraw it below. Withdrawal stops future tracking and removes advertising cookies we can access; it cannot recall information already received by Meta.</p>
    <p>For Meta’s handling of information, see <a href="https://www.facebook.com/privacy/policy/" rel="noreferrer" className="underline">Meta’s privacy policy</a>. Contact Caretekk through the existing support channels with privacy questions.</p>
    <AdvertisingPreferences />
    <p><Link href="/" className="underline">Return to homepage</Link></p>
  </main>;
}
