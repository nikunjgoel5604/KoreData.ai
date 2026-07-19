"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Play } from "lucide-react";
import HeroScene from "@/components/HeroScene";
import { features, solutions, trust, workflow } from "@/constants/site";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="eyebrow"><span className="live-dot" /> Enterprise AI Data Platform</div>
            <h1>
              Transform Data into <span className="gradient-text">Intelligent Decisions</span>
            </h1>
            <p className="hero-copy">
              Analyze, visualize, predict, and automate your data using artificial intelligence,
              machine learning, LLMs, retrieval-augmented generation, and enterprise-grade analytics.
            </p>

           <div className="hero-actions">
  <Link
    className="btn btn-primary"
    href="https://cal.com/koredata-ai-i4rvhi"
    target="_blank"
    rel="noopener noreferrer"
  >
    Get Started <ArrowRight size={16} />
  </Link>

  <Link
    className="btn"
    href="https://cal.com/koredata-ai-i4rvhi"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Calendar size={16} /> Book Demo
  </Link>

  <button className="btn">
    <Play size={16} /> Watch Demo
  </button>
</div>

            <div className="trust-row">
              {trust.map(([value, label]) => (
                <div className="trust-card" key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="hero-visual" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9 }}>
            <HeroScene />
            <div className="dashboard-preview cornered">
              <div className="preview-top">
                <span>KoreData Intelligence Console</span>
                <span>Live</span>
              </div>x

              <div className="preview-grid">
                <div className="metric">
                  <small>EDA Accuracy</small>
                  <strong>94.2%</strong>
                </div>
                <div className="metric">
                  <small>Forecast Lift</small>
                  <strong>31%</strong>
                </div>
                <div className="metric">
                  <small>Rows Analyzed</small>
                  <strong>128K</strong>
                </div>
                <div className="metric">
                  <small>Missing Data</small>
                  <strong>0.2%</strong>
                </div>
                <div className="chart-panel">
                  {[44, 66, 52, 86, 72, 95, 78, 100, 83].map((h, i) => (
                    <div className="bar" style={{ height: `${h}%` }} key={i} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Section kicker="Capabilities" title="Everything your data team needs, redesigned for AI.">
        <div className="feature-grid">
          {features.map(([title, Icon, desc]) => (
            <motion.article className="card cornered" whileHover={{ y: -6 }} key={title as string}>
              <div className="card-icon"><Icon size={21} /></div>
              <h3>{title as string}</h3>
              <p>{desc as string}</p>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section kicker="Workflow" title="From raw file to executive-ready intelligence.">
        <div className="workflow">
          {workflow.map((step, i) => (
            <div className="workflow-step cornered" key={step}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="Solutions" title="Built for data-heavy teams across industries.">
        <div className="solution-grid">
          {solutions.map((solution) => (
            <article className="card" key={solution}>
              <h3>{solution}</h3>
              <p>Deploy AI analytics, forecasting, dashboards, and secure data workflows for {solution.toLowerCase()} teams.</p>
            </article>
          ))}
        </div>
      </Section>

      <Section kicker="Pricing" title="Simple plans for startups, teams, and enterprises.">
        <div className="pricing-grid">
          {["Starter", "Professional", "Enterprise"].map((plan, i) => (
            <article className="card pricing-card cornered" key={plan}>
              <h3>{plan}</h3>
              <div className="price">{i === 2 ? "Custom" : `$${i === 0 ? 29 : 99}`}</div>
              <p>{i === 2 ? "For scaled enterprise deployment." : "Per user / month."}</p>
              <ul>
                <li>AI analytics workspace</li>
                <li>LLM assistant</li>
                <li>RAG search</li>
                <li>Automated reports</li>
                <li>{i === 0 ? "Community support" : "Priority support"}</li>
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <section className="cta cornered">
        <h2>Ready to analyze your data with AI?</h2>
        <p>Turn datasets, dashboards, reports, and business knowledge into fast, reliable decisions.</p>
        <Link className="btn btn-primary" href="/register">Create Free Account <ArrowRight size={16} /></Link>
      </section>
    </main>
  );
}

function Section({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section className="section">
      <div className="section-inner">
        <div className="section-kicker">// {kicker}</div>
        <h2 className="section-heading">{title}</h2>
        {children}
      </div>
    </section>
  );
}
