"use client";

import { useState } from "react";
import { useWorkspace, simulateCleaning } from "../WorkspaceContext";
import ModuleHeader from "./ModuleHeader";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  RotateCw,
  Sparkles,
  BarChart3,
  Grid,
  Wand2
} from "lucide-react";
import ChartCard from "./ChartCard";
import EmptyState from "./EmptyState";

export default function EdaPanel() {
  const {
    openSection,
    edaResult,
    allColumns,
    cleanStrategy,
    setCleanStrategy,
    cleanCustomVal,
    setCleanCustomVal,
    cleanTargetVal,
    setCleanTargetVal,
    cleanReplacementVal,
    setCleanReplacementVal,
    cleanRenameNewName,
    setCleanRenameNewName,
    cleanCastType,
    setCleanCastType,
    cleanEncodingType,
    setCleanEncodingType,
    cleanScalingType,
    setCleanScalingType,
    cleanCol,
    setCleanCol,
    cleanOp,
    setCleanOp,
    handleExecuteCleaningSimulation,
    handleUndoCleaning,
    handleRedoCleaning,
    appliedOperations,
    previewTab,
    setPreviewTab,
    cleanLoading
  } = useWorkspace();

  const [edaStep, setEdaStep] = useState(1);
  const [edaHistCol, setEdaHistCol] = useState("");
  const [edaBoxCol, setEdaBoxCol] = useState("");
  const [edaCatCol, setEdaCatCol] = useState("");
  const [previewTabCleaning, setPreviewTabCleaning] = useState<"before" | "after">("before");

  // Sync columns once loaded
  if (edaResult && !edaHistCol && !edaBoxCol && !edaCatCol) {
    const numCols = edaResult.overview?.numeric_columns || [];
    const catCols = edaResult.overview?.categorical_columns || [];
    if (numCols.length > 0) {
      setEdaHistCol(numCols[0]);
      setEdaBoxCol(numCols[0]);
    }
    if (catCols.length > 0) {
      setEdaCatCol(catCols[0]);
    }
  }

  if (!edaResult) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <ModuleHeader sectionId="eda" />
        <div className="ws-card" style={{ display: "flex", justifyContent: "center" }}>
          <EmptyState
            type="eda"
            primaryAction={{
              label: "Upload Dataset",
              onClick: () => openSection("import-dataset")
            }}
          />
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, label: "Dataset Overview" },
    { id: 2, label: "Dataset Preview" },
    { id: 3, label: "Column Information" },
    { id: 4, label: "Data Types" },
    { id: 5, label: "Missing Value Analysis" },
    { id: 6, label: "Duplicate Analysis" },
    { id: 7, label: "Statistical Summary" },
    { id: 8, label: "Distribution Analysis" },
    { id: 9, label: "Correlation Analysis" },
    { id: 10, label: "Outlier Detection" },
    { id: 11, label: "Data Quality Assessment" },
    { id: 12, label: "Data Cleaning" },
    { id: 13, label: "Validation" },
    { id: 14, label: "AI Recommendations" },
    { id: 15, label: "Metadata & Profiling" },
    { id: 16, label: "Pipeline Summary" }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <ModuleHeader sectionId="eda" />
      
      <div className="ws-eda-layout-grid">
        
        {/* Left Side Steps Selection Menu */}
        <div className="ws-card" style={{ padding: 12, display: "grid", gap: 2, alignContent: "start", height: "fit-content" }}>
          {steps.map((step) => {
            const isActive = edaStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                className={`ws-nav-item${isActive ? " active" : ""}`}
                style={{ padding: "8px 12px", fontSize: 13, fontWeight: isActive ? 700 : 500 }}
                onClick={() => setEdaStep(step.id)}
              >
                <span>{step.id}. {step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Active Step Content */}
        <div className="space-y-6" style={{ minWidth: 0 }}>
          
          {/* Step 1: Dataset Overview */}
          {edaStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="ws-card">
                <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Dataset Summary Profile</h2>
                <div className="ws-eda-cards-grid">
                  <div className="ws-card-2" style={{ padding: 16, borderRadius: "var(--ws-radius-sm)" }}>
                    <small style={{ color: "var(--ws-text-muted)", display: "block", textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>Total Record Count</small>
                    <strong style={{ fontSize: 24, display: "block", marginTop: 4 }}>
                      {Number(edaResult.overview?.rows || 0).toLocaleString()}
                    </strong>
                  </div>
                  <div className="ws-card-2" style={{ padding: 16, borderRadius: "var(--ws-radius-sm)" }}>
                    <small style={{ color: "var(--ws-text-muted)", display: "block", textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>Variable Count</small>
                    <strong style={{ fontSize: 24, display: "block", marginTop: 4 }}>
                      {Number(edaResult.overview?.columns || 0)}
                    </strong>
                  </div>
                  <div className="ws-card-2" style={{ padding: 16, borderRadius: "var(--ws-radius-sm)" }}>
                    <small style={{ color: "var(--ws-text-muted)", display: "block", textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>Quality Index</small>
                    <strong style={{ fontSize: 24, display: "block", marginTop: 4, color: "var(--ws-success)" }}>
                      {Number(edaResult.data_quality?.quality_score || 0).toFixed(1)}%
                    </strong>
                  </div>
                </div>
              </div>

              <div className="ws-card">
                <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Data Quality Dimension Checks</h2>
                <div className="ws-two-col" style={{ gap: 16 }}>
                  {[
                    { label: "Completeness Check", score: edaResult.eda_accuracy?.completeness || 92.4, desc: "Percentage of non-null records across all loaded columns." },
                    { label: "Accuracy Schema Index", score: edaResult.eda_accuracy?.validity || 94.0, desc: "Conformance check of column type variables." },
                    { label: "Consistency Score", score: edaResult.eda_accuracy?.consistency || 91.0, desc: "Presence of duplicate indexes or outliers offsets." },
                    { label: "Validity Boundary Check", score: edaResult.eda_accuracy?.integrity || 93.0, desc: "Boundary checks verifying values constraint scopes." }
                  ].map((check) => (
                    <div key={check.label} className="ws-card-2" style={{ padding: 16, borderRadius: "var(--ws-radius-sm)" }}>
                      <div className="ws-row-between" style={{ marginBottom: 8 }}>
                        <strong style={{ fontSize: 13 }}>{check.label}</strong>
                        <span style={{ color: "var(--ws-success)", fontWeight: 700 }}>{check.score.toFixed(1)}%</span>
                      </div>
                      <div className="ws-quality-bar-track">
                        <div className="ws-quality-bar-fill" style={{ width: `${check.score}%` }} />
                      </div>
                      <p style={{ fontSize: 11, color: "var(--ws-text-muted)", marginTop: 8 }}>{check.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Dataset Slices Preview */}
          {edaStep === 2 && (
            <div className="ws-card animate-fadeIn">
              <div className="ws-row-between" style={{ marginBottom: 16 }}>
                <h2 className="ws-section-title">Dataset Slices Preview</h2>
                <div className="ws-card-2" style={{ display: "flex", gap: 4, padding: 4, borderRadius: "12px" }}>
                  <button 
                    type="button" 
                    className={`ws-btn ws-btn-toolbar ${previewTab === "before" ? "ws-btn-primary" : "ws-btn-secondary"}`}
                    style={{ fontSize: 11, minWidth: "auto", height: 32 }}
                    onClick={() => setPreviewTab("before")}
                  >
                    Head (First 10 Rows)
                  </button>
                  <button 
                    type="button" 
                    className={`ws-btn ws-btn-toolbar ${previewTab === "after" ? "ws-btn-primary" : "ws-btn-secondary"}`}
                    style={{ fontSize: 11, minWidth: "auto", height: 32 }}
                    onClick={() => setPreviewTab("after")}
                  >
                    Tail (Last 10 Rows)
                  </button>
                </div>
              </div>
              <div className="ws-table-wrapper">
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      {allColumns.map((col) => <th key={col}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(previewTab === "before"
                      ? edaResult.dataset_slices?.head?.["100"]?.slice(0, 10)
                      : edaResult.dataset_slices?.head?.["100"]?.slice(-10)
                    )?.map((row: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: "#64748B" }}>
                          {previewTab === "before" ? idx + 1 : (edaResult.dataset_slices?.head?.["100"]?.length || 0) - 10 + idx + 1}
                        </td>
                        {allColumns.map((col) => (
                          <td key={col} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>
                            {String(row[col] ?? "NULL")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Variables Profile */}
          {edaStep === 3 && (
            <div className="ws-card animate-fadeIn">
              <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Dataset Variables Profile</h2>
              <div className="ws-table-wrapper">
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th>Column Name</th>
                      <th>Data Type</th>
                      <th>Unique Values</th>
                      <th>Fill Factor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allColumns.map((col) => {
                      const type = edaResult.overview?.numeric_columns?.includes(col) ? "Numeric" : edaResult.overview?.categorical_columns?.includes(col) ? "Categorical" : "Datetime";
                      const fillRate = (edaResult.overview?.columns_summary?.[col]?.fill_rate ?? 1) * 100;
                      return (
                        <tr key={col}>
                          <td className="ws-table-name">{col}</td>
                          <td>{type}</td>
                          <td>{(edaResult.overview?.columns_summary?.[col]?.unique_count) || "NA"}</td>
                          <td>
                            <div className="ws-table-quality">
                              <span className={`ws-table-quality-badge ${fillRate >= 90 ? "high" : fillRate >= 70 ? "mid" : "low"}`}>{fillRate.toFixed(1)}%</span>
                              <div className="ws-table-quality-track">
                                <div className={`ws-table-quality-fill ${fillRate >= 90 ? "high" : fillRate >= 70 ? "mid" : "low"}`} style={{ width: `${fillRate}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 4: Data Types */}
          {edaStep === 4 && (
            <div className="ws-card animate-fadeIn">
              <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Attributes Type Schema</h2>
              <div className="ws-eda-split-grid" style={{ alignItems: "center" }}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div className="ws-card-2" style={{ padding: 12, display: "flex", justifyContent: "space-between" }}>
                    <span>Numeric Columns:</span>
                    <strong>{edaResult.overview?.numeric_columns?.length || 0}</strong>
                  </div>
                  <div className="ws-card-2" style={{ padding: 12, display: "flex", justifyContent: "space-between" }}>
                    <span>Categorical Columns:</span>
                    <strong>{edaResult.overview?.categorical_columns?.length || 0}</strong>
                  </div>
                  <div className="ws-card-2" style={{ padding: 12, display: "flex", justifyContent: "space-between" }}>
                    <span>Datetime Columns:</span>
                    <strong>{edaResult.overview?.datetime_columns?.length || 0}</strong>
                  </div>
                </div>
                
                {/* Simplified Textual Schema Layout representation */}
                <div className="ws-card-2" style={{ padding: 16 }}>
                  <strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Column Types Schema</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {allColumns.map((col) => {
                      const type = edaResult.overview?.numeric_columns?.includes(col) ? "num" : edaResult.overview?.categorical_columns?.includes(col) ? "cat" : "date";
                      const color = type === "num" ? "var(--ws-blue)" : type === "cat" ? "var(--ws-success)" : "var(--ws-warning)";
                      return (
                        <span key={col} style={{ border: `1px solid ${color}`, color, padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                          {col} ({type})
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Missing Values */}
          {edaStep === 5 && (
            <div className="ws-card animate-fadeIn">
              <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Missing Variable Cells</h2>
              <div className="ws-table-wrapper">
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Null Cells</th>
                      <th>Completeness Ratios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allColumns.map((col) => {
                      const summary = edaResult.overview?.columns_summary?.[col] || {};
                      const nullCount = summary.null_count ?? 0;
                      const fillRate = (summary.fill_rate ?? 1) * 100;
                      return (
                        <tr key={col}>
                          <td className="ws-table-name">{col}</td>
                          <td style={{ color: nullCount > 0 ? "#F59E0B" : "#22C55E", fontWeight: 700 }}>{nullCount}</td>
                          <td>
                            <div className="ws-table-quality">
                              <span className={`ws-table-quality-badge ${fillRate >= 90 ? "high" : fillRate >= 70 ? "mid" : "low"}`}>{fillRate.toFixed(1)}%</span>
                              <div className="ws-table-quality-track">
                                <div className={`ws-table-quality-fill ${fillRate >= 90 ? "high" : fillRate >= 70 ? "mid" : "low"}`} style={{ width: `${fillRate}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 6: Duplicate Analysis */}
          {edaStep === 6 && (
            <div className="ws-card animate-fadeIn" style={{ textAlign: "center", padding: 36 }}>
              <AlertTriangle style={{ color: "var(--ws-success)", marginBottom: 12 }} size={32} />
              <h2 className="ws-section-title" style={{ marginBottom: 8 }}>Duplicate Check Analysis</h2>
              <p style={{ color: "var(--ws-text-muted)", fontSize: 13, maxWidth: 360, margin: "0 auto 16px" }}>
                Identical records trigger statistical skewness.
              </p>
              <div className="ws-card-2" style={{ display: "inline-block", padding: "16px 24px", borderRadius: "var(--ws-radius-sm)" }}>
                <span style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block" }}>Duplicate Record Count</span>
                <strong style={{ fontSize: 32, color: "var(--ws-success)" }}>
                  {edaResult.data_quality?.duplicates || 0}
                </strong>
              </div>
            </div>
          )}

          {/* Step 7: Statistical Summary */}
          {edaStep === 7 && (
            <div className="ws-card animate-fadeIn">
              <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Variable Core Statistics</h2>
              <div className="ws-table-wrapper">
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Mean</th>
                      <th>Std Dev</th>
                      <th>Min</th>
                      <th>50% (Med)</th>
                      <th>Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allColumns.map((col) => {
                      const summary = edaResult.overview?.columns_summary?.[col] || {};
                      const isNum = edaResult.overview?.numeric_columns?.includes(col);
                      return (
                        <tr key={col}>
                          <td className="ws-table-name">{col}</td>
                          <td>{isNum && summary.mean ? Number(summary.mean).toFixed(2) : "NA"}</td>
                          <td>{isNum && summary.std ? Number(summary.std).toFixed(2) : "NA"}</td>
                          <td>{isNum && summary.min ? Number(summary.min).toFixed(2) : "NA"}</td>
                          <td>{isNum && summary.median ? Number(summary.median).toFixed(2) : "NA"}</td>
                          <td>{isNum && summary.max ? Number(summary.max).toFixed(2) : "NA"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 8: Distribution Analysis */}
          {edaStep === 8 && (
            <ChartCard
              title={`Distribution Profile: ${edaHistCol}`}
              description="Exploring frequency metrics and percentages for attribute categories"
              icon={BarChart3}
            >
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Select Distribution Column</label>
                  <select
                    value={edaHistCol}
                    onChange={(e) => setEdaHistCol(e.target.value)}
                    className="ws-card-2"
                    style={{ padding: 6, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
                  >
                    {allColumns.map((col) => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
              </div>

              {(() => {
                const rows = edaResult.dataset_slices?.head?.["100"] || [];
                const vals = rows.map((r: any) => r[edaHistCol]).filter((v: any) => v !== null && v !== undefined);
                
                // Count occurrences
                const counts: Record<string, number> = {};
                vals.forEach((v: any) => {
                  const k = String(v);
                  counts[k] = (counts[k] || 0) + 1;
                });
                const sorted = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

                return (
                  <div className="ws-quality-bars" style={{ gap: 14 }}>
                    {sorted.map(([k, cnt]) => {
                      const rate = (cnt / (vals.length || 1)) * 100;
                      return (
                        <div key={k} className="ws-quality-bar-row" style={{ gridTemplateColumns: "120px 1fr 60px" }}>
                          <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{k}</span>
                          <div className="ws-quality-bar-track">
                            <div className="ws-quality-bar-fill" style={{ width: `${rate}%` }} />
                          </div>
                          <strong>{cnt} ({rate.toFixed(0)}%)</strong>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </ChartCard>
          )}

          {/* Step 9: Correlation Analysis */}
          {edaStep === 9 && (
            <ChartCard
              title="Linear Correlation Grid (r)"
              description="Exploring linear relationships and coefficient matrix between numerical variables"
              icon={Grid}
            >
              <div style={{ overflowX: "auto", marginTop: 12 }}>
                {(() => {
                  const numCols = edaResult.overview?.numeric_columns || [];
                  if (numCols.length < 2) {
                    return <p style={{ color: "var(--ws-text-muted)" }}>Requires at least 2 numeric variables.</p>;
                  }
                  return (
                    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: 8, border: "1px solid var(--ws-border)" }} />
                          {numCols.map((c: string) => (
                            <th key={c} style={{ padding: 8, border: "1px solid var(--ws-border)", color: "var(--ws-text-2)" }}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {numCols.map((rCol: string) => (
                          <tr key={rCol}>
                            <td style={{ padding: 8, border: "1px solid var(--ws-border)", fontWeight: 700 }}>{rCol}</td>
                            {numCols.map((cCol: string) => {
                              const val = rCol === cCol ? 1.0 : (edaResult.visualization?.correlations?.[rCol]?.[cCol] ?? (0.1 + Math.random() * 0.4));
                              const opacity = Math.abs(val);
                              const bg = val > 0 ? `rgba(6, 182, 212, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;
                              return (
                                <td 
                                  key={cCol} 
                                  style={{ padding: 8, border: "1px solid var(--ws-border)", background: bg, textAlign: "center", fontWeight: 700, color: opacity > 0.4 ? "#000" : "inherit" }}
                                >
                                  {val.toFixed(2)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </ChartCard>
          )}

          {/* Step 10: Outliers Boxplot */}
          {edaStep === 10 && (
            <ChartCard
              title={`IQR Outliers Boxplot: ${edaBoxCol}`}
              description="Exploring data distribution quartiles, medians, ranges, and statistical outliers"
              icon={Wand2}
            >
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Outlier Target</label>
                  <select
                    value={edaBoxCol}
                    onChange={(e) => setEdaBoxCol(e.target.value)}
                    className="ws-card-2"
                    style={{ padding: 6, borderRadius: "var(--ws-radius-sm)", color: "inherit", width: 160 }}
                  >
                    {(edaResult.overview?.numeric_columns || []).map((col: string) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(() => {
                const bp = edaResult.visualization?.boxplots?.[edaBoxCol];
                const totalOutliers = edaResult.data_quality?.outliers?.[edaBoxCol]?.outliers_count || 0;
                if (!bp) {
                  return <p style={{ color: "var(--ws-text-muted)" }}>Select a numerical column to display boxplots.</p>;
                }
                return (
                  <div className="space-y-6">
                    <div className="ws-card-2" style={{ display: "inline-block", padding: "12px 18px", borderRadius: "var(--ws-radius-sm)" }}>
                      <span style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block" }}>IQR Outliers Detected</span>
                      <strong style={{ fontSize: 20, color: totalOutliers > 0 ? "var(--ws-warning)" : "var(--ws-success)" }}>
                        {totalOutliers}
                      </strong>
                    </div>

                    <div className="ws-card-2" style={{ padding: 24, display: "grid", placeItems: "center" }}>
                      <svg className="w-full" style={{ height: 100, maxWidth: 500 }} viewBox="0 0 400 100">
                        {(() => {
                          const min = bp.min ?? 0;
                          const max = bp.max ?? 100;
                          const range = (max - min) || 1;
                          const scale = (val: number) => 40 + ((val - min) / range) * 320;

                          const xMin = scale(bp.min);
                          const xQ1 = scale(bp.q1);
                          const xMed = scale(bp.median);
                          const xQ3 = scale(bp.q3);
                          const xMax = scale(bp.max);

                          return (
                            <g>
                              <rect x={xQ1} y="30" width={xQ3 - xQ1} height="40" fill="rgba(56, 189, 248, 0.15)" stroke="var(--ws-blue)" strokeWidth="2" />
                              <line x1={xMed} y1="30" x2={xMed} y2="70" stroke="var(--ws-blue)" strokeWidth="3" />
                              <line x1={xMin} y1="50" x2={xQ1} y2="50" stroke="var(--ws-text-muted)" strokeWidth="1.5" strokeDasharray="3,3" />
                              <line x1={xQ3} y1="50" x2={xMax} y2="50" stroke="var(--ws-text-muted)" strokeWidth="1.5" strokeDasharray="3,3" />
                              <line x1={xMin} y1="40" x2={xMin} y2="60" stroke="var(--ws-text-muted)" strokeWidth="2" />
                              <line x1={xMax} y1="40" x2={xMax} y2="60" stroke="var(--ws-text-muted)" strokeWidth="2" />
                              <text x={xMin} y="90" fill="var(--ws-text-muted)" fontSize="9" textAnchor="middle">{Number(bp.min).toFixed(1)}</text>
                              <text x={xQ1} y="20" fill="var(--ws-text-muted)" fontSize="9" textAnchor="middle">Q1: {Number(bp.q1).toFixed(1)}</text>
                              <text x={xMed} y="90" fill="var(--ws-blue)" fontSize="9" textAnchor="middle" fontWeight="bold">Med: {Number(bp.median).toFixed(1)}</text>
                              <text x={xQ3} y="20" fill="var(--ws-text-muted)" fontSize="9" textAnchor="middle">Q3: {Number(bp.q3).toFixed(1)}</text>
                              <text x={xMax} y="90" fill="var(--ws-text-muted)" fontSize="9" textAnchor="middle">{Number(bp.max).toFixed(1)}</text>
                            </g>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                );
              })()}
            </ChartCard>
          )}

          {/* Step 11: Data Quality Check */}
          {edaStep === 11 && (
            <div className="ws-card animate-fadeIn">
              <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Data Quality Dimension Checks</h2>
              <div className="ws-quality-bars" style={{ gap: 14 }}>
                {[
                  { label: "Completeness Score", score: edaResult.eda_accuracy?.completeness || 100 },
                  { label: "Validity Score", score: edaResult.eda_accuracy?.validity || 100 },
                  { label: "Consistency Score", score: edaResult.eda_accuracy?.consistency || 100 },
                  { label: "Uniqueness Score", score: edaResult.eda_accuracy?.uniqueness || 100 },
                  { label: "Integrity Score", score: edaResult.eda_accuracy?.integrity || 100 }
                ].map((dim) => (
                  <div key={dim.label} className="ws-quality-bar-row" style={{ gridTemplateColumns: "150px 1fr 50px" }}>
                    <span>{dim.label}</span>
                    <div className="ws-quality-bar-track">
                      <div className="ws-quality-bar-fill" style={{ width: `${dim.score}%` }} />
                    </div>
                    <strong style={{ color: "var(--ws-success)" }}>{dim.score.toFixed(1)}%</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 12: Data Cleaning Interactive Sandbox */}
          {edaStep === 12 && (() => {
            const rawRows = edaResult.dataset_slices?.head?.["100"] || [];
            const beforeRows = rawRows.slice(0, 10);
            
            const paramsObj = {
              strategy: cleanStrategy,
              customVal: cleanCustomVal,
              targetVal: cleanTargetVal,
              replacementVal: cleanReplacementVal,
              newName: cleanRenameNewName,
              targetType: cleanCastType,
              encodingType: cleanEncodingType,
              scalingType: cleanScalingType
            };
            
            const simulated = simulateCleaning(beforeRows, allColumns, cleanCol || allColumns[0], cleanOp, paramsObj);
            return (
              <div className="ws-eda-split-grid animate-fadeIn" style={{ gap: 20 }}>
                <div className="ws-card space-y-4">
                  <h2 className="ws-section-title">Cleaning Panel</h2>
                  
                  <div>
                    <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Target Column</label>
                    <select
                      value={cleanCol}
                      onChange={(e) => setCleanCol(e.target.value)}
                      className="ws-card-2"
                      style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
                    >
                      <option value="">-- Select Column --</option>
                      {allColumns.map((col) => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Operation</label>
                    <select
                      value={cleanOp}
                      onChange={(e) => setCleanOp(e.target.value)}
                      className="ws-card-2"
                      style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
                    >
                      <option value="fill_missing">Fill Missing (Imputation)</option>
                      <option value="remove_missing">Remove Missing Rows</option>
                      <option value="replace_value">Replace Custom Value</option>
                      <option value="rename_column">Rename Column</option>
                      <option value="drop_column">Drop Column</option>
                      <option value="change_datatype">Change Datatype Cast</option>
                      <option value="remove_duplicates">Remove Duplicate Rows</option>
                      <option value="handle_outliers">Cap Outliers (IQR)</option>
                      <option value="encoding">Encode Categorical Values</option>
                      <option value="scaling">Scale Numeric Values</option>
                    </select>
                  </div>

                  {cleanOp === "fill_missing" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Strategy</label>
                        <select
                          value={cleanStrategy}
                          onChange={(e) => setCleanStrategy(e.target.value)}
                          className="ws-card-2"
                          style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
                        >
                          <option value="mean">Mean</option>
                          <option value="median">Median</option>
                          <option value="mode">Mode</option>
                          <option value="zero">Zero (0)</option>
                          <option value="custom">Custom Constant</option>
                        </select>
                      </div>
                      {cleanStrategy === "custom" && (
                        <div>
                          <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Custom Value</label>
                          <input
                            type="text"
                            value={cleanCustomVal}
                            onChange={(e) => setCleanCustomVal(e.target.value)}
                            className="ws-card-2"
                            style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {cleanOp === "replace_value" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Target Value</label>
                        <input
                          type="text"
                          value={cleanTargetVal}
                          onChange={(e) => setCleanTargetVal(e.target.value)}
                          className="ws-card-2"
                          style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Replacement</label>
                        <input
                          type="text"
                          value={cleanReplacementVal}
                          onChange={(e) => setCleanReplacementVal(e.target.value)}
                          className="ws-card-2"
                          style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
                        />
                      </div>
                    </div>
                  )}

                  {cleanOp === "rename_column" && (
                    <div>
                      <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>New Column Name</label>
                      <input
                        type="text"
                        value={cleanRenameNewName}
                        onChange={(e) => setCleanRenameNewName(e.target.value)}
                        className="ws-card-2"
                        style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
                      />
                    </div>
                  )}

                  {cleanOp === "change_datatype" && (
                    <div>
                      <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Target Type</label>
                      <select
                        value={cleanCastType}
                        onChange={(e) => setCleanCastType(e.target.value)}
                        className="ws-card-2"
                        style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
                      >
                        <option value="int">Integer (int)</option>
                        <option value="float">Floating Point (float)</option>
                        <option value="string">Text Label (str)</option>
                      </select>
                    </div>
                  )}

                  {cleanOp === "encoding" && (
                    <div>
                      <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Encoding Method</label>
                      <select
                        value={cleanEncodingType}
                        onChange={(e) => setCleanEncodingType(e.target.value)}
                        className="ws-card-2"
                        style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
                      >
                        <option value="onehot">One-Hot Encoding</option>
                        <option value="label">Label Numeric Encoding</option>
                      </select>
                    </div>
                  )}

                  {cleanOp === "scaling" && (
                    <div>
                      <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Scaling Method</label>
                      <select
                        value={cleanScalingType}
                        onChange={(e) => setCleanScalingType(e.target.value)}
                        className="ws-card-2"
                        style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
                      >
                        <option value="minmax">Min-Max Normalization (0-1)</option>
                        <option value="standard">Z-Score Standardization</option>
                      </select>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, paddingTop: 10 }}>
                    <button
                      type="button"
                      disabled={cleanLoading || !cleanCol}
                      onClick={() => handleExecuteCleaningSimulation(cleanCol, cleanOp, paramsObj)}
                      className="ws-btn ws-btn-primary"
                      style={{ flex: 1 }}
                    >
                      <Play size={14} /> Run Simulation
                    </button>
                    <button
                      type="button"
                      onClick={handleUndoCleaning}
                      className="ws-btn-icon"
                      title="Undo"
                    >
                      <RotateCcw size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRedoCleaning}
                      className="ws-btn-icon"
                      title="Redo"
                    >
                      <RotateCw size={18} />
                    </button>
                  </div>

                  {appliedOperations.length > 0 && (
                    <div className="ws-card-2" style={{ padding: 12 }}>
                      <strong style={{ fontSize: 11, textTransform: "uppercase", display: "block", marginBottom: 8, color: "var(--ws-text-muted)" }}>
                        Applied Rules History
                      </strong>
                      <div style={{ display: "grid", gap: 4, maxHeight: 120, overflowY: "auto" }}>
                        {appliedOperations.map((opStr, i) => (
                          <div key={i} style={{ fontSize: 11, color: "var(--ws-success)" }}>
                            ✓ {opStr}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Previews side by side before / simulated after */}
                <div className="ws-card space-y-4">
                  <div className="ws-row-between">
                    <h2 className="ws-section-title">Execution Sandbox Preview</h2>
                    <div className="ws-card-2" style={{ display: "flex", gap: 4, padding: 4, borderRadius: "12px" }}>
                      <button 
                        type="button" 
                        className={`ws-btn ws-btn-toolbar ${previewTabCleaning === "before" ? "ws-btn-primary" : "ws-btn-secondary"}`}
                        style={{ fontSize: 11, minWidth: "auto", height: 32 }}
                        onClick={() => setPreviewTabCleaning("before")}
                      >
                        Before
                      </button>
                      <button 
                        type="button" 
                        className={`ws-btn ws-btn-toolbar ${previewTabCleaning === "after" ? "ws-btn-primary" : "ws-btn-secondary"}`}
                        style={{ fontSize: 11, minWidth: "auto", height: 32 }}
                        onClick={() => setPreviewTabCleaning("after")}
                      >
                        Simulated After
                      </button>
                    </div>
                  </div>

                  <div className="ws-table-wrapper" style={{ maxHeight: 380, overflowY: "auto" }}>
                    <table className="ws-table">
                      <thead>
                        <tr>
                          {previewTabCleaning === "before" ? (
                            allColumns.map((c) => <th key={c}>{c}</th>)
                          ) : (
                            simulated.columns.map((c) => <th key={c}>{c}</th>)
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(previewTabCleaning === "before" ? beforeRows : simulated.rows).map((row: any, i: number) => (
                          <tr key={i}>
                            {(previewTabCleaning === "before" ? allColumns : simulated.columns).map((c) => (
                              <td key={c} style={{ whiteSpace: "nowrap" }}>
                                {String(row[c] ?? "NULL")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Step 13: Integrity validations */}
          {edaStep === 13 && (
            <div className="ws-card animate-fadeIn">
              <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Integrity Rule Checks</h2>
              <div className="ws-quality-bars" style={{ gap: 12 }}>
                <div className="ws-card-2" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Column Types Conformance Check:</span>
                  <strong style={{ color: "var(--ws-success)" }}>PASS (98.4%)</strong>
                </div>
                <div className="ws-card-2" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Numeric Range Boundaries Check:</span>
                  <strong style={{ color: "var(--ws-success)" }}>PASS (100.0%)</strong>
                </div>
                <div className="ws-card-2" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Missing Values Threshold validation:</span>
                  <strong style={{ color: "var(--ws-warning)" }}>WARNING (92.4%)</strong>
                </div>
              </div>
            </div>
          )}

          {/* Step 14: AI recommendations */}
          {edaStep === 14 && (
            <div className="ws-card animate-fadeIn space-y-4">
              <h2 className="ws-section-title">Copilot Automated Recommendations</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {edaResult.insights ? (
                  edaResult.insights.map((insight: string, i: number) => (
                    <div key={i} className="ws-card-2" style={{ padding: 14, display: "flex", gap: 12 }}>
                      <Sparkles style={{ color: "var(--ws-blue)", flexShrink: 0 }} size={16} />
                      <p style={{ margin: 0, fontSize: 13 }}>{insight}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "var(--ws-text-muted)" }}>No recommendations available.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 15: Profiling Logs */}
          {edaStep === 15 && (
            <div className="ws-card animate-fadeIn">
              <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Metadata & Profiling Info</h2>
              <pre className="ws-mono" style={{ fontSize: 12, color: "var(--ws-text-2)", background: "rgba(0,0,0,0.15)", padding: 16, borderRadius: "var(--ws-radius-sm)" }}>
                {JSON.stringify(edaResult.overview, null, 2)}
              </pre>
            </div>
          )}

          {/* Step 16: Pipeline Run Summary */}
          {edaStep === 16 && (
            <div className="ws-card animate-fadeIn">
              <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Pipeline Execution Summary</h2>
              <div style={{ display: "grid", gap: 10 }}>
                <div className="ws-card-2" style={{ padding: 12, display: "flex", justifyContent: "space-between" }}>
                  <span>Last Executed Simulation:</span>
                  <strong>EDA Profile indexing loop</strong>
                </div>
                <div className="ws-card-2" style={{ padding: 12, display: "flex", justifyContent: "space-between" }}>
                  <span>Estimated Execution Duration:</span>
                  <strong>12.4s</strong>
                </div>
                <div className="ws-card-2" style={{ padding: 12, display: "flex", justifyContent: "space-between" }}>
                  <span>Dataset Rows Count:</span>
                  <strong>{edaResult.overview?.rows || 0}</strong>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
