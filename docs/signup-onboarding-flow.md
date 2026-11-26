# Sign-up & Onboarding Flow

**Area:** Patient authentication (`/register`) and profile onboarding (`/onboarding`)

This document covers the patient sign-up and onboarding build:

1. **Sign-up** — email → OTP → account → (optional) referral outcome, then `/login`
2. **Onboarding** — two-step profile completion, then `/dashboard`

It is written as a handoff/onboarding reference for anyone touching these flows.

---

## 1. Overview & wiring

Routes:

| Route | File | Renders |
|---|---|---|
| `/register` | `src/app/(auth)/register/page.tsx` | `AuthSplitLayout` + `AuthVisualPanel` + `SignupFlow` |
| `/register?verified=1&email=…` | same | `SignupFlow` starting at the account step |
| `/onboarding` | `src/app/onboarding/page.tsx` | `RequireAuth` + `OnboardingFlow` |
| `/onboarding?preview=…` | same | `OnboardingPreview` (dev-only, no auth) |

The full journey:

```
/register (email) → OTP → /register?verified=1 (account + terms) → /login
/login → RequireAuth → GET /profiles/me/ → /onboarding → PATCH /auth/me/ + PATCH /profiles/me/ → /dashboard
```

`src/app/onboarding/layout.tsx` is a pass-through layout so the `?preview=` surface can render
without a session; the real auth gate lives on the page.

---

## 2. Shared foundation

- **Breakpoints (Tailwind v4 defaults):**
  - Mobile: below `lg` (< 64rem / 1024px) — single column
  - Desktop: `lg:` `≥ 64rem` (1024px) — sign-up split / absolute onboarding frame
  - `xl:` `≥ 80rem` (1280px) — visual-panel inset adjustments
- **Sign-up split** (`src/components/layout/auth-split-layout.tsx`):
  - `main`: `min-h-dvh bg-white p-4 lg:p-3`
  - grid: `max-w-[1512px]`, `lg:grid-cols-[minmax(0,744px)_minmax(450px,1fr)]`, `gap-8`
  - visual panel is `hidden lg:block`; below `lg` the brand lockup renders above the card.
- **Visual panel** (`auth-visual-panel.tsx`): `/img/Dr michael Idam.jpg` via `next/image` `fill`,
  `sizes="(min-width: 1024px) 744px, 0px"`, dark overlay, brand + headline/subline.
  Insets: `left-10 top-10` → `xl:left-[88px] xl:top-[50px]`; bottom band
  `bottom-10 left-10 right-10` → `xl:bottom-[69px] xl:left-[88px] xl:right-[77px]`.
- **Card:** `signup-card.tsx` — `bg-grey-200 p-2.5` shell, white inner `p-[30px]`
  (`max-[399px]:p-5`), centered icon + `type-page-title` heading + `type-body-lg` subtitle.
- **Onboarding screen** (`src/components/layout/onboarding-screen.tsx`):
  - header brand, centered content column `max-w-[598px]`, footer actions.
  - `lg`: header absolute at `left-[100px] top-[50px]`, footer absolute `inset-x-[100px] bottom-[56px]`,
    content `lg:px-[100px] lg:pt-28 lg:pb-36` so it clears both.
  - below `lg`: header/footer stay in flow (`px-6 sm:px-8`, `py-10`) so a tall form scrolls.
- **Type tokens** (`src/app/globals.css`): `type-heading-4` (32/40 bold), `type-page-title` (24/28),
  `type-body-giant`, `type-body-lg`, `type-body-md`, `type-helper-text`. Colours via
  `text-primary-500`, `text-grey-600`, `text-danger-600`, etc. No raw hex in markup.

---

## 3. Sign-up flow (`/register`)

### 3.1 Stage machine (`src/features/auth/signup/signup-flow.tsx`)

`Stage = "email" | "otp" | "account" | "referral"`; initial stage is `account` when
`?verified=1`, otherwise `email`.

URL params consumed: `verified`, `email`, `ref` (referral code), plus `preview`/`stage`/`state`
for the dev preview.

On mount (client-only effect) it restores state from `sessionStorage`/URL:

- saves `ref` if present;
- verified path: uses `email` param or stored verified email; missing → `router.replace("/register")`;
- unverified path: saves pending email, resumes the OTP step and restarts the 30s countdown.

### 3.2 API calls (`src/lib/api/endpoints.ts`)

