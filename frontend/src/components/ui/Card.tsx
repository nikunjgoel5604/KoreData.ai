"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

interface CardProps {
  children: ReactNode;
  cornered?: boolean;
  hover?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function Card({ children, cornered = false, hover = false, className = "", style }: CardProps) {
  const Wrapper = hover ? motion.article : "article";
  const hoverProps = hover ? { whileHover: { y: -6 } } : {};

  return (
    <Wrapper
      className={`relative overflow-hidden border border-kore-border bg-kore-surface backdrop-blur-[16px] rounded-kore p-6 transition-all duration-[220ms] ease-out card-sweep animate-cardReveal ${cornered ? "cornered" : ""} hover:-translate-y-2 hover:scale-[1.015] hover:border-kore-borderStrong hover:shadow-[0_0_28px_rgba(0,212,255,0.08)] ${className}`}
      style={style}
      {...hoverProps}
    >
      {children}
    </Wrapper>
  );
}

interface CardIconProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CardIcon({ children, className = "", style }: CardIconProps) {
  return (
    <div
      className={`relative z-[1] w-[42px] h-[42px] grid place-items-center border border-kore-border rounded-lg text-kore-accent bg-[rgba(0,212,255,0.06)] transition-all duration-[280ms] ease-out ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
