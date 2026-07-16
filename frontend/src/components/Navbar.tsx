"use client";

import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { navLinks } from "@/constants/site";

type Theme = "dark" | "light";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("koredata-theme") as Theme | null;
    const nextTheme = savedTheme === "light" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("koredata-theme", nextTheme);
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="logo" aria-label="KoreData home">
          <span className="logo-mark">KD</span>
          <span>Kore<span>Data</span></span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          {navLinks.map(([label, href]) => (
            <Link className="nav-link" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Link className="btn" href="/login">Login</Link>
          <Link className="btn btn-primary" href="/register">Get Started</Link>
        </div>

        <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <nav className="mobile-panel" aria-label="Mobile navigation">
          {navLinks.map(([label, href]) => (
            <Link href={href} key={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
          <Link href="/register" onClick={() => setOpen(false)}>Get Started</Link>
          <button className="mobile-theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </nav>
      )}
    </header>
  );
}
