"use client";

import { useWorkspace } from "../WorkspaceContext";
import { SECTION_REGISTRY } from "../sections";
import type { SectionId } from "../workspace.types";

/** Module-specific descriptions shown below the heading */
const MODULE_SUBTITLES: Record<SectionId, string> = {
  dashboard: "Your workspace overview, KPIs, pipeline progress, and recent activity.",
  "import-dataset": "Upload CSV, Excel, JSON, or Parquet files and connect to databases.",
  eda: "Explore, profile, validate, and prepare your dataset.",
  visualization: "Create interactive charts and business-ready visualizations.",
  "feature-engineering": "Transform, encode, scale, and engineer model-ready features.",
  "machine-learning": "Build, train, evaluate, and compare predictive models.",
  prediction: "Run inference on new data with a trained model.",
  "ai-insights": "Auto-generated insights, anomaly detection, and smart recommendations.",
  reports: "Generate shareable PDF, Excel, and PowerPoint reports.",
  export: "Export cleaned datasets, trained models, and project assets.",
  "dataset-manager": "Browse, manage, and organize all uploaded datasets.",
  "pipeline-history": "Review past pipeline runs, logs, and execution history.",
  "notification-center": "All workspace alerts, warnings, and notifications.",
  "workspace-settings": "Configure workspace preferences, integrations, and team access.",
  account: "Your profile, security settings, and account preferences.",
  projects: "Enterprise project management, team collaboration, and templates."
};

export default function ModuleHeader({ sectionId }: { sectionId?: SectionId }) {
  const { activeTab } = useWorkspace();
  const id = sectionId || activeTab?.sectionId || "dashboard";
  const meta = SECTION_REGISTRY[id];
  const Icon = meta.icon;
  const subtitle = MODULE_SUBTITLES[id] || meta.description;

  return (
    <div className="ws-module-header">
      <div className="ws-module-header-icon">
        <Icon size={24} />
      </div>
      <div className="ws-module-header-text">
        <h1>{meta.label}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
