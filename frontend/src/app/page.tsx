"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Check, Play, ShieldCheck, Sparkles, Zap } from "lucide-react";
import HeroScene from "@/components/HeroScene";
import { features, solutions, trust, workflow } from "@/constants/site";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import TrustRow from "@/components/ui/TrustRow";
import Card, { CardIcon } from "@/components/ui/Card";
import PricingCard from "@/components/ui/PricingCard";
import CTASection from "@/components/ui/CTASection";

const consoleLines = [
  "ingest /sales_q2.csv -> 128,430 rows indexed",
  "profile quality: 99.8% valid fields",
  "detect anomalies: 14 revenue outliers found",
  "forecast: +31% pipeline lift predicted",
  "rag answer ready: explain churn drivers"
];

const demoTabs = [
  ["Analyze", "Auto-profile datasets, find missing values, correlations, outliers, and business-ready recommendations."],
  ["Visualize", "Generate KPI boards, trend charts, segment views, and executive dashboards from raw files."],
  ["Forecast", "Model future demand, revenue, churn, inventory, and operational risk with explainable confidence."],
  ["Ask AI", "Chat with your company data, reports, documents, and knowledge base using secure RAG workflows."]
];

const engineBlocks = [
  ["01", "Data Foundation", "Connect files, warehouses, APIs, and business documents into one governed workspace."],
  ["02", "AI Reasoning", "Run EDA, ML, LLM, RAG, and forecasting systems over trusted context."],
  ["03", "Action Layer", "Publish dashboards, reports, alerts, exports, and API responses for every team."]
];

const securitySignals = [
  "Role-based access",
  "Audit-ready activity logs",
  "Private workspace isolation",
  "Encrypted data workflows"
];