| Action | Call | Endpoint |
|---|---|---|
| Send code | `authApi.otpRequest({ email })` | `POST /auth/otp/request/` |
| Resend code | `authApi.otpRequest({ email })` | `POST /auth/otp/request/` |
| Verify code | `authApi.otpVerify({ email, code })` | `POST /auth/otp/verify/` |
| Create account | `authApi.register({ email, password, phone, referral_code? })` | `POST /auth/register/` |

`requestCode` and `resendCode` are separate mutation instances (independent pending/error/success
UI) that share one `mutationFn`. Phone is normalised with `normalizeNigerianPhoneInput`, falling
back to a trimmed value. On register success all pending storages are cleared; if a referral code
was supplied and the API reports `referral.applied === false`, the `referral` stage shows the
outcome with a "Continue to sign in" button; otherwise it redirects to `/login`.

### 3.3 Persistence

`src/features/auth/email-flow-storage.ts` (sessionStorage, guarded by `try/catch` for private mode):

- `caretekk.auth.pending_email` — email awaiting OTP
- `caretekk.auth.verified_email` — email verified, ready for the account step

Referral state lives in `src/features/referral-program/referral-code-storage.ts`
(`savePendingReferralCode`, `readPendingReferralCode`, `clearPendingReferralCode`,
`normalizeReferralCode`).

### 3.4 Components

| File | Responsibility |
|---|---|
| `signup-card.tsx` | Card shell (icon, title, subtitle) |
| `signup-form.tsx` | `SignupEmailForm`, `SignupAccountForm`; internal divider/footer/Google/server-error helpers |
| `signup-otp-step.tsx` | Six-box OTP entry, paste/arrow/backspace handling, resend countdown, change email |
| `signup-preview.tsx` | Static QA surface for `?preview=split` |
| `signup-schema.ts` | Zod schemas for the email and account forms |

### 3.5 Validation (`signup-schema.ts`)

- **Email:** trim, required, valid email address.
- **Account:** valid email; password min 8 chars ("Password is too short"); phone required and
  must pass Nigerian phone normalisation; referral optional, max 32; terms must be accepted.
- Submit is disabled while submitting and until terms are checked (account) or the email is
  non-empty (email step). The password field shows a success hint once it is ≥ 8 chars and has no
  error (length-only — see §8).

### 3.6 OTP step (`signup-otp-step.tsx`)

Six numeric inputs (`CODE_LENGTH = 6`) with paste distribution, Backspace/Arrow navigation,
`autocomplete="one-time-code"` on the first box, and an inline error when fewer than 6 digits are
submitted. Resend starts a 30-second countdown; a success message appears after a resend.
`Use a different email` clears the pending email and returns to the email step.

### 3.7 Google sign-up

`SignupGoogle` renders the shared `GoogleAuthButton` with `mode="signup"`. It is shared with the
login page, so its legacy styling is intentionally left for a follow-up (§8).

### 3.8 Preview surface (dev only)

`/register?preview=split&stage=email|account&state=empty|filled|error` renders `SignupPreview`.
It is gated by `process.env.NODE_ENV !== "production"` in the page, so it never renders in a
production build. Demo values: `demo@example.test` / `caretekk-demo` / `08012345678`.

---

## 4. Onboarding flow (`/onboarding`)

### 4.1 Gate & data

`OnboardingPage` wraps `OnboardingFlow` in `RequireAuth`, which:

- requires a stored session (else redirects to `/login`);
- loads `GET /auth/me/` (`useCurrentUser`) and `GET /profiles/me/`;
- redirects patients with `profile_complete === false` to `/onboarding`;
- redirects `must_change_password` users to `/change-password`.

`OnboardingFlow` also reads the same profile (`["profile","me","patient","gate"]`) and redirects
to `/dashboard` when `profile_complete` is already true.

### 4.2 Steps & fields

| Step | Component | Fields |
|---|---|---|
| 1 — Welcome | `steps/step-welcome.tsx` | Full Name (text), Gender (select), Age Range (select) |
| 2 — Basic Information | `steps/step-basic-info.tsx` | State (select), Local Government (select, depends on state) |

Gender options: `female`, `male`, `prefer_not_to_say`.
Age ranges: `Under 18`, `18-24`, `25-34`, `35-44`, `45-54`, `55-64`, `65+`.
State/LGA data: `nigeria-locations.ts` (states + LGAs, `STATE_NAMES`, `getLgasForState`);
select options are built in `onboarding-options.ts` (`STATE_OPTIONS`, `getLgaOptions`).

### 4.3 Validation (`onboarding-schema.ts`)

