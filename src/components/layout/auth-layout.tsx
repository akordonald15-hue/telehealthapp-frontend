import Image from "next/image";
import { CheckCircle2, Stethoscope } from "lucide-react";

import { BrandLockup } from "@/components/brand/brand-lockup";

const authHighlights = [
  {
    title: "Simple care access",
    description: "Appointments, home care, records, and messages stay in one place.",
    icon: Stethoscope,
  },
  {
    title: "Built for trust",
    description: "Secure sign-in and verified care teams from the moment you arrive.",
    icon: CheckCircle2,
  },
];

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(112,152,212,0.14),_transparent_30%),linear-gradient(180deg,#F8FBFF_0%,#F4F8FF_34%,#FFFFFF_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="relative flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-[560px] animate-soft-enter">
            <div className="inline-flex rounded-full bg-white/86 px-3 py-2 shadow-[0_16px_36px_-28px_rgba(20,36,68,0.4)] backdrop-blur">
              <BrandLockup href="/" wordmark="image" wordmarkClassName="h-5 max-w-[138px] sm:h-6 sm:max-w-[156px]" />
            </div>

            <div className="ct-panel mt-6 p-5 sm:p-8">
              <div className="mb-8">
                <p className="ct-kicker">Caretekk account</p>
                <h1 className="font-heading mt-4 text-[clamp(2.15rem,5vw,3.3rem)] font-semibold tracking-[-0.055em] text-[#1F2937]">{title}</h1>
                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">{subtitle}</p>
              </div>

              <div className="mb-8 grid gap-3 sm:grid-cols-2">
                {authHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="ct-soft-card rounded-[22px] p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="mt-4 text-sm font-semibold text-[#1F2937]">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-[24px] border border-slate-200/70 bg-white p-4 shadow-[0_18px_42px_-36px_rgba(20,36,68,0.35)] sm:p-6">
                {children}
              </div>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,38,63,0.12),rgba(23,38,63,0.42))]" />
          <Image
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=80"
            alt="Caretekk clinician supporting a patient remotely"
            width={1600}
            height={1900}
            priority
            unoptimized
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-10 bottom-10 rounded-[32px] border border-white/18 bg-slate-950/40 p-7 text-white shadow-[0_30px_90px_-48px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <BrandLockup wordmark="image" inverse wordmarkClassName="h-7 max-w-[176px]" />
            <h2 className="font-heading mt-5 text-[2.3rem] font-semibold tracking-[-0.05em]">Care that feels clear from the very first step.</h2>
            <p className="mt-4 max-w-xl text-[0.98rem] leading-8 text-blue-50/88">
              Sign in to manage visits, records, messages, and home care with a calmer, more connected experience.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
