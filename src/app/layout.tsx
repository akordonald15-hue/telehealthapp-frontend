import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/app/providers";
import { BRAND_NAME } from "@/lib/brand";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} | Trusted Telehealth And Home Care`,
  description: `Book online appointments, message your care team, and manage records with ${BRAND_NAME}. Online consultations are currently available to patients located in Nigeria, subject to practitioner eligibility and appointment availability. Home visits are currently available in Akwa Ibom State, Nigeria.`,
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
  themeColor: "#426BB3",
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
    <html lang="en" className={`h-full ${lexend.variable}`} suppressHydrationWarning>
      <body className="min-h-full bg-[#F9FAFB] text-[#1F2937] antialiased">
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
