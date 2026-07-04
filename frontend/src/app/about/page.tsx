"use client";

import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Target, Shield, Users, Lightbulb, Globe } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Section from "@/components/ui/Section";
import Card, { CardIcon } from "@/components/ui/Card";
import CTASection from "@/components/ui/CTASection";
import Button from "@/components/ui/Button";

const values = [
  { icon: BrainCircuit, title: "Intelligence First", desc: "Every product decision starts with: does this make our users smarter? We build AI that amplifies human judgment, not replaces it." },
  { icon: Shield, title: "Trust by Design", desc: "Security, governance, and explainability are not features we added later. They are foundational to how KoreData is architected." },
  { icon: Target, title: "Radical Clarity", desc: "Analytics should produce decisions, not confusion. We obsess over making complex outputs simple, actionable, and understandable." },
  { icon: Users, title: "Teams Over Tools", desc: "Great analytics platforms fade into the background and make teams feel capable. We build for the team, not the individual power user." },
  { icon: Lightbulb, title: "Continuous Discovery", desc: "The best AI insights are the ones you weren't looking for. We build systems that surface what your team didn't know to ask." },
  { icon: Globe, title: "Open for Everyone", desc: "Enterprise-grade AI data intelligence should not be locked behind seven-figure contracts. We build for teams at every scale." }
];

const milestones = [
  { year: "2022", event: "KoreData founded with a focus on making AI-powered EDA accessible to all data teams." },
  { year: "2023", event: "Launched LLM assistant and RAG search on top of our analytics engine. 500+ early-access teams joined." },
  { year: "2024", event: "Enterprise launch with RBAC, audit logs, and API platform. Passed 10,000 datasets analyzed." },
  { year: "2025", event: "Released real-time intelligence, automated pipelines, and 99.9% SLA. Expanded to 40+ countries." },
  { year: "2026", event: "Today — SOC-ready, multi-region, serving data-heavy teams across healthcare, finance, retail, and research." }
];

const team = [
  { name: "Aria Nakamura", role: "Co-founder & CEO", bg: "linear-gradient(135deg, #00d4ff22, #7c3aed22)" },
  { name: "Marcus Webb", role: "Co-founder & CTO", bg: "linear-gradient(135deg, #00ff8822, #00d4ff22)" },
  { name: "Priya Sharma", role: "Head of AI Research", bg: "linear-gradient(135deg, #7c3aed22, #00ff8822)" },
  { name: "Leon Brandt", role: "Head of Product", bg: "linear-gradient(135deg, #00d4ff22, #2563eb22)" },
  { name: "Sasha Kim", role: "Head of Security", bg: "linear-gradient(135deg, #00ff8822, #7c3aed22)" },
  { name: "Felix Torres", role: "Head of Growth", bg: "linear-gradient(135deg, #2563eb22, #00d4ff22)" }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-[calc(var(--nav-h)+70px)] px-5 pb-10">
      {/* Hero */}
      <PageHero
        eyebrow="About KoreData"
        title={<>We transform raw data into{" "}<span className="text-transparent bg-[linear-gradient(100deg,#ffffff,var(--accent),var(--accent-2))] bg-clip-text [-webkit-background-clip:text]">intelligent decisions.</span></>}
        description="KoreData was built by data scientists and engineers who were tired of spending 80% of their time on infrastructure instead of insights. We built the platform we always wished existed."
      >
        <div className="flex flex-wrap gap-3.5 mt-8">
          <Button variant="primary" href="/register">Join Us <ArrowRight size={16} /></Button>
          <Button href="/contact">Get in Touch</Button>
        </div>
      </PageHero>

      {/* Mission */}
      <Section kicker="Our Mission" title="Make AI data intelligence accessible to every serious team." style={{ paddingTop: 32 }}>
        <div className="grid grid-cols-2 gap-10 items-center border-b border-kore-border pb-14 max-md:grid-cols-1">
          <div>
            <p className="text-kore-muted leading-[1.9] mb-5">
              The world's best-performing companies make decisions faster and more accurately than
              their competitors because they can extract intelligence from data at speed. But until
              KoreData, that capability required a team of data scientists, ML engineers, and six-figure
              infrastructure budgets.
            </p>
            <p className="text-kore-muted leading-[1.9]">
              We changed that. KoreData compresses an entire data science workflow — ingestion, cleaning,
              EDA, ML, LLM, RAG, dashboards, and delivery — into one platform that any analytically-minded
              team can operate without writing a single line of code.
            </p>
          </div>
          <div className="cornered rounded-kore p-9 border border-kore-border bg-kore-surface" style={{ background: "radial-gradient(circle at 30% 20%, rgba(0,212,255,0.08), transparent 60%), var(--surface)" }}>
            {[["10K+", "Datasets Analyzed"], ["99.9%", "Platform Uptime"], ["40+", "Countries Served"], ["50ms", "Avg Query Latency"]].map(([v, l]) => (
              <div key={l} className="flex justify-between items-center py-[18px] border-b border-kore-border">
                <span className="text-kore-muted font-mono text-[13px]">{l}</span>
                <strong className="text-kore-accent font-mono text-[28px]">{v}</strong>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Values */}
      <Section kicker="Our Values" title="What we believe in.">
        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
          {values.map(({ icon: Icon, title, desc }, i) => (
            <Card cornered hover key={title}>
              <CardIcon><Icon size={20} /></CardIcon>
              <h3 className="relative z-[1] mt-[18px] mb-2 font-mono text-sm tracking-[1.5px] uppercase text-kore-accent">{title}</h3>
              <p className="relative z-[1] m-0 text-kore-muted leading-[1.7]">{desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Timeline */}
      <Section kicker="Our Story" title="Built in the open, milestone by milestone.">
        <div className="flex flex-col">
          {milestones.map(({ year, event }, i) => (
            <motion.div
              key={year}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`grid grid-cols-[100px_1fr] gap-7 py-7 items-start ${i < milestones.length - 1 ? "border-b border-kore-border" : ""}`}
            >
              <strong className="text-kore-accent font-mono text-[22px] font-extrabold">{year}</strong>
              <p className="m-0 text-kore-muted leading-[1.8]">{event}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Team */}
      <Section kicker="Leadership" title="The team behind the platform.">
        <div className="grid grid-cols-3 gap-5 max-md:grid-cols-2 max-sm:grid-cols-1">
          {team.map(({ name, role, bg }, i) => (
            <motion.div
              key={name}
              className="cornered border border-kore-border bg-kore-surface rounded-kore text-center p-7 transition-all duration-[220ms] hover:-translate-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div
                className="w-[72px] h-[72px] rounded-full border border-kore-borderStrong grid place-items-center mx-auto mb-4 text-kore-accent font-display text-[22px] font-extrabold"
                style={{ background: bg }}
              >
                {name.split(" ").map(n => n[0]).join("")}
              </div>
              <strong className="block font-mono text-sm text-kore-text">{name}</strong>
              <span className="text-kore-dim font-mono text-[11px] tracking-[1px] uppercase">{role}</span>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <CTASection
        title="Want to be part of what we're building?"
        description="We're always looking for mission-driven engineers, data scientists, and product thinkers."
        primaryText="Get Started"
        primaryHref="/register"
        secondaryText="Talk to Us"
        secondaryHref="/contact"
        className="mb-[60px]"
      />
    </main>
  );
}
