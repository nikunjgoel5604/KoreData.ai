import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ButtonProps {
  variant?: "default" | "primary";
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export default function Button({
  variant = "default",
  href,
  onClick,
  type = "button",
  children,
  className = "",
  style,
  ariaLabel,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2.5 min-h-[42px] px-[18px] border border-kore-border bg-transparent text-kore-text rounded-md font-mono text-xs tracking-[1.4px] uppercase transition-all duration-200 hover:border-kore-accent hover:text-kore-accent hover:shadow-[0_0_18px_rgba(0,212,255,0.18)]";

  const primary =
    "border-kore-accent text-kore-accent bg-[rgba(0,212,255,0.08)]";

  const classes = `${base} ${variant === "primary" ? primary : ""} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes} style={style} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} onClick={onClick} type={type} style={style} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
