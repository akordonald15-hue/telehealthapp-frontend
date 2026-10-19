# Caretekk frontend PR review and hero corrections

Review date: 8 October 2026. Delivery is local and unmerged. Production readiness remains conditional on the release issues below.

## A. PR review

| PR | Status inspected | Scope | Head |
|---|---|---|---|
| [#8](https://github.com/akordonald15-hue/telehealthapp-frontend/pull/8) | OPEN, MERGEABLE, BLOCKED; REVIEW_REQUIRED; Vercel checks successful | FAQ, footer, Lexend 200, layout hydration suppression | `7773ce64ed84146f7fa7f9717a7cb0e545487edc` |
| [#9](https://github.com/akordonald15-hue/telehealthapp-frontend/pull/9) | OPEN, MERGEABLE, BLOCKED; REVIEW_REQUIRED; Vercel checks successful | Hero, navbar, services, solutions, statistics, GSAP animation | `93515ad08c6d7ba5a018a470a6ffd0b656c6904f` |

Fetched both branches and inspected their commits and diffs. Their common ancestor is `455cb3c653947f6b5692c4d1ae95dbc46c933a7f`. Neither head contains the other. PR #9 is the latest hero implementation; PR #8 supplies complementary FAQ/footer work. A nonmutating `git merge-tree --write-tree` check reports a conflict in `src/components/marketing/landing-page.tsx`; marketing data auto-merges. Neither PR was merged. Resolve integration deliberately, preserving PR #9's upper sections and PR #8's FAQ/footer, then validate the combined result.

Significant findings:

- PR #9's `#faq` navigation has no target until PR #8 is integrated; browser checks confirm the missing target.
- PR #8's newsletter calls `setSubmitted(true)` without persistence, then falsely says the visitor is on the list. Connect a real subscription endpoint or display honest unavailable/deferred behavior before release. No backend changes made here.
- PR #9 retains a commented-out legacy hero and an unused `cn` import in landing-page.tsx. These are maintainability issues, not duplicate rendered heroes.
- The displayed statistics are hard-coded claims (1,200 consultations, eight minutes, 50 providers, Lagos/Abuja/PH), while homecare copy says Akwa Ibom. Confirm the claims and coverage before publication.
- The first flattened image obscures a face with the foreground doctor's hand. Mobile uses an oversized fixed canvas and clips its edges.
- The original carousel lacks explicit pause/slide controls. This delivery adds keyboard-accessible controls and respects reduced motion when switching manually.
- PR #8 suppresses root hydration warnings. This can conceal actual root attribute mismatches; use the suppression narrowly and investigate any remaining hydration errors in combined QA.
- npm audit reports 18 advisories: 3 critical, 11 high, 3 moderate, 1 low. Critical package classifications include Next.js, Vitest and tinypool. This is the registry report, not an exploitability assessment. Review fixes in a separate dependency change; no broad upgrades were applied.

## B. First hero correction

The overlap is embedded in `/img/team-consult.webp`, not caused by separate DOM layers. Dr. Michael Idam is the central foreground doctor in blue; Dr. Paul Chinonso is behind on the left; Dr. Effiong Okon is behind on the right. Dr. Michael's raised hand overlaps Dr. Paul's face in the flattened image. Another part of his hand/arm pose is cut by the flattened crop.

The correction composes the existing named JPG originals in separate rounded 4:5 frames. Dr. Michael remains the featured central doctor; his full source hand pose is visible without covering another face. Frames have gaps and share a bottom baseline. The image area scales within the viewport rather than overflowing a 600px mobile canvas. No photo was synthesized or retouched; the original photographic backgrounds are visible inside the frames. This is a deliberate composition change for review, while the blue gradient, circles, typography, copy and CTAs remain.

Files: `src/components/marketing/hero-slideshow.tsx`, `src/features/marketing/data.ts`.

## C. Second hero correction

`/img/Dr effiong Okon.jpg` identifies Dr. Okon by filename and coat text and matches the original right-side person, including his multicolored tie. `/img/Dr Ekene.jpg` is the removed central doctor. The fair-complexioned left doctor is Dr. Paul Chinonso and is retained as a smaller companion on the left. Dr. Okon's original photograph occupies the larger central frame; an empty right allocation preserves his exact horizontal centering and leaves the decorative circles visible. He is no longer repeated on the right. The two-person arrangement uses intentional open space; review its appearance in the screenshots before accepting it.

Files: the same two hero/data files. Facial appearance, skin tone and original pixels are preserved. No unrelated stock photo or AI replacement was introduced.

## D. Quality assurance

Before and after screenshots cover both slides at 360, 390, 768, 1024, 1280 and 1440px. These are actual Chromium renders, visually inspected, not inferred from unit-test results. The original and corrected hero section is captured in full, including below the desktop viewport fold. The unrelated install prompt was dismissed; the Next.js development indicator can appear.

| Check | Result |
|---|---|
| All six widths | Text and CTAs readable; navigation separate from portraits; no horizontal overflow; faces separate; Dr. Michael hand visible |
| Slide transition | Existing GSAP text/pill/image transition retained; manual controls and pause/resume added; timed rotation and pause checked in Chromium |
| Reduced motion | Manual switch uses immediate opacity changes; automatic rotation remains disabled |
| Stable layout | Fixed aspect-ratio composition and stacked text layers reserve space; manual switching checked for unchanged hero height |
| Browser console | No captured console errors or uncaught page errors in viewport checks |
| CTA routing | Both hero actions retain `/register`; no auth/payment integration changed |
| Mobile navigation | Open/close toggle checked below 1024px |
| TypeScript | `npm run typecheck` passed |
| Lint | `npm run lint` passed with two existing warnings: unused landing-page `cn`; React Hook Form compiler warning in appointments |
| Tests | Initial full run: 62 passed, one dashboard/referral test timed out under concurrent load. Isolated rerun: all nine tests in that file passed |
| Build | Initial compilation passed but page collection failed without BACKEND_API_BASE_URL. Configured rerun passed compilation, TypeScript and static-page generation |
| Patch whitespace | `git diff --check` passed |

The build rerun supplies BACKEND_API_BASE_URL and NEXT_PUBLIC_API_BASE_URL using the `.env.example` placeholder `https://api.caretekk.example/api/v1`, not production credentials. It validates compilation/page generation, not live backend behavior. PR #8 was source-reviewed; its combined runtime with PR #9 is not certified because integration was intentionally not merged. Chromium QA does not establish Safari/Firefox or physical-device parity. No production bookings, patient records or provider operations were accessed.

### Screenshot evidence

| Width | First before | First after | Second before | Second after |
|---|---|---|---|---|
| 360px | [before](before-360-consult.png) | [after](after-360-consult.png) | [before](before-360-homecare.png) | [after](after-360-homecare.png) |
| 390px | [before](before-390-consult.png) | [after](after-390-consult.png) | [before](before-390-homecare.png) | [after](after-390-homecare.png) |
| 768px | [before](before-768-consult.png) | [after](after-768-consult.png) | [before](before-768-homecare.png) | [after](after-768-homecare.png) |
| 1024px | [before](before-1024-consult.png) | [after](after-1024-consult.png) | [before](before-1024-homecare.png) | [after](after-1024-homecare.png) |
| 1280px | [before](before-1280-consult.png) | [after](after-1280-consult.png) | [before](before-1280-homecare.png) | [after](after-1280-homecare.png) |
| 1440px | [before](before-1440-consult.png) | [after](after-1440-consult.png) | [before](before-1440-homecare.png) | [after](after-1440-homecare.png) |

Raw outputs: `after-qa.json`, `before-qa.json`, `lint.txt`, `targeted-lint.txt`, `typecheck.txt`, `tests.txt`, `test-rerun.txt`, `build.txt`, `build-configured.txt`, `npm-audit.json`, `rotation-qa.json`. Screenshot and browser assertion script: `scripts/hero-visual-qa.mjs`. It uses Playwright already installed in the sibling original checkout; it adds no package dependencies. Run from this worktree with `node scripts/hero-visual-qa.mjs after` while the preview listens on port 3100.

## E. Delivery

Branch: `fix/hero-composition-review`, based on PR #9 head. Worktree: `C:/Projects/Caretekk/hero-review`. Your original checkout, local package/admin modifications and artifacts were left untouched. The delivery commit SHA is provided in the accompanying chat; a commit cannot contain its own SHA. No remote PR created, no push, merge or deployment performed.

Outstanding decisions: accept the photographic-frame composition and two-person central-Okon arrangement; resolve the PR #8/#9 conflict; make newsletter messaging truthful; validate marketing claims; address dependency advisories; test the combined frontend against the intended staging configuration before production approval.
