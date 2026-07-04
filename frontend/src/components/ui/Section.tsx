import type { ReactNode } from "react";

interface SectionProps {
  kicker: string;
  title: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function Section({ kicker, title, children, className = "", style }: SectionProps) {
  return (
    <section className={`py-16 px-5 ${className}`} style={style}>
      <div className="w-full max-w-[1240px] mx-auto">
        <div className="text-kore-accent font-mono text-xs tracking-[3px] uppercase">
          // {kicker}
        </div>
        <h2 className="max-w-[760px] mt-3.5 mb-[38px] font-display text-[clamp(34px,4vw,58px)] leading-none tracking-[-0.04em]">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
