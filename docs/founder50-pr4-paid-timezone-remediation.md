# PR4 paid booking timezone remediation

16 October 2026. Targeted frontend change; backend unchanged.

## Cause and correction

The date/hour controls produced a timezone-free `YYYY-MM-DDTHH:mm` React selection. Paid checkout passed it through `appointmentsApi.book`, JSON and the BFF without an offset. PR3's UTC serializer consequently interpreted the selected Lagos hour as UTC. PostgreSQL correctly stored that incorrectly specified instant; the API returned it unchanged. This was inherited from pre-PR4 main. A fresh isolated naive-payload API probe reproduced the same 08:00Z error during this remediation.

Future selections now resolve once through the IANA `Africa/Lagos` zone using built-in Intl before entering form/booking state. Both checkout branches receive an explicit ISO instant. Future calendar defaults, elapsed-hour filtering, earliest-slot choice and unavailable-slot comparisons use Lagos calendar fields too; browser calendar carriers are never submitted as instants. Already-offset values preserve identity, so the promotional hook's ISO serialization and recovery cannot shift them again. Paid immediate checkout still submits `new Date().toISOString()`. No dependencies or backend/global timezone changes.

Appointment list and promotional confirmation/recovery displays explicitly format the stored instant in Africa/Lagos, independent of device timezone. Existing persisted instants are never rewritten. The scheduling summary labels Lagos time.

| Selected Lagos wall time, 20 October 2026 | Submitted UTC |
| --- | --- |
| 08:00 | 20 October 07:00Z |
| 14:00 | 20 October 13:00Z |
| 00:30 | 19 October 23:30Z |
| 23:30 | 20 October 22:30Z |

The midnight examples test conversion and display; midnight is outside the application's offered hourly consultation slots.

## Real PR3/PostgreSQL evidence

Before: independent re-review selected 18 October 08:00 Lagos, sent `2026-10-18T08:00`, stored/returned `2026-10-18T08:00:00Z` (09:00 Lagos).

After: fresh isolated database `founder50_pr4_timezone`, pinned merged PR3 implementation, synthetic verified patients and completed triage, loopback Next BFF and Django. The same selected 18 October 08:00 Lagos sent `2026-10-18T07:00:00.000Z`; API returned and ORM read `2026-10-18T07:00:00Z`, displayed as 08:00 Lagos. Shift: zero seconds; selected doctor/date unchanged, one appointment/payment.

Paid immediate stored the exact fixed submission instant `2026-10-15T11:34:56Z`. Promotional future stored `2026-10-15T12:00:00Z` (13:00 Lagos). Before-commit request loss retried successfully; after-commit response loss replayed the original appointment with HTTP200. Request body/key stayed identical, changed doctor/time was rejected409, and each promotional patient retained exactly one appointment/payment. Expiry, reacquisition and idempotent release also passed. Bank transfer immediate/future API bookings with explicit instants passed.

All integration data is synthetic. Cash initialization was stubbed to a loopback URL/transfer state; live provider APIs, real cash successes and payouts were not exercised. The fixed 15 October clock is fixture time. Zero pre-completion earnings.

External local evidence directory: `C:/Projects/Caretekk/founder50-pr2-independent-review`, files `timezone-real-results.json`, `timezone-backend-results.json`, `timezone-identity-proof.json`, `timezone-before-proof.log`, `timezone-*.log`. Fixture tokens are excluded from this repository.

## Validation and boundary

138 unit tests (121 previous +17 timezone cases including calendar fields), TypeScript, lint (one inherited React Hook Form warning), production build, original19 enabled browsers, eight additional paid-future provider/browser-timezone cases, disabled payment browsers and18 real backend assertions passed locally for this commit. The matrix explicitly sets Africa/Lagos, UTC, America/New_York and Europe/London and asserts 08:00 Lagos submits07:00Z for Paystack and bank transfer. Unit cases cover all four times and display/repeated-normalization identity in each zone. Existing19 cases retain the original four defect regressions.

Merge/deployment safety remains **BLOCKED — DEPLOYMENT CONTROLS UNVERIFIED**. Previous authorized read-only Vercel checks returned403 for both production projects. No settings, deployment controls, production flags or financial records were changed. Green CI does not authorize deployment. No merge, deployment, campaign activation or PR5 implementation. Independent re-review required after push.

Local build attempts without the required dummy backend URL failed page-data collection (configuration error). Validation was repeated with explicit loopback BACKEND_API_BASE_URL/NEXT_PUBLIC_API_BASE_URL and the dev server stopped. No production start command was retried.
