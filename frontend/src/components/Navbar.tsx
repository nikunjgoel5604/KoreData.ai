"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { navLinks } from "@/constants/site";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <Link href="/" className="brand" aria-label="KoreData home">
        <span>KD</span>
        <strong>KoreData</strong>
      </Link>

      <nav className="nav-links" aria-label="Primary navigation">
        {navLinks.map(([label, href]) => (
          <Link href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>

      <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <nav className="mobile-menu" aria-label="Mobile navigation">
          {navLinks.map(([label, href]) => (
            <Link href={href} key={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
