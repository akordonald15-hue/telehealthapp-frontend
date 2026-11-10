import type { Metadata, Viewport } from "next";
import { Inter_Tight, Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/app/providers";
import { BRAND_NAME } from "@/lib/brand";

// Design-system fonts (Figma "DESIGN SYSTEM" page): Inter Tight for body text, Manrope for headings.
// Variable fonts: every weight the UI uses (200–800) is available.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--ds-font-manrope",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--ds-font-inter-tight",
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} | Trusted Telehealth And Home Care`,
  description: `Book online appointments, message your care team, and manage records with ${BRAND_NAME}. Online consultations are subject to practitioner eligibility, applicable regulations, and appointment availability. Home visits are currently available in Akwa Ibom State, Nigeria.`,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/pwa/icon-192.png",
    apple: [{ url: "/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: BRAND_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#3961A9",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Browser extensions (e.g. QuillBot) add attributes to <html> before hydration; this only silences that element.
    <html lang="en" className={`h-full ${manrope.variable} ${interTight.variable}`} suppressHydrationWarning>
      <body className="min-h-full bg-grey-50 text-grey-800 antialiased">
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
