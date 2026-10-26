# Founder50 PR4: checkout implementation and review handoff

## Repository and scope

Frontend: `akordonald15-hue/telehealthapp-frontend`. Exact base: `0224c180e2af59742d1dfc99cfc2c442e3bda59a` (main). Branch: `feature/founder50-pr4-checkout-experience`. Backend contract: merged PR3 main `26f342e451efae8d0f803b1f46f3233f256392b7`, whose tree equals reviewed PR3 head `fb6123a9c3367f1abb59129f603e3067688bd675`.

Reconnaissance traced `appointments-client.tsx`: saved completed triage → recommended doctors → timing/schedule sheet → shared submission handler → Paystack URL or bank-transfer instructions. Both existing payment CTAs are in the same schedule dialog: the body and footer now use the shared promotion controller, with one labelled promotion panel in the checkout body. This avoids duplicate code fields and an oversized sticky mobile footer. Existing authentication, cookie-forwarding BFF, React Query, UI primitives and referral repricing consent are preserved. The existing worktree's unrelated package/admin/artifact edits were left alone.

No backend, unrelated page, medical workflow, payout policy or scheduler change. No new runtime dependency. The new PR/manual-only Actions workflow validates this frontend; it cannot deploy.

## Disabled by default

`NEXT_PUBLIC_FOUNDER50_ENABLED` must equal `true` to show the promotion presentation. Absent/false hides the panel/confirmation and performs no promotion requests, reservation or free booking. `.env.example` and CI explicitly use false. This is a build-time Next.js public flag: a built bundle does not respond to a later environment-only toggle; a separately authorized build is needed to change visibility. The backend independently authorizes every operation and still defaults acquisition off.

No campaign was seeded or enabled in production. Local QA alone enabled presentation and an isolated synthetic backend campaign. `vercel.json` excludes this feature branch from automatic Git deployments; it does not alter main or production secrets/settings. This uses Vercel's documented [git.deploymentEnabled configuration](https://vercel.com/docs/project-configuration/git-configuration). A later merge/deployment requires its own authorization and deployment-safety review.

## API contracts used

Browser paths are the same paths under `/api`; the existing BFF forwards to these backend `/api/v1` routes:

| Operation    | Backend route                                          | Contract                                                                                                                                                     |
| ------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Availability | GET `/api/v1/promotions/founder50/`                    | No body; `accepting_reservations`, `eligible`, `can_reserve`, remaining capacity, own claim and code                                                         |
| Apply        | POST `/api/v1/promotions/founder50/reserve/`           | `{code,idempotency_key,service_type:"appointment"}`; 201 new / 200 replay with reservation, applied, pricing, replayed                                       |
| Recover      | GET `/api/v1/promotions/reservations/<uuid>/`          | Owned reservation and pricing while RESERVED; inline expiry                                                                                                  |
| Remove       | POST `/api/v1/promotions/reservations/<uuid>/release/` | `{}`; idempotent unused reservation release                                                                                                                  |
| Confirm      | POST `/api/v1/appointments/book/`                      | Doctor, timezone-aware scheduled_at, saved triage reference, required callback URL, generic reason/empty notes, reservation UUID and a distinct booking UUID |

All use the existing authenticated API client and cookie proxy. Inputs never include patient identity, price, discount, payment status or provider. Promotional requests never include reward_id. The backend owns account/capacity/triage/scheduling eligibility; typing or focusing does not reserve anything.

## Patient experience and pricing

The labelled promo field supports keyboard Enter or Apply; synchronous operation guards and pending buttons prevent duplicate submissions. Successful Apply shows only backend pricing: service value, full negative discount and total to pay, with an explicit free-consultation message. Tests use a changed server price of ₦2,450 to ensure display is not hardcoded to ₦2,000. Existing referral rewards and promotion are mutually exclusive; a patient must remove a selected reward before applying.

The confirmed response must explicitly identify promotional checkout, confirmed action/status, no payment required, a successful promotional payment and zero NGN amount. A missing authorization URL cannot establish success. The confirmation shows doctor, appointment time, ₦0 paid and a real appointment-details link, and invalidates appointment/payment queries. Paid requests continue through the existing mutation, Paystack redirect, bank transfer and repricing consent without promotional fields.

## Expiry, identity and recovery

Use backend expires_at for a 30-second-resolution remaining-time display and local expiry trigger; re-fetch authoritative status on expiry, focus and cross-tab storage changes. Browser time is advisory. Apply never renews the deadline. BOOKED/REDEEMED claims never display a countdown or lose future funding. An expired claim requires a new Apply or explicit choice of ordinary paid checkout; it does not silently change the requested free booking into payment. Consumed/booked accounts can explicitly choose ordinary paid care for another consultation.