- `full_name`: trimmed, required, max 120, must be at least two words and letters only.
- `gender`: enum of the three values.
- `age_range`: enum of the seven ranges.
- `state`: required and must be a known state.
- `lga`: required and must belong to the selected state (LGA is cleared when state changes).

Step gating in the UI uses `hasValidFullName` + `isGenderValue` + `isAgeRange` for step 1 and
`isLgaForState` for step 2.

### 4.4 Prefill

`useOnboardingForm` (react-hook-form + `zodResolver`, `mode: "onTouched"`) prefills **once** when
profile data arrives, without overwriting user input. `full_name` comes from the account or
profile; `gender`/`age_range` are only applied if valid; `state`/`lga` only if valid and the LGA
belongs to the state. Changing the state clears an incompatible LGA.

### 4.5 Save sequence

On step 2 Continue, `saveOnboarding`:

1. `PATCH /auth/me/` with `{ full_name }` (`authApi.updateMe`)
2. `PATCH /profiles/me/` with `{ gender, age_range, state, lga }` (`profilesApi.updateMe`)
3. updates the `auth/me`, `profile/me/patient`, and gate caches, then invalidates `auth/me` and
   `profile/me`;
4. if the refreshed gate profile is still `profile_complete === false`, throws a user-facing error;
5. otherwise `router.replace("/dashboard")`.

The two PATCHes are not atomic because the backend exposes no combined endpoint (see §8).

### 4.6 Error handling & focus

`handleSaveError` maps server field errors from an `ApiError` payload
(`full_name`/`fullName`, `gender`, `age_range`/`ageRange`, `state`, `lga`) onto the form, jumps to
the step that owns the first field, and focuses it. `401` shows a session-expired message; network
failures show a connectivity message; everything else falls back to a generic error.

Focus after a cross-step jump is applied in an effect (`focusTarget` + `requestAnimationFrame`)
once the target step has committed, avoiding a same-handler DOM race. Validation failures on the
current step use `focusFirstInvalid`.

### 4.7 Enter-to-submit

The active step is wrapped in `<form id="onboarding-form" noValidate onSubmit={…}>`, and the footer
Continue button is `type="submit"` with `form="onboarding-form"`, so pressing Enter in a field
advances/submits. The preview surface keeps the button in `type="button"` + `onClick` mode.

### 4.8 Footer & screen

`OnboardingFooter`: Back (step 2 only) bottom-left, Continue bottom-right on desktop; stacked
full-width buttons on mobile. Continue is disabled while pending or while the current step is
invalid.

### 4.9 Preview surface (dev only)

`/onboarding?preview=<key>` renders `OnboardingPreview` outside `RequireAuth`, gated by
`NODE_ENV !== "production"`. Keys:

| Key | Shows |
|---|---|
| `welcome-empty` | Step 1 empty |
| `welcome-filled` | Step 1 filled (`David Johnson`) |
| `welcome-errors` | Step 1 validation errors |
| `basic-empty` | Step 2 empty |
| `basic-state-open` | Step 2, State menu open |
| `basic-lga-open` | Step 2, LGA menu open |
| `basic-complete` | Step 2 filled (`Akwa Ibom` / `Eket`) |
| `basic-errors` | Step 2 errors |

It is visual-only: Continue advances 1 → 2, but step 2's Continue performs no save.

---

## 5. Responsive behaviour

- **Sign-up split:** two columns at `lg` (1024px); below that the visual panel is hidden and the
  brand lockup sits above the card. The grid's `minmax(0,744px)` lets the panel shrink to ~510px
  at 1024px without overflowing.
- **Visual panel insets** step down at `xl` so text is not cramped at 1024px.
- **Sign-up card** is `max-w-[450px]`, centered; inner padding drops to `p-5` below 400px.
- **Onboarding** content is `max-w-[598px]`; at `lg` it uses `pt-28/pb-36` to clear the absolute
  header/footer, so short viewports do not overlap. Below `lg` everything is in flow.
- **Onboarding headings** use the fixed `type-heading-4` (32/40). On phones the title wraps to two
  lines (three on very narrow screens); desktop/tablet keep one line. This is intentional — the
  previous `whitespace-nowrap` caused horizontal overflow.

---

## 6. Dev mocks & offline testing

There is **no backend required** for sign-up, but onboarding needs one.

| Layer | File(s) | Enables | Gate |
|---|---|---|---|
| API mock | `src/lib/server/auth-mock.ts` via `api/auth/otp/request`, `otp/verify`, `register` routes | OTP request/verify + register | `NODE_ENV !== "production"` **and** `NEXT_PUBLIC_AUTH_MOCK` = `1`/`true` |
| Sign-up preview | `signup-preview.tsx` | Static email/account states | `?preview=split` + dev |
| Onboarding preview | `onboarding-preview.tsx` | Static step states | `?preview=` + dev |

