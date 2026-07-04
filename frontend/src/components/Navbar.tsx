"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { navLinks } from "@/constants/site";
import Button from "./ui/Button";

type Theme = "dark" | "light";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("koredata-theme") as Theme | null;
    const nextTheme = savedTheme === "light" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("koredata-theme", nextTheme);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className="fixed inset-x-0 top-0 h-navH z-50 bg-kore-navBg backdrop-blur-[18px] border-b border-kore-border transition-[background,border-color] duration-[350ms] ease-out nav-scan"
      data-scrolled={scrolled ? "true" : undefined}
    >
      <div className="w-[min(1240px,calc(100%-32px))] h-full mx-auto flex items-center gap-7">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-display font-extrabold tracking-[2px] uppercase" aria-label="KoreData home">
          <span className="w-[38px] h-[38px] grid place-items-center border border-kore-accent rounded-md text-kore-accent font-mono shadow-[0_0_18px_rgba(0,212,255,0.25),inset_0_0_14px_rgba(0,212,255,0.06)]">
            KD
          </span>
          <span>
            Kore<span className="text-kore-accent">Data</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="flex-1 flex justify-center gap-1.5 max-md:hidden" aria-label="Primary navigation">
          {navLinks.map(([label, href]) => (
            <Link
              className={`px-3 py-2 rounded-md font-mono text-xs tracking-[1.5px] uppercase transition-all duration-200 border border-transparent ${
                isActive(href)
                  ? "text-kore-accent bg-[rgba(0,212,255,0.08)] border-[rgba(0,212,255,0.22)]"
                  : "text-kore-dim hover:text-kore-accent hover:bg-[rgba(0,212,255,0.08)] hover:border-[rgba(0,212,255,0.22)]"
              }`}
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="flex items-center gap-2.5 max-md:hidden">
          <Button href="/login">Login</Button>
          <Button variant="primary" href="/register">Get Started</Button>
        </div>

        {/* Theme Toggle */}
        <button
          className="w-[42px] h-[42px] grid place-items-center border border-kore-border rounded-md bg-kore-panelSoft text-kore-text transition-all duration-200 hover:border-kore-accent hover:text-kore-accent hover:shadow-[0_0_18px_rgba(0,212,255,0.18)] max-md:ml-auto"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={theme === "dark" ? "Light Mode" : "Dark Mode"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Mobile Hamburger */}
        <button
          className="w-[42px] h-[42px] hidden max-md:grid place-items-center border border-kore-border rounded-md bg-transparent text-kore-text transition-all duration-200 hover:border-kore-accent hover:text-kore-accent"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Panel */}
      {open && (
        <nav
          className="grid gap-2 p-4 border-t border-kore-border bg-kore-panelStrong md:hidden"
          aria-label="Mobile navigation"
        >
          {navLinks.map(([label, href]) => (
            <Link
              href={href}
              key={href}
              onClick={() => setOpen(false)}
              className={`p-3 font-mono uppercase tracking-[1.2px] ${
                isActive(href) ? "text-kore-accent" : "text-kore-muted"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="h-px bg-kore-border my-1" />
          <Link href="/login" onClick={() => setOpen(false)} className="p-3 font-mono uppercase tracking-[1.2px] text-kore-muted">
            Login
          </Link>
          <Link href="/register" onClick={() => setOpen(false)} className="p-3 font-mono uppercase tracking-[1.2px] text-kore-muted">
            Get Started
          </Link>
          <button
            className="border border-kore-border rounded-md bg-kore-panelSoft text-kore-accent p-3 font-mono tracking-[1.2px] text-left uppercase"
            onClick={toggleTheme}
          >
            {theme === "dark" ? "☀ Light Mode" : "☾ Dark Mode"}
          </button>
        </nav>
      )}
    </header>
  );
}
