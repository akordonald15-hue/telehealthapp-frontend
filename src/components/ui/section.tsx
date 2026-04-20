export function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">{title}</h1>
          {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-600">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
