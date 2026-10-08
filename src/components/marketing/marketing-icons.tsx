
type IconProps = { className?: string };

export function ArrowLongRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M1.5 8h19M13.5 1.5 20.5 8l-7 6.5" />
    </svg>
  );
}

export function ShieldCheckSolidIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden="true">
      <path d="M11.3 1.7a2 2 0 0 1 1.4 0l7.2 2.7a1.6 1.6 0 0 1 1.1 1.5V11c0 5.2-3.6 9.6-8.4 11.2a2 2 0 0 1-1.2 0C6.6 20.6 3 16.2 3 11V5.9a1.6 1.6 0 0 1 1.1-1.5Zm4.9 7.6a1 1 0 0 0-1.4 0l-4 4-1.6-1.6a1 1 0 0 0-1.4 1.4l2.3 2.3a1 1 0 0 0 1.4 0l4.7-4.7a1 1 0 0 0 0-1.4Z" />
    </svg>
  );
}

export function StopwatchSolidIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden="true">
      <path d="M9.5 1h5a1 1 0 1 1 0 2h-1.5v1.6a9.5 9.5 0 1 1-2 0V3H9.5a1 1 0 0 1 0-2ZM12 8.5a1 1 0 0 0-1 1v4.2a1 1 0 0 0 2 0V9.5a1 1 0 0 0-1-1Z" />
    </svg>
  );
}
