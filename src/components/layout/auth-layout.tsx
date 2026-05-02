import Image from "next/image";
import { CheckCircle2, ShieldCheck, Stethoscope } from "lucide-react";

import { BrandLockup } from "@/components/brand/brand-lockup";

const authHighlights = [
  {
    title: "Care that feels coordinated",
    description: "Appointments, secure records, referrals, and payments stay in one calm workflow.",
    icon: Stethoscope,
  },
  {
    title: "Built for trust",
    description: "Secure sign-in, trusted care teams, and a calm experience from the moment you arrive.",
    icon: ShieldCheck,
  },
  {
    title: "Ready on any screen",
    description: "Move from sign in to care plans comfortably on mobile, tablet, or desktop.",
    icon: CheckCircle2,
  },
];

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(112,152,212,0.16),_transparent_34%),linear-gradient(180deg,#EDF3FF_0%,#F7FAFE_36%,#FFFFFF_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="relative flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="min-w-0 w-full max-w-[calc(100vw-32px)] sm:max-w-xl">
            <div className="inline-flex rounded-full border border-white/70 bg-white/85 px-3 py-2 shadow-sm backdrop-blur">
              <BrandLockup href="/" wordmark="image" wordmarkClassName="h-5 max-w-[138px] sm:h-6 sm:max-w-[156px]" />
            </div>

            <div className="mt-6 rounded-[28px] border border-white/75 bg-white/88 p-5 shadow-[0_24px_80px_-48px_rgba(66,107,179,0.45)] backdrop-blur sm:p-8">
              <div className="mb-8 min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-[var(--primary)]">Welcome back to care</p>
                <h1 className="font-heading mt-4 max-w-full break-words text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">{title}</h1>
                <p className="mt-3 max-w-full break-words text-sm leading-7 text-slate-600 sm:max-w-lg sm:text-base">{subtitle}</p>
              </div>

              <div className="mb-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {authHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-[20px] border border-slate-200/80 bg-[linear-gradient(180deg,#FFFFFF_0%,#F5F9FF_100%)] p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)]"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="mt-4 text-sm font-semibold text-[#1F2937]">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_-42px_rgba(15,23,42,0.55)] sm:p-6">
                {children}
              </div>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(66,107,179,0.14),rgba(15,23,42,0.34))]" />
          <Image
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80"
            alt="Caretekk clinician supporting a patient remotely"
            width={1600}
            height={1900}
            priority
            unoptimized
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-8 bottom-8 rounded-[28px] border border-white/20 bg-slate-950/50 p-6 text-white shadow-2xl backdrop-blur-sm">
            <div className="mb-4">
              <BrandLockup wordmark="image" inverse wordmarkClassName="h-6 max-w-[158px] sm:h-7 sm:max-w-[176px]" />
            </div>
            <h2 className="font-heading mt-3 text-3xl font-semibold tracking-tight">Healthcare that feels personal, not fragmented.</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-blue-50/86">
              Sign in to manage visits, share records, message your care team, and keep each step of the journey in one trusted workspace.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
