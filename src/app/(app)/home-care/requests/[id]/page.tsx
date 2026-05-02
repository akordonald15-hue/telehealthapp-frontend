import { HomeCareRequestDetailClient } from "@/features/homecare/homecare-request-detail-client";

export default async function HomeCareRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HomeCareRequestDetailClient requestId={Number(id)} />;
}
