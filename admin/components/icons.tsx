import type { ReactNode } from "react";

const s = { stroke: "currentColor", strokeWidth: 2, fill: "none" } as const;

/** Every icon used by the panel, keyed by name. Add yours here. */
export const icons: Record<string, ReactNode> = {
  grid: (<><rect x="3" y="3" width="8" height="8" rx="2.5" {...s} /><rect x="13" y="3" width="8" height="8" rx="2.5" {...s} /><rect x="3" y="13" width="8" height="8" rx="2.5" {...s} /><rect x="13" y="13" width="8" height="8" rx="2.5" {...s} /></>),
  chart: <path d="M4 19V10M10 19V5M16 19v-7M21 19H3" {...s} strokeLinecap="round" />,
  flow: (<><rect x="3" y="4" width="7" height="7" rx="2" {...s} /><rect x="14" y="13" width="7" height="7" rx="2" {...s} /><path d="M10 7.5h5a2 2 0 012 2V13" {...s} /></>),
  users: (<><circle cx="9" cy="8" r="3.4" {...s} /><path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M16 5.5a3.4 3.4 0 010 5M18.5 19c-.4-1.8-1.3-3.1-2.6-3.9" {...s} strokeLinecap="round" /></>),
  card: (<><rect x="3" y="5" width="18" height="14" rx="3" {...s} /><path d="M3 10h18M7 15h4" {...s} strokeLinecap="round" /></>),
  mega: (<><path d="M4 10v4a1 1 0 001 1h2l5 4V5L7 9H5a1 1 0 00-1 1z" {...s} strokeLinejoin="round" /><path d="M16 9a4 4 0 010 6" {...s} strokeLinecap="round" /></>),
  chat: <path d="M21 12a8 8 0 01-11.6 7.1L4 21l1.9-5.4A8 8 0 1121 12z" {...s} strokeLinejoin="round" />,
  cal: (<><rect x="3" y="5" width="18" height="16" rx="4" {...s} /><path d="M3 10h18M8 3v4M16 3v4" {...s} strokeLinecap="round" /></>),
  cog: (<><circle cx="12" cy="12" r="3.2" {...s} /><path d="M12 2.8v3M12 18.2v3M21.2 12h-3M5.8 12h-3M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1M18.5 18.5l-2.1-2.1M7.6 7.6L5.5 5.5" {...s} strokeLinecap="round" /></>),
  search: (<><circle cx="11" cy="11" r="6.5" {...s} /><path d="M20 20l-3.3-3.3" {...s} strokeLinecap="round" /></>),
  bell: (<><path d="M12 3a3 3 0 013 3v.4A6 6 0 0118.5 12v3l1.7 2.4a1 1 0 01-.8 1.6H4.6a1 1 0 01-.8-1.6L5.5 15v-3A6 6 0 019 6.4V6a3 3 0 013-3z" {...s} strokeLinejoin="round" /><path d="M10 21h4" {...s} strokeLinecap="round" /></>),
  head: (<><path d="M4 14v-2a8 8 0 0116 0v2" {...s} strokeLinecap="round" /><rect x="2.5" y="13" width="4.5" height="7" rx="2.2" {...s} /><rect x="17" y="13" width="4.5" height="7" rx="2.2" {...s} /></>),
  phone: <path d="M5 4h4l2 5-2.5 1.5a12 12 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" {...s} strokeLinejoin="round" />,
  mail: (<><rect x="3" y="5" width="18" height="14" rx="3" {...s} /><path d="M4 7l8 6 8-6" {...s} strokeLinejoin="round" /></>),
  pin: (<><path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" {...s} strokeLinejoin="round" /><circle cx="12" cy="10" r="2.4" {...s} /></>),
  expand: <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" {...s} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  pen: <path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z" {...s} strokeLinejoin="round" />,
  info: (<><circle cx="12" cy="12" r="9" {...s} /><path d="M12 11v5M12 8h.01" {...s} strokeLinecap="round" /></>),
  arrow: <path d="M9 6l6 6-6 6" {...s} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />,
  send: <path d="M4 12l16-8-6 16-2.5-6L4 12z" {...s} strokeLinejoin="round" />,
  chev: <path d="M6 9l6 6 6-6" {...s} strokeWidth="2.5" strokeLinecap="round" />,
  chevLeft: <path d="M14 6l-6 6 6 6" {...s} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />,
  x: <path d="M6 6l12 12M18 6L6 18" {...s} strokeWidth="2.3" strokeLinecap="round" />,
  dots: (<><circle cx="12" cy="5" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="19" r="1.6" fill="currentColor" /></>),
  menu: <path d="M4 7h16M4 12h16M4 17h16" {...s} strokeLinecap="round" />,
  plus: <path d="M12 5v14M5 12h14" {...s} strokeWidth="2.4" strokeLinecap="round" />,
  check: <path d="M5 13l4 4L19 7" {...s} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />,
  refresh: <path d="M20 12a8 8 0 11-2.3-5.6M20 4v4h-4" {...s} strokeLinecap="round" strokeLinejoin="round" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" {...s} strokeLinecap="round" />,
  building2: (<><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18M6 18h12M10 6h4M10 10h4M10 14h4" {...s} strokeLinecap="round" strokeLinejoin="round" /></>),
  sun: (<><circle cx="12" cy="12" r="4.2" {...s} /><path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.7 5.3l-1.7 1.7M7 17l-1.7 1.7M18.7 18.7L17 17M7 7L5.3 5.3" {...s} strokeLinecap="round" /></>),
  upload: <path d="M12 16V4M12 4L7 9M12 4l5 5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" {...s} strokeLinecap="round" strokeLinejoin="round" />,
  home: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" {...s} strokeLinejoin="round" />,
  flag: (<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12zM4 22v-7" {...s} strokeLinecap="round" strokeLinejoin="round" /></>),
  star: (<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" {...s} strokeLinejoin="round" /></>),
  fileText: (<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" {...s} strokeLinejoin="round" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" {...s} strokeLinecap="round" /></>),
};

export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {icons[name] ?? icons.grid}
    </svg>
  );
}
export default Icon;
