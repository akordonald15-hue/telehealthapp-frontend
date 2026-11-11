# Caretekk design system

The design system lives in Figma: **CARETEKK TECHNOLOGIES → page "DESIGN SYSTEM"**.
Its colours, fonts, text styles and shadows are available in code as Tailwind classes,
defined in [`src/app/globals.css`](../src/app/globals.css) (section "Caretekk design system").

## Rules

- Use these tokens for all new UI. **Don't hardcode colours** like `bg-[#2563EB]`.
- If you need a value that isn't here, ask the frontend lead to add it to Figma and this file first.
- The older tokens (`bg-primary`, `text-muted`, `font-heading`, Lexend) still exist while pages are
  migrated. Don't use them in new code.

## Colours

Every scale goes from `50` (lightest) to `900` (darkest). `500` is the main swatch.

| Scale | Use for | Example |
|---|---|---|
| `primary` | Brand, primary buttons, links | `bg-primary-500 text-white` |
| `grey` | Text, borders, backgrounds | `text-grey-900`, `border-grey-200`, `bg-grey-50` |
| `black` | Very dark surfaces | `bg-black-900` |
| `success` | Success states | `bg-success-50 text-success-700` |
| `danger` | Errors, destructive actions | `text-danger-500` |
| `warning` | Warnings | `bg-warning-50 text-warning-800` |
| `info` | Informational notices | `bg-info-50 text-info-700` |

White with opacity (Figma "alfa 10–90%"): `bg-white/80`, `bg-white/10`, etc.

## Fonts

| Class | Font | Used for |
|---|---|---|
| `font-manrope` | Manrope | Headings, titles, input text |
| `font-inter-tight` | Inter Tight | Body text, labels, buttons, nav |

## Text styles

One class sets font, size, weight, line height and letter spacing. Names match the Figma text styles.

| Class | Font | Size / line height | Weight |
|---|---|---|---|
| `type-heading-1` | Manrope | 60 / 72 | 700 |
| `type-heading-2` | Manrope | 48 / 56 | 700 |
| `type-heading-3` | Manrope | 40 / 48 | 700 |
| `type-heading-4` | Manrope | 32 / 40 | 700 |
| `type-page-title` | Manrope | 24 / 28 | 700 |
| `type-section-heading` | Manrope | 18 / 22 | 700 |
| `type-card-title` | Manrope | 15 / 18 | 600 |
| `type-modal-title` | Manrope | 15 / 18 | 700 |
| `type-input-text` | Manrope | 16 / 20 | 400 |
| `type-helper-text` | Manrope | 14 / 20 | 400 |
| `type-body-giant` | Inter Tight | 18 / 24 | 500 |
| `type-body-lg` | Inter Tight | 16 / 20 | 500 |
| `type-body-md` | Inter Tight | 14 / 16 | 500 |
| `type-body-sm` | Inter Tight | 12 / 16 | 500 |
| `type-body-tiny` | Inter Tight | 10 / 12 | 500 |
| `type-input-label` | Inter Tight | 12 / 14 | 500 |
| `type-table-data` | Inter Tight | 12 / 14 | 400 |
| `type-status-tag` | Inter Tight | 11 / 14 | 600 (write in CAPS, or add `uppercase`) |
| `type-muted-label` | Inter Tight | 11 / 14 | 400 |
| `type-cta-button` | Inter Tight | 13 / 18 | 500 |
| `type-nav-item` | Inter Tight | 13 / 16 | 600 |

Text styles don't set a colour; add one, e.g. `type-page-title text-grey-900`.
For responsive sizes, combine them: `type-heading-4 md:type-heading-2`.

## Shadows

`shadow-100` (subtle) to `shadow-800` (strongest), e.g. `shadow-200` for cards, `shadow-600` for modals.

## Example

```tsx
<div className="rounded-2xl bg-white p-6 shadow-200">
  <h2 className="type-card-title text-grey-900">Upcoming appointment</h2>
  <p className="type-body-md mt-2 text-grey-600">Dr. Okon · Tomorrow, 10:00</p>
  <span className="type-status-tag mt-3 inline-block rounded-full bg-success-50 px-2 py-1 uppercase text-success-700">
    Confirmed
  </span>
</div>
```

## Still to do

- Components from Figma (Button, Input, Badge & Chip, Checkbox, Radio, Toggle, Dropdown, …)
  will be built in `src/components/ui/` using these tokens.
- Existing pages will be moved from hardcoded colours to these tokens page by page.
