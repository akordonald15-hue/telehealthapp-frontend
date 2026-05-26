import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/app/providers";
import { BRAND_NAME } from "@/lib/brand";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} | Trusted Telehealth And Home Care`,
  description: `Book appointments, message your care team, manage records, and coordinate home visits with ${BRAND_NAME}.`,
  icons: {
    icon: "/Logo/newlogo.png",
    shortcut: "/Logo/newlogo.png",
    apple: "/Logo/newlogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${lexend.variable}`}>
      <body className="min-h-full bg-[#F9FAFB] text-[#1F2937] antialiased">
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
