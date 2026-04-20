import Image from "next/image";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase text-[#2563EB]">LifeFirst</p>
              <h1 className="mt-3 text-3xl font-semibold text-zinc-950">{title}</h1>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{subtitle}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">{children}</div>
          </div>
        </section>
        <section className="hidden min-h-screen overflow-hidden lg:block">
          <Image
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80"
            alt="Clinician reviewing telehealth care notes"
            width={1400}
            height={1800}
            priority
            className="h-full w-full object-cover"
          />
        </section>
      </div>
    </main>
  );
}
