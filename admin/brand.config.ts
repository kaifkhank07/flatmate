/* ============================================================================
 * BRAND CONFIG — central configuration for brand identity and theme colors.
 * Update brand information and palette here; preserve standard UI status colors.
 * ========================================================================== */

export type BrandConfig = typeof brand;

export const brand = {
  /* ── Identity ─────────────────────────────────────────────────────────── */
  name: "Flat & Flatmate",
  shortName: "F&F",
  legalName: "Flat & Flatmate",
  tagline: "Designed to find your perfect home.",

  /* ── Logo ─────────────────────────────────────────────────────────────── */
  logo: {
    light: "/favicon.png",
    dark: "/favicon.png",
    invertOnDark: true,
    height: { sidebar: 44, login: 46, mobile: 34 },
    maxWidth: 200,
  },

  /* ── Brand colors ─────────────────────────────────────────────────────── */
  colors: {
    // Primary brand colors
    primary: "#073A81",
    accent: "#0066F9",

    // Derived primary shades
    primaryTint: "#0B4A9E",
    primaryLight: "#245BA3",
    primaryDeep: "#052B61",
    primarySoft: "#E5EEFA",

    // Derived accent shades
    accentTint: "#3385FA",
    accentLight: "#66A3FB",
    accentDeep: "#004BB8",
    accentSoft: "#E5F0FF",

    // Standard semantic status colors — preserved
    success: "#17714A",
    successSoft: "#DCF0E4",
    warning: "#B7791F",
    warningSoft: "#FEF3C7",
    danger: "#B33F4F",
    dangerSoft: "#FCE2E4",
    info: "#215F94",
    infoSoft: "#DDEAF7",

    // Neutrals
    canvas: "#F2FAFD",
    canvasAlt: "#E8F5FA",
    card: "#FFFFFF",
    cardAlt: "#F8FCFE",
    ink: "#101722",
    inkSoft: "#3D4757",
    inkMuted: "#737E8F",
    inkFaint: "#A9B2C0",
    hairline: "#DCEAF2",
    hairlineAlt: "#C8DDEB",
  },

  /* ── Dark mode ────────────────────────────────────────────────────────── */
  dark: {
    primary: "#3385FA",
    accent: "#0196FD",
    primarySoft: "#102849",
    accentSoft: "#0C2B43",
    accentDeep: "#66B9FF",
    canvas: "#060D18",
    canvasAlt: "#0B1727",
    card: "#101D2D",
    cardAlt: "#142338",
    ink: "#EDF5FF",
    inkSoft: "#BDCEE2",
    inkMuted: "#8297B0",
    inkFaint: "#52677F",
    hairline: "#203249",
    hairlineAlt: "#2B415B",
  },

  /* ── Shape & motion — unchanged ───────────────────────────────────────── */
  radius: { xl: 22, lg: 17, md: 12, sm: 9 },

  motion: {
    enabled: true,
    pageTransitions: true,
    customCursor: true,
  },

  /* ── Feature flags — unchanged ────────────────────────────────────────── */
  features: {
    commandPalette: true,
    notifications: true,
    themeToggle: true,
    collapsibleSidebar: true,
    mobileTabBar: true,
  },
} as const;

export default brand;



// /* ============================================================================
//  *  BRAND CONFIG — the only file you need to edit to re-skin this admin panel.
//  *
//  *  Everything below flows into CSS custom properties at runtime, so a change
//  *  here updates every page, chart, button, chip and dark-mode surface at once.
//  *  No rebuild of the stylesheet required.
//  * ========================================================================== */

// export type BrandConfig = typeof brand;

// export const brand = {
//   /* ── Identity ───────────────────────────────────────────────────────────
//    * `name` is used for <title>, the sidebar fallback and aria labels.
//    * `shortName` shows in the collapsed sidebar and mobile header.        */
//   name: "LegalSavvy",
//   shortName: "LS",
//   legalName: "Finsbury Advisory Pvt. Ltd.",
//   tagline: "Run the pipeline. Settle more.",

