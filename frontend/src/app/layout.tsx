import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VideoBackground from "@/components/VideoBackground";

export const metadata: Metadata = {
  title: "KoreData | Transform Data into Intelligent Decisions",
  description:
    "KoreData is an AI-powered SaaS platform for data analytics, LLM assistants, RAG search, dashboards, forecasting, and business intelligence."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <div className="site-shell">
          <VideoBackground />
          <div className="ai-bg-overlay" />
          <div className="bg-grid" />
          <div className="display-light" />
          <Navbar />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
