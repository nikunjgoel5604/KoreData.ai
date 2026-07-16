"use client";

import React, { useState, useEffect } from "react";
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
  Activity,
  MoreHorizontal,
  Eye,
  Trash2,
  Plus,
  Settings,
  RotateCcw,
  Save,
  User,
  Layers,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Brain,
  Download,
  AlertCircle,
  Pin,
  X
} from "lucide-react";
import { useWorkspace } from "../WorkspaceContext";
import PipelineStepper from "./PipelineStepper";
import ModuleHeader from "./ModuleHeader";
import EmptyState from "./EmptyState";

interface Kpi {
  label: string;
  value: string;
  trend: string;
  direction: "up" | "down";
  sub: string;
  icon: any;
  points: number[];
  color: string;
  gradient: string;
  status: string;
}

interface WidgetConfig {
  id: string;
  name: string;
  visible: boolean;
  size: "small" | "medium" | "large";
  pinned: boolean;
}

function sparklineLinePath(points: number[], width = 120, height = 38) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  
  let path = "";
  const coords = points.map((p, i) => ({
    x: i * step,
    y: height - ((p - min) / range) * height
  }));

  coords.forEach((pt, i) => {
    if (i === 0) {
      path += `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    } else {
      const prev = coords[i - 1];
      const cpX1 = prev.x + step / 2;
      const cpY1 = prev.y;
      const cpX2 = pt.x - step / 2;
      const cpY2 = pt.y;
      path += ` C ${cpX1.toFixed(1)},${cpY1.toFixed(1)} ${cpX2.toFixed(1)},${cpY2.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }
  });
  return path;
}

function sparklineFillPath(points: number[], width = 120, height = 38) {
  const linePath = sparklineLinePath(points, width, height);
  return `${linePath} L ${width},${height} L 0,${height} Z`;
}

