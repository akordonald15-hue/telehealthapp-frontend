# Remove consultation-country feature — 9 October 2026

**PASS: feature removed; original API contracts restored and tested.** No default-country workaround, new location declaration, geographic eligibility system, migration, push, merge, deployment or production operation was introduced. This report supersedes the country-requirement sections of the earlier integration/preflight reports; those files and Git history remain historical evidence.

## Commits and scope

- Backend: `release/frontend-integration-contracts`, removal commit **`785d7c25d3f081d5891fbb440a84a1c5e7bca13d`**, worktree `C:/Projects/Caretekk/backend-release`. This separately reverts the feature commit `aa5f703` without rewriting history. Its file tree is identical to original `89ee11a` and the fetched backend `origin/main`.
- Frontend: `release/frontend-integration-review`, removal implementation **`d55dfffe0dd5090a50fe101a633dce0aa7b40799`**, worktree `C:/Projects/Caretekk/frontend-release`, based on the formerly approved `471bb3a`. A subsequent documentation/evidence commit contains this report; use branch HEAD for the full review candidate.
- Original checkouts' unrelated changes and prior untracked reports are preserved. No production configuration, payment credential, webhook secret, financial record or patient record was touched.

## Exact removal inventory

| Repository / file | Change |
|---|---|
| Backend `apps/profiles/clinical_location.py` | Deleted the introduced declaration permission and missing/foreign-country rejection. |
| Backend `apps/appointments/views.py` | Removed only its permission import and appointment-booking declaration guard. |
| Backend `apps/triage/views.py` | Removed only the declaration permission from care-check and conversation-start. |
| Backend `apps/homecare/views.py` | Removed only the new patient booking declaration guard. Existing homecare rules remain. |
| Backend `telehealth_backend/settings.py`, `.env.example` | Removed `CLINICAL_ALLOWED_COUNTRIES` configuration. |
| Backend `tests/test_clinical_location.py` | Deleted the removed feature's tests. |
| Backend `conftest.py`, `pyproject.toml` | Removed automatic NG injection into old test payloads and the feature-specific marker. |
| Frontend `src/components/ui/clinical-location.tsx` and `.test.tsx` | Deleted the declaration checkbox/component and its feature test. |
| Frontend `src/features/appointments/appointments-client.tsx`, `src/features/triage/triage-client.tsx` | Restored approved `bda0354` versions: no declaration state, startup gate or payload injection. |
| Frontend `src/features/homecare/homecare-booking-client.tsx` | Removed only declaration import/state/UI/payload injection; retained approved Akwa Ibom notice and previously fixed provider-neutral payment labels. |
| Frontend `src/lib/api/endpoints.ts` | Restored original request types/payloads: bodyless care-check start, session-only conversation start, ordinary appointment/homecare booking. |
| Frontend `src/features/marketing/data.ts`, `src/features/referral-program/referral-landing-client.tsx`, `src/app/layout.tsx`, `src/app/r/[code]/page.tsx` | Restored approved `bda0354` copy/metadata, removing the integration-added Nigeria-only online restriction. Online messaging still qualifies practitioner eligibility, applicable regulations and appointment availability; no worldwide authorization promise was added. |
| Frontend `scripts/local-clinical-ui-qa.mjs` | Deleted feature-specific UI/declaration assertions. |
| Frontend `scripts/local-backend-integration.mjs` | Removed all declarations, foreign-country denial scenarios and NG defaults. Executes original real HTTP/BFF payloads; added an existing unsupported homecare-zone negative check. Keeps authentication, payment and referral assertions. |
| Frontend `artifacts/integration-final-fixes/compose.qa.yml` | Removed the feature's QA environment setting only. |
| Frontend `src/lib/api/clinical-contracts.test.ts` | Added four original-contract regression tests; no replacement field/default. |
| Frontend `scripts/local-original-ui-qa.mjs` | Actual-backend browser test for original bodyless care-check startup, no extra checkbox, and preserved homecare notice. |
| Frontend `artifacts/country-feature-removal/` | This report, logs, receipts and screenshots. |

Runtime-source searches find no `consultation_country`, feature permission/component, state, allowlist or marker in frontend `src`/executable QA scripts or backend apps/tests/settings/example configuration. Historical reports/receipts/Git history still name the removed feature. No country persistence, serializer model field or migration had been introduced, so none needed removal. Patient phone, state/LGA, addresses, service zones, nurse tracking, authentication, authorization, practitioner admission, payment and triage safety behavior remain intact.

## Preserved fixes and approved design

