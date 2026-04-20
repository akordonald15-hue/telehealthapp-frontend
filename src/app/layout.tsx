import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";

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
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#F9FAFB] text-[#1F2937] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