export default function OverviewPanel() {
  const { openSection, edaResult, files, trainedModelCard } = useWorkspace();

  // Widget Configuration State
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { id: "overview", name: "Workspace Overview", visible: true, size: "large", pinned: false },
    { id: "kpi", name: "KPI Cards", visible: true, size: "large", pinned: false },
    { id: "pipeline", name: "Pipeline Workflow Status", visible: true, size: "large", pinned: false },
    { id: "datasets", name: "Recent Datasets Ingestion", visible: true, size: "medium", pinned: false },
    { id: "recommendations", name: "AI Recommendations Engine", visible: true, size: "medium", pinned: false },
    { id: "activity", name: "Recent activity logs", visible: true, size: "small", pinned: false },
    { id: "ml", name: "Machine Learning Studio Models", visible: true, size: "large", pinned: false },
    { id: "predictions", name: "Prediction Analysis", visible: true, size: "medium", pinned: false },
    { id: "reports", name: "Generated Reports Compiler", visible: true, size: "small", pinned: false },
    { id: "system", name: "System Cluster Health", visible: true, size: "small", pinned: false }
  ]);

  // Load custom layouts
  useEffect(() => {
    const saved = window.localStorage.getItem("koredata-dashboard-layout");
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  const handleSaveLayout = () => {
    window.localStorage.setItem("koredata-dashboard-layout", JSON.stringify(widgets));
    alert("Dashboard layout saved successfully.");
  };

  const handleResetLayout = () => {
    const fresh = [
      { id: "overview", name: "Workspace Overview", visible: true, size: "large" as const, pinned: false },
      { id: "kpi", name: "KPI Cards", visible: true, size: "large" as const, pinned: false },
      { id: "pipeline", name: "Pipeline Workflow Status", visible: true, size: "large" as const, pinned: false },
      { id: "datasets", name: "Recent Datasets Ingestion", visible: true, size: "medium" as const, pinned: false },
      { id: "recommendations", name: "AI Recommendations Engine", visible: true, size: "medium" as const, pinned: false },
      { id: "activity", name: "Recent activity logs", visible: true, size: "small" as const, pinned: false },
      { id: "ml", name: "Machine Learning Studio Models", visible: true, size: "large" as const, pinned: false },
      { id: "predictions", name: "Prediction Analysis", visible: true, size: "medium" as const, pinned: false },
      { id: "reports", name: "Generated Reports Compiler", visible: true, size: "small" as const, pinned: false },
      { id: "system", name: "System Cluster Health", visible: true, size: "small" as const, pinned: false }
    ];
    setWidgets(fresh);
    window.localStorage.removeItem("koredata-dashboard-layout");
  };

  const handleToggleVisible = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const handleTogglePin = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, pinned: !w.pinned } : w))
    );
  };

  const handleChangeSize = (id: string, newSize: WidgetConfig["size"]) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, size: newSize } : w))
    );
  };

  // Metrics Calculations
  const realRows = edaResult?.overview?.rows ? Number(edaResult.overview.rows).toLocaleString() : "2,450,000";
  const realCols = edaResult?.overview?.columns ? String(edaResult.overview.columns) : "48";
  const realQuality = edaResult?.data_quality?.quality_score ? `${Number(edaResult.data_quality.quality_score).toFixed(1)}%` : "92.4%";
  
  let totalNulls = 0;
  let missingStr = "125.4K";
  if (edaResult?.overview?.columns_summary) {
    Object.values(edaResult.overview.columns_summary).forEach((colSummary: any) => {
      totalNulls += (colSummary.null_count || 0);
    });
    missingStr = totalNulls > 1000 ? `${(totalNulls / 1000).toFixed(1)}K` : String(totalNulls);
  }

  const KPIS_LOCAL: Kpi[] = [
    { label: "Total Rows", value: realRows, trend: "18.2%", direction: "up", sub: "vs last upload", icon: Calendar, points: [4, 6, 5, 8, 7, 9, 11, 10, 13], color: "#38BDF8", gradient: "linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)", status: "LIVE" },
    { label: "Total Columns", value: realCols, trend: "0%", direction: "up", sub: "No change", icon: BarChart3, points: [6, 6, 6, 6, 6, 6, 6, 6, 6], color: "#A855F7", gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(124, 58, 237, 0.05) 100%)", status: "HEALTHY" },
    { label: "Missing Values", value: missingStr, trend: "8.4%", direction: "down", sub: "vs last upload", icon: AlertTriangle, points: [12, 11, 10, 9, 9, 8, 7, 7, 6], color: "#F59E0B", gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)", status: "WARNING" },
    { label: "Data Quality Score", value: realQuality, trend: "6.7%", direction: "up", sub: "vs last upload", icon: CheckCircle2, points: [7, 7, 8, 8, 9, 9, 10, 11, 12], color: "#22C55E", gradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.05) 100%)", status: "UPDATED" },
    { label: "Memory Usage", value: "812 MB", trend: "12.3%", direction: "down", sub: "vs last upload", icon: HardDrive, points: [10, 9, 9, 8, 8, 7, 7, 6, 6], color: "#06B6D4", gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(8, 145, 178, 0.05) 100%)", status: "HEALTHY" },
    { label: "Processing Time", value: "2m 34s", trend: "9.1%", direction: "down", sub: "vs last upload", icon: Clock, points: [11, 10, 10, 9, 8, 8, 7, 6, 6], color: "#EF4444", gradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)", status: "LIVE" }
  ];

  const sortedWidgets = [...widgets].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return 0;
  });

  const hiddenWidgets = widgets.filter((w) => !w.visible);

  return (
    <>
      <ModuleHeader sectionId="dashboard" />

      {/* Customization & Quick Actions Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 20,
          background: "var(--ws-card-2)",
          border: "1px solid var(--ws-border)",
          borderRadius: 12,
          padding: 12
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="ws-btn ws-btn-primary" onClick={() => openSection("import-dataset")}>
            <UploadCloud size={14} /> Upload Dataset
          </button>
          <button type="button" className="ws-btn ws-btn-secondary" onClick={() => openSection("machine-learning")}>
            <Wand2 size={14} /> Train Model
          </button>
          <button type="button" className="ws-btn ws-btn-secondary" onClick={() => openSection("prediction")}>
            <TrendingUp size={14} /> Run Prediction
          </button>
          <button type="button" className="ws-btn ws-btn-secondary" onClick={() => openSection("reports")}>
            <FileText size={14} /> Generate Report
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {hiddenWidgets.length > 0 && (
            <div style={{ position: "relative" }}>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleToggleVisible(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="ws-card-2"
                style={{
                  fontSize: 11,
                  padding: "6px 20px 6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--ws-border)",
                  color: "var(--ws-text)",
                  cursor: "pointer"
                }}
                defaultValue=""
              >
                <option value="" disabled>Restore Widgets...</option>
                {hiddenWidgets.map((hw) => (
                  <option key={hw.id} value={hw.id}>{hw.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="ws-btn ws-btn-secondary"
            onClick={handleResetLayout}
            title="Reset layout grid"
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            type="button"
            className="ws-btn ws-btn-secondary"
            onClick={handleSaveLayout}
            title="Save custom dashboard layout"
          >
            <Save size={12} /> Save Layout
          </button>
        </div>
      </div>

      {/* Dynamic Widget Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20
        }}
      >
        {sortedWidgets
          .filter((w) => w.visible)
          .map((widget) => {
            const spanClass =
              widget.size === "large"
                ? "col-span-3"
                : widget.size === "medium"
                ? "col-span-2"
                : "col-span-1";

            const isPinned = widget.pinned;

            const renderWidgetHeader = () => (
              <div
                className="ws-row-between"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  paddingBottom: 10,
                  marginBottom: 14
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isPinned && <Pin size={12} style={{ color: "#8B5CF6", transform: "rotate(45deg)" }} />}
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {widget.name}
                  </h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {/* Pin button */}
                  <button
                    type="button"
                    onClick={() => handleTogglePin(widget.id)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: isPinned ? "#8B5CF6" : "#64748B" }}
                    title={isPinned ? "Unpin widget" : "Pin widget to top"}
                  >
                    <Pin size={12} style={{ transform: isPinned ? "none" : "rotate(45deg)" }} />
                  </button>
                  {/* Resize selectors */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextSize: WidgetConfig["size"] = widget.size === "small" ? "medium" : widget.size === "medium" ? "large" : "small";
                      handleChangeSize(widget.id, nextSize);
                    }}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B", fontSize: 10 }}
                    title={`Current width: ${widget.size}. Click to cycle resize.`}
                  >
                    {widget.size.toUpperCase()}
                  </button>
                  {/* Hide button */}
                  <button
                    type="button"
                    onClick={() => handleToggleVisible(widget.id)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}
                    title="Hide widget"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            );

            // Render different widget content based on id
            return (
              <div
                key={widget.id}
                className={`ws-card ${spanClass}`}
                style={{
                  gridColumn: widget.size === "large" ? "span 3" : widget.size === "medium" ? "span 2" : "span 1",
                  border: isPinned ? "1px solid #8B5CF6" : "1px solid #2E3B52"
                }}
              >
                {renderWidgetHeader()}

                {/* Widget Contents */}
                {widget.id === "overview" && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 16
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(139, 92, 246, 0.1)", color: "#8B5CF6", display: "grid", placeItems: "center" }}>
                        <Layers size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: "#64748B", display: "block" }}>WORKSPACE NAME</span>
                        <strong style={{ fontSize: 13, color: "#CBD5E1" }}>KoreData Enterprise Analytics Hub</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(34, 197, 94, 0.1)", color: "#22C55E", display: "grid", placeItems: "center" }}>
                        <User size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: "#64748B", display: "block" }}>OWNER</span>
                        <strong style={{ fontSize: 13, color: "#CBD5E1" }}>Nikunj Goel (Lead Architect)</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", display: "grid", placeItems: "center" }}>
                        <Database size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: "#64748B", display: "block" }}>ACTIVE DATASET</span>
                        <strong style={{ fontSize: 13, color: "#CBD5E1" }}>{files.length > 0 ? files[0].file_name : "Pending Upload"}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(6, 182, 212, 0.1)", color: "#06B6D4", display: "grid", placeItems: "center" }}>
                        <HardDrive size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: "#64748B", display: "block" }}>STORAGE USED</span>
                        <strong style={{ fontSize: 13, color: "#CBD5E1" }}>2.4 GB / 10 GB (24%)</strong>
                      </div>
                    </div>
                  </div>
                )}

                {widget.id === "kpi" && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: 16
                    }}
                  >
                    {KPIS_LOCAL.map((kpi) => {
                      const Icon = kpi.icon;
                      return (
                        <div
                          key={kpi.label}
                          className="ws-kpi-card"
                          style={{ margin: 0, border: "1px solid #334155" }}
                        >
                          <div className="ws-kpi-top-row">
                            <div className="ws-kpi-icon-container" style={{ background: kpi.gradient }}>
                              <Icon size={16} style={{ color: kpi.color }} />
                            </div>
                            <span className="ws-kpi-title">{kpi.label}</span>
                          </div>
                          <div className="ws-kpi-middle-row" style={{ margin: "8px 0" }}>
                            <div className="ws-kpi-number" style={{ fontSize: 24 }}>{kpi.value}</div>
                          </div>
                          <div className="ws-kpi-bottom-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span className={`ws-kpi-trend-pill ${kpi.direction}`} style={{ fontSize: 9 }}>
                              {kpi.direction === "up" ? "▲" : "▼"} {kpi.trend}
                            </span>
                            <div className="ws-kpi-sparkline-wrapper" style={{ width: 80, height: 24 }}>
                              <svg viewBox="0 0 120 38" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                                <path d={sparklineFillPath(kpi.points, 120, 38)} fill="rgba(139, 92, 246, 0.05)" />
                                <path d={sparklineLinePath(kpi.points, 120, 38)} fill="none" stroke={kpi.color} strokeWidth={1.5} />
                              </svg>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {widget.id === "pipeline" && (
                  <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 12, padding: 14 }}>
                    <PipelineStepper />
                  </div>
                )}

                {widget.id === "datasets" && (
                  <div className="ws-table-wrapper" style={{ maxHeight: 220, overflowY: "auto" }}>
                    {files.length === 0 ? (
                      <EmptyState
                        type="table"
                        title="No datasets imported"
                        description="Drag and drop or select CSV analytics sheets."
                        primaryAction={{ label: "Upload Dataset", onClick: () => openSection("import-dataset") }}
                      />
                    ) : (
                      <table className="ws-table">
                        <thead>
                          <tr>
                            <th>Dataset</th>
                            <th>Rows</th>
                            <th>Cols</th>
                            <th>Quality</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {files.map((f) => (
                            <tr key={f.id}>
                              <td>
                                <span className="ws-table-name" onClick={() => openSection("import-dataset")}>
                                  {f.file_name}
                                </span>
                              </td>
                              <td>{Number(f.row_count ?? 12500).toLocaleString()}</td>
                              <td>{f.col_count ?? 24}</td>
                              <td>
                                <span className="ws-status-badge-header ready">
                                  {(f as any).quality_score ? `${(f as any).quality_score}%` : "98.4%"}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="ws-action-btn danger"
                                  onClick={() => alert("Deleting dataset profile...")}
                                  title="Delete dataset profile"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {widget.id === "recommendations" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { t: "Improve Quality", d: "Null values exceed 5% on age. Impute cells.", i: AlertCircle, c: "#EF4444" },
                      { t: "Suggested Cleaning", d: "Remove duplicate customer rows.", i: Wand2, c: "#F59E0B" },
                      { t: "Recommended Model", d: "Random Forest provides classification fit.", i: Brain, c: "#22C55E" },
                      { t: "Suggested Viz", d: "Plot boxplots to outline target bounds.", i: BarChart3, c: "#3B82F6" }
                    ].map((rec, rIdx) => {
                      const Icon = rec.i;
                      return (
                        <div
                          key={rIdx}
                          className="ws-card-2"
                          style={{ padding: 10, display: "flex", gap: 10, alignItems: "flex-start" }}
                        >
                          <Icon size={14} style={{ color: rec.c, marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <strong style={{ fontSize: 11, color: "var(--ws-text)", display: "block" }}>{rec.t}</strong>
                            <p style={{ margin: "2px 0 0", fontSize: 9.5, color: "var(--ws-text-muted)", lineHeight: 1.3 }}>{rec.d}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {widget.id === "activity" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { t: "Model trained successfully", s: "Random Forest fits 94.8% accuracy", time: "2m ago" },
                      { t: "EDA quality profile built", s: "Finished profiling dataset", time: "10m ago" },
                      { t: "Dataset schema loaded", s: "Parsed 24 columns in memory", time: "30m ago" }
                    ].map((act, aIdx) => (
                      <div key={aIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: 11 }}>
                        <div>
                          <strong style={{ color: "var(--ws-text)", display: "block" }}>{act.t}</strong>
                          <span style={{ color: "var(--ws-text-muted)" }}>{act.s}</span>
                        </div>
                        <span style={{ color: "var(--ws-text-muted)", fontSize: 9 }}>{act.time}</span>
                      </div>
                    ))}
                  </div>
                )}

                {widget.id === "ml" && (
                  <div className="ws-table-wrapper">
                    <table className="ws-table">
                      <thead>
                        <tr>
                          <th>Model Algorithm</th>
                          <th>Accuracy</th>
                          <th>Precision</th>
                          <th>Recall</th>
                          <th>F1-Score</th>
                          <th>Feature Importance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "Random Forest Classifier", acc: "94.8%", p: "94.1%", r: "95.5%", f1: "94.8%", feat: "age (34%), income (28%)", status: "DEPLOYED" },
                          { name: "XGBoost Classifier", acc: "96.2%", p: "95.9%", r: "96.5%", f1: "96.2%", feat: "tenure (40%), savings (22%)", status: "STAGING" },
                          { name: "Logistic Regression", acc: "89.4%", p: "88.1%", r: "90.7%", f1: "89.4%", feat: "income (52%), age (18%)", status: "OFFLINE" }
                        ].map((m, mIdx) => (
                          <tr key={mIdx}>
                            <td><strong>{m.name}</strong></td>
                            <td>{m.acc}</td>
                            <td>{m.p}</td>
                            <td>{m.r}</td>
                            <td>{m.f1}</td>
                            <td><span style={{ fontSize: 10, color: "#64748B" }}>{m.feat}</span></td>
                            <td>
                              <span
                                className="ws-status-badge-header ready"
                                style={{
                                  background: m.status === "DEPLOYED" ? "rgba(34,197,94,0.1)" : m.status === "STAGING" ? "rgba(59,130,246,0.1)" : "rgba(100,116,139,0.1)",
                                  color: m.status === "DEPLOYED" ? "#22C55E" : m.status === "STAGING" ? "#3B82F6" : "#94A3B8"
                                }}
                              >
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {widget.id === "predictions" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <span style={{ fontSize: 10, color: "var(--ws-text-muted)" }}>LATEST INFERENCES</span>
                        <strong style={{ fontSize: 13, color: "var(--ws-text)", display: "block" }}>Customer Churn Batch Inferences</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: "var(--ws-text-muted)" }}>AVERAGE CONFIDENCE</span>
                        <strong style={{ fontSize: 13, color: "var(--ws-text)", display: "block" }}>94.2%</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: "var(--ws-text-muted)" }}>HIGH RISK ALERTS</span>
                        <strong style={{ fontSize: 13, color: "var(--ws-danger)", display: "block" }}>142 Accounts flagged Churn</strong>
                      </div>
                    </div>
                    {/* Mock prob curve SVG */}
                    <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 8, padding: 8, display: "grid", placeItems: "center" }}>
                      <svg viewBox="0 0 100 50" style={{ width: "100%", height: "100%" }}>
                        <path d="M 10 40 Q 40 10 70 30 T 90 20" fill="none" stroke="#8B5CF6" strokeWidth={2} />
                        <text x={10} y={48} fill="#64748B" fontSize={8}>0.0</text>
                        <text x={85} y={48} fill="#64748B" fontSize={8}>1.0</text>
                      </svg>
                    </div>
                  </div>
                )}

                {widget.id === "reports" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { name: "Monthly Sales Report.pdf", time: "10m ago", size: "2.4 MB" },
                      { name: "Customer Churn Insights.docx", time: "1h ago", size: "1.8 MB" }
                    ].map((rep, rIdx) => (
                      <div
                        key={rIdx}
                        className="ws-card-2"
                        style={{ padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <div style={{ overflow: "hidden" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ws-text)", display: "block", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {rep.name}
                          </span>
                          <span style={{ fontSize: 9, color: "var(--ws-text-muted)" }}>Generated {rep.time} • {rep.size}</span>
                        </div>
                        <button
                          type="button"
                          className="ws-action-btn"
                          onClick={() => alert("Downloading report files...")}
                          title="Download report"
                        >
                          <Download size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {widget.id === "system" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748B" }}>Database</span>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748B" }}>API Gate</span>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748B" }}>AI Engine</span>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748B" }}>GPU Cluster</span>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#64748B" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748B" }}>CPU (24%)</span>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748B" }}>Memory (812M)</span>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        className="ws-fab"
        onClick={() => openSection("import-dataset")}
        title="Upload Dataset"
      >
        <Plus size={24} />
      </button>
    </>
  );
}
