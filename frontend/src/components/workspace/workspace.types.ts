// workspace.types.ts — shared types for the /workspace module (Phase 1 foundation)

export type SectionId =
  | "dashboard"
  | "import-dataset"
  | "eda"
  | "visualization"
  | "feature-engineering"
  | "machine-learning"
  | "prediction"
  | "ai-insights"
  | "reports"
  | "export"
  | "dataset-manager"
  | "pipeline-history"
  | "notification-center"
  | "workspace-settings"
  | "account"
  | "projects";

export type NavGroupId = "platform" | "pipeline" | "data" | "admin";

export interface WorkspaceTab {
  /** Unique instance id (allows re-opening the same section later if needed) */
  id: string;
  sectionId: SectionId;
  title: string;
  pinned: boolean;
  closable: boolean;
}

export type PipelineStepStatus = "done" | "current" | "pending" | "failed";

export interface PipelineStep {
  step: number;
  key: string;
  name: string;
  status: PipelineStepStatus;
}
