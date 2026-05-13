import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { BRAND_NAME } from "@/lib/brand";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} | Trusted Telehealth And Home Care`,
  description: `Book appointments, message your care team, manage records, and coordinate home visits with ${BRAND_NAME}.`,
  icons: {
    icon: "/Logo/Logo.png",
    shortcut: "/Logo/Logo.png",
    apple: "/Logo/Logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${poppins.variable}`}>
      <body className="min-h-full bg-[#F9FAFB] text-[#1F2937] antialiased">
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
