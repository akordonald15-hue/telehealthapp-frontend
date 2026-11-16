import DocumentShell from "@/app/document";
import { AdvertisingBoundary } from "@/features/advertising/advertising-boundary";
export { metadata, viewport } from "@/app/document";

export default function MarketingRoot({ children }: { children: React.ReactNode }) {
  return (
    <DocumentShell>
      <AdvertisingBoundary
        enabled={process.env.NEXT_PUBLIC_META_PIXEL_ENABLED === "true" && process.env.VERCEL_ENV === "production"}
        pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID || ""}
      >
        {children}
      </AdvertisingBoundary>
    </DocumentShell>
  );
}
