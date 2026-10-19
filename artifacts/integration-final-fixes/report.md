# Caretekk frontend redesign integration and final fixes

8 October 2026, Africa/Lagos. **Implementation ready for review; final acceptance BLOCKED only for the specifically unlocated consent/policy integration and external Paystack test-mode coverage described below.** This is an integration of an existing operational platform, not a new product launch or a new compliance implementation.

The founder's current clarification supersedes the earlier report's practitioner-document and business-process verification gates. Practitioner/nursing verification is accepted as founder-confirmed. No private practitioner documentation was requested, accessed, copied or attached. No credential, specialist, nursing-poster or legitimate service claims were rewritten. The approved design, named portrait assets, hero composition and marketing commit `bda0354f79ad50d030ab55a73ee5ee0f08640e53` are preserved, with only the expressly requested Nigeria-only clinical-availability clarification.

## A. Existing functionality discovered

Backend inspected from the existing repository at `89ee11a8cd46848ca5eab48766f3b2cb46bc1639`, then edited in an isolated worktree at `C:/Projects/Caretekk/backend-release`. The original backend checkout was left unchanged. Frontend changes are on the existing release worktree at `C:/Projects/Caretekk/frontend-release`; unrelated package/admin modifications in `telehealthapp-frontend` remain untouched.

- Existing verified-email registration/login, JWT cookies, refresh/logout, provider setup and patient/doctor/nurse profiles were reused.
- Existing doctor discovery, provider availability, completed conversation-result requirement, payment-first appointment booking and confirmation were reused.
- Existing Paystack and bank-transfer initialization/verification, retries, server pricing, payment-detail ownership and provider ledger were reused. No provider success response or patient payment was fabricated in product code.
- Existing clinical-referral create/update endpoints, admin-only operational status changes and patient/doctor ownership checks were reused. These are separate from signup referral attribution/rewards.
- Existing REST messaging, Channels/Redis authentication, consultation windows, voice/file endpoints, care plans and scoped/audited clinical access were preserved.
- Existing Eket/Uyo homecare services, nurse approval/dispatch, service zones, requests, assignments, verification, tracking and completion endpoints were preserved. Homecare still requires the existing feature flag and operational providers.
- Existing `/triage` browser route intentionally redirects to `/appointments`, where the care-check journey is consolidated. It was not replaced or revived as another page.

## B. Actual integration fixes

| Flow | Frontend request | Existing backend contract | Root cause and smallest fix |
|---|---|---|---|
| Active bank-transfer status polling | `paymentsApi.detail(id)` → GET `/api/payments/<id>/` (`appointments-client.tsx`) | GET `/api/v1/payments/<id>/`; authenticated, patient/admin scoped; returns serialized Payment with `id`, status/provider/amount/currency and related service fields | Missing Next.js handler. Added `src/app/api/payments/[id]/route.ts` GET, forwarding the original request to `/payments/<id>/`. No payload or status computation added. |
| Clinical-referral operational updates | `referralsApi.update(id, {status})` → PATCH `/api/referrals/<id>/` (referrals/admin clients) | PATCH `/api/v1/referrals/<id>/`; authenticated/owned or admin; **only admin may change operational status**; returns updated Referral | Missing Next.js handler. Added `src/app/api/referrals/[id]/route.ts` PATCH, forwarding to `/referrals/<id>/`. Backend authorization and response remain authoritative. |

Both routes use the existing `forwardBackendRequest`: cookies/authentication, JSON body, method, backend errors and response schema are preserved. Unit regression tests check exact targets, original request and payload preservation, returned response identity and a backend 403. Real local BFF tests verify payment GET 200 after actual local confirmation, patient referral-status PATCH 403 and admin PATCH 200 with the requested new status.

The local bank-transfer test also demonstrated hard-coded Paystack labels in the homecare form before the backend chose a provider. Changed only those labels to provider-neutral “payment”/“Continue to payment.” Existing checkout selection and both response branches remain unchanged.

The previously identified **unused** reschedule/refund API-helper routes were not expanded into new functionality. No current UI callers were found; they are not advertised as newly validated workflows. No refund/payment API authorization was broadened.

