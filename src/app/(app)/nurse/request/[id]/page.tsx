import { NurseRequestDetailClient } from "@/features/nurse/nurse-request-detail-client";

export default async function NurseRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NurseRequestDetailClient requestId={Number(id)} />;
}