Recovery storage is account-scoped and allowlisted: Apply UUID and/or a booking UUID plus doctor/time/triage/callback/reservation references. It contains no token, symptom narrative, medical summary, entered clinical notes, pricing or provider. Promotional reason is a fixed generic label and notes are empty; the existing saved owned triage still supplies the doctor's clinical summary. The paid reason/notes flow is unchanged. Corrupt or unavailable recovery storage fails closed instead of submitting an unrecoverable request.

An unknown network outcome retains the exact booking request/key and blocks another checkout. A recovery action is available after reload even without reselecting a doctor. Cooperative tabs serialize through the Web Locks API when supported; backend constraints remain authoritative without it. A definite validation/slot refusal retains its failed identity: unchanged normalized retries reuse it; a changed selection uses a new booking key only after a definite refusal. Unknown outcomes always recover the original selection, not the currently edited UI. Success clears recovery; `booking_no_longer_confirmed` routes the patient to existing appointments and never fabricates a new booking.

Backend gap: reservation status/availability do not include the linked appointment ID. A retained request can recover it reliably, demonstrated in a reload/lost-response browser test. Without that key, BOOKED/REDEEMED states link to the existing authorized appointments list. Adding read-only appointment_id would improve cross-device navigation but is non-blocking; no backend change was made.

## Errors and accessibility

Machine codes map to static patient-safe copy for invalid input/code, unavailable/paused campaign, exhaustion, ineligible account, existing entitlement, ownership 404, expiry, triage/doctor/slot refusal, key conflict and an existing booking. Framework authentication, throttling, network and server failures have safe fallback copy; raw backend exceptions/SQL are never displayed. The existing API client handles session refresh/sign-in redirection. Throttles tell patients to wait; there is no automatic retry storm.

New controls use existing labelled Input/Button/Notice primitives, visible focus styles, keyboard submission, disabled/busy semantics, role=status for success and role=alert for errors. Countdown changes are not announced every second. Text communicates state independently of color. The responsive panel wraps pricing and action layouts; mobile browser QA checks no panel overflow and successful keyboard entry. This is targeted accessibility verification, not a claim of full application WCAG certification or a screen-reader audit.

## Validation and reproducibility

Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` with explicit local/dummy API URLs. Keep the default public flag false for the release-style build. CI performs those gates and a disabled-checkout Chromium regression using mocked APIs.

For feature-on browser QA, start Next locally with `NEXT_PUBLIC_FOUNDER50_ENABLED=true`, point API URLs to loopback, and run `node scripts/founder50-browser-qa.mjs`. Its default journeys intercept every API call: mobile/desktop free checkout, mobile lost-response/reload replay, exhausted campaign and ordinary Paystack redirect. `QA_DISABLED=true` instead verifies hidden promotion UI, zero promotion requests and the ordinary paid request/redirect. `QA_OUTPUT_DIR` selects an external artifact directory. QA refuses non-loopback app URLs.

An additional real integration run used the merged PR3 Django code, a newly created loopback PostgreSQL database, a synthetic verified account/completed triage/doctor and an isolated JWT cookie. Availability, Apply, status and booking traversed browser → Next BFF → real Django ORM/SQL guards. Other app bootstrap data was stubbed; provider HTTP was forbidden, notifications muted and cache/channel transport local. The result was one confirmed appointment, one successful promotional Payment at ₦0, immutable ₦2,000/₦2,000/₦0 pricing, one BOOKED claim, capacity 1 and no earning before completion. No production credential/data/provider was accessed.

Evidence logs and screenshots live outside the implementation tree in `C:/Projects/Caretekk/founder50-pr2-independent-review/`, prefixed `pr4-`. Final engineering report records exact counts, final SHA, PR URL and exact-head CI outcomes. Exploratory failures were corrected rather than hidden: duplicate promotion panel identified by browser strict selectors; asynchronous replay assertion needed response polling; isolated backend first needed an available local port and local cache configuration. No backend implementation change was needed.

Known inherited quality issues: one React Compiler warning on the existing react-hook-form `form.watch()` call; five high-severity transitive development-tool advisories in the existing dependency tree. Production-only npm audit reports zero vulnerabilities. Package manifests/lockfile are unchanged; no unrelated dependency upgrade was folded into PR4.

## Review and launch boundaries

Ready for independent frontend/security review after exact-head CI. No merge, deployment, production activation, PR5 work or backend policy change is authorized by this PR. Backups/PITR, forward-only migration recovery, controlled migration deployment, historical reconciliation, actual deployed flags/code/schema, ledger/expiry operations, subsidy funding, approved cancellation/no-show/restoration/recovery policy and staging/launch acceptance remain separate operational gates.