## C. Reuse of existing privacy and consent

Existing privacy behavior was located and preserved: scoped account/clinical queries; restricted and audited disputed-thread review; HttpOnly authentication cookies; private-page/API no-store and service-worker exclusions; session/draft handling; redacted operational notifications; AI medical disclaimers; and explicit financial repricing consent (`src/features/referral-program/repricing-consent.tsx`), reused in appointment/homecare/payment screens and covered by the existing tests.

The redesign retains the existing repricing component and call sites. The older “Improve auth onboarding clarity and privacy” commit changes email-flow/session/error handling rather than adding a policy or clinical-consent system. Main before the redesign, all locally available branch file histories for privacy/consent/terms, and the supplied frontend/backend sources were inspected. No evidence was found that PR #8/#9 removed an existing policy or clinical-consent component.

**Precise components not located in these supplied versions:** a public privacy-policy route/document link; terms-and-conditions route/document link; patient/clinical-consent UI; the corresponding versioned acceptance model/API/audit event or an external integration URL. The founder confirms these exist in the operational platform; this report does **not** conclude that the platform never implemented them. Their implementation/build/route location must be identified before exposure in this particular candidate can be verified or reconnected. No duplicate schema, checkbox or consent store was created. The new location checkbox is an eligibility declaration, not clinical/privacy consent.

Result: preserved discovered privacy controls and financial consent **PASS**; reconnecting/validating the not-located policy and clinical-consent integration **BLOCKED**. No practitioner-document or fresh compliance investigation is a release prerequisite in this report.

## D. Nigeria-only clinical eligibility

No existing country field/current-country eligibility mechanism was found in the supplied patient profile or booking contracts. Nigerian phone, state and LGA fields are retained, but are not used as proof of current physical location. No IP-only restriction was introduced.

Added the minimal shared backend permission `apps/profiles/clinical_location.py` and configuration `CLINICAL_ALLOWED_COUNTRIES=NG` (default NG). Four clinical entry points require a nonempty string `consultation_country` whose trimmed, uppercased value is allowed:

1. POST `/api/v1/triage/start`;
2. POST `/api/v1/triage/conversation/start`;
3. POST `/api/v1/appointments/book/`;
4. POST `/api/v1/home-care/requests/book/`.

Missing, blank, malformed or unsupported declarations receive **403 before session/booking/payment work**. Public browsing, authentication, read-only history and existing care resolution are not country-blocked. Patients cannot use generic appointment/homecare creation as an alternate checkout route: the existing backend already refuses those patient writes. Existing clinical scheduling, payment pricing, provider verification and service-zone rules were not replaced.

The clinical booking screens show an unchecked “I confirm that I am currently in Nigeria” checkbox using existing UI styling. The appointments care check does not auto-start until confirmation; booking payloads derive NG only from the current confirmation state. A direct API request still has to pass the server permission. Confirmation is not preselected or persisted as a permanent identity assertion. Existing homecare service/zone enforcement remains Eket/Uyo within Akwa Ibom, with the exact Akwa Ibom notice preserved.

Public copy now states online consultations within Nigeria; international visitors may still browse. Changes are limited to the online-coverage lines, hero description, referral copy and metadata. Counts, prices, practitioner descriptions, 24/7 wording, confidentiality wording, hero assets, spacing and composition are unchanged.

**No migration or country-profile backfill is required.** Existing callers must send the new field; the example environment documents the allowlist. This is a server-enforced current-location **declaration**, not independent geolocation or proof that a patient is truthful. It creates no international licensing framework. Future expansion requires deliberate allowlist/UI/operating-scope review; changing configuration alone does not establish practitioner eligibility abroad.

Regression coverage includes 20 raw rejected cases across four entry points, permitted/case-normalized NG, a closed allowlist and unaffected GET history. Existing positive API test fixtures explicitly declare NG; the new eligibility tests opt out of that fixture and send raw absent/foreign input. No backend permission is mocked. Real BFF tests independently verify missing/US rejection and successful NG booking.

