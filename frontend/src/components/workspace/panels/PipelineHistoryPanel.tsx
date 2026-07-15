"use client";

import { useWorkspace } from "../WorkspaceContext";
import { Clock } from "lucide-react";
import ModuleHeader from "./ModuleHeader";

export default function PipelineHistoryPanel() {
  const { logs } = useWorkspace();

  return (
    <div className="space-y-6 animate-fadeIn">
      <ModuleHeader sectionId="pipeline-history" />
      
      <div className="ws-card">
        <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Execution Logs Timeline</h2>
        
        <div style={{ display: "grid", gap: 12 }}>
          {logs.map((log, idx) => {
            let color = "var(--ws-blue)";
            if (log.type === "success") color = "var(--ws-success)";
            if (log.type === "warning") color = "var(--ws-warning)";
            if (log.type === "error") color = "var(--ws-danger)";

            return (
              <div 
                key={idx} 
                className="ws-card-2 ws-row-between" 
                style={{ 
                  padding: 12,
                  borderLeft: `3px solid ${color}`,
                  borderRadius: "var(--ws-radius-sm)"
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Clock size={14} style={{ color: "var(--ws-text-muted)" }} />
                  <span style={{ fontSize: 11, color: "var(--ws-text-muted)" }}>{log.timestamp}</span>
                  <span 
                    className="ws-badge" 
                    style={{ 
                      fontSize: 10, 
                      background: "rgba(0,0,0,0.15)", 
                      color: "inherit",
                      border: "1px solid var(--ws-border)"
                    }}
                  >
                    {log.node}
                  </span>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 500 }}>{log.message}</p>
                </div>
                <span style={{ fontSize: 10, textTransform: "uppercase", color, fontWeight: 700 }}>
                  {log.type}
                </span>
              </div>
            );
          })}
          {logs.length === 0 && (
            <p style={{ color: "var(--ws-text-muted)", textAlign: "center", padding: 24, margin: 0 }}>
              No execution records recorded. Run simulation pipelines or clean data to log actions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
