import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VideoBackground from "@/components/VideoBackground";

export const metadata: Metadata = {
  title: "KoreData | Transform Data into Intelligent Decisions",
  description:
    "KoreData is an AI-powered SaaS platform for data analytics, LLM assistants, RAG search, dashboards, forecasting, and business intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <div className="min-h-screen relative isolate overflow-x-hidden">
          <VideoBackground />
          {/* Overlay */}
          <div className="fixed inset-0 z-[1] pointer-events-none bg-[image:var(--overlay-bg)] transition-[background] duration-[350ms] ease-out" />
          {/* Grid */}
          <div
            className="fixed inset-0 z-[2] pointer-events-none animate-gridMove"
            style={{
              backgroundImage:
                "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "linear-gradient(to bottom, black, transparent 82%)",
            }}
          />
          {/* Display light */}
          <div
            className="fixed -inset-[10%] z-[2] pointer-events-none opacity-90 blur-[2px] animate-displayLight transition-[background,opacity] duration-[350ms] ease-out"
            style={{
              background: "var(--display-light)",
              mixBlendMode: "var(--display-light-blend)" as React.CSSProperties["mixBlendMode"],
            }}
          />
          <Navbar />
          <div className="relative z-[3]">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