## E. Actual local integration testing

The disposable Docker project `caretekk-release-qa-20261008` uses the current backend worktree with PostgreSQL 16, Redis and MinIO. It has its own database/storage and an **internal-only application network**. A loopback TCP gateway passes HTTP/WebSocket traffic without fabricating responses. No original `.env`, production database, production account or live payment credential is used. QA secrets/accounts and physician/nurse license strings are explicitly fictional fixtures. Generated OTP mail is sent to a local file mailbox and is excluded from version control.

Existing migrations were executed against the actual QA HTTP database. The backend's existing Celery application runs real tasks eagerly in this local QA process; this validates task execution, not production worker/Beat operation. Full backend tests run in a separate PostgreSQL test database with the repository's `--nomigrations` test setup and Paystack provider unit-test mocks. The HTTP integration process uses **actual bank-transfer business logic**, actual proof uploads to local MinIO and actual test-admin confirmation, with no real cash transfer. External Paystack network initialization/webhooks remain untested because no test key was supplied; no fake Paystack response was added to product code.

| Requested workflow | Actual local evidence | Result |
|---|---|---|
| Authentication and registration | BFF OTP request → real local email → generated-code verification → actual registration → cookie login/me/onboarding → logout and 401 | PASS |
| Email verification | Existing hashed OTP and verification endpoint, local email sink; no bypass | PASS |
| Patient/doctor profiles | Real profile GET/PATCH and profile-complete response; doctor/nurse authenticated profile reads | PASS |
| Doctor discovery | The normal patient available-doctors endpoint returns the fictional QA clinician | PASS |
| Appointment booking | Actual conversation start/message/completion/result; booking enforces saved completed result and creates the pending checkout | PASS |
| Payment initialization/status | Actual bank-transfer instructions, MinIO PDF proof, admin test confirmation, successful fixed BFF detail polling and confirmed appointment listing | PASS for local bank transfer; BLOCKED for external Paystack test initialization/webhook |
| Clinical referrals | Actual doctor creation; patient operational update refused; admin update succeeds through the fixed PATCH proxy | PASS |
| Messaging/WebSockets | Actual doctor REST message visible to patient; cookie-authenticated Channels/Redis WebSocket handshake through local gateway | PASS locally; production cross-host cookie/WS topology not claimed tested |
| Homecare requests | Actual Eket service booking/payment/proof/confirmation, patient list and nurse assignment | PASS for these HTTP steps; full nursing trip/completion UI not executed end-to-end (backend suite covers lifecycle) |
| Privacy/consent | Existing privacy controls/repricing tests pass; precise clinical/policy components above not located | PASS for discovered controls; BLOCKED for not-located integration |
| Nigeria eligibility | Eight actual missing/US BFF requests rejected; NG care/booking allowed; real checkbox-to-request check at 390/1440px | PASS within declared-location scope |

The live HTTP tests use no Playwright API routing mocks. They exercise the real Next.js proxy, actual Django serializers/permissions, actual database and storage. Patient/doctor/nurse dashboard browser smoke checks use real backend cookies. The clinical UI test verifies actual login, unchecked declaration, the NG care-check request, existing `/triage` redirect and homecare notice at mobile/desktop widths. The booking/referral/payment lifecycle is **HTTP/BFF integration**, not a claim that every action was clicked through the browser UI.

Separate six-width landing/navigation/CTA/browser checks use synthetic API responses to isolate visual regressions, as the previous release harness did. They are not counted as real backend lifecycle tests. Evidence: `real-backend-integration.json`, `real-clinical-ui.json`, `browser-qa.json`, `motion-qa.json` and the screenshots alongside this report.

## F. Regression results and release readiness

