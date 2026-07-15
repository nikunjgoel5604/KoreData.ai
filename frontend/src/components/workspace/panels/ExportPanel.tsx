"use client";

import { useWorkspace } from "../WorkspaceContext";
import ModuleHeader from "./ModuleHeader";

export default function ExportPanel() {
  const { edaResult, addLog } = useWorkspace();

  if (!edaResult) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <ModuleHeader sectionId="export" />
        <div className="ws-card">
          <p style={{ color: "var(--ws-text-muted)", fontSize: 14 }}>
            No active dataset profile. Please upload a file to export workspace assets.
          </p>
        </div>
      </div>
    );
  }

  const exportAssets = [
    { title: "Processed Dataset", format: "CSV / Parquet", size: "4.2 MB", desc: "Download the fully cleaned and transformed dataset matrix." },
    { title: "ML Model Binary", format: "JOBLIB / PKL", size: "1.8 MB", desc: "Download the trained random forest/gradient boosted estimator." },
    { title: "Jupyter Python Notebook", format: "IPYNB", size: "120 KB", desc: "Download the full 10-stage analytics pipeline in code format." },
    { title: "SQL Migration Script", format: "SQL", size: "15 KB", desc: "Download schema definitions and custom transformation queries." },
    { title: "Visualizations Package", format: "SVG / PNG ZIP", size: "890 KB", desc: "Download all saved dashboard charts and correlation heatmaps." },
    { title: "Unified Project ZIP", format: "ZIP Bundle", size: "6.9 MB", desc: "Download the complete workspace state, models, logs, and datasets." }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <ModuleHeader sectionId="export" />
      
      <div className="ws-quick-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {exportAssets.map((asset) => (
          <div 
            key={asset.title} 
            className="ws-card" 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "space-between", 
              height: 190,
              padding: 16
            }}
          >
            <div>
              <strong style={{ fontSize: 13, textTransform: "uppercase", display: "block", color: "var(--ws-text-2)" }}>{asset.title}</strong>
              <span style={{ fontSize: 10, color: "var(--ws-blue)", display: "block", marginTop: 4, fontWeight: 700 }}>
                {asset.format} • {asset.size}
              </span>
              <p style={{ fontSize: 11, color: "var(--ws-text-muted)", marginTop: 8, lineHeight: 1.5 }}>{asset.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                alert(`Exporting ${asset.title} in progress...`);
                addLog("Exporter", `Triggered export for asset: ${asset.title}`, "success");
              }}
              className="ws-btn"
              style={{ width: "100%", padding: 6, justifyContent: "center", fontSize: 11 }}
            >
              Download Asset
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
