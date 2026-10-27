# Marketing Landing Page — New Sections

**Developer:** Amaka Scholastica

This document covers the four new sections added to the marketing landing page
(`src/components/marketing/landing-page.tsx`), in page order:

1. **How It Works** — `#how-it-works`
2. **Trust** — `#trust`
3. **Technology** — `#technology`
4. **Get Started** — `#get-started`

It is written as a handoff/onboarding reference for anyone touching these sections.

---

## 1. Overview & wiring

Render order in `landing-page.tsx` (after the hero + hero-stats strip):

```tsx
<HowItWorksSection />
<TrustSection />
<TechnologySection />
<GetStartedSection />
```

Each section is a self-contained component under `src/components/marketing/`, exports a
single `*Section()` function, and renders its own `<section id="…">` with
`aria-labelledby` pointing at the section heading. Copy/lists come from
`src/features/marketing/data.ts` (no content hard-coded in markup).

| Section | Component | Anchor | Data export | Accent token |
|---|---|---|---|---|
| How It Works | `how-it-works-section.tsx` | `#how-it-works` | `howItWorksSteps` | `--accent-deep`, `--accent-strong`, `--primary-strong` |
| Trust | `trust-section.tsx` | `#trust` | `trustCards` | `--accent-strong` |
| Technology | `technology-section.tsx` | `#technology` | `technologySteps` | — |
| Get Started | `get-started-section.tsx` | `#get-started` | `getStartedCta` | `--accent-strong` |

---

## 2. Shared foundation

- **Container:** every section uses `mx-auto max-w-[1440px] px-4 md:px-10`.
- **Breakpoints (Tailwind v4 defaults):**
  - Mobile: `< 48rem` (< 768px)
  - Tablet: `md:` `48rem`–`<64rem` (768–1023px), targeted with `md:max-lg:`
  - Desktop: `lg:` `≥64rem` (1024px)
- **Design tokens** (`src/app/globals.css`, mapped into `@theme inline` so utilities exist):
  - Inks: `--ink #0B1C30`, `--ink-muted: #434655`
  - Blues: `--primary #2563EB`, `--primary-strong #1D4ED8`, `--primary-dark #1E40AF`,
    `--primary-tint #EFF6FF`, `--primary-halo #BFDBFE`, `--primary-halo-strong #93C5FD`
  - Accents: `--accent #60A5FA`, `--accent-strong #3B82F6`, `--accent-deep #2747AC` *(new)*
  - Surfaces/shadows: `--surface`, `--shadow-trust-card`, `--shadow-trust-photo`
- **Rule:** no raw hex in markup — use the token utilities (`bg-accent-deep`, `text-ink`, …).
  The single new token added for this work is `--accent-deep` (`#2747AC`).

---

## 3. How It Works (`#how-it-works`)

**Purpose:** a three-step explainer of the sign-up flow, on three bold blue cards with
bleeding background photos and subtle glow ellipses.

- **Background:** `bg-white`, `py-20` → `lg:pt-[6.25rem] lg:pb-[11.125rem]`.
- **Header:** caption `how it works` (`text-primary-dark`, light, uppercase) + title
  `Care In **Three** Simple Steps.` with `Three` in `text-accent-strong`. Title uses a fluid
  size `text-[clamp(2.25rem,4vw,3.4375rem)]`.
- **Cards:** rendered from `howItWorksSteps`. Each is
  `relative overflow-hidden rounded-[3.125rem]` + a fill token:
  - `01` `bg-accent-deep`, `02` `bg-accent-strong`, `03` `bg-primary-strong`.
  - Content: number chip (`bg-white/20`), title, body (all white). Chip is 80px mobile → 100px (`lg`).
