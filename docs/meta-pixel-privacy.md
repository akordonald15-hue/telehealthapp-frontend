# Homepage Meta Pixel — review and activation gates

Implementation baseline: production source `0ddc87dbeabca0f2c3b15b3c6ae88ef94259dc61`.
This change does not authorize a deployment or advertising activation.

## Architecture and changed areas

The audit found one App Router root with shared authentication, QueryClient and PWA providers, no advertising consent manager, and no existing Meta/GA/Vercel analytics integration. Payment repricing consent is unrelated and remains unchanged. No project Meta environment variables were present in the audited metadata; existing HTTPS API and CARE50 flags are unchanged.

The homepage moves unchanged to `(marketing)`. Authentication, clinical, referral, onboarding, admin and offline routes move without content changes to `(site)` (the baseline comparison normalizes Windows checkout line endings only). URLs do not change. Both roots use the original document/fonts/Google sign-in/provider shell. Moving between these roots causes a full document navigation, intentionally discarding the third-party runtime. Auth-to-dashboard and paid-booking routes stay within the same application root. API handlers remain unchanged. Shared error/loading/404 views retain the original UI; an application-root catch-all calls `notFound()` without experimental configuration.

New advertising modules implement a versioned 180-day browser preference, equal-choice allow/reject controls, withdrawal, URL/context policy and the official `fbevents.js` SDK through `next/script` (`afterInteractive`). A separate untracked privacy/preferences page is linked in the existing footer. No new dependencies or lockfile changes are required. The service worker excludes advertising requests from caching/replay. The homepage sends `Referrer-Policy: no-referrer`.

## Fail-closed privacy behavior

- No SDK, preconnect, initialization, noscript beacon or event before affirmative persisted consent. Missing/invalid configuration, storage failure, expiry, GPC or DNT suppress advertising.
- Only `https://www.caretekk.com/` and its fixed public section anchors (`home`, `services`, `how-it-works`, `trust`, `faq`, `contact`, `doctors`, `home-care`) are eligible. Queries and unknown fragments suppress tracking, as do unapproved referrers, known account-session markers or retained CARE50 recovery context. The fixed anchors preserve normal homepage scrolling without a reload or duplicate event. This is an additional suppression measure, not a guarantee that an anonymous homepage visitor has no healthcare relationship.
- `fbclid`/UTM attribution is deliberately unavailable. The SDK can inspect the real document URL and referrer; a sanitized custom parameter would not guarantee removal of those fields. Do not hash identifiers, rewrite landing URLs, carry attribution into clinical workflows or broaden the allowlist without a new review.
- Only one manual `trackSingle` PageView is issued per eligible document, including under React Strict Mode. Homepage hash changes are not page views. Client-side application navigation cannot inherit the SDK because it crosses root documents.
- `autoConfig=false` is set before `init`. Browser testing found the current SDK has an independent SPA history observer; `disablePushState=true` is now set before SDK loading and `trackSingleOnly=true` after initialization. These controls were confirmed in the delivered SDK and browser-tested; they are not described in the public advanced guide reviewed, so they are version-dependent and must be revalidated after SDK changes. No third initialization argument, user matching data, conversion events, custom event parameters or CAPI. No application user objects, symptoms, specialties associated with a user, bookings, payment information or clinical storage values are read into the SDK.
- Withdrawal synchronously revokes consent, deletes accessible `_fbp`/`_fbc` cookies and sets a denial safety cookie. A loaded runtime is discarded with a clean document reload. Consent changes from another tab, expiry and unsafe context changes are rechecked. Pagehide revokes; BFCache restoration reloads before reuse. Withdrawal cannot recall already transmitted data or clear Meta's own third-party cookies.
- Pixel failure/ad blockers do not block application rendering and do not trigger automatic retries. No error or diagnostic upload includes patient information.

## Meta-side review: not independently verified

Final release authorization: the owner confirms Portfolio Caretekk, dataset Caretekk Health Website (`1122375003881493`), ad account Caretekk Technologies Ads (`1414055514066196`), domain allowlist `caretekk.com` and subdomains, Health & wellness provider category, automatic advanced matching OFF, automatic event tracking OFF and no Diagnostics errors. Healthcare restrictions were reviewed and accepted by the owner. These are **owner-confirmed settings**, not independent policy verification or certification. Offline auto-tracking is **intended OFF**, not independently verified; this implementation adds neither offline events nor CAPI. Production Test Events receipt remains pending.

