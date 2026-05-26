export default function Loading() {
  return (
    <main className="grid min-h-[60dvh] place-items-center px-6 py-16" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 text-ash-500">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-primary"
        />
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-primary [animation-delay:120ms]"
        />
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-primary [animation-delay:240ms]"
        />
        <span className="ml-2 text-sm font-semibold">Loading...</span>
      </div>
    </main>
  );
}
