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
    <section className="ct-page-transition grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="ct-dashboard-title text-[#1F2937]">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-base leading-7 text-[#667085]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
