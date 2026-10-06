// Placeholder glyphs matching the landing design's solid icon style. Swap for final assets later.

type IconProps = { className?: string };

/** Long-shaft arrow used on the landing CTAs (wider than lucide's ArrowRight). */
export function ArrowLongRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M1.5 8h19M13.5 1.5 20.5 8l-7 6.5" />
    </svg>
  );
}

export function VideoSolidIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden="true">
      <path d="M5 3h7a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm1.2 3.6a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Z" />
      <path d="m17.2 9.6 4.3-2.9A1 1 0 0 1 23 7.5v9a1 1 0 0 1-1.5.8l-4.3-2.9Z" />
    </svg>
  );
}

export function HouseSolidIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden="true">
      <path d="M10.6 2.5a2.2 2.2 0 0 1 2.8 0l7.8 6.4c.5.4.8 1 .8 1.7v8.9a2.5 2.5 0 0 1-2.5 2.5H4.5A2.5 2.5 0 0 1 2 19.5v-8.9c0-.7.3-1.3.8-1.7ZM12 15.2a1 1 0 0 0-1 1v3.3a1 1 0 1 0 2 0v-3.3a1 1 0 0 0-1-1Z" />
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

export function IdCardsSolidIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden="true">
      <path d="M8 3h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-.5V5.5H6V5a2 2 0 0 1 2-2Z" />
      <path d="M4 7h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm3.5 3.6a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8Zm-2.9 7.9c.3-1.5 1.5-2.5 2.9-2.5s2.6 1 2.9 2.5ZM12 11.2h3.6v1.6H12Zm0 3.3h2.6v1.6H12Z" />
    </svg>
  );
}

export function FastForwardSolidIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M2.5 6.3c0-.9 1-1.4 1.7-.9l7.3 5.4V6.3c0-.9 1-1.4 1.7-.9l8 5.8c.6.4.6 1.3 0 1.7l-8 5.8c-.7.5-1.7 0-1.7-.9v-4.6l-7.3 5.4c-.7.5-1.7 0-1.7-.9Z" />
    </svg>
  );
}

export function BanknoteSolidIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden="true">
      <path d="M4 4.5h16a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3Zm8 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM5.5 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm13 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </svg>
  );
}
