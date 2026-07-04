import type { ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

export default function Eyebrow({ children, className = "" }: EyebrowProps) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 w-fit px-3.5 py-[7px] border border-kore-border bg-[rgba(0,212,255,0.065)] rounded-full text-kore-accent font-mono text-xs tracking-[1.8px] uppercase ${className}`}
    >
      <span className="w-[7px] h-[7px] bg-kore-accent2 rounded-full shadow-[0_0_16px_rgba(0,255,136,0.8)] animate-pulse" />
      {children}
    </div>
  );
}