The owner identifies dataset **Caretekk Health Website**, category **Health & wellness provider**, ID `1122375003881493`. Authenticated dataset settings and account-specific restrictions were not inspected. The healthcare restrictions help page requires Meta login. Consent does not override Meta's restrictions on sensitive information.

Before activation the owner must inspect Events Manager and retain evidence of:

1. Correct dataset/domain and healthcare category; applicable core-setup/data-source/event restrictions and diagnostics reviewed. If PageView on the public homepage is restricted, leave this integration OFF. Do not reclassify the business or bypass restrictions.
2. Automatic advanced matching OFF; automatic event tracking, Event Setup Tool rules and any automatic event enhancements OFF. Code configuration alone does not prove the account settings.
3. No CAPI, gateway, partner conversion integration or other Pixel installation duplicates this implementation.
4. Approval of the advertising notice, consent purpose/retention and applicable privacy obligations. SDK requests inherently disclose IP/browser/device and advertising identifiers; this is not anonymous or a certification of legal compliance.

Official references:
- [Meta consent API and received data](https://developers.facebook.com/documentation/meta-pixel/implementation/gdpr)
- [Meta automatic configuration and single-Pixel events](https://developers.facebook.com/documentation/meta-pixel/advanced)
- [Meta advanced matching](https://developers.facebook.com/documentation/meta-pixel/advanced/advanced-matching)
- [Meta data-source restrictions](https://www.facebook.com/business/help/1402913027039332) (account review outstanding)
- [Next.js multiple root layouts](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Next.js Script](https://nextjs.org/docs/app/api-reference/components/script)

## Tests and browser acceptance

Initial implementation validation on 16 November 2026: 202/202 Vitest tests passed (171 existing + 31 new), TypeScript passed, lint had zero errors and the existing React Hook Form compiler warning. Optimized builds passed with advertising OFF and with a synthetic enabled configuration. Inspection of generated homepage, login, dashboard, payments and privacy HTML found no SDK URL, beacon URL or queue bootstrap. Browser follow-up added a hidden-tab withdrawal regression; the updated advertising unit suite passes 32/32.

Unit tests mock the SDK. Browser acceptance additionally executes a local, unmodified copy of the official SDK, SHA-256 `d835d20814c5d955098f6c0f6839233d7a7a72b05857f6f82d4dbd20201d027d`, fetched from `https://connect.facebook.net/en_US/fbevents.js`. All browser SDK/configuration/beacon requests are intercepted locally. Synthetic configuration completion unlocks only test Pixel `123456789`; no production dataset configuration, automatic plugins or healthcare restrictions are fetched or simulated as passed. No test event is sent to Meta. Account-specific event acceptance therefore remains unverified.

The owner explicitly authorized isolated browser acceptance. The standard `npm run start -- --hostname 127.0.0.1 --port 3118` command was accepted by current execution policy; no alternative shell, executable, host, push or deployment was used to circumvent a rejected start. Builds use an inert loopback backend URL and process-local test flags, with no production Secrets. A fresh Chromium context uses an unreachable external proxy, external-DNS suppression, external/WebSocket request guards and blocked service workers. The canonical website address is fulfilled from the loopback build, not Production. This is browser-level defense in depth, not an OS/kernel network sandbox. All API dependencies are synthetic; unexpected requests fail the audit. Known existing Google SDK requests are guard-aborted; real Google OAuth and live payment-provider behavior are not certified by these tests.

Acceptance checks:

1. No Meta requests/globals before choice, after rejection, with default OFF or invalid ID; blocked storage remains OFF.
2. Allow on a clean canonical homepage produces exactly one manual PageView and no other events; rerender/Strict Mode does not duplicate it. Attribution/referrer/private URL variants produce zero requests.
3. Homepage → login/register → dashboard → CARE50 checkout/paid checkout → homepage, direct app entry, Back/Forward and BFCache: no SDK or events on application documents. Session/auth/care recovery state remains intact.
4. Withdrawal, cross-tab denial and expiry stop tracking and discard the runtime; auth cookies and CARE50 recovery are preserved. Ad blockers/offline/SDK failure do not break navigation.
5. No hydration/provider regressions; custom 404/error/loading behavior, responsive consent controls, keyboard access and the unchanged paid/auth/CARE50 journeys pass.

Browser evidence and screenshots are retained locally under `artifacts/meta-pixel-browser-20261116/` (ignored by Git). The final result section below records completed runs. Production activation remains HOLD until the owner Meta-side review, privacy notice review and explicit release authorization pass.

### Final enabled-build results — 16 November 2026

The final enabled-source browser run completed **16:01:11–16:02:30 UTC (17:01:11–17:02:30 Lagos)**:

| Check | Evidence/result |
| --- | --- |
| Enabled Pixel acceptance | **27/27 PASS**, `on-results.json` |
| Final disabled-build acceptance | **1/1 PASS**, `off-results.json`, `off-network.json`; zero SDK/beacons even with a previously granted preference |
| Consent acceptance/rejection/withdrawal | PASS, including cookie cleanup, clean-document reload, cross-tab denial and expiry |
| Pre-consent, denied, unsafe URL/referrer, GPC and account/recovery contexts | Zero SDK/beacon requests |
| Clinical/auth/payment direct entry | Zero Meta requests on login, registration, appointments, payments, records, messages, triage, profile, referrals and privacy/preferences |
| Navigation/provider continuity | Homepage → login clears the runtime; login → registration → Back stays in the application document; synthetic email login reaches dashboard with session state intact |
| Official SDK network audit | 15 intercepted Meta attempts: 5 SDK loads, 5 synthetic config completions and 5 manual PageViews in 5 separate consenting public documents; zero on restricted routes |
| Payload inspection | PageView only, clean public homepage location, empty referrer, no user-data/custom-data parameter fields |
| Isolation audit | Zero unexpected external requests; zero browser errors. Native browser connectivity was online; no synthetic online override was needed |
| Existing CARE50/paid regression harness | **19/19 PASS**, unchanged assertions; `results.json`, `isolation-care50-paid.json` |
| Existing paid timezone matrix | **8/8 PASS**, Lagos/UTC/New York/London × Paystack/bank fixtures; `timezone-results.json`, `isolation-timezone.json` |
| Regression privacy audit | Zero Meta requests, unexpected requests or browser errors across both existing suites |
| Unit regression | **203/203 PASS**; includes **32 advertising tests** and the added hidden-tab withdrawal regression |

The CARE50 suite covers zero-naira confirmation, explicit ordinary paid checkout, no accidental paid fallback, expiry/release, unavailable doctors/campaigns, reservation failures, retry/recovery across refresh/history/tabs, duplicate submission and clock skew. All bookings/payments/claims in these tests exist only in fixture memory. No live campaign or financial operation is performed.

Two integration corrections resulted from testing: (1) suppress the SDK's separate automatic SPA PageViews; (2) re-evaluate the consent *reason*, not just an allowed/not-allowed boolean, so a denial also discards a hidden runtime. The latter has a dedicated deterministic hidden-document unit test. Earlier failing diagnostic files are preserved, including `duplicate-pageview-failure.json` and `config-stub-incomplete-failure.json`; the authoritative successful run is `on-results.json` plus `on-network.json`, not the older `on-failure.json`.

Screenshots: `consent-mobile.png`, `accepted-homepage.png`, `synthetic-auth-dashboard.png`, `privacy-notice.png`. The notice was reviewed for optional purpose, inherent Meta identifiers, exclusions, 180-day preference, withdrawal limitations and the Meta privacy link; final owner/privacy approval is still required.

Limitations: this is Chromium on Windows with mobile/desktop viewports, not a Safari/Firefox/device matrix. Native BFCache restoration was not observed (0 persisted page-show events); Back navigation and the explicit restore safeguard do not constitute proof for every browser's native BFCache implementation. Service workers are blocked for isolation, so live PWA behavior is not claimed as browser-verified. Google OAuth, real providers, Meta account-side configuration/healthcare restrictions and actual Meta event receipt are not exercised. The public SDK is vendor-updated and its observed manual-only controls must be revalidated after changes. Attribution from `fbclid`/UTM landing URLs and unapproved external referrers is intentionally lost; do not relax URL/referrer controls to improve attribution.

Decision: **GO for final code/privacy review; NO-GO for Production Pixel activation until the outstanding Events Manager checks and explicit production authorization are complete.** No push, merge, deployment, production environment edit, backend change or live transaction is authorized by these tests.

Cleanup: the local test server is stopped; the final local optimized build has advertising OFF. Production Vercel variables and deployment state were not modified. The original working directory's uncommitted changes remain untouched.

## File inventory

Final release validation adds `service-worker.test.ts` and `scripts/meta-pixel-route-audit.mjs`. The one-time Git comparison remains a release audit; permanent routing tests use filesystem contracts so they work in shallow CI clones without freezing all future application source changes.

- New SDK/policy/consent/UI: `src/features/advertising/{advertising-boundary.tsx,consent.ts,policy.ts,preferences.tsx}`.
- New tests: `src/features/advertising/{advertising-boundary.test.tsx,consent.test.ts,policy.test.ts,routing.test.ts}`.
- Original `src/app/page.tsx` moves to `src/app/(marketing)/page.tsx`; original `(app)`, `(auth)`, `onboarding`, `r`, `dasbooard`, `offline` directories move under `src/app/(site)/` without source changes.
- Original root layout becomes `src/app/document.tsx` (function renamed only); new `(marketing)/layout.tsx` and `(site)/layout.tsx` select the root boundary. Original error/loading views are copied into both roots; original not-found UI moves to `src/components/layout/not-found-page.tsx`, referenced from each root's `not-found.tsx`.
- New `src/app/(site)/[...unmatched]/page.tsx` and `src/app/(site)/privacy/advertising/page.tsx`.
- Updated `.env.example`, `next.config.ts`, `public/sw.js`, `src/components/marketing/site-footer.tsx`; new `docs/meta-pixel-privacy.md` (this file).
- Browser QA only: `scripts/meta-pixel-browser-isolation.mjs`, `scripts/meta-pixel-browser-qa.mjs`; `.gitignore` excludes this run's downloaded SDK/evidence directory from publication. The downloaded SDK is stored as a text evidence artifact, not shipped application code.
- Package manifests/lockfile, API handlers, auth/payment/CARE50 features and backend configuration are unchanged. The original working directory's uncommitted files are untouched; all implementation work is in a separate worktree.

## Exact production activation steps — separate authorization required

1. Review final diff and isolated browser results; obtain required GitHub review on the exact final commit. Publishing a branch can trigger Preview deployments and requires authorization; no push is authorized by the implementation/browser-testing requests.
2. First release with the default `NEXT_PUBLIC_META_PIXEL_ENABLED=false` (or absent), verify root navigation/auth/CARE50/paid flows and Production identity. Do not change backend or campaign flags.
3. After explicit activation approval, in `akor-donalds-projects/telehealthapp-frontend`, add **separate Production-only Config** values:
   - `NEXT_PUBLIC_META_PIXEL_ID=1122375003881493`
   - `NEXT_PUBLIC_META_PIXEL_ENABLED=true`
   Preserve Preview/Development and all existing environment rows. These are public build-time values, not Secrets. The server also requires `VERCEL_ENV=production`; do not override that Vercel system variable.
4. Perform one approved same-source Production rebuild; verify Ready, exact SHA and `www.caretekk.com` assignment. Build-time public values require a rebuild to change behavior.
5. Verify zero requests when denied and on every excluded route. With an explicitly consenting nonclinical test browser on the clean homepage, verify one PageView in Meta Test Events and inspect outgoing fields for unsafe URL/referrer data. No claims, bookings or payments are needed. Abort activation if any sensitive information or automatic event appears.
6. Emergency disable: withdraw browser consent immediately; owner disables relevant Meta-side collection if necessary. Separately authorize Production `NEXT_PUBLIC_META_PIXEL_ENABLED=false` and a same-source rebuild. A new build affects new documents, not code already running in existing tabs. Do not roll back to an old HTTP-configured release, modify campaign allocation or touch financial records.

## Final production release preflight

The owner's final release instructions supersede the earlier preparation-only authorization. Release execution is authorized subject to all gates, including GitHub protection. Fresh GitHub/Vercel reads confirm `main` and Ready Production remain at `0ddc87dbeabca0f2c3b15b3c6ae88ef94259dc61`, deployment `dpl_3Cy65bPgDW9bwZhwbjF8RnQBZZkH`, project `prj_MdmL4DfEIaC00ukSIwLmqc8pyP0T` / `telehealthapp-frontend`, team `akor-donalds-projects`, account `akordonald15-hue`. The nine existing environment metadata rows are unchanged and contain no Meta variables. No Secret values were exported.

Fresh checks: 209/209 unit tests passed; 8/8 focused routing/service-worker tests passed after separating the history-dependent release audit from CI tests. TypeScript, ESLint (existing warning only), and the optimized build pass. The source audit again confirms all 33 moved files, homepage and document shell are unchanged apart from the function rename and checkout line endings. Accepted 28 consent/isolation browser cases and 27 CARE50/paid/timezone cases remain applicable because only tests/documentation changed after browser acceptance. Real-provider and cross-browser limits remain as recorded above.

Production-only Meta variables are authorized but deferred until the protected PR gate clears, so the automatic main build can include the approved values in one release. GitHub requires one formal approving review and dismisses stale reviews. The authenticated account will author this PR and cannot approve it itself. Do not bypass protection. No merge, Production deployment or Meta Test Events success is claimed before it actually occurs.

### STOP — fresh dependency security gate failed

The final `npm audit` reports **11 affected dependency packages: 2 high, 9 moderate, 0 critical**. Installed affected families include Vite 8.3.1 (via Vitest/plugin-react), Undici 8.11.2 (via jsdom), Vitest/@vitest/mocker 4.1.11, and minimatch 10.2.5 (via the ESLint TypeScript toolchain). `npm audit --omit=dev` reports **zero vulnerabilities**: these findings are in the development/test toolchain, not production dependencies in that audit. This distinction does not override the owner's explicit requirement to stop on any failed security test.

Full audit evidence: local `artifacts/meta-pixel-browser-20261116/final-security-audit.json`. No `npm audit fix`, package update, force override or lockfile change has been performed. The feature remains local; no commit, push, PR publication, merge, Production variable write or deployment occurred. Production remains Ready at the existing baseline/deployment above. Meta Test Events and production consent verification are **not performed** because the release is stopped.

Required next authorization: narrowly scoped remediation of the affected development-tool dependency chains using supported patched versions, preserving production dependencies and npm lockfile integrity, followed by the required checks. A formal eligible GitHub approval is also required once a clean candidate PR is published. Final release decision: **NO-GO / SECURITY HOLD**. Earlier functional/browser passes do not clear this failed gate.

## Approved security remediation — completed locally

This section supersedes the preceding security HOLD. The owner authorized remediation and validation only: **no push, merge, deployment, Production variable edit or Pixel activation is authorized**. The earlier production-release authorization must not be reused to proceed beyond this restricted phase.

### Advisory and dependency review

The before-audit contains 11 affected package entries (2 high, 9 moderate), including aggregated TypeScript-ESLint dependents; it is not a count of distinct CVEs. The exact advisory titles, affected ranges, dependency nodes and URLs are retained in `artifacts/meta-pixel-browser-20261116/security-remediation-before.json`.

| Dependency path | Before → patched resolution | Relevant fix/exposure |
| --- | --- | --- |
| Vitest → @vitest/mocker and companion modules | 4.1.11 → 4.1.12 | Manual mock-registration injection and Windows redirect traversal; 4.1.12 is the supported backport, avoiding Vitest 5 |
| Vitest / @vitejs/plugin-react → Vite | 8.3.1 → 8.3.3 | Windows launch-editor vulnerabilities, custom middleware XSS, filesystem allowlist/wasm disclosure issues |
| jsdom 30.1.1 → Undici | 8.11.2 → 8.12.2 | TLS Agent validation, redirects/cache disclosure and resource-exhaustion issues; jsdom stays unchanged |
| eslint-config-next 16.4.0 → typescript-eslint and @typescript-eslint modules | 8.58.2 → 8.73.0 | Supported parser/toolchain update adopts patched minimatch 11; ESLint and eslint-config-next stay unchanged |
| @typescript-eslint/typescript-estree → minimatch | 10.2.5 → 11.0.1 | Glob-pattern amplification DoS; this version satisfies the updated parser's own `^11.0.1` range, not an incompatible override into its old range |

Maintainer references: [Vitest backport](https://github.com/vitest-dev/vitest/security/advisories/GHSA-qxg6-89mg-rqv8), [Vitest Windows traversal](https://github.com/vitest-dev/vitest/security/advisories/GHSA-xp26-3454-mjgp), [Vite/launch-editor affected and patched versions](https://github.com/vitejs/launch-editor/security/advisories/GHSA-587h-7wmj-h5pm), [Undici TLS advisory](https://github.com/nodejs/undici/security/advisories/GHSA-2m5v-pch6-74hx), [minimatch patched version](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249). All 17 leaf advisory entries are preserved in the raw before-audit. Undici's other seven and Vite's other five entries share their respective patched version above.

The initially broad npm resolution also refreshed unrelated children and a shared runtime Nano ID entry; those changes were rejected before validation. The final lock retains **all original production entries, versions, resolved URLs and integrity hashes**, plus unchanged production manifest declarations. It also retains unrelated original tooling children. Final changes are **23 development-only lock entries**: 11 TypeScript-ESLint family entries, eight Vitest family entries, Vite, Undici, parser minimatch and its required new `@isaacs/nonrecursive-glob-match` 1.1.0 dependency. No application source or existing test assertions/timeouts changed for remediation.

`package.json` pins Vitest 4.1.12 and uses compatible npm overrides for Vite 8.3.3, Undici 8.12.2, typescript-eslint 8.73.0 and the updated parser's minimatch 11.0.1. Each is within its current parent/peer range. No `--force`, audit suppression, install-script permission change or production dependency upgrade was used. Review these pins during future dependency maintenance rather than allowing them to become stale.

### Validation and disposition

- Fresh full audit: **11 → 0** affected packages; critical/high/moderate/low all zero afterward.
- Production-only audit: **0 → 0**.
- Clean `npm ci --no-audit`: PASS. Lock SHA-256 remains `4c8ec3241387f0af7a80e6bc1739b90de3dd468f8799586a6e65702ad6e1a5b1` before/after installation. `npm ls` reports a valid patched tree.
- Full Vitest 4.1.12 suite: **209/209 PASS**; TypeScript PASS; lint PASS with the existing React Hook Form compiler warning only.
- Optimized builds: PASS with advertising/campaign disabled and with both locally enabled using synthetic dependencies and Pixel ID. These are local builds, not deployments.
- Isolated browser cases: **57/57 PASS** — 27 enabled-Pixel consent/navigation/isolation, one default-off Pixel check, two disabled-campaign paid checkouts, 19 CARE50/free/paid/recovery cases and eight paid timezone cases.
- Saved request audits: zero unexpected requests or browser errors; zero Meta requests on clinical/auth/booking/payment flows; only five PageViews on five consenting public documents, fulfilled locally with no data sent to Meta. The privacy rules for `fbclid`, UTM queries and unsafe referrers remain intact.
- Original-source audit: all 33 moved application files, homepage and document shell preserved. Production dependency equality was checked independently. Unrelated work in the original checkout is untouched.

Evidence directory: `artifacts/meta-pixel-browser-20261116/security-remediation/`; `summary.json`, `dependency-delta.json`, `audit-all-after.json`, `audit-production-after.json`, the phase result files and request audits are the authoritative remediation evidence. Known limits remain: synthetic providers/session authentication, Chromium rather than a cross-browser matrix, no live financial operations, no Meta Test Events or independent account-side policy verification.

**Final security assessment: GO — the reported dependency security gate is CLOSED. The local Meta Pixel candidate is ready for formal PR publication/review when separately authorized. No high-severity or other npm-audit finding remains. Remote CI, formal GitHub approval, Production configuration/deployment and real Meta verification are not claimed as complete.**

## Formal PR publication authorization

The owner subsequently authorized staging, committing, pushing `feat/meta-pixel-consent-20261116` and opening a PR against `main`, with CI verification. This authorization **does not permit merging, a Production deployment, Production variable changes or Pixel activation**. Fresh `main` matches the audited baseline. Generated SDK copies, browser artifacts, audit captures and local PR-body files remain ignored and are not part of the commit. Only synthetic test identities occur in QA fixtures; no live patient records or credentials are included.

GitHub protection requires one formal approving review and dismisses stale reviews; this remains a merge gate. Dependabot alert inspection returned HTTP 403 reporting alerts disabled, so account-side alerts are not independently cleared by this review. No settings/permission changes are authorized or performed; the fresh npm dependency audit is reported separately. A separate explicit merge authorization is required even if all checks and reviews pass, because main automatically deploys to Production.
