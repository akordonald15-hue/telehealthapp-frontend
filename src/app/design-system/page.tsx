import type { Metadata } from "next";

import { DesignSystemShowcase } from "@/features/design-system/design-system-showcase";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return <DesignSystemShowcase />;
}
