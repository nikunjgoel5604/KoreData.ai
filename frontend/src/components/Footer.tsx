import Link from "next/link";
import { footerGroups } from "@/constants/site";

export default function Footer() {
  return (
    <footer className="relative z-[3] mt-24 border-t border-kore-border py-12 px-5">
      <div className="w-full max-w-[1240px] mx-auto grid grid-cols-[1.5fr_2fr] gap-[42px] max-md:grid-cols-1">
        <div>
          <Link href="/" className="flex items-center gap-2.5 font-display font-extrabold tracking-[2px] uppercase">
            <span className="w-[38px] h-[38px] grid place-items-center border border-kore-accent rounded-md text-kore-accent font-mono shadow-[0_0_18px_rgba(0,212,255,0.25),inset_0_0_14px_rgba(0,212,255,0.06)]">
              KD
            </span>
            <span>
              Kore<span className="text-kore-accent">Data</span>
            </span>
          </Link>
          <p className="max-w-[440px] mt-4 text-kore-muted">
            Transform raw data into intelligent business decisions using AI, machine learning,
            LLM assistants, RAG search, and modern analytics workflows.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[22px] max-sm:grid-cols-1">
          {footerGroups.map(([title, links]) => (
            <div key={title as string}>
              <h4 className="text-kore-accent font-mono text-xs tracking-[2px] uppercase">
                {title as string}
              </h4>
              {(links as string[][]).map(([label, href]) => (
                <Link
                  href={href}
                  key={href}
                  className="block mt-2.5 text-kore-dim font-mono text-xs hover:text-kore-accent transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
