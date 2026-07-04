"use client";

import { motion } from "framer-motion";
import { ArrowRight, Upload, Cpu, BarChart2, MessageSquare, FileOutput, ArrowDown, Sparkles, Check } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Section from "@/components/ui/Section";
import CTASection from "@/components/ui/CTASection";
import Button from "@/components/ui/Button";

const steps = [
  { num: "01", icon: Upload, title: "Connect Your Data", subtitle: "Ingest", desc: "Upload CSV, Excel, JSON, or connect to your cloud warehouse, database, or API. KoreData ingests, validates, and indexes your data in seconds.", detail: "KoreData accepts structured files, semi-structured documents, and live API feeds. The ingestion engine auto-detects schema, column types, date formats, and encoding — then produces an instant quality report before analysis begins.", checks: ["CSV, Excel, JSON, Parquet", "Database connectors (Postgres, MySQL, BigQuery)", "REST API & webhook ingestion", "Auto-schema detection"], color: "#00d4ff" },
  { num: "02", icon: Cpu, title: "Clean & Prepare", subtitle: "Transform", desc: "Automated data cleaning removes duplicates, fills missing values, normalizes formats, detects outliers, and flags data quality issues — all before analysis.", detail: "The preparation engine runs over 40 quality checks: null rates, cardinality, distribution skews, value inconsistencies, and type mismatches. You receive a quality score and can review or override all automated decisions.", checks: ["Duplicate detection & removal", "Missing value imputation", "Format normalization", "Quality scoring (0–100)"], color: "#00ff88" },
  { num: "03", icon: BarChart2, title: "AI Analysis Engine", subtitle: "Analyze + Model", desc: "The core intelligence layer runs EDA, finds correlations, trains ML models, generates forecasts, and surfaces explainable business insights automatically.", detail: "KoreData's reasoning engine combines statistical analysis, tree-based ML, and deep learning to identify patterns that matter. Every finding is paired with a plain-English explanation, confidence score, and supporting evidence.", checks: ["Automated EDA & profiling", "Correlation & causality mapping", "AutoML + forecasting", "Explainable AI insights"], color: "#7c3aed" },
  { num: "04", icon: MessageSquare, title: "Ask AI — RAG + LLM", subtitle: "Query", desc: "Chat with your data using natural language. The LLM assistant and RAG search layer retrieves relevant context from your datasets, documents, and reports before answering.", detail: "Questions are decomposed into sub-queries, routed through a semantic retrieval index, and answered by a fine-tuned LLM with citations back to source data. Hallucinations are minimised by grounding every response in your actual data.", checks: ["Natural language data queries", "Document + dataset RAG", "Source-cited answers", "Multi-turn context memory"], color: "#00d4ff" },
  { num: "05", icon: Sparkles, title: "Visualize & Explore", subtitle: "Discover", desc: "Auto-generated dashboards, KPI cards, trend charts, segment breakdowns, and heatmaps let your team explore findings without touching a line of code.", detail: "Every insight is automatically visualised in the most appropriate chart type. You can drill into segments, filter by time, compare cohorts, and pin any view to a shared dashboard — all live and collaboration-ready.", checks: ["Auto-selected chart types", "Live KPI dashboards", "Segment & cohort views", "Shareable team dashboards"], color: "#00ff88" },
  { num: "06", icon: FileOutput, title: "Deliver & Act", subtitle: "Export + Automate", desc: "Export reports, schedule automated insights, publish API endpoints, and trigger alerts. Turn analysis into decisions and decisions into action.", detail: "KoreData turns completed analysis into durable outputs: scheduled PDF/Excel reports, REST API responses, webhook triggers, Slack notifications, and data pipeline exports — all governed by your team's access controls.", checks: ["Scheduled report delivery", "REST API publication", "Slack / email alerts", "Role-based data exports"], color: "#7c3aed" }
];

export default function WorkingMechanismPage() {
  return (
    <main className="min-h-screen pt-[calc(var(--nav-h)+70px)] px-5 pb-10">
      <PageHero
        eyebrow="How It Works"
        title={<>From raw file to{" "}<span className="text-transparent bg-[linear-gradient(100deg,#ffffff,var(--accent),var(--accent-2))] bg-clip-text [-webkit-background-clip:text]">executive-ready decision.</span></>}
        description="KoreData's six-stage AI pipeline transforms raw, messy data into analysis, predictions, answers, and automations — with full transparency at every step."
      >
        <div className="flex flex-wrap gap-3.5 mt-8">
          <Button variant="primary" href="/register">See It Live <ArrowRight size={16} /></Button>
          <Button href="/services">Explore Services</Button>
        </div>
      </PageHero>

      {/* Pipeline Steps */}
      <Section kicker="Intelligence Pipeline" title="Six stages. One unified system." style={{ paddingTop: 32 }}>
        <div className="flex flex-col">
          {steps.map(({ num, icon: Icon, title, subtitle, desc, detail, checks, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
            >
              <div className={`grid grid-cols-2 gap-8 items-center py-12 max-md:grid-cols-1 ${i < steps.length - 1 ? "border-b border-kore-border" : ""}`}>
                {/* Info panel */}
                <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                  <div className="flex items-center gap-3.5 mb-5">
                    <div
                      className="w-[52px] h-[52px] grid place-items-center border rounded-[10px]"
                      style={{ borderColor: `${color}44`, background: `${color}10`, color }}
                    >
                      <Icon size={22} />
                    </div>
                    <div>
                      <span className="font-mono text-[11px] tracking-[1.8px] uppercase" style={{ color }}>
                        {subtitle}
                      </span>
                      <h3 className="mt-1 font-display text-[clamp(22px,3vw,32px)] tracking-[-0.03em]">
                        {title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-kore-muted leading-[1.8] mb-4">{desc}</p>
                  <ul className="p-0 m-0 list-none grid gap-[9px]">
                    {checks.map(c => (
                      <li key={c} className="flex items-center gap-[9px] font-mono text-xs text-kore-text">
                        <Check size={13} className="text-kore-accent2 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Detail card */}
                <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
                  <div className="cornered border border-kore-border bg-kore-surface rounded-kore p-6" style={{ borderColor: `${color}33` }}>
                    <div className="flex justify-between items-center mb-4 pb-3.5" style={{ borderBottom: `1px solid ${color}22` }}>
                      <span className="font-mono text-[32px] font-extrabold opacity-30" style={{ color }}>{num}</span>
                      <span
                        className="py-1 px-3 border rounded-full font-mono text-[10px] tracking-[1.4px] uppercase"
                        style={{ borderColor: `${color}33`, color }}
                      >
                        Stage {num}
                      </span>
                    </div>
                    <p className="text-kore-muted leading-[1.8] m-0 text-sm">{detail}</p>
                  </div>
                </div>
              </div>

              {i < steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown size={18} className="text-kore-borderStrong opacity-60" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <CTASection
        title="Experience the pipeline yourself."
        description="Upload a dataset and watch KoreData's full pipeline run live — no setup, no code."
        primaryText="Try It Free"
        primaryHref="/register"
        secondaryText="Schedule a Demo"
        secondaryHref="/contact"
        className="mb-[60px]"
      />
    </main>
  );
}
