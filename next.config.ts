import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    const protectedHeaders = [
      { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0, private" },
      { key: "Pragma", value: "no-cache" },
      { key: "Expires", value: "0" },
    ];

    return [
      { source: "/dashboard", headers: protectedHeaders },
      { source: "/appointments", headers: protectedHeaders },
      { source: "/appointments/:path*", headers: protectedHeaders },
      { source: "/messages", headers: protectedHeaders },
      { source: "/payments", headers: protectedHeaders },
      { source: "/home-care", headers: protectedHeaders },
      { source: "/home-care/:path*", headers: protectedHeaders },
      { source: "/nurse", headers: protectedHeaders },
      { source: "/nurse/:path*", headers: protectedHeaders },
      { source: "/records", headers: protectedHeaders },
      { source: "/profile", headers: protectedHeaders },
      { source: "/referrals", headers: protectedHeaders },
      { source: "/triage", headers: protectedHeaders },
      { source: "/care-plan", headers: protectedHeaders },
      { source: "/audit", headers: protectedHeaders },
      { source: "/provider-ledger", headers: protectedHeaders },
      { source: "/provider-ledger/:path*", headers: protectedHeaders },
    ];
  },
};

export default nextConfig;
