import {
  LayoutGrid,
  UploadCloud,
  Activity,
  BarChart3,
  Layers,
  Brain,
  TrendingUp,
  Sparkles,
  FileText,
  Download,
  Database,
  Clock,
  Bell,
  User,
  Folder,
  type LucideIcon
} from "lucide-react";
import type { NavGroupId, SectionId } from "./workspace.types";

export interface SectionMeta {
  id: SectionId;
  label: string;
  icon: LucideIcon;
  group: NavGroupId;
  description: string;
}

export const SECTION_REGISTRY: Record<SectionId, SectionMeta> = {
  dashboard: {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    group: "platform",
    description: "Workspace overview, KPIs, and recent activity."
  },
  projects: {
    id: "projects",
    label: "My Projects",
    icon: Folder,
    group: "platform",
    description: "Enterprise project management, collaboration, and settings."
  },
  "import-dataset": {
    id: "import-dataset",
    label: "Import Dataset",
    icon: UploadCloud,
    group: "platform",
    description: "Upload a CSV, Excel, JSON, or Parquet dataset."
  },
  eda: {
    id: "eda",
    label: "EDA",
    icon: Activity,
    group: "pipeline",
    description: "Exploratory data analysis — stats, distributions, correlations."
  },
  visualization: {
    id: "visualization",
    label: "Visualization",
    icon: BarChart3,
    group: "pipeline",
    description: "Build charts and interactive visual explorations."
  },
  "feature-engineering": {
    id: "feature-engineering",
    label: "Feature Engineering",
    icon: Layers,
    group: "pipeline",
    description: "Transform, encode, and engineer model-ready features."
  },
  "machine-learning": {
    id: "machine-learning",
    label: "Machine Learning",
    icon: Brain,
    group: "pipeline",
    description: "Train, compare, and evaluate ML models."
  },
  prediction: {
    id: "prediction",
    label: "Prediction",
    icon: TrendingUp,
    group: "pipeline",
    description: "Run inference on new data with a trained model."
  },
  "ai-insights": {
    id: "ai-insights",
    label: "AI Insights",
    icon: Sparkles,
    group: "pipeline",
    description: "Auto-generated insights, anomalies, and recommendations."
  },
  reports: {
    id: "reports",
    label: "Reports",
    icon: FileText,
    group: "pipeline",
    description: "Generate shareable PDF / PPTX / Excel reports."
  },
  export: {
    id: "export",
    label: "Export",
    icon: Download,
    group: "pipeline",
    description: "Export cleaned datasets, charts, and trained models."
  },
  "dataset-manager": {
    id: "dataset-manager",
    label: "Dataset Manager",
    icon: Database,
    group: "data",
    description: "Browse and manage all uploaded datasets."
  },
  "pipeline-history": {
    id: "pipeline-history",
    label: "Pipeline History",
    icon: Clock,
    group: "data",
    description: "Past pipeline runs and their outcomes."
  },
  "notification-center": {
    id: "notification-center",
    label: "Notification Center",
    icon: Bell,
    group: "data",
    description: "All workspace notifications in one place."
  },
  "workspace-settings": {
    id: "workspace-settings",
    label: "Workspace Settings",
    icon: Settings,
    group: "admin",
    description: "Workspace-level configuration and preferences."
  },
  account: {
    id: "account",
    label: "Account",
    icon: User,
    group: "admin",
    description: "Your profile, security, and account settings."
  }
};

export const NAV_GROUPS: { id: NavGroupId; label: string; sections: SectionId[] }[] = [
  { id: "platform", label: "Platform", sections: ["dashboard", "projects", "import-dataset"] },
  {
    id: "pipeline",
    label: "Analytics Pipeline",
    sections: [
      "eda",
      "visualization",
      "feature-engineering",
      "machine-learning",
      "prediction",
      "ai-insights",
      "reports",
      "export"
    ]
  },
  {
    id: "data",
    label: "Data Management",
    sections: ["dataset-manager", "pipeline-history", "notification-center"]
  },
  { id: "admin", label: "Administration", sections: ["workspace-settings", "account"] }
];
