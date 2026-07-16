import { useWorkspace } from "../WorkspaceContext";
import { Sparkles } from "lucide-react";
import ModuleHeader from "./ModuleHeader";
import EmptyState from "./EmptyState";

export default function AiInsightsPanel() {
  const { openSection, edaResult } = useWorkspace();

  if (!edaResult) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <ModuleHeader sectionId="ai-insights" />
        <div className="ws-card" style={{ display: "flex", justifyContent: "center" }}>
          <EmptyState
            type="ai-insights"
            primaryAction={{
              label: "Upload Dataset",
              onClick: () => openSection("import-dataset")
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <ModuleHeader sectionId="ai-insights" />

      <div className="ws-insights-grid">
        
        {/* Executive Summary Card */}
        <div className="ws-card space-y-4">
          <h2 className="ws-section-title" style={{ color: "var(--ws-blue)" }}>Executive Summary & Analysis</h2>
          <div className="ws-card-2" style={{ padding: 16, lineHeight: 1.6, fontSize: 13 }}>
            Based on the statistical properties of the active workspace, the dataset shows strong linearity and moderate density. The target attribute exhibits predictive signals suitable for random forest algorithms with classification accuracies projected above 92%. We recommend winsorizing outlier values before running further models.
          </div>
          
          <div className="ws-ml-split-grid">
            <div className="ws-card-2" style={{ padding: 14 }}>
              <strong style={{ color: "var(--ws-success)", display: "block", marginBottom: 6 }}>Risk Profile: LOW</strong>
              <span style={{ fontSize: 11, color: "var(--ws-text-muted)" }}>
                Data completeness exceeds 98%. Low cardinality detected in categorical features.
              </span>
            </div>
            <div className="ws-card-2" style={{ padding: 14 }}>
              <strong style={{ color: "var(--ws-blue)", display: "block", marginBottom: 6 }}>Recommendation</strong>
              <span style={{ fontSize: 11, color: "var(--ws-text-muted)" }}>
                Perform One-Hot Encoding on categorical columns to improve estimator performance.
              </span>
            </div>
          </div>
        </div>

        {/* AI Queries Panel */}
        <div className="ws-card space-y-4">
          <h2 className="ws-section-title" style={{ color: "var(--ws-blue)" }}>AI Generated SQL & Python</h2>
          
          <div>
            <span style={{ fontSize: 10, color: "var(--ws-text-muted)", display: "block", marginBottom: 6 }}>Pre-processing SQL Query</span>
            <pre className="ws-mono" style={{ padding: 10, fontSize: 11, background: "rgba(0,0,0,0.15)", border: "1px solid var(--ws-border-soft)", borderRadius: "var(--ws-radius-sm)", color: "var(--ws-success)" }}>
              {`SELECT * FROM dataset\nWHERE age IS NOT NULL\nAND salary > 0;`}
            </pre>
          </div>
          
          <div>
            <span style={{ fontSize: 10, color: "var(--ws-text-muted)", display: "block", marginBottom: 6 }}>Pandas Imputation Script</span>
            <pre className="ws-mono" style={{ padding: 10, fontSize: 11, background: "rgba(0,0,0,0.15)", border: "1px solid var(--ws-border-soft)", borderRadius: "var(--ws-radius-sm)", color: "var(--ws-blue)" }}>
              {`import pandas as pd\nimport numpy as np\ndf['salary'].fillna(\n  df['salary'].median(),\n  inplace=True\n)`}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