- The mock is enabled by `NEXT_PUBLIC_AUTH_MOCK=1` in `.env.development.local` (gitignored).
- **Use `npm run dev`.** `next start` runs with `NODE_ENV=production`, which disables the mock even
  if the flag is set, and `.env.development.local` is not loaded.
- Mock OTP sends no email and accepts **any 6 digits**; `[auth-mock]` lines appear in the server
  terminal.
- **Not mocked:** login, `auth/me`, and `profiles/me` (GET/PATCH). So offline you can reach
  `/login` but not the real onboarding; use `?preview=` for onboarding visuals.
- Only `.env.example` and `.env.staging.example` are tracked; neither enables the mock.

---

## 7. Testing & gates

Test files:

- `src/features/auth/signup/signup-flow.test.tsx`
- `src/features/auth/signup/signup-form.test.tsx`
- `src/features/onboarding/onboarding-flow.test.tsx`
- `src/features/onboarding/onboarding-preview.test.tsx`
- `src/components/ds/select-menu.test.tsx` (shared select used by both steps)

Commands:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Note: a single full `vitest run` can hang in this environment. Run it bounded, e.g.
`npx vitest run --pool=threads --maxWorkers=1 --no-file-parallelism`, in small file chunks. The
last full pass was 25 files / 199 tests.

---

## 8. Known limitations / deferred

- **L-02** `GoogleAuthButton` still uses legacy `ash-*` / `@/components/ui` styling (shared with
  login; out of scope here).
- **L-03** `SelectMenu` does not return focus to the trigger on outside click.
- **L-05** Onboarding saves with two sequential PATCHes (not atomic); the backend has no combined
  endpoint.
- **L-06** The `profile_complete` guard depends on the refetch returning the updated profile;
  verify against the real backend.
- **L-09** Arriving with `?email=` starts the OTP countdown immediately (product decision pending).
- **L-11** Password strength is length-only (min 8) with a success hint; no complexity scoring.
- **Mock coverage** stops at register/login; onboarding requires a backend.
- **Preview data in prod** is branch-gated but the modules are statically imported, so demo
  strings may remain in the production bundle unless tree-shaken.

---

## 9. Files

| File | Change |
|---|---|
| `src/app/(auth)/register/page.tsx` | route; split layout + `SignupFlow`; dev preview branch |
| `src/app/onboarding/page.tsx` | route; `RequireAuth` + `OnboardingFlow`; dev preview branch |
| `src/app/onboarding/layout.tsx` | pass-through layout |
| `src/components/layout/auth-split-layout.tsx` | two-column split at `lg`, mobile brand |
| `src/components/layout/auth-visual-panel.tsx` | sign-up visual panel |
| `src/components/layout/onboarding-screen.tsx` | onboarding header/content/footer frame |
| `src/features/auth/signup/signup-flow.tsx` | stage machine, mutations, persistence, redirects |
| `src/features/auth/signup/signup-form.tsx` | email/account forms, terms, Google, footer |
| `src/features/auth/signup/signup-otp-step.tsx` | OTP entry + resend |
| `src/features/auth/signup/signup-card.tsx` | card shell |
| `src/features/auth/signup/signup-schema.ts` | email/account Zod schemas |
| `src/features/auth/signup/signup-preview.tsx` | dev preview |
| `src/features/auth/email-flow-storage.ts` | guarded sessionStorage helpers |
| `src/features/onboarding/onboarding-flow.tsx` | steps, validation, save, error/focus |
| `src/features/onboarding/onboarding-footer.tsx` | Back/Continue, submit association |
| `src/features/onboarding/onboarding-preview.tsx` | dev preview states |
| `src/features/onboarding/onboarding-schema.ts` | onboarding Zod schema + guards |
| `src/features/onboarding/onboarding-options.ts` | select options from schema/locations |
| `src/features/onboarding/nigeria-locations.ts` | states + LGAs |
| `src/features/onboarding/use-onboarding-form.ts` | RHF setup, prefill, LGA reset |
| `src/features/onboarding/steps/step-welcome.tsx` | step 1 fields |
| `src/features/onboarding/steps/step-basic-info.tsx` | step 2 fields |
| `src/components/layout/require-auth.tsx` | session/profile gate |
| `src/lib/server/auth-mock.ts` | dev API mock (OTP + register) |
