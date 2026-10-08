# Founder copy verification — 8 October 2026

Branch: `release/frontend-integration-review`. Parent: `39f61bf0647d38b670979fa4bfc6b5f498868b1c`. Corrections committed as the successor to that parent; use `git log -1` for the final SHA. No merge, push or deployment. Unrelated changes in the original checkout remain untouched.

| Check | Result |
|---|---|
| TypeScript (`npm run typecheck`) | Passed, exit 0 |
| Lint (`npm run lint`) | Passed, exit 0; one pre-existing React Hook Form `watch()` compiler warning; no errors |
| Production build (`npm run build`) | Passed, exit 0; 34 pages; placeholder API URLs, no production access |
| Full automated suite (`npm test`) | 10 files / 64 tests passed, exit 0; 146 seconds on this host; no timeouts |
| Six-width browser QA | Passed at 360, 390, 768, 1024, 1280, 1440px; both slides, source portraits, centering, stable height, navigation, mobile Escape/focus, FAQ, CTAs, mocked auth journeys, honest disabled newsletter, no document overflow or browser errors |
| Motion QA | Passed at 390 and 1440px; manual/automatic slide transitions, pause, stable hero height, menu animation, text within existing contrast regions |
| Coverage browser QA | Passed on referral pages and authenticated homecare booking/list/detail at 390 and 1440px; exact restriction visible; no horizontal overflow; synthetic responses only |
| Targeted QA-script lint | Passed, exit 0 |
| Source audit | No obsolete count/city/expansion claims in source/public text; search evidence saved |
| Diff whitespace check | Passed |

Axe checks at 390/1440px found no confirmed WCAG A/AA violations. Gradient color contrast includes incomplete automated findings; this is not a compliance certification. Existing contrast-region checks passed. Visually inspected mobile and desktop hero, service cards, overview, footer, referral and homecare screens. Michael’s raised and lower hands remain visible in the original portrait; Okon remains central on slide two. No portrait/CSS composition changes were made. New longer copy wraps within existing layouts. The four former numeric tiles retain their grid and colors with smaller headings to fit qualitative labels.

## Exact changes and remaining concerns

See [founder approval report](../release-review/marketing-claims.md) for the complete removed/replacement statement table and unresolved credential/poster/privacy/international-operating-policy matters. These copy changes do not establish production legal readiness or backend jurisdiction enforcement. No new figures or credentials were introduced.

## Changed files

- `artifacts/release-review/marketing-claims.md`
- `scripts/release-browser-qa.mjs`
- `scripts/release-motion-qa.mjs`
- `src/app/layout.tsx`
- `src/app/manifest.ts`
- `src/app/r/[code]/page.tsx`
- `src/components/marketing/hero-mockup.tsx`
- `src/components/marketing/landing-page.tsx`
- `src/components/marketing/platform-stats.tsx`
- `src/components/marketing/site-footer.tsx`
- `src/features/dashboard/dashboard-client.tsx`
- `src/features/homecare/homecare-booking-client.tsx`
- `src/features/homecare/homecare-request-detail-client.tsx`
- `src/features/homecare/homecare-requests-client.tsx`
- `src/features/marketing/data.ts`
- `src/features/referral-program/referral-landing-client.tsx`
- `scripts/marketing-coverage-qa.mjs`
- `artifacts/marketing-approval/ (reports, logs, screenshots)`

## Before and after screenshots

Before captures are from the preceding integrated candidate; after captures are from the corrected local production build. Full page pairs include all changed landing sections. Every after viewport and changed patient/referral surface is saved in this directory.

| Surface | Before | After |
|---|---|---|
| Mobile landing (390px) | [Before](before-landing-390.png) | [After](after-landing-390.png) |
| Desktop landing (1440px) | [Before](before-landing-1440.png) | [After](after-landing-1440.png) |
| Mobile doctor hero | [Before](before-hero-consult-390.png) | [After](after-hero-consult-390.png) |
| Desktop homecare hero | [Before](before-hero-homecare-1440.png) | [After](after-hero-homecare-1440.png) |
| Mobile service cards | [Before](before-services-390.png) | [After](after-services-390.png) |
| Desktop footer | [Before](before-newsletter-1440.png) | [After](after-newsletter-1440.png) |

Additional evidence: [overview](after-service-overview-390.png), [referral](after-referral-390.png), [homecare booking](after-homecare-booking-390.png), [homecare requests](after-homecare-requests-1440.png). Full browser data: `browser-qa.json`, `coverage-browser-qa.json`, `motion-qa.json`. Build/test/lint logs are adjacent.
