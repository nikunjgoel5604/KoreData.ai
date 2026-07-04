"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Eyebrow from "./Eyebrow";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  description: string | ReactNode;
  children?: ReactNode;
}

export default function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="w-full max-w-[1240px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="max-w-[850px] mt-[18px] mb-0 font-display text-[clamp(44px,6vw,78px)] leading-[0.98] tracking-[-0.04em]">
          {title}
        </h1>
        <div className="max-w-[740px] mt-4 text-kore-muted font-mono leading-[1.8]">
          {typeof description === "string" ? <p>{description}</p> : description}
        </div>
        {children}
      </motion.div>
    </section>
  );
}
