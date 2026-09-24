/** Date-only formatting for referral surfaces. `formatDateTime` in lib/utils is too noisy for
 * an expiry line like "Expires 21 Nov 2026". */
export function formatReferralDate(value?: string | null) {
  if (!value) {
    return "";
  }
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}