| Check | Result |
|---|---|
| Frontend full suite | **PASS — 12 files, 67 tests**; final single-worker run, 29.91s |
| Backend full suite | **PASS — 736 tests**, including 22 new eligibility tests; 118.64s on isolated PostgreSQL; existing deprecation/config warnings retained |
| TypeScript | **PASS**; standalone check and final production build type checking |
| Lint | **PASS**, zero errors; one existing React Hook Form compiler warning; targeted new route/component/script lint also passes |
| Final production build | **PASS**; compiled with explicit local QA API/WS URLs; rebuild with intended environment URLs before a reviewed deployment |
| Six viewports | **PASS — 360, 390, 768, 1024, 1280, 1440px**; both heroes, navigation, FAQ, CTAs, layout and mocked browser journeys |
| Motion | **PASS — 390/1440px**; manual/automatic rotation, pause, stable hero height, navigation animation, text inside prior contrast regions |
| Accessibility checks | No confirmed axe WCAG A/AA violations at 390/1440px; gradient color-contrast analysis includes incomplete automated findings, not a certification |
| Hero/design preservation | **PASS** — original portrait sources; Michael's hand visible; Okon centered; no redesign or image/CSS composition edits |
| Practitioner verification | Founder-confirmed existing process; preserved; no private documentation reviewed or requested |
| Overall final acceptance | **BLOCKED** for the specific not-located consent/policy integration and unexecuted external Paystack test-mode coverage; implemented routing/location fixes pass local validation |

Initial failures were preserved accurately: one frontend fork-worker startup timeout, then all 67 passed on a bounded single-worker rerun. Initial backend runs used migrated service seeds and the bank-transfer runtime provider instead of the established unit-test settings; this caused fixture/provider expectation failures. The final run restores the repository's no-migrations test setup and overrides the environment provider to Paystack for its mocked-provider tests. A new test initially expected a top-level `code`; it was corrected to assert the backend's existing error-envelope `message`. No production error handler was changed and no test timeout budget was increased.

Dependency lockfile unchanged. The earlier documented five high findings in one development lint-tool chain remain; production audit previously reports zero. This task did not restart dependency/compliance investigations or apply unrelated updates. Existing residual tooling-risk documentation remains available under `../release-review/dependency-assessment.md`.

## G. Delivery and integration order

- **Backend:** branch `release/frontend-integration-contracts`, commit `aa5f70335b2e3aa2fb9bc0a25e0ba3ade5a381ee`, isolated worktree `C:/Projects/Caretekk/backend-release`.
- **Frontend implementation:** existing branch `release/frontend-integration-review`, commit `c111470cbf3143bd1a6b611b662e4c4143c3d9d5`, based on approved marketing commit `bda0354…`.
- This report/evidence is a subsequent documentation commit on the frontend branch; use its branch HEAD for the complete review candidate.

Backend files changed: `.env.example`; `apps/profiles/clinical_location.py`; clinical entry permissions in `apps/{appointments,homecare,triage}/views.py`; `telehealth_backend/settings.py`; `tests/test_clinical_location.py`; `conftest.py` (NG declarations for existing positive API fixtures); marker registration in `pyproject.toml`. No models or migrations changed.

Frontend files changed: the two new service BFF handlers; `src/lib/server/service-routes.test.ts`; `src/components/ui/clinical-location.tsx` and test; clinical location wiring in appointments/homecare/triage clients and endpoint types; online Nigeria-only wording in marketing data, referral client and layout/referral metadata; provider-neutral homecare labels; two reproducible local integration scripts; this evidence directory. No backend payment/referral business API was changed.

Recommended review order: backend additive request validation → frontend proxies/declaration/copy → combined staging acceptance evidence → founder approval. Deployment must be coordinated: an old frontend missing `consultation_country` will be rejected by the new backend. Validate the pair in staging first, then plan a controlled frontend-first/paired production update with acquisition controlled until both are ready. Existing PR #9/#8/hero integrations already live together in this release branch; release the integrated candidate rather than separately deploying an intermediate redesign. No merge, push, deployment or production modification has occurred.

Remaining concrete actions: identify the existing policy/terms and patient/clinical-consent component/API/build location so this candidate can expose the existing system; execute external Paystack test-mode initialization/verification/callback in an owner-confirmed safe environment; verify intended-host cookie/WebSocket configuration and deployed flags. No private practitioner records or duplicate consent system are required.
