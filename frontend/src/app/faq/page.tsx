"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useState } from "react";
import PageHero from "@/components/ui/PageHero";
import CTASection from "@/components/ui/CTASection";
import Button from "@/components/ui/Button";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      { q: "What is KoreData and who is it for?", a: "KoreData is an enterprise AI data platform that combines automated data analysis, machine learning, LLM assistants, RAG search, dashboards, and data pipelines into one unified workspace. It's built for data-heavy teams across any industry who need to turn raw data into decisions faster — without requiring a full data science team." },
      { q: "Do I need to write code to use KoreData?", a: "No. KoreData is designed to be used without any coding. You can upload files, ask questions in plain English, build dashboards by clicking, and configure ML pipelines visually. That said, we also expose a full REST API and support Python SDK integrations for technical teams that want to go deeper." },
      { q: "How quickly can I get started?", a: "You can upload your first dataset and receive an AI analysis report in under 3 minutes. No setup, no infrastructure configuration, no onboarding call required. Sign up, connect your data, and KoreData does the rest." },
      { q: "What file formats does KoreData support?", a: "KoreData supports CSV, Excel (.xlsx, .xls), JSON, Parquet, and plain-text formats out of the box. For structured databases, we support Postgres, MySQL, BigQuery, Snowflake, and Redshift via native connectors. Custom REST API ingestion is available on Professional and Enterprise plans." }
    ]
  },
  {
    category: "AI & Analysis",
    questions: [
      { q: "How does the AI analysis work?", a: "When you upload a dataset, KoreData automatically profiles it: column types, null rates, distributions, cardinality, and outliers. It then runs correlation analysis, anomaly detection, and business-relevant pattern discovery. All findings are explained in plain English with confidence scores and visual evidence." },
      { q: "What is RAG search and how does it use my data?", a: "RAG stands for Retrieval-Augmented Generation. KoreData indexes your datasets, uploaded documents, and past reports into a semantic search layer. When you ask a question, the system retrieves the most relevant content from your actual data, then uses that context to generate an accurate, cited answer — rather than generating a response from general AI knowledge." },
      { q: "Can I train custom machine learning models?", a: "Yes. KoreData includes an AutoML pipeline that trains and evaluates multiple model types (regression, classification, time-series) on your data, selects the best performer, and explains the model's decision logic in plain English. You can also upload your own pre-trained models via the API on Enterprise plans." },
      { q: "How accurate are the AI forecasts?", a: "Forecast accuracy depends heavily on your data quality and historical volume. In our internal benchmarks on well-structured datasets, KoreData's AutoML forecasting achieves accuracy within 8–15% of specialized model implementations. Every forecast comes with a confidence interval and data quality impact explanation." },
      { q: "Does KoreData hallucinate or make up answers?", a: "We've designed the LLM and RAG system to minimize hallucination by always grounding responses in your actual data. Every answer includes source citations back to the specific dataset rows, document sections, or report segments used. When the system is uncertain, it says so." }
    ]
  },
  {
    category: "Security & Privacy",
    questions: [
      { q: "Where is my data stored and who can access it?", a: "Your data is stored in isolated, encrypted workspaces on SOC-ready cloud infrastructure. Only users you explicitly invite can access your workspace. KoreData staff do not access your data except in cases where you explicitly request support and grant temporary access." },
      { q: "Is KoreData GDPR compliant?", a: "Yes. KoreData is designed with privacy-by-default principles. You can export all your data at any time, request workspace deletion, and configure data retention policies. We offer DPA (Data Processing Agreements) to all customers on Professional and Enterprise plans." },
      { q: "Can I deploy KoreData on my own infrastructure?", a: "Enterprise customers can choose from cloud-hosted, private-cloud (VPC deployment), or on-premises deployment options. Contact our sales team to discuss your specific infrastructure and compliance requirements." },
      { q: "Does KoreData use my data to train its AI models?", a: "No. Your data is never used to train KoreData's AI models. Your workspace is fully isolated and your data is only used to generate insights within your own account." }
    ]
  },
  {
    category: "Pricing & Plans",
    questions: [
      { q: "What's included in the free trial?", a: "The free trial gives you full access to KoreData's core features for 14 days: unlimited dataset uploads (up to 100MB per file), AI analysis, LLM assistant, RAG search, dashboards, and report export. No credit card is required to start." },
      { q: "What happens after my trial ends?", a: "After the 14-day trial, you can choose a paid plan (Starter at $29/user/month or Professional at $99/user/month) or contact us for Enterprise pricing. Your data and settings are preserved for 30 days after trial expiry so you can continue without disruption." },
      { q: "Do you offer discounts for startups, nonprofits, or research institutions?", a: "Yes. We offer 50% discounts for qualifying nonprofits and academic research teams, and special startup pricing for companies under 2 years old with fewer than 20 employees. Contact us at hello@koredata.ai to apply." },
      { q: "Can I cancel anytime?", a: "Yes. All plans are month-to-month with no lock-in contracts. You can cancel at any time from your account settings. Annual plans are available at a 20% discount and are also cancellable with a pro-rated refund." }
    ]
  }
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`cornered border border-kore-border rounded-kore overflow-hidden transition-colors duration-200 ${open ? "bg-kore-surface" : "bg-kore-panel"}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-4 py-5 px-6 bg-transparent border-none text-left font-body text-[15px] font-medium leading-[1.5] transition-colors duration-200 cursor-pointer ${open ? "text-kore-accent" : "text-kore-text"}`}
        aria-expanded={open}
      >
        {q}
        {open
          ? <ChevronUp size={18} className="text-kore-accent flex-shrink-0" />
          : <ChevronDown size={18} className="text-kore-dim flex-shrink-0" />
        }
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="m-0 px-6 pb-[22px] text-kore-muted leading-[1.85] text-sm border-t border-kore-border">
              <span className="block pt-[18px]">{a}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...faqs.map(f => f.category)];

  const filtered = faqs
    .map(group => ({
      ...group,
      questions: group.questions.filter(
        ({ q, a }) =>
          (activeCategory === "All" || group.category === activeCategory) &&
          (search === "" || q.toLowerCase().includes(search.toLowerCase()) || a.toLowerCase().includes(search.toLowerCase()))
      )
    }))
    .filter(group => group.questions.length > 0);

  const totalShown = filtered.reduce((acc, g) => acc + g.questions.length, 0);

  return (
    <main className="min-h-screen pt-[calc(var(--nav-h)+70px)] px-5 pb-10">
      {/* Hero */}
      <PageHero
        eyebrow="FAQ"
        title={<>Frequently asked{" "}<span className="text-transparent bg-[linear-gradient(100deg,#ffffff,var(--accent),var(--accent-2))] bg-clip-text [-webkit-background-clip:text]">questions.</span></>}
        description={<p>Everything you need to know about KoreData — from getting started to enterprise deployment, security, and pricing. Can&apos;t find your answer?{" "}<Link href="/contact" className="text-kore-accent">Contact us directly.</Link></p>}
      />

      <section className="py-16 px-5" style={{ paddingTop: 24 }}>
        <div className="w-full max-w-[1240px] mx-auto">
          {/* Search + Filter */}
          <div className="grid grid-cols-[1fr_auto] gap-4 mb-9 items-center max-sm:grid-cols-1">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kore-dim" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search questions..."
                aria-label="Search FAQ"
                className="w-full border border-kore-border bg-kore-panel text-kore-text rounded-kore py-3 px-3.5 pl-[42px] outline-none font-[inherit]"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "primary" : "default"}
                  onClick={() => setActiveCategory(cat)}
                  className="min-h-[38px] px-3.5 text-[11px]"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-kore-dim font-mono text-xs tracking-[1px] mb-8">
            Showing {totalShown} question{totalShown !== 1 ? "s" : ""}
            {search ? ` for "${search}"` : ""}
            {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
          </p>

          {/* FAQ Groups */}
          {filtered.length === 0 ? (
            <div className="border border-kore-border bg-kore-surface rounded-kore text-center p-12">
              <p className="text-kore-muted">No questions found for that search. <Link href="/contact" className="text-kore-accent">Ask us directly →</Link></p>
            </div>
          ) : (
            filtered.map(({ category, questions }) => (
              <div key={category} className="mb-12">
                <div className="flex items-center gap-3 mb-5 pb-3.5 border-b border-kore-border">
                  <span className="text-kore-accent font-mono text-[11px] tracking-[2px] uppercase">
                    // {category}
                  </span>
                  <span className="text-kore-dim font-mono text-[11px]">
                    {questions.length} question{questions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {questions.map(({ q, a }) => (
                    <FAQItem key={q} q={q} a={a} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Still have questions?"
        description="Our team is happy to walk you through anything. Book a demo or send us a message and we'll respond within one business day."
        primaryText="Contact Support"
        primaryHref="/contact"
        secondaryText="Start Free Trial"
        secondaryHref="/register"
        className="mb-[60px]"
      />
    </main>
  );
}
