"use client";

import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Bot, FileSearch, WandSparkles, ChartNoAxesCombined, ServerCog, Activity, ShieldCheck, Workflow, Check, Zap } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Section from "@/components/ui/Section";
import { CardIcon } from "@/components/ui/Card";
import CTASection from "@/components/ui/CTASection";
import TrustRow from "@/components/ui/TrustRow";
import Button from "@/components/ui/Button";

const services = [
  { icon: BrainCircuit, title: "AI Data Analysis", tag: "EDA + ML", desc: "Automated exploratory data analysis, anomaly detection, correlation mapping, and smart business recommendations. No code required.", features: ["Auto-profiling & quality scoring", "Anomaly & outlier detection", "Correlation heatmaps", "Smart data recommendations"], color: "#00d4ff" },
  { icon: Bot, title: "LLM Assistant", tag: "Conversational AI", desc: "Ask natural-language questions and receive clear, context-aware answers drawn from your actual data, reports, and business knowledge.", features: ["Natural language queries", "Context-aware responses", "Multi-turn conversations", "Business knowledge integration"], color: "#00ff88" },
  { icon: FileSearch, title: "RAG Search", tag: "Retrieval AI", desc: "Semantic search across datasets, documents, dashboards, and business knowledge bases with retrieval-augmented generation workflows.", features: ["Semantic document search", "Cross-dataset retrieval", "Knowledge base indexing", "Verified source citations"], color: "#7c3aed" },
  { icon: WandSparkles, title: "Machine Learning", tag: "No-code ML", desc: "Train, evaluate, and deploy predictive models for demand forecasting, churn prediction, revenue modeling, and operational risk — all without writing code.", features: ["AutoML pipelines", "Forecast & classification", "Model explainability", "Confidence scoring"], color: "#00d4ff" },
  { icon: ChartNoAxesCombined, title: "Interactive Dashboards", tag: "Visualization", desc: "Beautiful, live KPI cards, trend charts, segment breakdowns, heatmaps, and executive-ready reporting views built from your raw data.", features: ["Live KPI monitoring", "Executive dashboards", "Drill-down charts", "Custom report builder"], color: "#00ff88" },
  { icon: ServerCog, title: "Cloud API Platform", tag: "API + Integration", desc: "Expose KoreData intelligence as REST APIs. Integrate analytics, forecasts, semantic search, and automated insights directly into your own applications.", features: ["REST API endpoints", "Webhook automation", "OAuth2 authentication", "Enterprise rate controls"], color: "#7c3aed" },
  { icon: Activity, title: "Real-time Intelligence", tag: "Live Monitoring", desc: "Monitor operational metrics, data quality changes, model drift, and pipeline health in real time with alerting and instant notifications.", features: ["Live stream processing", "Data drift alerts", "Quality monitoring", "Custom alert rules"], color: "#00d4ff" },
  { icon: ShieldCheck, title: "Enterprise Security", tag: "Compliance + Access", desc: "Secure architecture with role-based access control, full audit trails, workspace isolation, and deployment flexibility for regulated industries.", features: ["Role-based access (RBAC)", "Full audit logs", "Workspace isolation", "SOC-ready posture"], color: "#00ff88" },
  { icon: Workflow, title: "Data Pipelines", tag: "ETL + Automation", desc: "Clean, transform, validate, schedule, and export reports from raw files to finished workflows — all from one visual interface.", features: ["Drag-and-drop ETL", "Scheduled pipelines", "Data quality gates", "Multi-format exports"], color: "#7c3aed" }
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen pt-[calc(var(--nav-h)+70px)] px-5 pb-10">
      <PageHero
        eyebrow="Our Services"
        title={<>Every capability your data team needs,{" "}<span className="text-transparent bg-[linear-gradient(100deg,#ffffff,var(--accent),var(--accent-2))] bg-clip-text [-webkit-background-clip:text]">redesigned for AI.</span></>}
        description="KoreData delivers a complete suite of AI-powered data services — from automated analysis and predictive modeling to LLM assistants, RAG search, and enterprise security — all from one unified platform."
      >
        <div className="flex flex-wrap gap-3.5 mt-8">
          <Button variant="primary" href="/register">Start Free Trial <ArrowRight size={16} /></Button>
          <Button href="/contact">Book a Demo</Button>
        </div>
      </PageHero>

      {/* Stats bar */}
      <section className="py-16 px-5" style={{ paddingTop: 40, paddingBottom: 32 }}>
        <div className="w-full max-w-[1240px] mx-auto">
          <TrustRow
            items={[["9", "Core Services"], ["99.9%", "Platform Uptime"], ["50ms", "Avg Latency"], ["SOC-ready", "Security"]]}
            className="max-w-full"
          />
        </div>
      </section>

      {/* Services Grid */}
      <Section kicker="Service Catalogue" title="What KoreData can do for you.">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
          {services.map(({ icon: Icon, title, tag, desc, features, color }, i) => (
            <motion.article
              className="cornered border border-kore-border bg-kore-surface backdrop-blur-[16px] rounded-kore p-6 transition-all duration-[220ms] hover:-translate-y-2 card-sweep"
              key={title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
            >
              <div className="flex items-start justify-between gap-3">
                <CardIcon style={{ color, borderColor: `${color}33`, background: `${color}10` }}>
                  <Icon size={20} />
                </CardIcon>
                <span
                  className="py-1 px-2.5 border rounded-full font-mono text-[10px] tracking-[1.4px] uppercase"
                  style={{ borderColor: `${color}33`, color }}
                >
                  {tag}
                </span>
              </div>
              <h3 className="mt-[18px] mb-2 font-mono text-sm tracking-[1.5px] uppercase" style={{ color }}>{title}</h3>
              <p className="m-0 text-kore-muted leading-[1.7] mb-4">{desc}</p>
              <ul className="p-0 m-0 list-none grid gap-2">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-kore-muted font-mono text-xs">
                    <Check size={13} className="text-kore-accent2 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <CTASection
        title="Ready to put all of this to work?"
        description="Start your free trial today. No credit card required. Connect your first dataset in minutes."
        primaryText="Create Free Account"
        primaryHref="/register"
        secondaryText="Talk to Sales"
        secondaryHref="/contact"
        className="mb-[60px]"
      >
        <div className="flex items-center justify-center gap-2.5 mb-4 text-kore-accent2 font-mono text-xs tracking-[2px] uppercase">
          <Zap size={14} /> Trusted by data-driven teams
        </div>
        <div className="flex gap-3.5 justify-center flex-wrap">
          <Button variant="primary" href="/register">Create Free Account <ArrowRight size={16} /></Button>
          <Button href="/contact">Talk to Sales</Button>
        </div>
      </CTASection>
    </main>
  );
}
