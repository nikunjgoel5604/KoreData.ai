"use client";

import {
  Calendar,
  Database,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Clock,
  Sparkles,
  BarChart3,
  PieChart,
  FileText,
  UploadCloud,
  Wand2,
  Activity
} from "lucide-react";
import { useWorkspace } from "../WorkspaceContext";
import PipelineStepper from "./PipelineStepper";

// ── Placeholder demo data ────────────────────────────────────────────────
// Phase 2 will replace this with real values from /upload, /activity, and
// /ml/* endpoints. Kept as typed data here so swapping in live data later
// is a drop-in replacement, not a rewrite.

interface Kpi {
  label: string;
  value: string;
  trend: string;
  direction: "up" | "down";
  sub: string;
  icon: typeof Database;
  points: number[];
  color: string;
}

const KPIS: Kpi[] = [
  { label: "Total Rows", value: "2.45M", trend: "18.2%", direction: "up", sub: "vs last upload", icon: Calendar, points: [4, 6, 5, 8, 7, 9, 11, 10, 13], color: "#38bdf8" },
  { label: "Total Columns", value: "48", trend: "0%", direction: "up", sub: "No change", icon: BarChart3, points: [6, 6, 6, 6, 6, 6, 6, 6, 6], color: "#94a3b8" },
  { label: "Missing Values", value: "125.4K", trend: "8.4%", direction: "down", sub: "vs last upload", icon: AlertTriangle, points: [12, 11, 10, 9, 9, 8, 7, 7, 6], color: "#f59e0b" },
  { label: "Data Quality Score", value: "92.4%", trend: "6.7%", direction: "up", sub: "vs last upload", icon: CheckCircle2, points: [7, 7, 8, 8, 9, 9, 10, 11, 12], color: "#22c55e" },
  { label: "Memory Usage", value: "812 MB", trend: "12.3%", direction: "down", sub: "vs last upload", icon: HardDrive, points: [10, 9, 9, 8, 8, 7, 7, 6, 6], color: "#a855f7" },
  { label: "Processing Time", value: "2m 34s", trend: "9.1%", direction: "down", sub: "vs last upload", icon: Clock, points: [11, 10, 10, 9, 8, 8, 7, 6, 6], color: "#06b6d4" }
];

function sparklinePath(points: number[], width = 100, height = 30) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  return points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const RECENT_WORKSPACES = [
  { name: "Sales Analysis Q2", sub: "Sales performance analysis", dataset: "sales_q2_2026.csv", updated: "10 mins ago", quality: 92.4, steps: 4 },
  { name: "Customer Churn Prediction", sub: "ML churn prediction model", dataset: "churn_data.xlsx", updated: "1 hour ago", quality: 88.1, steps: 5 },
  { name: "Marketing Campaign ROI", sub: "Campaign effectiveness analysis", dataset: "marketing_2026.csv", updated: "Yesterday", quality: 76.8, steps: 3 },
  { name: "Revenue Forecasting", sub: "Time series revenue forecast", dataset: "revenue_data.csv", updated: "2 days ago", quality: 91.2, steps: 6 }
];

const ACTIVITY = [
  { icon: BarChart3, title: "Visualization created", sub: "Sales distribution by region", time: "2 min ago" },
  { icon: Activity, title: "EDA completed", sub: "Missing value analysis finished", time: "5 min ago" },
  { icon: UploadCloud, title: "Dataset uploaded", sub: "sales_q2_2026.csv (2.45M rows)", time: "10 min ago" },
  { icon: Wand2, title: "Data cleaning applied", sub: "125.4K missing values filled", time: "15 min ago" },
  { icon: Sparkles, title: "Outlier detection completed", sub: "3.2K outliers identified", time: "20 min ago" }
];

