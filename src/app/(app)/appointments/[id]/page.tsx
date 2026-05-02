import { AppointmentDetailClient } from "@/features/appointments/appointment-detail-client";

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppointmentDetailClient appointmentId={Number(id)} />;
}