- **Photo bleed:** each card holds an absolutely-positioned image layer
  (`z-0`, `hidden md:block`); content sits at `relative z-10`. Assets are **pre-cropped
  visible bands**, positioned as a % of the card:
  - Card 1 `how-it-works-1.png` (1041×626): `left-0 top-[43.572%] h-[56.428%] w-full`
  - Card 2 `how-it-works-2.png` (1041×665): `left-0 top-[40.054%] h-[59.946%] w-full`
  - Card 3 `how-it-works-3.png` (1538×965): md full-width band; `lg` right-side band
    (`lg:left-[27.562%] lg:top-[12.991%] lg:w-[72.438%] lg:h-[87.009%]`).
- **Glow ellipses:** desktop-only (`hidden lg:block`, `z-0`), two white circles per card,
  card-relative px (see `how-it-works-section.tsx:63-82`).
- **Responsive:** mobile single column (photos hidden); tablet single column
  `md:aspect-[774/739]`; desktop 2-col grid (`lg:grid-cols-2`, `lg:max-w-[80rem]`,
  gap 27px / 55px), card 3 spans both columns at `lg:aspect-[1415/739]`.

---

## 4. Trust (`#trust`)

**Purpose:** credibility — a team photo collage plus four trust cards.

- **Background:** `bg-primary-tint` with a dotted radial-gradient overlay
  (`#EBEBEB` dots). `py-24` → `md:py-[10.6875rem]` → `lg:py-[6.125rem]`.
- **Header:** caption `trust` + title `Care You Can Put Your **Family’s** Name On.`
  (`Family's` in `text-accent-strong`). Fluid title `clamp(2.25rem,4vw,3.8125rem)`.
- **Media collage:** two images with `--shadow-trust-photo`:
  - `trust-care-team.png` (970×1008) — primary photo.
  - `trust-home-visit.png` (487×505) — overlapping inset, offset with negative margin.
- **Cards:** `trustCards` (4) with icons from `trust-icons.tsx`
  (`Note2Icon`, `GalleryEditIcon`, `ForwardIcon`, `DirectRightIcon`). Cards are
  `bg-surface`, large radius, `--shadow-trust-card`, with an offset rhythm
  (`lg:translate-x-[78px]` etc. in `trust-section.tsx:7-12`).
- **Responsive:** default stacked; tablet staggered offsets; desktop
  `lg:grid-cols-[45.5%_1fr]` with absolutely-positioned photos and the four cards right.

---

## 5. Technology (`#technology`)

**Purpose:** position the product as a platform (not a directory), with four feature pills.

- **Background:** `bg-primary-dark`; two large white/5 glow circles; a dotted pattern
  bottom-right. `py-24` → `lg:pt-[10.125rem] lg:pb-[6.5rem]`.
- **Layout:** `lg:grid-cols-[45.5%_1fr]`. Left = `technology-care.png` product visual;
  right = heading + body + pills.
- **Heading:** `Technology-Enabled Care, Not a Phone Book of Contacts.` — fluid
  `clamp(2.25rem,4vw,3.8125rem)`.
- **Pills:** rendered from `technologySteps` (4). Each is a rounded `bg-primary-halo-strong/20`
  pill with a numbered circle (`bg-white/20`) and a title. Desktop sizes/offsets are
  hard-coded per index via `pillOffsets`, `pillWidths`, `pillOffsetsMd`, `pillWidthsMd`
  (`technology-section.tsx:4-15`).

---

## 6. Get Started (`#get-started`)

**Purpose:** final CTA band — headline, supporting copy, and two buttons over a care photo.

- **Background:** `bg-primary-dark` with a top white border. Dotted pattern bottom-right
  (`lg:block`). Two large white/5 glow circles (desktop).
- **Copy:** from `getStartedCta` (`heading`, `body` — both use `whitespace-pre-line`).
  Heading `Your family deserves\ncare that doesn't make\nthem wait.` uses fluid
  `clamp(2.25rem,4vw,3.8125rem)`.
- **Buttons:** `primaryLabel` → `/register` (`bg-accent-strong`, with `arrow-right.png`);
  `secondaryLabel` → `/login` (white outline, with `clinic.png`). Height 60px mobile → 90px
  (`md`/`lg`).