export default function HomePage() {
  return (
    <main>
      {/* ─── HERO ─── */}
      <section className="relative min-h-[115vh] pt-[calc(var(--nav-h)+0px)] px-5 pb-[260px] overflow-visible max-md:min-h-auto max-md:pb-[120px] max-sm:pt-[calc(var(--nav-h)+40px)]">
        <div className="w-[min(1320px,calc(100%-40px))] mx-auto grid grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)] items-center gap-11 max-md:grid-cols-1">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Eyebrow>Enterprise AI Data Platform</Eyebrow>
            <h1 className="max-w-[780px] mt-6 font-display text-[clamp(48px,7vw,92px)] leading-[0.96] tracking-[-0.04em] max-sm:text-[46px]">
              The AI command center for{" "}
              <span className="text-transparent bg-[linear-gradient(100deg,#ffffff,var(--accent),var(--accent-2))] bg-clip-text [-webkit-background-clip:text] [text-shadow:0_0_40px_rgba(0,212,255,0.08)]">
                data intelligence
              </span>
            </h1>
            <p className="max-w-[720px] mt-[26px] text-kore-muted font-mono text-[15px] leading-[1.8]">
              KoreData turns raw files, dashboards, business documents, and operational signals into
              analysis, predictions, RAG answers, and executive-ready decisions.
            </p>

            <div className="flex flex-wrap gap-3.5 mt-[34px]">
              <Button variant="primary" href="/register">Get Started <ArrowRight size={16} /></Button>
              <Button href="/contact"><Calendar size={16} /> Book Demo</Button>
              <Button><Play size={16} /> Watch Demo</Button>
            </div>

            <TrustRow items={trust as [string, string][]} />

            {/* Console */}
            <div className="cornered mt-6 max-w-[720px] border border-kore-border rounded-kore bg-kore-panel p-4 shadow-[inset_0_0_22px_rgba(0,212,255,0.04)]">
              <div className="flex items-center justify-between text-kore-dim font-mono text-[11px] tracking-[1.3px] uppercase">
                <span>Live Intelligence Run</span>
                <span>00:18</span>
              </div>
              {consoleLines.map((line, i) => (
                <div className="grid grid-cols-[34px_1fr] gap-2.5 mt-2.5 text-kore-muted font-mono text-xs" key={line}>
                  <span className="text-kore-accent opacity-65">{String(i + 1).padStart(2, "0")}</span>
                  <code className="whitespace-normal">{line}</code>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            className="relative min-h-[900px] isolate max-md:min-h-[620px] max-sm:min-h-[560px]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9 }}
          >
            {/* Orb glow */}
            <div
              className="absolute z-0 rounded-full blur-[24px] animate-orbGlow"
              style={{
                inset: "20px 20px 210px",
                background:
                  "radial-gradient(circle, rgba(0,212,255,0.08), transparent 100%), radial-gradient(circle, rgba(124,58,237,0.07), transparent 100%)",
              }}
            />
            <HeroScene />

            {/* Dashboard Preview */}
            <div
              className="cornered fixed z-[3] border border-kore-borderStrong bg-kore-panel backdrop-blur-[22px] rounded-xl p-[18px] shadow-[0_30px_80px_rgba(0,0,0,0.45),0_0_42px_rgba(0,212,255,0.12)] max-md:left-0 max-md:right-0 max-md:bottom-[-80px] max-sm:left-0 max-sm:right-0 max-sm:bottom-[-60px]"
              style={{ left: 60, right: -20, bottom: -550 }}
            >
              {/* Dashboard light glow */}
              <div
                className="absolute -inset-px z-[-1] rounded-[inherit] blur-[18px] opacity-95 animate-dashboardPulse"
                style={{ background: "var(--dashboard-light)" }}
              />

              <div className="flex items-center justify-between text-kore-dim font-mono text-xs tracking-[1.4px] uppercase mb-4">
                <span>KoreData Intelligence Console</span>
                <span>Live</span>
              </div>

              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                {[
                  ["EDA Accuracy", "94.2%"],
                  ["Forecast Lift", "31%"],
                  ["Rows Analyzed", "128K"],
                  ["Missing Data", "0.2%"],
                ].map(([label, value]) => (
                  <div className="bg-kore-panelSoft border border-kore-border rounded-lg p-4" key={label}>
                    <small className="block text-kore-dim font-mono text-[11px] tracking-[1px] uppercase">{label}</small>
                    <strong className="block mt-2 text-kore-accent font-mono text-[28px]">{value}</strong>
                  </div>
                ))}

                {/* Chart */}
                <div className="col-span-full h-[170px] border border-kore-border rounded-lg p-4 flex items-end gap-2.5 bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(0,212,255,0.04))]">
                  {[44, 66, 52, 86, 72, 95, 78, 100, 83].map((h, i) => (
                    <div className="flex-1 rounded-t-[5px] bar-gradient" style={{ height: `${h}%` }} key={i} />
                  ))}
                </div>

                {/* Insight */}
                <div className="col-span-full border border-[rgba(0,255,136,0.24)] rounded-lg bg-[rgba(0,255,136,0.045)] p-4">
                  <div className="flex items-center gap-2 text-kore-accent2 font-mono text-xs tracking-[1.3px] uppercase">
                    <Sparkles size={16} />
                    <span>AI Insight</span>
                  </div>
                  <p className="mt-2.5 text-kore-text leading-[1.55]">
                    Enterprise accounts with delayed onboarding show 2.4x higher churn risk.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── PRODUCT DEMO ─── */}
      <Section kicker="Product Demo" title="A complete AI workflow, compressed into one control surface.">
        <div className="cornered grid grid-cols-[260px_1fr] gap-4 border border-kore-borderStrong rounded-xl bg-kore-panel p-4 backdrop-blur-[18px] max-md:grid-cols-1">
          {/* Sidebar */}
          <div className="grid gap-2.5 content-start">
            {demoTabs.map(([label], i) => (
              <button
                className={`min-h-[58px] flex items-center gap-3 px-3.5 border rounded-lg font-mono tracking-[1.2px] uppercase ${
                  i === 0
                    ? "border-kore-accent text-kore-accent bg-[rgba(0,212,255,0.08)]"
                    : "border-kore-border text-kore-muted bg-kore-panelSoft hover:border-kore-accent hover:text-kore-accent"
                }`}
                key={label}
              >
                <span className="text-kore-accent">{String(i + 1).padStart(2, "0")}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Main */}
          <div
            className="border border-kore-border rounded-lg p-4"
            style={{
              background:
                "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px), var(--panel-soft)",
              backgroundSize: "34px 34px",
            }}
          >
            <div className="flex items-center justify-between text-kore-dim font-mono text-[11px] tracking-[1.3px] uppercase">
              <span>koredata://workspace/revenue-intel</span>
              <span>Synced</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 mt-4 max-md:grid-cols-2 max-sm:grid-cols-1">
              {demoTabs.map(([label, desc]) => (
                <article className="border border-kore-border rounded-kore bg-kore-panel p-5" key={label}>
                  <div className="w-9 h-9 grid place-items-center text-kore-accent2 border border-[rgba(0,255,136,0.25)] rounded-lg bg-[rgba(0,255,136,0.05)]">
                    <Zap size={17} />
                  </div>
                  <h3 className="mt-4 mb-2 text-kore-accent font-mono text-sm tracking-[1.4px] uppercase">{label}</h3>
                  <p className="m-0 text-kore-muted leading-[1.7]">{desc}</p>
                </article>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 border border-[rgba(0,255,136,0.22)] rounded-lg bg-[rgba(0,255,136,0.045)] p-3.5 max-sm:flex-col max-sm:items-stretch">
              <code className="text-kore-text font-mono">
                Ask KoreData: Which customer segments are most likely to expand next quarter?
              </code>
              <Button variant="primary" href="/register">Run Demo <ArrowRight size={16} /></Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── CAPABILITIES ─── */}
      <Section kicker="Capabilities" title="Everything your data team needs, redesigned for AI.">
        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
          {features.map(([title, Icon, desc]) => (
            <Card cornered hover key={title as string}>
              <CardIcon><Icon size={21} /></CardIcon>
              <h3 className="relative z-[1] mt-[18px] mb-2 font-mono text-sm tracking-[1.5px] uppercase text-kore-accent">
                {title as string}
              </h3>
              <p className="relative z-[1] m-0 text-kore-muted leading-[1.7]">{desc as string}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ─── INTELLIGENCE ENGINE ─── */}
      <Section kicker="Intelligence Engine" title="One system for data, reasoning, and action.">
        <div className="grid grid-cols-3 gap-3.5 max-md:grid-cols-2 max-sm:grid-cols-1">
          {engineBlocks.map(([num, title, desc]) => (
            <article className="cornered border border-kore-border rounded-kore bg-kore-panel p-5" key={title}>
              <span className="text-[rgba(0,212,255,0.28)] font-mono text-[42px] font-extrabold">{num}</span>
              <h3 className="mt-4 mb-2 text-kore-accent font-mono text-sm tracking-[1.4px] uppercase">{title}</h3>
              <p className="m-0 text-kore-muted leading-[1.7]">{desc}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ─── WORKFLOW ─── */}
      <Section kicker="Workflow" title="From raw file to executive-ready intelligence.">
        <div className="grid grid-cols-5 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
          {workflow.map((step, i) => (
            <div className="cornered min-h-[116px] border border-kore-border bg-[rgba(0,212,255,0.035)] rounded-kore p-[18px]" key={step}>
              <span className="text-[rgba(0,212,255,0.28)] font-mono text-[26px] font-extrabold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <strong className="block mt-3.5 font-mono text-kore-text">{step}</strong>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── SECURITY ─── */}
      <Section kicker="Security" title="Built for serious teams that cannot guess with their data.">
        <div className="cornered grid grid-cols-2 gap-6 items-center border border-kore-borderStrong rounded-xl p-7 max-md:grid-cols-1" style={{ background: "radial-gradient(circle at 20% 0%, rgba(0,255,136,0.1), transparent 24rem), var(--panel-bg)" }}>
          <div>
            <CardIcon><ShieldCheck size={21} /></CardIcon>
            <h3 className="mt-4 mb-2 text-kore-accent font-mono text-sm tracking-[1.4px] uppercase">
              Enterprise control without slowing the team down.
            </h3>
            <p className="m-0 text-kore-muted leading-[1.7]">
              Keep analytics, LLM responses, search, and reporting inside governed workflows
              with clear access, traceability, and deployment flexibility.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
            {securitySignals.map((item) => (
              <div
                className="flex items-center gap-2.5 min-h-[58px] border border-kore-border rounded-lg bg-kore-panelSoft px-3.5 text-kore-text font-mono text-xs tracking-[1.1px] uppercase"
                key={item}
              >
                <Check size={17} className="text-kore-accent2 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── SOLUTIONS ─── */}
      <Section kicker="Solutions" title="Built for data-heavy teams across industries.">
        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
          {solutions.map((solution) => (
            <Card key={solution}>
              <h3 className="relative z-[1] mt-[18px] mb-2 font-mono text-sm tracking-[1.5px] uppercase text-kore-accent">
                {solution}
              </h3>
              <p className="relative z-[1] m-0 text-kore-muted leading-[1.7]">
                Deploy AI analytics, forecasting, dashboards, and secure data workflows for {solution.toLowerCase()} teams.
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ─── PRICING ─── */}
      <Section kicker="Pricing" title="Simple plans for startups, teams, and enterprises.">
        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
          {[
            { plan: "Starter", price: "$29", desc: "Per user / month.", features: ["AI analytics workspace", "LLM assistant", "RAG search", "Automated reports", "Community support"] },
            { plan: "Professional", price: "$99", desc: "Per user / month.", features: ["AI analytics workspace", "LLM assistant", "RAG search", "Automated reports", "Priority support"] },
            { plan: "Enterprise", price: "Custom", desc: "For scaled enterprise deployment.", features: ["AI analytics workspace", "LLM assistant", "RAG search", "Automated reports", "Priority support"] },
          ].map((item) => (
            <PricingCard key={item.plan} {...item} />
          ))}
        </div>
      </Section>

      {/* ─── CTA ─── */}
      <CTASection
        title="Ready to analyze your data with AI?"
        description="Turn datasets, dashboards, reports, and business knowledge into fast, reliable decisions."
        primaryText="Create Free Account"
        primaryHref="/register"
      />
    </main>
  );
}
