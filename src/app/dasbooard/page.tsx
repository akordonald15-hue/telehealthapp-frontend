import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { TrainingDashboard } from "@/features/admin/training-dashboard";
import { isDashboardSession } from "@/lib/server/dashboard-access";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  if (!isDashboardSession(cookieStore.get("caretekk_dashboard_session")?.value)) redirect("/dasbooard/login");

  return <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#F5F8FC_0%,#F7FAFE_40%,#FFFFFF_100%)]">
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><BrandLockup /><form action="/dasbooard/logout" method="post"><button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Sign out</button></form></div></header>
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8"><TrainingDashboard /></main>
  </div>;
}
