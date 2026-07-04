import type { ReactNode } from "react";
import Button from "./Button";
import { ArrowRight } from "lucide-react";

interface CTASectionProps {
  title: string;
  description: string;
  primaryText?: string;
  primaryHref?: string;
  secondaryText?: string;
  secondaryHref?: string;
  children?: ReactNode;
  className?: string;
}

export default function CTASection({
  title,
  description,
  primaryText = "Get Started",
  primaryHref = "/register",
  secondaryText,
  secondaryHref,
  children,
  className = "",
}: CTASectionProps) {
  return (
    <section
      className={`cornered mx-auto mt-[30px] w-full max-w-[1240px] border border-kore-borderStrong rounded-[14px] bg-[radial-gradient(circle_at_50%_0%,rgba(0,212,255,0.16),transparent_28rem),rgba(0,18,36,0.74)] p-14 text-center max-sm:p-[34px_22px] ${className}`}
    >
      <h2 className="m-0 font-display text-[clamp(34px,5vw,58px)] tracking-[-0.04em]">
        {title}
      </h2>
      <p className="max-w-[680px] mx-auto mt-[18px] mb-7 text-kore-muted">{description}</p>
      {children || (
        <div className="flex gap-3.5 justify-center flex-wrap">
          <Button variant="primary" href={primaryHref}>
            {primaryText} <ArrowRight size={16} />
          </Button>
          {secondaryText && secondaryHref && (
            <Button href={secondaryHref}>{secondaryText}</Button>
          )}
        </div>
      )}
    </section>
  );
}
