# LegalSavvy Admin — Next.js

Production-ready admin panel. **Next.js 14 (App Router) · TypeScript · GSAP · zero UI dependencies.**

```bash
npm install
npm run dev      # http://localhost:3000
```

---

## 🎨 Change colors and logo — one file

Everything lives in **`brand.config.ts`** at the project root. Edit it, save, and
the whole app re-skins on hot reload. No stylesheet edits, no rebuild step.

### Colors

```ts
colors: {
  primary: "#0E2A4E",   // structure: sidebar, dark surfaces, bars
  accent:  "#F26C0D",   // attention: active nav, buttons, gauges, focus rings
  ...
}
```

Change those two and everything follows — buttons, charts, chips, gauges,
focus rings, the dark hero band, dark mode. The remaining keys (tints, status
colors, neutrals) are there when you want finer control.

**How it works:** `components/brand-style.tsx` compiles the config into CSS
custom properties injected once in the root layout. Every component reads
`var(--ember)` / `var(--navy)` etc., so there is exactly one source of truth.

### Logo

```ts
logo: {
  light: "/logo-light.svg",   // shown on light surfaces (login)
  dark:  "/logo-dark.svg",    // shown on the dark sidebar
  height: { sidebar: 44, login: 46, mobile: 34 },
  maxWidth: 200,
}
```

Drop your files into `/public` and point to them, or paste absolute URLs.
Set either to `null` and `components/logo.tsx` falls back to a generated
wordmark — it also falls back automatically if the image fails to load.

### Everything else in the config

| Key | What it controls |
|---|---|
| `name`, `shortName`, `legalName`, `tagline` | Page titles, sidebar, login footer |
| `radius` | Corner roundness of every surface |
| `motion.enabled` | Master switch — `false` ships a static build |
| `motion.pageTransitions` | The dark curtain between routes |
| `motion.customCursor` | Desktop cursor (auto-off on touch) |
| `features.*` | Toggle ⌘K palette, notifications, theme toggle, collapsible sidebar, mobile tab bar |

---

## Project structure

```
brand.config.ts          ⭐ colors, logo, identity, feature flags
app/
  layout.tsx             root: fonts, brand tokens, toast provider
  page.tsx               login (preloader, orbits, curtain exit)
  login.css              login-only styles
  globals.css            design system — all values are CSS vars
  (panel)/
    layout.tsx           wraps every page in <Shell>
    dashboard/           command band, gauge, funnel, KPIs, timeline
    pipeline/            drag-and-drop kanban (React state, no library)
    customers/           search + filter + paginate + slide-over case file
    analytics/ campaigns/ payments/ forms/ messages/ calendar/ settings/
components/
  shell.tsx              sidebar + topbar + mobile chrome + palette
  brand-style.tsx        config → CSS custom properties
  logo.tsx  icons.tsx  ui.tsx  band.tsx  rail.tsx
  sidebar.tsx  topbar.tsx  mobile-nav.tsx
  command-palette.tsx  page-wipe.tsx  cursor.tsx
  charts/index.tsx       Spark, Kpi, AreaChart, Bars, Gauge, Donut, Funnel, Heatmap
  forms/index.tsx        22 field components (see below)
lib/
  nav.ts                 sidebar + mobile tabs — add a page by adding a row
  data.ts                typed mock data; swap for your API
  motion.ts              GSAP helpers + usePageMotion()
  theme.tsx  toast.tsx
```

## Adding a page

1. Create `app/(panel)/reports/page.tsx`
2. Add `{ href: "/reports", label: "Reports", icon: "chart" }` to `lib/nav.ts`

That's it — chrome, animations and mobile nav come for free.

## Form components

`components/forms/index.tsx` exports: `Field` `Input` `FloatInput` `Select`
`Textarea` `OptionCard` `Switch` `Slider` `Stepper` `ChipSelect` `TagInput`
`Otp` `Autocomplete` `Dropzone` `Wizard` `FormSection`.
See `/forms` for a live example of every one.

## Charts

All SVG, no charting library. `components/charts/index.tsx` exports `Spark`,
`Kpi`, `AreaChart` (with a pulse dot riding the path), `Bars` (hover tooltips),
`Gauge`, `Donut`, `Funnel`, `Heatmap`. Animation is driven by `data-` attributes
read in `lib/motion.ts`, so charts animate on mount and on scroll-back.

## Data

`lib/data.ts` is typed mock data. Replace each export with a fetch or a server
component — page components only consume props and typed arrays.

## Mobile

Bottom tab bar with a raised FAB, sticky translucent app header, sidebar as a
sheet, drawers and the palette as bottom sheets, snap-scrolling card rows,
44px tap targets, 16px inputs (no iOS zoom), and safe-area insets.

## Accessibility

Semantic landmarks, labelled controls, visible focus rings, keyboard-navigable
palette (↑ ↓ Enter Esc), and full `prefers-reduced-motion` support.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm start       # serve the build
npx tsc --noEmit  # typecheck
```

---

## Troubleshooting

### Content appears blank or ghosted (fixed in this build)

If you ever see faded text and empty cards in **dev only**, the cause is
React StrictMode double-invoking effects while GSAP's `from()` is mid-flight:
the second `from()` reads the current opacity (0) as its *end* value and the
element never becomes visible.

This project guards against it in three layers:

1. **No bare `gsap.from()` anywhere** — every entrance uses `fromTo()` with an
   explicit end state and `clearProps`, so a re-run can't strand an element.
2. **`gsap.context()`** in `usePageMotion` and on the login page, reverted on
   cleanup, so StrictMode's first pass is properly undone.
3. **CSS fallback** — `.gs, .band, .glass-tile { opacity: 1 }` means that even
   with JS disabled or a cancelled tween, the page stays readable.

If you add your own animation, follow the same rule:

```ts
// ❌ breaks under StrictMode
gsap.from(el, { opacity: 0, y: 20 });

// ✅ safe
gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, clearProps: "all" });
```

### The logo is invisible on the dark sidebar

Your wordmark is dark artwork on a transparent background. `brand.config.ts`
has `logo.invertOnDark: true`, which flips it to white with a CSS filter.
Once you add a real white logo to `/public` and point `logo.dark` at it, set
that flag to `false`.

### Disabling animation entirely

`brand.config.ts` → `motion.enabled: false`. Everything renders statically;
the CSS fallbacks keep the layout intact.