- `src/app/api/payments/[id]/route.ts` GET still forwards authoritative payment status with original authentication/ownership checks.
- `src/app/api/referrals/[id]/route.ts` PATCH still forwards the existing clinical referral contract; patient status changes are refused and admin changes succeed.
- Existing proxy regression tests remain. Provider-neutral homecare labels remain; no payment business logic changed.
- Hero/slideshow/header/footer/branding code and all portraits are unchanged. Marketing data and hero copy are byte-for-byte the founder-approved `bda0354` version. Michael's hand and Okon's central positioning were rechecked visually and automatically.
- Akwa Ibom homecare copy remains exact. Existing Eket/Uyo service-zone validation is retained, not replaced by account-address or IP checks.

## Tests and actual compatibility evidence

| Check | Result |
|---|---|
| Full backend suite | **PASS: 714 tests**, isolated PostgreSQL, 249.65s; original test fixtures now run without automatic declaration injection. Existing warnings remain. |
| Full frontend suite | **PASS: 12 files / 70 tests**, 146.95s; includes original request contracts and preserved payment/referral proxy regression tests. |
| TypeScript | **PASS**, standalone and production-build checking. |
| Lint | **PASS**, zero errors; one pre-existing React Hook Form compiler warning. |
| Production build | **PASS**, explicit local QA URLs; no production build/deploy or environment modification. |
| Responsive/browser QA | **PASS: 360, 390, 768, 1024, 1280, 1440px**, both slides, navigation, CTAs, FAQ, footer and layout. These visual checks use the established synthetic API harness and are not claimed as backend lifecycle tests. |
| Motion QA | **PASS: 390/1440px**, switching/rotation/pause, stable hero height, existing contrast regions. |
| Actual original UI | **PASS: 390/1440px**, real login, automatic care-check POST with no body → 201, no extra declaration checkbox, homecare notice and no horizontal overflow. |
| Actual local BFF integration | **PASS**, original payloads throughout, real Django/PostgreSQL/Redis/MinIO; no API routing mocks and no default/forced-country test fixture. |
| Source/production-contract comparison | **PASS**, backend tree identical to original and fetched main; frontend clinical client/endpoint contracts match approved pre-feature versions. |

Actual BFF workflow receipts (`real-backend-integration.json`) cover:

1. Real locally delivered OTP, email verification, registration, login, onboarding and logout/401.
2. Patient/doctor/nurse profiles and normal doctor discovery.
3. Bodyless care-check start, session-only conversation start, real symptom/message/completion/result, and appointment creation with original fields.
4. Actual bank-transfer initialization, test proof uploaded to isolated MinIO, actual local test-admin confirmation, authoritative payment GET and confirmed appointment listing.
5. Clinical referral creation, patient operational-status PATCH refusal (403 for **authorization**, not a missing country), and admin PATCH success through the preserved proxy.
6. Doctor/patient REST messaging and cookie-authenticated Channels/Redis WebSocket handshake.
7. Existing homecare validator rejects `service_zone=lagos` with 400; valid Eket booking, payment, patient request list and nurse assignment work with original payloads and no declaration.
8. Backend-authenticated patient/doctor/nurse dashboard browser smoke checks.

The isolated QA project reuses only disposable local resources. External email/SMS and live payment credentials are disabled; real backend tasks run eagerly in QA. The HTTP payment path uses real bank-transfer code in the disposable database, with explicitly fictional proof/review and **no real cash**. Paystack provider unit tests use their existing mocks; external Paystack initialization/webhook was not executed and is not represented as an end-to-end pass. No security check was disabled in product code. Full backend security/authorization suites passed unchanged.

## Migration, rollback and production order

- **No migration or production configuration change is required.** No country field was ever persisted.
- **The country-based deployment blocker is resolved.** The backend removal branch has no effective diff against the fetched production `main`; these removals therefore require no backend production deployment. Do not deploy the abandoned `aa5f703` feature commit.
- Recommended next release order: verify intended production backend/runtime and select the correct Vercel target → complete normal PR review/CI for the updated frontend candidate → deploy the frontend through its established pipeline after founder approval. Do not deploy a needless backend change merely to retain an earlier backend-first sequence.
- With the original backend contract retained, rollback can return the frontend to the prior production deployment without introducing a mandatory new payload or altering records. Do not use `aa5f703` as a rollback target, because it reintroduces the removed requirement.

## Remaining release checks

No new feature/contract blocker remains from this removal. The earlier unresolved **production preflight** still needs target/access/environment/backup/rollback confirmation and normal PR approvals/CI before deployment; this task deliberately performs no push, merge or production operation. Two production Vercel projects were previously recorded, so the intended target must remain explicit. External Paystack test-mode coverage remains outside these local receipts. No marketing, practitioner or general privacy review was reopened, and no duplicate system was created.

Historical integration/preflight reports describing the removed guard are superseded by this removal report. Final approval must refer to the updated branch HEADs, not the abandoned country-feature commit.
