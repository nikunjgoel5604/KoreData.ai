import type { ReactNode } from "react";

interface PricingCardProps {
  plan: string;
  price: string;
  description: string;
  features: string[];
  className?: string;
}

export default function PricingCard({ plan, price, description, features, className = "" }: PricingCardProps) {
  return (
    <article
      className={`relative overflow-hidden border border-kore-border bg-kore-surface backdrop-blur-[16px] rounded-kore p-6 min-h-[420px] transition-all duration-[220ms] ease-out card-sweep cornered animate-cardReveal hover:-translate-y-2 hover:scale-[1.015] hover:border-kore-borderStrong hover:shadow-[0_0_28px_rgba(0,212,255,0.08)] ${className}`}
    >
      <h3 className="relative z-[1] mt-[18px] mb-2 font-mono text-sm tracking-[1.5px] uppercase text-kore-accent">
        {plan}
      </h3>
      <div className="my-[22px] text-kore-accent font-mono text-[42px] font-extrabold">
        {price}
      </div>
      <p className="relative z-[1] m-0 text-kore-muted leading-[1.7]">{description}</p>
      <ul className="p-0 mt-6 list-none grid gap-3 text-kore-muted">
        {features.map((feature) => (
          <li key={feature} className="before:content-['✓'] before:text-kore-accent2 before:mr-2.5">
            {feature}
          </li>
        ))}
      </ul>
    </article>
  );
}
