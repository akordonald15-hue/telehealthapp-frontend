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
    <section className="grid gap-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="ct-dashboard-title">{title}</h1>
          {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-[#667085] sm:text-[0.98rem]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