//   /* ── Logo ───────────────────────────────────────────────────────────────
//    * Drop your files in /public and point to them (e.g. "/logo-light.svg"),
//    * or paste any absolute URL. `light` renders on light surfaces (login),
//    * `dark` renders on the dark sidebar. Set either to null to fall back to
//    * the built-in wordmark. Tune `height` if your logo reads small or large. */
//   logo: {
//     light:
//       "https://thelegalsavvy.com/wp-content/uploads/2023/11/lashes-4-e1733906933339-1024x257.webp",
//     dark: "https://thelegalsavvy.com/wp-content/uploads/2023/11/lashes-3-e1733904648620.webp",

//     /* Your wordmark is dark artwork on a transparent background, and the
//      * sidebar is dark navy — so we flip it to white with a CSS filter.
//      * Set this to false once you drop a real white/light logo into /public
//      * and point `dark` at it.                                            */
//     invertOnDark: true,

//     height: { sidebar: 44, login: 46, mobile: 34 }, // px
//     maxWidth: 200, // px
//   },

//   /* ── Colors ─────────────────────────────────────────────────────────────
//    * TWO values drive the whole palette. Everything else is derived below,
//    * so start by changing just `primary` and `accent`.
//    *
//    *   primary → structure: sidebar, dark surfaces, bars, message bubbles
//    *   accent  → attention: active nav, primary buttons, gauges, focus rings
//    */
//   colors: {
//     primary: "#0E2A4E", // deep legal navy
//     accent: "#F26C0D", // ember orange

//     /* Derived shades — regenerate these with any color tool if you change
//      * primary/accent, or leave them; they are tuned to the pair above.   */
//     primaryTint: "#17406F",
//     primaryLight: "#2A5E9B",
//     primaryDeep: "#0A1E38",
//     primarySoft: "#E8EFF7",

//     accentTint: "#FF9243",
//     accentLight: "#FFB877",
//     accentDeep: "#B44904",
//     accentSoft: "#FFEEE1",

//     /* Semantic status colors — used by chips, tiles and chart series.    */
//     success: "#17714A",
//     successSoft: "#DCF0E4",
//     danger: "#B33F4F",
//     dangerSoft: "#FCE2E4",
//     info: "#215F94",
//     infoSoft: "#DDEAF7",

//     /* Neutrals. `canvas` is the page background, `card` the surfaces.    */
//     canvas: "#F6F5F2",
//     canvasAlt: "#EDEBE6",
//     card: "#FFFFFF",
//     cardAlt: "#FAF9F6",
//     ink: "#101722",
//     inkSoft: "#3D4757",
//     inkMuted: "#737E8F",
//     inkFaint: "#A9B2C0",
//     hairline: "#EAE8E3",
//     hairlineAlt: "#DEDBD4",
//   },

//   /* ── Dark mode ──────────────────────────────────────────────────────────
//    * Only the values that must change in dark mode. Leave as-is unless your
//    * brand needs a different night palette.                                */
//   dark: {
//     primary: "#3C78C8",
//     accent: "#FF8A3D",
//     primarySoft: "#12243C",
//     accentSoft: "#31200F",
//     accentDeep: "#FFA75C",
//     canvas: "#080D15",
//     canvasAlt: "#0E1622",
//     card: "#101927",
//     cardAlt: "#152134",
//     ink: "#EDF1F7",
//     inkSoft: "#BAC4D3",
//     inkMuted: "#7E8A9C",
//     inkFaint: "#4E5A6C",
//     hairline: "#1B2534",
//     hairlineAlt: "#243144",
//   },

//   /* ── Shape & motion ─────────────────────────────────────────────────────
//    * `radius` scales the roundness of every surface.
//    * Set `motion.enabled` to false to ship a completely static build.      */
//   radius: { xl: 22, lg: 17, md: 12, sm: 9 },
//   motion: {
//     enabled: true,
//     pageTransitions: true, // the dark curtain wipe between routes
//     customCursor: true, // desktop only, auto-disabled on touch
//   },

//   /* ── Feature flags ──────────────────────────────────────────────────── */
//   features: {
//     commandPalette: true, // ⌘K / Ctrl-K
//     notifications: true,
//     themeToggle: true,
//     collapsibleSidebar: true,
//     mobileTabBar: true,
//   },
// } as const;

// export default brand;
