# Founder50 PR4 remediation and release gate

Baseline reviewed: `2f51759274afb887068e567505aab31501899e79`, frontend PR #13. Backend contract: main `26f342e451efae8d0f803b1f46f3233f256392b7`. No backend changes are required by this remediation. Founder50 remains disabled unless the frontend build explicitly sets `NEXT_PUBLIC_FOUNDER50_ENABLED=true`; the backend independently authorizes funding.

## Functional changes

The earlier “Consult now” value was memoized at selection time and rounded down to minutes. PR3 rejects any initial promotional appointment time at or before its own current time. It has no immediate-start request flag or server-generated immediate timestamp; its near-future availability checks do not make a stale timestamp valid.

With the frontend feature enabled, “Earliest appointment” now offers the next existing hourly candidate from the scheduling sheet (08:00–17:00 in the displayed local timezone), excluding reported unavailable slots. It displays an explicit date/time for patient confirmation. It is not a promise of availability: PR3 rechecks doctor status/conflicts under its scheduling lock. If today/tomorrow have no candidate, the patient must choose another date. No arbitrary minute offset, new availability, or backend validation exception is introduced. Submission rejects a locally elapsed selection and asks for another future slot. Default-off checkout retains its established timing controls.

Promotion availability used to determine readiness of every paid CTA. Recovery state is now read before that optional network request. A clean local account state can use ordinary checkout despite a stalled or failed availability read. A pending operation, active claim, explicit unresolved application or unreadable recovery state remains protected. A definite Apply rejection persists the need for an explicit “Choose ordinary paid checkout” decision, including after refresh. Ambiguous Apply outcomes retain the key and require reconciliation. Manual status refresh does not acquire the financial-submission lock.

An unknown booking outcome retains an immutable account-scoped, nonclinical request snapshot: doctor, scheduled time, triage reference, callback, claim and key. Doctor/time controls and primary checkout CTAs lock while submitting or awaiting recovery. The recovery panel shows the original doctor (ID fallback) and timestamp, with a dedicated recovery action. The controller also refuses changed context on an unresolved snapshot, protecting stale tabs or handlers independently of disabled controls. Explicit recovery submits the original key and payload. New keys do not cancel old operations.

Files: `src/features/appointments/appointments-client.tsx`, new `consultation-slots.ts` and its tests; `src/features/promotions/use-founder50.ts`, `recovery.ts`, `promotion-checkout.tsx`, and `checkout.test.tsx`; new `scripts/founder50-remediation-qa.mjs`.

## Verification and reproduction

Run TypeScript, lint, all Vitest tests and the production build using the existing npm scripts. The inherited form.watch compiler warning remains; dependency manifests and lockfile are unchanged.

For loopback-only browser tests, start the allowed development server with the frontend flag true and use:

```powershell
$env:QA_BASE_URL='http://127.0.0.1:3106'
node scripts/founder50-remediation-qa.mjs
node scripts/founder50-browser-qa.mjs
```

The remediation browser script covers earliest hourly booking, unavailable doctor, promotion status 503/500/403/timeout with paid checkout, disabled campaign, ambiguous Apply, before/after-commit response loss, locked doctor/time changes, refresh, history, tabs, repeated Confirm and clock-skew rejection/reselection. All APIs are mocked unless an explicitly supplied `QA_LOCAL_BACKEND_FIXTURE` points to a synthetic fixture. Real fixture execution passes promotional and booking requests through the local Next BFF to isolated PR3. Never supply production credentials or production URLs.

With a false frontend flag, run `scripts/founder50-browser-qa.mjs` with `QA_DISABLED=true` to check Paystack and bank transfer independently. Local production-server start was previously rejected by automatic approval review; it is not retried. Authorized local development-server execution and existing exact-head CI production-server execution provide separate evidence. Full fresh evidence, exact counts and final head/CI URL are recorded in the remediation completion report.

