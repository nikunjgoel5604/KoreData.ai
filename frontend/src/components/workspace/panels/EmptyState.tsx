"use client";

import React from "react";
import {
  Folder,
  UploadCloud,
  BarChart3,
  LineChart,
  BrainCircuit,
  Cpu,
  Target,
  Sparkles,
  FileText,
  Download,
  Database,
  Search,
  AlertTriangle,
  WifiOff,
  Lock,
  ChevronRight,
  HelpCircle
} from "lucide-react";

export type EmptyStateType =
  | "workspace"
  | "import-dataset"
  | "eda"
  | "visualization"
  | "feature-engineering"
  | "machine-learning"
  | "prediction"
  | "ai-insights"
  | "reports"
  | "export"
  | "table"
  | "search"
  | "error"
  | "network"
  | "permission";

interface EmptyStateProps {
  type: EmptyStateType;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  title?: string;
  description?: string;
  tip?: string;
}

export default function EmptyState({
  type,
  primaryAction,
  secondaryAction,
  title,
  description,
  tip
}: EmptyStateProps) {
  
  // Custom graphics mapping
  const renderIllustration = () => {
    let strokeColor = "url(#illustration-gradient)";
    let fillColor = "url(#illustration-fill-gradient)";

    switch (type) {
      case "workspace":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
              <linearGradient id="illustration-fill-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.15)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0.05)" />
              </linearGradient>
            </defs>
            {/* Cloud Outline */}
            <path d="M40,55 A 15,15 0 0,1 70,55 A 20,20 0 0,1 100,75 A 15,15 0 0,1 85,90 L 35,90 A 15,15 0 0,1 20,75 A 15,15 0 0,1 40,55 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Folder 1 */}
            <rect x="30" y="45" width="28" height="20" rx="3" fill="rgba(59, 130, 246, 0.2)" stroke="#3B82F6" strokeWidth="2" />
            <path d="M30,50 L42,50 L46,45 L58,45" fill="none" stroke="#3B82F6" strokeWidth="2" />
            {/* Folder 2 */}
            <rect x="62" y="35" width="28" height="20" rx="3" fill="rgba(6, 182, 212, 0.2)" stroke="#06B6D4" strokeWidth="2" />
            <path d="M62,40 L74,40 L78,35 L90,35" fill="none" stroke="#06B6D4" strokeWidth="2" />
          </svg>
        );
      case "import-dataset":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#22C55E" />
              </linearGradient>
              <linearGradient id="illustration-fill-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(6, 182, 212, 0.15)" />
                <stop offset="100%" stopColor="rgba(34, 197, 94, 0.05)" />
              </linearGradient>
            </defs>
            {/* Server disks representation */}
            <rect x="35" y="25" width="50" height="18" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
            <circle cx="45" cy="34" r="2.5" fill="#06B6D4" />
            <rect x="35" y="50" width="50" height="18" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
            <circle cx="45" cy="59" r="2.5" fill="#10B981" />
            <rect x="35" y="75" width="50" height="18" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
            <circle cx="45" cy="84" r="2.5" fill="#22C55E" />
            {/* Arrow Ingestion upward */}
            <path d="M92,85 L92,55 M92,55 L84,63 M92,55 L100,63" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "eda":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
              <linearGradient id="illustration-fill-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(34, 197, 94, 0.15)" />
                <stop offset="100%" stopColor="rgba(168, 85, 247, 0.05)" />
              </linearGradient>
            </defs>
            {/* Stats Dashboard Grid */}
            <rect x="25" y="25" width="70" height="70" rx="10" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
            <line x1="25" y1="60" x2="95" y2="60" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="60" y1="25" x2="60" y2="95" stroke={strokeColor} strokeWidth="1.5" />
            {/* Sparkline curve */}
            <path d="M35,48 Q45,35 52,44" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="52" cy="44" r="3" fill="#22C55E" />
            {/* Outlier dot */}
            <circle cx="42" cy="80" r="4" fill="#A855F7" />
            {/* Box plot sketch */}
            <rect x="70" y="70" width="16" height="14" fill="rgba(168, 85, 247, 0.2)" stroke="#A855F7" strokeWidth="1.5" />
            <line x1="78" y1="65" x2="78" y2="70" stroke="#A855F7" strokeWidth="1.5" />
            <line x1="78" y1="84" x2="78" y2="89" stroke="#A855F7" strokeWidth="1.5" />
          </svg>
        );
      case "visualization":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <linearGradient id="illustration-fill-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(168, 85, 247, 0.15)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.05)" />
              </linearGradient>
            </defs>
            {/* Pie layout & bars */}
            <circle cx="50" cy="60" r="28" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
            <path d="M50,60 L50,32 A28,28 0 0,1 78,60 Z" fill="rgba(168, 85, 247, 0.3)" stroke="#A855F7" strokeWidth="1.5" />
            {/* Small bar indicators */}
            <rect x="90" y="35" width="8" height="50" rx="2" fill="rgba(59, 130, 246, 0.3)" stroke="#3B82F6" strokeWidth="2" />
            <rect x="102" y="50" width="8" height="35" rx="2" fill="rgba(6, 182, 212, 0.3)" stroke="#06B6D4" strokeWidth="2" />
          </svg>
        );
      case "feature-engineering":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
              <linearGradient id="illustration-fill-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(245, 158, 11, 0.15)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0.05)" />
              </linearGradient>
            </defs>
            {/* Node graph representation */}
            <circle cx="35" cy="60" r="10" fill="rgba(245, 158, 11, 0.2)" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="85" cy="35" r="10" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" strokeWidth="2" />
            <circle cx="85" cy="85" r="10" fill="rgba(99, 102, 241, 0.2)" stroke="#6366F1" strokeWidth="2" />
            {/* Interconnecting paths */}
            <line x1="45" y1="56" x2="75" y2="39" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3,3" />
            <line x1="45" y1="64" x2="75" y2="81" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3,3" />
            <line x1="85" y1="45" x2="85" y2="75" stroke="#94A3B8" strokeWidth="1.5" />
          </svg>
        );
      case "machine-learning":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
              <linearGradient id="illustration-fill-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(139, 92, 246, 0.15)" />
                <stop offset="100%" stopColor="rgba(236, 72, 153, 0.05)" />
              </linearGradient>
            </defs>
            {/* Brain Circuits outline */}
            <path d="M60,25 C45,25 35,35 35,50 C35,62 43,68 45,75 C47,82 48,90 60,90 C72,90 73,82 75,75 C77,68 85,62 85,50 C85,35 75,25 60,25 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
            <line x1="60" y1="25" x2="60" y2="90" stroke={strokeColor} strokeWidth="1.5" />
            {/* Synapses dots */}
            <circle cx="50" cy="40" r="3.5" fill="#8B5CF6" />
            <circle cx="70" cy="48" r="3.5" fill="#EC4899" />
            <circle cx="48" cy="62" r="3.5" fill="#6366F1" />
          </svg>
        );
      case "prediction":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            {/* Target bullseye rings */}
            <circle cx="60" cy="60" r="38" fill="none" stroke="url(#illustration-gradient)" strokeWidth="2.5" />
            <circle cx="60" cy="60" r="24" fill="none" stroke="url(#illustration-gradient)" strokeWidth="2" strokeDasharray="4,2" />
            <circle cx="60" cy="60" r="10" fill="rgba(239, 68, 68, 0.15)" stroke="#EF4444" strokeWidth="2.5" />
            {/* Arrow striking */}
            <path d="M28,28 L53,53 M53,53 L47,55 M53,53 L55,47" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "ai-insights":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            {/* Sparkles, Magic AI cards */}
            <path d="M40,55 L40,75 L60,85 L80,75 L80,55 L60,45 Z" fill="rgba(236, 72, 153, 0.12)" stroke="url(#illustration-gradient)" strokeWidth="2" />
            {/* Big Sparkle */}
            <path d="M60,25 Q60,38 73,38 Q60,38 60,51 Q60,38 47,38 Q60,38 60,25 Z" fill="#EC4899" />
            {/* Little Sparkle */}
            <path d="M85,55 Q85,62 92,62 Q85,62 85,69 Q85,62 78,62 Q85,62 85,55 Z" fill="#3B82F6" />
          </svg>
        );
      case "reports":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
              <linearGradient id="illustration-fill-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(20, 184, 166, 0.15)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0.05)" />
              </linearGradient>
            </defs>
            {/* Document sheet mockup */}
            <rect x="35" y="25" width="50" height="70" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
            <path d="M45,40 L75,40 M45,55 L75,55 M45,70 L65,70" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            <circle cx="73" cy="70" r="4.5" fill="#14B8A6" />
          </svg>
        );
      case "export":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
            </defs>
            {/* Arrow Exporting out of box */}
            <path d="M30,70 L30,85 L90,85 L90,70" fill="none" stroke="url(#illustration-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M60,25 L60,65 M60,65 L50,55 M60,65 L70,55" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "table":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>
            <rect x="25" y="30" width="70" height="60" rx="8" fill="none" stroke="url(#illustration-gradient)" strokeWidth="2.5" />
            <line x1="25" y1="50" x2="95" y2="50" stroke="#475569" strokeWidth="1.5" />
            <line x1="25" y1="70" x2="95" y2="70" stroke="#475569" strokeWidth="1.5" />
            <line x1="48" y1="30" x2="48" y2="90" stroke="#475569" strokeWidth="1.5" />
            {/* Crossed grid empty lines */}
            <line x1="58" y1="58" x2="84" y2="82" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3,3" />
            <line x1="84" y1="58" x2="58" y2="82" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3,3" />
          </svg>
        );
      case "search":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            {/* Search magnifier */}
            <circle cx="55" cy="55" r="22" fill="none" stroke="url(#illustration-gradient)" strokeWidth="2.5" />
            <line x1="72" y1="72" x2="92" y2="92" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
            {/* Small sparkles */}
            <circle cx="82" cy="40" r="1.5" fill="#38BDF8" />
            <circle cx="34" cy="74" r="1.5" fill="#3B82F6" />
          </svg>
        );
      case "error":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            {/* Alert triangle */}
            <path d="M60,25 L100,90 L20,90 Z" fill="rgba(239, 68, 68, 0.1)" stroke="url(#illustration-gradient)" strokeWidth="2.5" strokeLinejoin="round" />
            <line x1="60" y1="48" x2="60" y2="70" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
            <circle cx="60" cy="80" r="2.5" fill="#EF4444" />
          </svg>
        );
      case "network":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
            {/* Cloud outline crossed */}
            <path d="M40,55 A 15,15 0 0,1 70,55 A 20,20 0 0,1 100,75 A 15,15 0 0,1 85,90 L 35,90 A 15,15 0 0,1 20,75 A 15,15 0 0,1 40,55 Z" fill="none" stroke="url(#illustration-gradient)" strokeWidth="2.5" />
            {/* Diagonal cross slash */}
            <line x1="25" y1="35" x2="95" y2="95" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      case "permission":
        return (
          <svg className="ws-empty-illustration" viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <defs>
              <linearGradient id="illustration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
            </defs>
            {/* Padlock outline */}
            <rect x="35" y="55" width="50" height="38" rx="6" fill="rgba(245, 158, 11, 0.1)" stroke="url(#illustration-gradient)" strokeWidth="2.5" />
            <path d="M45,55 L45,40 A 15,15 0 0,1 75,40 L75,55" fill="none" stroke="url(#illustration-gradient)" strokeWidth="2.5" />
            <circle cx="60" cy="70" r="3.5" fill="#F59E0B" />
            <line x1="60" y1="74" x2="60" y2="82" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Content text mappings based on type
  const defaultContent = {
    workspace: {
      title: "No Workspace Found",
      desc: "Create your first workspace to start building analytics projects.",
      icon: Folder,
      tip: "Workspaces let you group multiple datasets, cleaning pipelines, trained models, and reports under one unified sandbox."
    },
    "import-dataset": {
      title: "No Dataset Ingested",
      desc: "Upload a CSV, Excel, JSON, SQL, or connect to a database to begin.",
      icon: Database,
      tip: "Supported formats include text-based CSV/JSON files, binary Excel worksheets (.xlsx), and compressed Parquet schema files."
    },
    eda: {
      title: "No Dataset Available",
      desc: "Upload a dataset to begin Exploratory Data Analysis.",
      icon: BarChart3,
      tip: "EDA profiling performs automatic variable schema scanning, data type mapping, null checks, outlier analysis, and correlation calculations."
    },
    visualization: {
      title: "No Visualizations Yet",
      desc: "Create your first chart after completing EDA.",
      icon: LineChart,
      tip: "Use the Configurator on the side panel to toggle chart types, map x/y axes variables, and export premium vector SVG chart files."
    },
    "feature-engineering": {
      title: "No Features Created",
      desc: "Generate new features to improve model performance.",
      icon: Cpu,
      tip: "Feature engineering supports scaling algorithms, categorical variables encoding, mathematical column transforms, and custom imputation."
    },
    "machine-learning": {
      title: "No Model Trained",
      desc: "Select an algorithm and train your first model.",
      icon: BrainCircuit,
      tip: "ML Studio runs algorithms in the local workspace. Select a target column, evaluate model metrics, and view feature weight importances."
    },
    prediction: {
      title: "No Predictions Available",
      desc: "Run a trained model to generate predictions.",
      icon: Target,
      tip: "Prediction studio loads the locally trained classifiers to infer outcomes and risk scores on fresh inference batch datasets."
    },
    "ai-insights": {
      title: "No AI Insights Yet",
      desc: "Generate AI-powered business insights from your dataset.",
      icon: Sparkles,
      tip: "AI insights utilize large language patterns to query your dataset summary and draft anomaly summaries, correlation flags, and pipeline suggestions."
    },
    reports: {
      title: "No Reports Generated",
      desc: "Create executive-ready reports with one click.",
      icon: FileText,
      tip: "Compile summaries from EDA profiling, business metrics, or model evaluations into executive-level PDF slide files or presentations."
    },
    export: {
      title: "Nothing to Export",
      desc: "Generate reports, predictions, or datasets before exporting.",
      icon: Download,
      tip: "Assets created inside the sandbox (predictions outputs, cleaned tabular logs, PDF reports) will populate this list for bulk download."
    },
    table: {
      title: "No records found",
      desc: "Try changing your filters or upload new data.",
      icon: Database,
      tip: "Use the instant search box to locate records by name, or use the visibility checkboxes menu to customize the visible columns list."
    },
    search: {
      title: "No Results Found",
      desc: "Try another keyword or clear active filters.",
      icon: Search,
      tip: "Keywords are matched case-insensitively across column names, file formats, dates, and registered statuses."
    },
    error: {
      title: "Something Went Wrong",
      desc: "An unexpected error occurred during operation.",
      icon: AlertTriangle,
      tip: "Refer to the execution logs in the timeline panel to check stack traces, or retry the simulation rules."
    },
    network: {
      title: "Connection Lost",
      desc: "Unable to communicate with the workspace server.",
      icon: WifiOff,
      tip: "Verify your server instance is running locally or check network connectivity parameters before retrying connection."
    },
    permission: {
      title: "Access Restricted",
      desc: "You don't have permission to access this resource.",
      icon: Lock,
      tip: "Administrators can configure workspace roles, user levels, and database keys in the Workspace Settings panel."
    }
  };

  const currentText = defaultContent[type];
  const activeTitle = title || currentText.title;
  const activeDesc = description || currentText.desc;
  const Icon = currentText.icon;
  const activeTip = tip || currentText.tip;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        margin: "0 auto",
        maxWidth: 520,
        width: "100%",
        textAlign: "center",
        animation: "ws-fade-in 0.3s ease-out"
      }}
    >
      {/* Visual Vector Illustration */}
      <div style={{ marginBottom: 24, position: "relative" }}>
        {renderIllustration()}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#F8FAFC",
          margin: "0 0 8px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "center"
        }}
      >
        <Icon size={18} style={{ color: "var(--ws-module-accent, #3B82F6)" }} />
        {activeTitle}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 13,
          color: "#94A3B8",
          lineHeight: 1.5,
          margin: "0 0 24px",
          maxWidth: 420
        }}
      >
        {activeDesc}
      </p>

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="ws-btn-group" style={{ marginBottom: 28, justifyContent: "center" }}>
          {primaryAction && (
            <button
              type="button"
              className="ws-btn ws-btn-primary"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
              <ChevronRight size={14} />
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              className="ws-btn ws-btn-secondary"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}

      {/* Divider */}
      <div
        style={{
          width: "100%",
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--ws-border-soft, #2E3B52), transparent)",
          marginBottom: 16
        }}
      />

      {/* Helpful Tips Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "start",
          gap: 8,
          background: "rgba(30, 41, 59, 0.3)",
          border: "1px solid var(--ws-border-soft, #2E3B52)",
          borderRadius: 12,
          padding: 12,
          textAlign: "left",
          fontSize: 12,
          color: "#64748B",
          lineHeight: 1.4
        }}
      >
        <HelpCircle size={14} style={{ color: "#475569", flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong style={{ display: "block", color: "#94A3B8", fontSize: 11, marginBottom: 2, textTransform: "uppercase" }}>
            Workspace Guide
          </strong>
          {activeTip}
        </div>
      </div>
    </div>
  );
}