const QUICK_ACCESS: { label: string; icon: typeof UploadCloud }[] = [
  { label: "Import Dataset", icon: UploadCloud },
  { label: "New EDA", icon: BarChart3 },
  { label: "Create Chart", icon: PieChart },
  { label: "ML Studio", icon: Wand2 },
  { label: "AI Insights", icon: Sparkles },
  { label: "Generate Report", icon: FileText }
];

const QUALITY_BREAKDOWN = [
  { label: "Completeness", value: 94 },
  { label: "Consistency", value: 91 },
  { label: "Accuracy", value: 93 },
  { label: "Validity", value: 90 },
  { label: "Uniqueness", value: 92 }
];

function qualityClass(score: number) {
  if (score >= 85) return "high";
  if (score >= 70) return "mid";
  return "low";
}

export default function OverviewPanel() {
  const { openSection, edaResult } = useWorkspace();

  const realRows = edaResult?.overview?.rows ? Number(edaResult.overview.rows).toLocaleString() : "2.45M";
  const realCols = edaResult?.overview?.columns ? String(edaResult.overview.columns) : "48";
  const realQuality = edaResult?.data_quality?.quality_score ? `${Number(edaResult.data_quality.quality_score).toFixed(1)}%` : "92.4%";
  
  // Calculate total missing cells
  let missingStr = "125.4K";
  if (edaResult?.overview?.columns_summary) {
    let totalNulls = 0;
    Object.values(edaResult.overview.columns_summary).forEach((colSummary: any) => {
      totalNulls += (colSummary.null_count || 0);
    });
    missingStr = totalNulls > 1000 ? `${(totalNulls / 1000).toFixed(1)}K` : String(totalNulls);
  }

  const KPIS_LOCAL = [
    { label: "Total Rows", value: realRows, trend: "18.2%", direction: "up", sub: "vs last upload", icon: Calendar, points: [4, 6, 5, 8, 7, 9, 11, 10, 13], color: "#38bdf8" },
    { label: "Total Columns", value: realCols, trend: "0%", direction: "up", sub: "No change", icon: BarChart3, points: [6, 6, 6, 6, 6, 6, 6, 6, 6], color: "#94a3b8" },
    { label: "Missing Values", value: missingStr, trend: "8.4%", direction: "down", sub: "vs last upload", icon: AlertTriangle, points: [12, 11, 10, 9, 9, 8, 7, 7, 6], color: "#f59e0b" },
    { label: "Data Quality Score", value: realQuality, trend: "6.7%", direction: "up", sub: "vs last upload", icon: CheckCircle2, points: [7, 7, 8, 8, 9, 9, 10, 11, 12], color: "#22c55e" },
    { label: "Memory Usage", value: "812 MB", trend: "12.3%", direction: "down", sub: "vs last upload", icon: HardDrive, points: [10, 9, 9, 8, 8, 7, 7, 6, 6], color: "#a855f7" },
    { label: "Processing Time", value: "2m 34s", trend: "9.1%", direction: "down", sub: "vs last upload", icon: Clock, points: [11, 10, 10, 9, 8, 8, 7, 6, 6], color: "#06b6d4" }
  ];

  return (
    <>
      <div className="ws-row-between">
        <h1 className="ws-page-title">Workspace Hub</h1>
      </div>

      {/* Pipeline stepper */}
      <div className="ws-card">
        <div className="ws-pipeline-header">
          <div>
            <div className="ws-pipeline-eyebrow">Analytics Pipeline</div>
            <div className="ws-pipeline-title">Your workflow progress</div>
          </div>
          <button type="button" className="ws-btn ws-btn-primary" onClick={() => openSection("eda")}>
            View Pipeline
          </button>
        </div>
        <PipelineStepper />
      </div>

      {/* KPI grid */}
      <div className="ws-kpi-grid">
        {KPIS_LOCAL.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div className="ws-kpi-card" key={kpi.label}>
              <div className="ws-kpi-top">
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ws-text-2)" }}>{kpi.label}</span>
                <span className="ws-kpi-icon">
                  <Icon size={16} />
                </span>
              </div>
              <div>
                <div className="ws-kpi-value">{kpi.value}</div>
                <span className={`ws-kpi-trend ${kpi.direction}`}>
                  {kpi.direction === "up" ? "↑" : "↓"} {kpi.trend}
                </span>
              </div>
              <svg className="ws-sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d={sparklinePath(kpi.points)} fill="none" stroke={kpi.color} strokeWidth={2} />
              </svg>
              <div className="ws-kpi-sub">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Recent workspaces + activity */}
      <div className="ws-two-col">
        <div className="ws-card">
          <div className="ws-row-between" style={{ marginBottom: 14 }}>
            <h2 className="ws-section-title">Recent Workspaces</h2>
            <a className="ws-link" href="#">
              View All →
            </a>
          </div>
          <div className="ws-scroll" style={{ overflowX: "auto" }}>
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Workspace Name</th>
                  <th>Dataset</th>
                  <th>Updated</th>
                  <th>Quality Score</th>
                  <th>Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_WORKSPACES.map((w) => (
                  <tr key={w.name}>
                    <td>
                      <span className="ws-table-name">{w.name}</span>
                      <span className="ws-table-sub">{w.sub}</span>
                    </td>
                    <td>{w.dataset}</td>
                    <td>{w.updated}</td>
                    <td>
                      <span className={`ws-quality-chip ${qualityClass(w.quality)}`}>{w.quality}%</span>
                    </td>
                    <td>
                      <div className="ws-mini-steps">
                        {Array.from({ length: w.steps }).map((_, i) => (
                          <span className="ws-mini-step" key={i}>
                            {i + 1}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ws-card">
          <div className="ws-row-between" style={{ marginBottom: 14 }}>
            <h2 className="ws-section-title">Pipeline Activity</h2>
            <a className="ws-link" href="#">
              View All →
            </a>
          </div>
          <div className="ws-activity">
            {ACTIVITY.map((a) => {
              const Icon = a.icon;
              return (
                <div className="ws-activity-item" key={a.title + a.time}>
                  <span className="ws-activity-icon">
                    <Icon size={16} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="ws-activity-title">{a.title}</div>
                    <div className="ws-activity-sub">{a.sub}</div>
                  </div>
                  <span className="ws-activity-time">{a.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick access + data quality */}
      <div className="ws-two-col">
        <div className="ws-card">
          <h2 className="ws-section-title" style={{ marginBottom: 14 }}>
            Quick Access
          </h2>
          <div className="ws-quick-grid">
            {QUICK_ACCESS.map((q) => {
              const Icon = q.icon;
              return (
                <button
                  type="button"
                  key={q.label}
                  className="ws-quick-item"
                  onClick={() => openSection("import-dataset")}
                >
                  <span className="ws-quick-icon">
                    <Icon size={18} />
                  </span>
                  {q.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ws-card">
          <div className="ws-row-between" style={{ marginBottom: 14 }}>
            <h2 className="ws-section-title">Data Quality Overview</h2>
            <a className="ws-link" href="#">
              View Details →
            </a>
          </div>
          <div className="ws-quality-layout">
            <div
              className="ws-donut"
              style={{
                background: `conic-gradient(var(--ws-success) 0% 92.4%, var(--ws-card-2) 92.4% 100%)`
              }}
            >
              <div className="ws-donut-value">
                <strong>92.4%</strong>
                <span>Overall Score</span>
              </div>
            </div>
            <div className="ws-quality-bars">
              {QUALITY_BREAKDOWN.map((q) => (
                <div className="ws-quality-bar-row" key={q.label}>
                  <span>{q.label}</span>
                  <div className="ws-quality-bar-track">
                    <div
                      className="ws-quality-bar-fill"
                      style={{
                        width: `${q.value}%`,
                        background: q.value >= 90 ? "var(--ws-success)" : "var(--ws-warning)"
                      }}
                    />
                  </div>
                  <span>{q.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