The isolated real PR3/PostgreSQL test accepted the selected 13:00 Lagos hourly appointment as `2026-10-15T12:00:00Z`, returned 201/confirmed with a successful promotional payment of 0.00, full authoritative 2,000 discount, one appointment/payment and no pre-completion earning. Matched client/application test time was 11:34:56 UTC. Additional real-backend checks verified exact-key replay, changed-key-parameters rejection, current/past boundary refusal, unavailable doctor refusal, triage/ownership/authentication, and expired/released claim rejection. No provider HTTP calls or production data were used.

Clock-skew handling is safe refusal/reselection, not clock synchronization. Browser time estimates candidate slots and countdown; backend time remains authoritative. A substantially wrong device clock can still require the patient to choose a corrected future date. No backend server-time API is invented. Full assistive-technology/WCAG certification and live payment-provider transactions are outside these fixtures. Optional appointment-ID recovery remains non-blocking.

## Production deployment investigation: MERGE BLOCKED

Both GitHub-recorded production projects require verification:

| Project/environment | Last inspected production evidence on current frontend main |
| --- | --- |
| telehealthapp-frontend | Successful Vercel deployment 6981186470, 10 October 2026 |
| telehealthapp-frontend-m7yv | Successful Vercel deployment 6981201101, 10 October 2026 |

Both records refer to frontend main `0224c180e2af59742d1dfc99cfc2c442e3bda59a` and were created by Vercel. Repository webhooks returned none; the only GitHub Actions workflow is PR/manual validation, with no release, image push, production migration or environment update step.

Read-only Vercel API inspection using the available authenticated CLI session returned 404 for both Caretekk project names; listing the accessible personal/team scope showed no Caretekk project. This is an access limitation, not proof the projects do not exist or are disconnected. Their exact project/team IDs, current Git connection, configured production branch, Ignored Build Step, deployment hooks and automatic-deployment settings are **unknown**. The historical GitHub production records establish risk, not current configuration.

`vercel.json` excludes only the PR branch. Unspecified branches are enabled by default according to [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration). Feature-flag defaults do not prevent deployment or prove production flags. No production Vercel settings, repository connections, secrets or environment variables were changed. Push authorization applies only to the already excluded PR branch; inspect that head's GitHub deployment records after pushing.

## Proposed operator procedure — requires separate founder authorization

1. An operator with access to BOTH Caretekk projects records each project/team ID, GitHub repo connection, production branch, branch/root configuration overrides, Ignored Build Step, deploy hooks, CLI/API release integrations, and queued/running deployments. Confirm no third production project is connected to this repository.
2. Obtain founder authorization for a temporary production deployment freeze. A concrete option is to disconnect this repository's Git connection from both projects, preserving existing deployments/domains, and separately suspend any deploy hooks or external release integrations capable of deploying it. Do not delete projects, change production secrets or rely on a prior credential failure. If the operator selects another supported deployment-disable mechanism, independently prove it covers main and both projects; a branch-only PR exclusion or Ignored Build Step alone is insufficient proof that deployment cannot be initiated.
3. Verify the freeze in both project settings and GitHub, drain/cancel queued deployment work under that authorization, and record evidence that no automation can deploy the merge. Do not test this by triggering a production deployment. If this cannot be established, keep the PR unmerged.
4. Obtain a fresh independent review of the remediation head and separate merge authorization. After a later authorized merge, inspect exact merge-SHA Actions, commit statuses and deployment records in GitHub and both Vercel projects. Keep deployment integrations frozen until an explicitly authorized release.
5. A later deployment requires its own launch gates: backend/frontend parity, production flags verified off, controlled irreversible migrations with conflicting writers drained, backup/PITR restore evidence and forward-only recovery, financial reconciliation, subsidy funding and approved cancellation/no-show policy. Activation requires separate authorization.

This document proposes controls; it does not implement them or authorize merge, deployment or activation. PR #13 must remain open for independent re-review. No PR5 implementation is included.
