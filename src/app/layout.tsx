import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

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
  title: "LifeFirst | Secure Telehealth Care",
  description: "Book doctors, manage records, and get secure care support with LifeFirst.",
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
      </body>
    </html>
  );
}
