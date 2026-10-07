import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { isDashboardSession } from "@/lib/server/dashboard-access";

export default async function DashboardLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const cookieStore = await cookies();
  if (isDashboardSession(cookieStore.get("caretekk_dashboard_session")?.value)) redirect("/dasbooard");
  const { error } = await searchParams;
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#F5F8FC] px-4 py-10">
    <div className="ct-panel w-full max-w-md rounded-[24px] p-7"><BrandLockup /><h1 className="mt-6 font-heading text-2xl font-semibold">Dashboard sign in</h1>
      {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">Invalid email or password.</p> : null}
      <form action="/dasbooard/login/submit" method="post" className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold">Email<input name="email" type="email" autoComplete="username" required className="min-h-12 rounded-xl border border-slate-200 px-3 font-normal" /></label>
        <label className="grid gap-2 text-sm font-semibold">Password<input name="password" type="password" autoComplete="current-password" required className="min-h-12 rounded-xl border border-slate-200 px-3 font-normal" /></label>
        <button type="submit" className="min-h-12 rounded-xl bg-[#2563EB] px-4 font-semibold text-white">Sign in</button>
      </form>
    </div>
  </main>;
}
