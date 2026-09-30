import { brand } from "@/brand.config";

/**
 * Turns brand.config.ts into CSS custom properties.
 * Rendered once in the root layout — every component reads these vars,
 * so editing brand.config.ts re-skins the entire app with no rebuild.
 */
export default function BrandStyle() {
  const c = brand.colors;
  const d = brand.dark;
  const r = brand.radius;

  const css = `
:root{
  --navy:${c.primary}; --ember:${c.accent};
  --navy-2:${c.primaryTint}; --navy-3:${c.primaryLight};
  --navy-ink:${c.primaryDeep}; --navy-soft:${c.primarySoft};
  --navy-glow:${hexA(c.primary, 0.3)};
  --ember-2:${c.accentTint}; --ember-3:${c.accentLight};
  --ember-ink:${c.accentDeep}; --ember-soft:${c.accentSoft};
  --ember-glow:${hexA(c.accent, 0.34)};

  --canvas:${c.canvas}; --canvas-2:${c.canvasAlt};
  --card:${c.card}; --card-2:${c.cardAlt};
  --ink:${c.ink}; --ink-2:${c.inkSoft}; --ink-3:${c.inkMuted}; --ink-4:${c.inkFaint};
  --hair:${c.hairline}; --hair-2:${c.hairlineAlt};

  --mint:${c.successSoft}; --mint-ink:${c.success};
  --rose:${c.dangerSoft};  --rose-ink:${c.danger};
  --sea:${c.infoSoft};     --sea-ink:${c.info};
  --sand:${c.accentSoft};  --sand-ink:${c.accentDeep};
  --lav:${c.primarySoft};  --lav-ink:${c.primary};

  --r-xl:${r.xl}px; --r-lg:${r.lg}px; --r-md:${r.md}px; --r-sm:${r.sm}px;
  --logo-h-sidebar:${brand.logo.height.sidebar}px;
  --logo-h-login:${brand.logo.height.login}px;
  --logo-h-mobile:${brand.logo.height.mobile}px;
  --logo-max:${brand.logo.maxWidth}px;
}
[data-theme="dark"]{
  --navy:${d.primary}; --ember:${d.accent};
  --navy-soft:${d.primarySoft}; --ember-soft:${d.accentSoft}; --ember-ink:${d.accentDeep};
  --navy-glow:${hexA(d.primary, 0.34)}; --ember-glow:${hexA(d.accent, 0.34)};
  --canvas:${d.canvas}; --canvas-2:${d.canvasAlt};
  --card:${d.card}; --card-2:${d.cardAlt};
  --ink:${d.ink}; --ink-2:${d.inkSoft}; --ink-3:${d.inkMuted}; --ink-4:${d.inkFaint};
  --hair:${d.hairline}; --hair-2:${d.hairlineAlt};
  --lav:${d.primarySoft}; --lav-ink:${d.primary};
  --sand:${d.accentSoft}; --sand-ink:${d.accentDeep};
}
.brand-logo{height:var(--logo-h-sidebar);max-width:var(--logo-max)}
.mobile-bar .mlogo{height:var(--logo-h-mobile)}
`;
  return <style id="brand-tokens" dangerouslySetInnerHTML={{ __html: css }} />;
}

/** #rrggbb + alpha → rgba() */
function hexA(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
