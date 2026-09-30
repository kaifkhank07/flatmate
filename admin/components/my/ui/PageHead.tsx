import { ReactNode } from "react";

export interface PageHeadProps {
  eyebrow?: string;
  title: string;
  sub?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHead({
  eyebrow,
  title,
  sub,
  actions,
  className = "",
}: PageHeadProps) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 mb-4.5 sm:mb-[18px] ${className}`}>
      <div>
        {eyebrow && (
          <div className="flex items-center gap-[9px] text-[10.5px] font-extrabold text-[var(--ember)] mb-[9px] tracking-[0.11em] uppercase before:content-[''] before:w-[18px] before:h-[2px] before:rounded-full before:bg-[var(--ember)]">
            {eyebrow}
          </div>
        )}
        <h1
          className="text-[clamp(25px,2.5vw,33px)] font-extrabold tracking-[-0.042em] leading-[1.06] text-[var(--ink)]"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {sub && (
          <p className="text-[13.5px] text-[var(--ink-3)] mt-[9px] max-w-[56ch] leading-[1.6]">
            {sub}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-[9px] items-center">{actions}</div>}
    </div>
  );
}

export default PageHead;
