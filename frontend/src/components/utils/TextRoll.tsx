import React from "react";

interface TextRollProps {
  text: string;
  className?: string;
}

/**
 * TextRoll component: On hover over this element or parent .group, 
 * default text slides up out of view and duplicate text slides up from bottom.
 */
export default function TextRoll({ text, className = "" }: TextRollProps) {
  return (
    <span className={`group relative inline-block overflow-hidden leading-tight align-bottom ${className}`}>
      <span className="block transition-transform duration-500 ease-out group-hover:-translate-y-full pointer-events-none">
        {text}
      </span>
      <span className="block absolute inset-0 transition-transform duration-500 ease-out translate-y-full group-hover:translate-y-0 pointer-events-none">
        {text}
      </span>
    </span>
  );
}