- **Image:** `get-started-care.png` fill on desktop (`right-6 w-[70%]`, `object-cover`);
  a separate band image is shown on tablet/mobile (`md:aspect-[834/638]`).
- **Layout:** `lg:grid lg:grid-cols-[46rem_1fr]`.

---

## 7. Cross-cutting implementation notes

- **Aspect-ratio cascade bug (How It Works) — fixed.** Using
  `lg:aspect-[var(--lg-aspect)]` on the base class while only card 3 defined
  `--lg-aspect` caused the generated `var()` rule (emitted *after* the explicit rules) to win
  and fall back to `aspect-ratio: auto` on cards 1–2. Do not reintroduce a
  `var(--lg-aspect)` aspect on cards that don't define the variable.
- **Photos are pre-cropped bands.** Card/photo assets are the *visible* cropped regions from
  Figma, so they are positioned with `object-cover`/`object-contain` inside percentage-sized
  containers. Changing a card's aspect ratio changes the crop.
- **Z-order contract.** Decorative layers are `z-0`/`pointer-events-none`; content is
  `relative z-10` so text/chips always sit above images and glows.
- **Build/run.** The app is served with `next start` (production). Source edits require
  `npm run build` then `npm run start`; use `npm run dev` for live reload. Do **not** run
  `next build` while a `next start` server is running — it can corrupt `.next`.
- **Typecheck.** `npm run typecheck` (or `npx tsc --noEmit`) passes.

---

## 8. Known limitation: not fully responsive across all devices

**These sections are not fully responsive across all devices.** The desktop mock is matched
well, but intermediate/mobile sizes are approximations and must be reconciled when mobile
designs are available. Specific known gaps:

- **Mobile is not designed.** The Figma mobile frame has no equivalents for these blocks;
  the `<768px` rules are interim (stacked layouts, scaled type, some photos hidden).
- **Fixed px/rem dimensions.** Several elements use absolute design-px sizes that do not
  scale, e.g. Technology pill widths up to `w-[50.4375rem]` and the Trust/Technology
  `lg:grid-cols-[45.5%_1fr]` split — these can overflow or crowd on narrower viewports.
- **Typography jumps.** Tablet headings use fixed `md:max-lg:text-[3.8125rem]` (61px), which
  can be tight on smaller tablets/landscape phones.
- **Get Started tablet image class typo.** `md:max-lg:left-1/22` in
  `get-started-section.tsx` is not a valid Tailwind fraction (likely intended `left-1/2`), so
  that positioning rule is dropped at tablet widths.
- **Percentage photo bands** keep the design crop only near the reference widths; other
  card ratios crop differently.
- **No full visual verification.** Rendered output has not been pixel-checked across
  320 / 390 / 768 / 834 / 1024 / 1280 / 1440 / 1920 px.

**Next steps:** obtain mobile frames, replace fixed sizes with fluid `clamp()` values, fix
the Get Started tablet `left` class, and add a visual regression pass across the breakpoints
above.

---

## 9. Files

| File | Change |
|---|---|
| `src/components/marketing/how-it-works-section.tsx` | new section (cards, photo bands, glows) |
| `src/components/marketing/trust-section.tsx` | new section (photo collage + trust cards) |
| `src/components/marketing/technology-section.tsx` | new section (visual + feature pills) |
| `src/components/marketing/get-started-section.tsx` | new section (CTA band) |
| `src/components/marketing/trust-icons.tsx` | new inline SVG icons for trust cards |
| `src/features/marketing/data.ts` | `howItWorksSteps`, `technologySteps`, `getStartedCta` (`trustCards` reused) |
| `src/app/globals.css` | `--accent-deep` token + `--color-accent-deep` theme mapping |
| `src/components/marketing/landing-page.tsx` | renders the four sections; legacy timeline section removed |
| `public/img/*.png` | section image assets |

