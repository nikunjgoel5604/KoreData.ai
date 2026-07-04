import {
  BrainCircuit,
  ChartNoAxesCombined,
  DatabaseZap,
  FileSearch,
  LockKeyhole,
  Network,
  ServerCog,
  Sparkles,
  WandSparkles,
  Workflow,
  Bot,
  Cloud,
  LineChart,
  ShieldCheck,
  Activity
} from "lucide-react";

export const navLinks = [
  ["Home", "/"],
  ["Services", "/services"],
  ["How It Works", "/working-mechanism"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["FAQ", "/faq"]
];

export const features = [
  ["AI Data Analysis", BrainCircuit, "Automated EDA, anomaly detection, correlations, and smart recommendations."],
  ["LLM Assistant", Bot, "Ask natural-language questions and receive clear, contextual answers."],
  ["RAG Search", FileSearch, "Search across datasets, documents, reports, and business knowledge."],
  ["Machine Learning", WandSparkles, "Train models, evaluate accuracy, and forecast outcomes without code."],
  ["Interactive Dashboards", ChartNoAxesCombined, "Beautiful KPI cards, charts, tables, heatmaps, and live insights."],
  ["Cloud API Platform", ServerCog, "Integrate KoreData intelligence into your applications and workflows."],
  ["Real-time Intelligence", Activity, "Monitor operational metrics, quality changes, and data drift instantly."],
  ["Enterprise Security", ShieldCheck, "Secure architecture with access control, audit trails, and data isolation."],
  ["Data Pipelines", Workflow, "Clean, transform, validate, and export reports from a single workflow."]
];

export const workflow = [
  "Upload Dataset",
  "Clean Data",
  "Analyze",
  "Visualize",
  "AI Assistant",
  "LLM",
  "RAG",
  "Insights",
  "Forecast",
  "Export Report"
];

export const solutions = [
  "Healthcare",
  "Education",
  "Finance",
  "Retail",
  "Manufacturing",
  "Agriculture",
  "Energy",
  "Research",
  "Government"
];

export const pages: Record<string, { title: string; eyebrow: string; description: string }> = {
  platform: {
    eyebrow: "Platform",
    title: "A complete operating system for intelligent data teams.",
    description: "KoreData combines analytics, LLM workflows, RAG search, dashboards, forecasting, and automation in one enterprise-grade platform."
  },
  features: {
    eyebrow: "Features",
    title: "Everything you need to turn raw data into decisions.",
    description: "From automated EDA to predictive modeling, KoreData helps teams analyze, visualize, explain, and act on data faster."
  },
  solutions: {
    eyebrow: "Solutions",
    title: "AI data intelligence for every modern industry.",
    description: "Purpose-built workflows for healthcare, finance, education, retail, manufacturing, research, government, and more."
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Flexible pricing for teams at every stage.",
    description: "Start small, scale confidently, and deploy KoreData across departments when your organization is ready."
  },
  documentation: {
    eyebrow: "Docs",
    title: "Build, integrate, and deploy with confidence.",
    description: "Explore platform guides, API references, deployment notes, data workflow examples, and integration patterns."
  },
  api: {
    eyebrow: "API",
    title: "Bring KoreData intelligence into your product.",
    description: "Use APIs for analysis, forecasting, semantic search, automated reports, dashboards, and workflow automation."
  },
  resources: {
    eyebrow: "Resources",
    title: "Guides and playbooks for AI-powered analytics.",
    description: "Learn how to build reliable data workflows, improve dataset quality, and deploy practical AI inside your business."
  },
  blog: {
    eyebrow: "Blog",
    title: "Ideas on AI, analytics, and decision intelligence.",
    description: "Read practical insights on data science, machine learning, LLMs, RAG, business intelligence, and analytics engineering."
  },
  about: {
    eyebrow: "About",
    title: "We transform raw data into intelligent decisions.",
    description: "KoreData is building a modern AI data platform for teams that need speed, clarity, automation, and trust."
  },
  careers: {
    eyebrow: "Careers",
    title: "Help build the future of enterprise AI analytics.",
    description: "Join KoreData and work on intelligent interfaces, scalable data systems, AI workflows, and premium product experiences."
  },
  contact: {
    eyebrow: "Contact",
    title: "Talk to the KoreData team.",
    description: "Book a demo, ask about enterprise deployment, discuss integrations, or explore how KoreData fits your business."
  },
  login: {
    eyebrow: "Login",
    title: "Welcome back to KoreData.",
    description: "Access your secure AI analytics workspace."
  },
  register: {
    eyebrow: "Register",
    title: "Create your KoreData workspace.",
    description: "Start analyzing, visualizing, predicting, and automating your data with AI."
  },
  "privacy-policy": {
    eyebrow: "Privacy",
    title: "Privacy Policy",
    description: "How KoreData handles data privacy, security, access, storage, and enterprise compliance."
  },
  "terms-of-service": {
    eyebrow: "Terms",
    title: "Terms of Service",
    description: "Terms governing use of KoreData products, platform, APIs, websites, and services."
  }
};

export const footerGroups = [
  ["Product", [["Platform", "/platform"], ["Features", "/features"], ["Pricing", "/pricing"], ["API", "/api"]]],
  ["Company", [["About", "/about"], ["Careers", "/careers"], ["Contact", "/contact"], ["Blog", "/blog"]]],
  ["Resources", [["Documentation", "/documentation"], ["Resources", "/resources"], ["Privacy", "/privacy-policy"], ["Terms", "/terms-of-service"]]]
];

export const trust = [
  ["10K+", "datasets analyzed"],
  ["99.9%", "platform uptime"],
  ["50ms", "avg query latency"],
  ["SOC-ready", "security posture"]
];

export const icons = {
  DatabaseZap,
  Network,
  Cloud,
  LockKeyhole,
  Sparkles,
  LineChart
};
