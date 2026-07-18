"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
  type ChangeEvent
} from "react";
import { SECTION_REGISTRY, NAV_GROUPS } from "./sections";
import type { SectionId, WorkspaceTab } from "./workspace.types";
import { getMockWorkspaceData } from "./mockData";

const STORAGE_KEY = "koredata-workspace-tabs-v1";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export interface LogEntry {
  timestamp: string;
  node: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export interface UploadedFile {
  id: number;
  file_name: string;
  file_type: string;
  file_size_kb: number;
  row_count?: number;
  col_count?: number;
  uploaded_at?: string;
}

export interface WorkspaceContextValue {
  // Active Workspace context (Sales, Churn, Marketing, Revenue, Custom or project ID)
  activeWorkspace: string;
  token: string | null;
  changeWorkspace: (workspaceId: string) => void;

  projects: any[];
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
  addProject: (projectData: any) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  updateProject: (id: string, updates: any) => void;
  toggleFavoriteProject: (id: string) => void;
  shareProject: (id: string, email: string, role: string) => Promise<boolean>;
  projectsFilter: string;
  setProjectsFilter: (filter: string) => void;
  createProjectFromTemplate: (templateKey: string) => void;

  // Tabs core
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  activeTab: WorkspaceTab | null;
  openSection: (sectionId: SectionId) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  togglePin: (tabId: string) => void;
  reorderTab: (fromIndex: number, toIndex: number) => void;

  // AI assistant drawer state
  assistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;

  // Ingested data analytics core state
  edaResult: any;
  setEdaResult: (result: any) => void;
  uploading: boolean;
  files: UploadedFile[];
  setFiles: (files: UploadedFile[]) => void;
  
  // Pipeline simulation running states
  simRunning: boolean;
  simProgress: number;
  currentStageKey: string | null;
  stageStatuses: Record<string, string>;
  logs: LogEntry[];
  addLog: (node: string, message: string, type?: LogEntry["type"]) => void;

  // Functions & Handlers
  handleUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleReuseFile: (fileId: number, fileName: string) => Promise<void>;
  handleRemoveFile: (fileId: number) => Promise<void>;
  handleStartSimulation: () => void;
  handleStopAllOperations: () => void;
  apiStatus: "loading" | "ready" | "error";
  statusMessage: string;
  
  // Shared options & UI controllers
  aiTab: "chat" | "code" | "insights" | "history";
  setAiTab: (tab: "chat" | "code" | "insights" | "history") => void;
  aiMessages: { sender: "user" | "ai"; text: string }[];
  setAiMessages: React.Dispatch<React.SetStateAction<{ sender: "user" | "ai"; text: string }[]>>;
  aiInputText: string;
  setAiInputText: (txt: string) => void;

  // ML / Models states
  models: any[];
  savedModels: any[];
  mlHistory: any[];
  trainedModelCard: any;
  setTrainedModelCard: (card: any) => void;

  // Visualizer configs
  vizChartType: string;
  setVizChartType: (t: string) => void;
  vizXAxis: string;
  setVizXAxis: (col: string) => void;
  vizYAxis: string;
  setVizYAxis: (col: string) => void;
  vizColorTheme: string;
  setVizColorTheme: (theme: string) => void;

  // Dynamic calculations helpers
  allColumns: string[];
  columnDistribution: { label: string; value: number }[];
  selectedColumn: string;
  setSelectedColumn: (col: string) => void;
  selectedStrategy: string;
  setSelectedStrategy: (st: string) => void;
  cleanLoading: boolean;
  appliedOperations: string[];
  previewTab: "before" | "after";
  setPreviewTab: (tab: "before" | "after") => void;

  // Operations
  handleUndoCleaning: () => Promise<void>;
  handleRedoCleaning: () => Promise<void>;
  handleExecuteCleaningSimulation: (col: string, op: string, params: any) => Promise<void>;
  handleApplyImputation: () => Promise<void>;

  // Console runner
  codeText: string;
  setCodeText: (code: string) => void;
  consoleOutput: string;
  consoleError: string;
  consoleResult: any;
  codeRunning: boolean;
  handleRunCode: () => Promise<void>;

  // Prediction & AutoML
  targetCol: string;
  setTargetCol: (col: string) => void;
  taskHint: string;
  setTaskHint: (hint: string) => void;
  promptText: string;
  setPromptText: (txt: string) => void;
  mlRecommendLoading: boolean;
  recommendationData: any;
  setRecommendationData: (data: any) => void;
  trainingLoading: boolean | string;
  setTrainingLoading: (ld: boolean | string) => void;
  predictInputs: Record<string, string>;
  setPredictInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  predictResult: any;
  setPredictResult: (res: any) => void;
  predictLoading: boolean;
  handleRunPrediction: () => Promise<void>;
  handleGetRecommendations: () => Promise<void>;
  handleTrainModel: () => Promise<void>;
  mlAlgo: string;
  setMlAlgo: (algo: string) => void;

  // Reports
  reportType: string;
  setReportType: (t: string) => void;
  reportFormat: string;
  setReportFormat: (fmt: string) => void;
  reportCron: string;
  setReportCron: (cron: string) => void;
  handleGenerateReport: () => Promise<void>;
  generatedReportsList: any[];

  // Cleaning Step tabs state
  activeCleanStep: string;
  setActiveCleanStep: (step: string) => void;
  cleanCol: string;
  setCleanCol: (col: string) => void;
  cleanOp: string;
  setCleanOp: (op: string) => void;
  cleanStrategy: string;
  setCleanStrategy: (st: string) => void;
  cleanCustomVal: string;
  setCleanCustomVal: (v: string) => void;
  cleanTargetVal: string;
  setCleanTargetVal: (v: string) => void;
  cleanReplacementVal: string;
  setCleanReplacementVal: (v: string) => void;
  cleanRenameNewName: string;
  setCleanRenameNewName: (v: string) => void;
  cleanCastType: string;
  setCleanCastType: (v: string) => void;
  cleanEncodingType: string;
  setCleanEncodingType: (v: string) => void;
  cleanScalingType: string;
  setCleanScalingType: (v: string) => void;

  // Global settings page helper details
  user: any;
  notifications: any[];

  // Sidebar collapsible state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const SIMULATION_STAGES = [
  { key: "upload", label: "Upload & Parse", category: "Ingestion" },
  { key: "eda", label: "Structural Profile", category: "EDA Profiler" },
  { key: "cleaning", label: "Local Cleaning Rules", category: "Cleaning Sandbox" },
  { key: "visualization", label: "Visual Charting", category: "Visualizer Canvas" },
  { key: "feature", label: "One-Hot / Scalers", category: "Features Eng" },
  { key: "train", label: "Compile Models", category: "AutoML Training" },
  { key: "eval", label: "Metrics & Validation", category: "Model Evaluation" },
  { key: "export", label: "Deploy & Register", category: "Deployment" }
];

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const simulateCleaning = (rows: any[], cols: string[], col: string, op: string, params: any) => {
  let newRows = JSON.parse(JSON.stringify(rows));
  let newCols = [...cols];

  if (!col) return { rows: newRows, columns: newCols };

  if (op === "fill_missing") {
    let strategy = params.strategy;
    let fill: any = "";
    if (strategy === "mean" || strategy === "median") {
      let nums = newRows.map((r: any) => Number(r[col])).filter((v: number) => !isNaN(v));
      if (nums.length > 0) {
        nums.sort((a: number, b: number) => a - b);
        if (strategy === "mean") {
          fill = nums.reduce((sum: number, v: number) => sum + v, 0) / nums.length;
        } else {
          fill = nums[Math.floor(nums.length / 2)];
        }
      } else {
        fill = 0;
      }
    } else if (strategy === "mode") {
      let counts: Record<string, number> = {};
      newRows.forEach((r: any) => {
        if (r[col] !== null && r[col] !== undefined) {
          counts[r[col]] = (counts[r[col]] || 0) + 1;
        }
      });
      let sorted = Object.entries(counts).sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
      fill = sorted[0] ? sorted[0][0] : "";
    } else if (strategy === "zero") {
      fill = 0;
    } else {
      fill = params.customVal || "";
    }

    newRows = newRows.map((r: any) => {
      if (r[col] === null || r[col] === undefined || String(r[col]).toLowerCase() === "nan" || String(r[col]) === "") {
        r[col] = fill;
      }
      return r;
    });
  } else if (op === "remove_missing") {
    newRows = newRows.filter((r: any) => {
      let val = r[col];
      return val !== null && val !== undefined && String(val).toLowerCase() !== "nan" && String(val) !== "";
    });
  } else if (op === "replace_value") {
    let target = params.targetVal;
    let repl = params.replacementVal;
    newRows = newRows.map((r: any) => {
      if (String(r[col]) === String(target)) {
        r[col] = repl;
      }
      return r;
    });
  } else if (op === "rename_column") {
    let newName = params.newName;
    if (newName) {
      newCols = newCols.map((c) => c === col ? newName : c);
      newRows = newRows.map((r: any) => {
        r[newName] = r[col];
        delete r[col];
        return r;
      });
    }
  } else if (op === "drop_column") {
    newCols = newCols.filter((c) => c !== col);
    newRows = newRows.map((r: any) => {
      delete r[col];
      return r;
    });
  } else if (op === "change_datatype") {
    let type = params.targetType;
    newRows = newRows.map((r: any) => {
      if (type === "int") r[col] = parseInt(r[col]) || 0;
      else if (type === "float") r[col] = parseFloat(r[col]) || 0.0;
      else r[col] = String(r[col] ?? "");
      return r;
    });
  } else if (op === "remove_duplicates") {
    let seen = new Set();
    newRows = newRows.filter((r: any) => {
      let key = JSON.stringify(r);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } else if (op === "handle_outliers") {
    let nums = newRows.map((r: any) => Number(r[col])).filter((v: number) => !isNaN(v));
    if (nums.length > 4) {
      nums.sort((a: number, b: number) => a - b);
      let q1 = nums[Math.floor(nums.length * 0.25)];
      let q3 = nums[Math.floor(nums.length * 0.75)];
      let iqr = q3 - q1;
      let lower = q1 - 1.5 * iqr;
      let upper = q3 + 1.5 * iqr;
      newRows = newRows.map((r: any) => {
        let val = Number(r[col]);
        if (!isNaN(val)) {
          if (val < lower) r[col] = lower;
          else if (val > upper) r[col] = upper;
        }
        return r;
      });
    }
  } else if (op === "encoding") {
    let encType = params.encodingType;
    if (encType === "label") {
      let uniqueVals = Array.from(new Set(newRows.map((r: any) => String(r[col] ?? ""))));
      newRows = newRows.map((r: any) => {
        r[col] = uniqueVals.indexOf(String(r[col] ?? ""));
        return r;
      });
    } else {
      let uniqueVals = Array.from(new Set(newRows.map((r: any) => String(r[col] ?? ""))));
      uniqueVals.forEach((val) => {
        let cleanName = `${col}_${String(val).replace(/[^a-zA-Z0-9]/g, "_")}`;
        newCols.push(cleanName);
        newRows = newRows.map((r: any) => {
          r[cleanName] = String(r[col] ?? "") === val ? 1 : 0;
          return r;
        });
      });
      newCols = newCols.filter((c) => c !== col);
      newRows = newRows.map((r: any) => {
        delete r[col];
        return r;
      });
    }
  } else if (op === "scaling") {
    let scaleType = params.scalingType;
    let nums = newRows.map((r: any) => Number(r[col])).filter((v: number) => !isNaN(v));
    if (nums.length > 0) {
      if (scaleType === "minmax") {
        let min = Math.min(...nums);
        let max = Math.max(...nums);
        let range = (max - min) || 1;
        newRows = newRows.map((r: any) => {
          let val = Number(r[col]);
          if (!isNaN(val)) {
            r[col] = (val - min) / range;
          }
          return r;
        });
      } else {
        let mean = nums.reduce((sum: number, v: number) => sum + v, 0) / nums.length;
        let std = Math.sqrt(nums.reduce((sum: number, v: number) => sum + Math.pow(v - mean, 2), 0) / nums.length) || 1;
        newRows = newRows.map((r: any) => {
          let val = Number(r[col]);
          if (!isNaN(val)) {
            r[col] = (val - mean) / std;
          }
          return r;
        });
      }
    }
  }

  return { rows: newRows, columns: newCols };
};

const SEED_PROJECTS = [
  {
    id: "sales",
    name: "Sales Analysis Q2",
    description: "An enterprise-grade analysis of retail and wholesale sales trends in Q2.",
    icon: "trending-up",
    colorTheme: "blue",
    industryTemplate: "Retail",
    projectType: "Automated Reporting",
    visibility: "team",
    tags: ["Retail", "Sales", "Q2"],
    createdDate: "2026-05-15",
    lastModified: "2026-07-16",
    owner: "Nikunj Goel",
    status: "Active",
    datasetCount: 3,
    modelsCount: 2,
    reportsCount: 12,
    storageUsed: "4.8 MB",
    pipelineProgress: 85,
    teamMembers: [
      { name: "Nikunj Goel", email: "goel@koredata.ai", role: "Owner" },
      { name: "Sarah Connor", email: "sarah@koredata.ai", role: "Editor" }
    ],
    isFavorite: true,
    isSample: true
  },
  {
    id: "churn",
    name: "Customer Churn Prediction",
    description: "Machine learning prediction models to identify high-risk subscription cancellations.",
    icon: "brain",
    colorTheme: "purple",
    industryTemplate: "Telecom",
    projectType: "ML Classification",
    visibility: "team",
    tags: ["ML", "Churn", "Retention"],
    createdDate: "2026-04-10",
    lastModified: "2026-07-15",
    owner: "Nikunj Goel",
    status: "Active",
    datasetCount: 2,
    modelsCount: 4,
    reportsCount: 8,
    storageUsed: "12.4 MB",
    pipelineProgress: 95,
    teamMembers: [
      { name: "Nikunj Goel", email: "goel@koredata.ai", role: "Owner" },
      { name: "Alex Mercer", email: "alex@koredata.ai", role: "Viewer" }
    ],
    isFavorite: false,
    isSample: true
  },
  {
    id: "marketing",
    name: "Marketing Campaign ROI",
    description: "Attribution models tracking advertisement spend return on investment.",
    icon: "bar-chart",
    colorTheme: "cyan",
    industryTemplate: "Marketing",
    projectType: "Attribution Modeling",
    visibility: "public",
    tags: ["ROI", "Marketing", "Ads"],
    createdDate: "2026-06-01",
    lastModified: "2026-07-14",
    owner: "Nikunj Goel",
    status: "Active",
    datasetCount: 1,
    modelsCount: 1,
    reportsCount: 4,
    storageUsed: "2.1 MB",
    pipelineProgress: 60,
    teamMembers: [
      { name: "Nikunj Goel", email: "goel@koredata.ai", role: "Owner" }
    ],
    isFavorite: true,
    isSample: true
  },
  {
    id: "revenue",
    name: "Revenue Forecasting",
    description: "Predictive time-series forecasting of upcoming ARR and pipeline growth.",
    icon: "database",
    colorTheme: "green",
    industryTemplate: "Finance",
    projectType: "Time-Series Forecasting",
    visibility: "private",
    tags: ["Forecasting", "Revenue", "ARR"],
    createdDate: "2026-03-20",
    lastModified: "2026-07-16",
    owner: "Nikunj Goel",
    status: "Active",
    datasetCount: 4,
    modelsCount: 3,
    reportsCount: 18,
    storageUsed: "8.9 MB",
    pipelineProgress: 75,
    teamMembers: [
      { name: "Nikunj Goel", email: "goel@koredata.ai", role: "Owner" },
      { name: "Bruce Wayne", email: "bruce@koredata.ai", role: "Viewer" }
    ],
    isFavorite: false,
    isSample: true
  },
  {
    id: "custom",
    name: "Personal Sandbox",
    description: "Your default scratch workspace for custom datasets and quick experiments.",
    icon: "folder",
    colorTheme: "blue",
    industryTemplate: "Custom",
    projectType: "Scratchpad",
    visibility: "private",
    tags: ["Sandbox", "Custom"],
    createdDate: "2026-07-16",
    lastModified: "2026-07-17",
    owner: "Nikunj Goel",
    status: "Active",
    datasetCount: 1,
    modelsCount: 1,
    reportsCount: 0,
    storageUsed: "1.2 MB",
    pipelineProgress: 10,
    teamMembers: [
      { name: "Nikunj Goel", email: "goel@koredata.ai", role: "Owner" }
    ],
    isFavorite: false,
    isSample: false
  },
  {
    id: "shared-marketing",
    name: "Marketing ROI Dashboard",
    description: "Campaign statistics and conversion analysis shared by Sarah Smith.",
    icon: "bar-chart",
    colorTheme: "orange",
    industryTemplate: "Marketing",
    projectType: "Marketing Attribution",
    visibility: "team",
    tags: ["Marketing", "ROI", "Campaign"],
    createdDate: "2026-06-10",
    lastModified: "2026-07-15",
    owner: "Sarah Smith",
    status: "Active",
    datasetCount: 1,
    modelsCount: 1,
    reportsCount: 5,
    storageUsed: "3.2 MB",
    pipelineProgress: 75,
    teamMembers: [
      { name: "Sarah Smith", email: "sarah@koredata.ai", role: "Owner" },
      { name: "Nikunj Goel", email: "goel@koredata.ai", role: "Editor" }
    ],
    isFavorite: false,
    isSample: false,
    sharedBy: { name: "Sarah Smith", avatar: "SS", role: "Editor" }
  },
  {
    id: "shared-fraud",
    name: "Fraud Detection Pipeline",
    description: "Risk assessment ML pipelines shared by John Doe.",
    icon: "brain",
    colorTheme: "purple",
    industryTemplate: "Finance",
    projectType: "Anomaly Classification",
    visibility: "team",
    tags: ["Security", "Finance", "Anomaly"],
    createdDate: "2026-07-01",
    lastModified: "2026-07-16",
    owner: "John Doe",
    status: "Active",
    datasetCount: 2,
    modelsCount: 3,
    reportsCount: 2,
    storageUsed: "15.7 MB",
    pipelineProgress: 90,
    teamMembers: [
      { name: "John Doe", email: "john@koredata.ai", role: "Owner" },
      { name: "Nikunj Goel", email: "goel@koredata.ai", role: "Viewer" }
    ],
    isFavorite: false,
    isSample: false,
    sharedBy: { name: "John Doe", avatar: "JD", role: "Viewer" }
  }
];

const TEMPLATE_CONFIGS: Record<string, any> = {
  "blank": {
    name: "New Blank Project",
    description: "A blank workspace container to upload custom datasets and train models.",
    icon: "folder",
    colorTheme: "blue",
    industryTemplate: "Custom",
    projectType: "General Sandbox",
    tags: ["Blank", "Sandbox"]
  },
  "sales": {
    name: "Sales Analytics Project",
    description: "Pre-configured template for tracking revenue, volume, and customer sales pipelines.",
    icon: "trending-up",
    colorTheme: "cyan",
    industryTemplate: "Retail",
    projectType: "Sales Forecast",
    tags: ["Retail", "Sales", "Forecast"]
  },
  "finance": {
    name: "Finance Analytics Project",
    description: "Financial time-series forecasting, ARR, churn, and net margin analyses.",
    icon: "database",
    colorTheme: "green",
    industryTemplate: "Finance",
    projectType: "Financial Forecasting",
    tags: ["Finance", "ARR", "Margin"]
  },
  "churn": {
    name: "Customer Churn Project",
    description: "Classification model pipeline configured to predict and isolate subscriber attrition.",
    icon: "brain",
    colorTheme: "purple",
    industryTemplate: "Telecom",
    projectType: "Attrition Analytics",
    tags: ["ML", "Churn", "Retention"]
  },
  "marketing": {
    name: "Marketing Campaign Project",
    description: "Attribution and ROI modeling for advertisement channels, search traffic, and campaigns.",
    icon: "bar-chart",
    colorTheme: "orange",
    industryTemplate: "Marketing",
    projectType: "ROI Analytics",
    tags: ["ROI", "Marketing", "Ads"]
  },
  "manufacturing": {
    name: "Manufacturing Optimization Project",
    description: "Predictive maintenance and equipment anomaly detection for machinery.",
    icon: "database",
    colorTheme: "blue",
    industryTemplate: "Custom",
    projectType: "Predictive Maintenance",
    tags: ["IoT", "Anomaly", "Factory"]
  },
  "retail": {
    name: "Retail Analytics Project",
    description: "Basket analysis, customer segmentation, and product cross-selling configurations.",
    icon: "trending-up",
    colorTheme: "cyan",
    industryTemplate: "Retail",
    projectType: "Market Basket Analysis",
    tags: ["Retail", "Segmentation", "Basket"]
  },
  "healthcare": {
    name: "Healthcare Analytics Project",
    description: "Patient readmission predictions and treatment outcomes statistical models.",
    icon: "brain",
    colorTheme: "purple",
    industryTemplate: "Custom",
    projectType: "Outcome Prediction",
    tags: ["Healthcare", "ML", "Clinical"]
  },
  "custom": {
    name: "Custom Project Template",
    description: "Your custom analytics configuration template.",
    icon: "folder",
    colorTheme: "orange",
    industryTemplate: "Custom",
    projectType: "Custom Sandbox",
    tags: ["Custom", "Sandbox"]
  }
};

export function validateAndNormalizeProject(p: any): any {
  if (!p || typeof p !== "object") return null;

  const id = String(p.id || p.project_id || "").trim();
  const name = String(p.name || p.projectName || "Untitled Project").trim();
  const description = String(p.description || p.Descrip || p.desc || "").trim();
  const createdAt = String(p.createdAt || p.createdDate || p.created_at || "").trim();
  const lastModified = String(p.lastModified || p.lastModifiedDate || p.last_modified_at || p.updated_at || p.created_at || p.createdDate || "").trim();
  const storageUsed = String(p.storageUsed || p.storage_used || "0 KB").trim();
  const status = String(p.status || "Active").trim();
  const industryTemplate = String(p.industryTemplate || p.template || p.industry || "Custom").trim();
  const projectType = String(p.projectType || p.project_type || "Standard").trim();
  const owner = String(p.owner || p.ownerName || p.owner_id || "Me").trim();
  const icon = String(p.icon || "folder").trim();
  const colorTheme = String(p.colorTheme || p.color_theme || p.color || "blue").trim();
  const tags = Array.isArray(p.tags) ? p.tags.map((t: any) => String(t).trim()).filter(Boolean) : [];
  const isFavorite = !!(p.isFavorite || p.favorite || p.is_favorite);
  const isArchived = !!(p.isArchived || p.archived || p.is_archived);
  const isDeleted = !!(p.isDeleted || p.deleted || p.is_deleted);
  const pipelineProgress = typeof p.pipelineProgress === "number" ? p.pipelineProgress : (typeof p.pipeline_progress === "number" ? p.pipeline_progress : 0);
  const datasetCount = typeof p.datasetCount === "number" ? p.datasetCount : (typeof p.dataset_count === "number" ? p.dataset_count : 0);
  const modelsCount = typeof p.modelsCount === "number" ? p.modelsCount : (typeof p.models_count === "number" ? p.models_count : 0);
  const teamMembers = Array.isArray(p.teamMembers) ? p.teamMembers : (Array.isArray(p.team_members) ? p.team_members : []);
  const sharedBy = p.sharedBy || p.shared_by || null;
  const isSample = !!p.isSample;

  return {
    id, name, description, createdAt, lastModified, storageUsed, status,
    industryTemplate, projectType, owner, icon, colorTheme, tags,
    isFavorite, isArchived, isDeleted, pipelineProgress, datasetCount,
    modelsCount, teamMembers, sharedBy, isSample
  };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // Authentication & Profile helpers
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const defaultWs = getMockWorkspaceData("sales");
  const [activeWorkspace, setActiveWorkspace] = useState<string>("custom");

  // Dynamic projects list
  const [projects, setProjects] = useState<any[]>(() => {
    const rawSeed = Array.isArray(SEED_PROJECTS) ? SEED_PROJECTS : [];
    const normalizedSeed = rawSeed.map(validateAndNormalizeProject).filter(Boolean);
    
    if (typeof window === "undefined") return normalizedSeed;
    const saved = localStorage.getItem("koredata-projects");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(validateAndNormalizeProject).filter(Boolean);
        }
      } catch (e) {}
    }
    return normalizedSeed;
  });

  const [projectsFilter, setProjectsFilter] = useState<string>("all");

  // Project-specific caches
  const [projectStates, setProjectStates] = useState<Record<string, any>>(() => {
    if (typeof window === "undefined") return {};
    const saved = localStorage.getItem("koredata-project-states");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  // Custom workspace cache states
  const [customEdaResult, setCustomEdaResult] = useState<any>(null);
  const [customModels, setCustomModels] = useState<any[]>([]);
  const [customSavedModels, setCustomSavedModels] = useState<any[]>([]);
  const [customFiles, setCustomFiles] = useState<UploadedFile[]>([]);
  const [customReports, setCustomReports] = useState<any[]>([]);
  const [customLogs, setCustomLogs] = useState<LogEntry[]>([]);



  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // System states
  const [apiStatus, setApiStatus] = useState<"loading" | "ready" | "error">("loading");
  const [statusMessage, setStatusMessage] = useState("Loading Python cloud packages...");

  // Ingested data analytics core state
  const [edaResult, setEdaResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  
  // Pipeline simulation running states
  const [simRunning, setSimRunning] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [currentStageKey, setCurrentStageKey] = useState<string | null>(null);
  const [stageStatuses, setStageStatuses] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // AI assistant states
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [aiTab, setAiTab] = useState<"chat" | "code" | "insights" | "history">("chat");
  const [aiInputText, setAiInputText] = useState("");
  const [aiMessages, setAiMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Welcome to KoreData-EX AI Assistant. I can explain your dataset, recommend cleaning steps, generate reports, or compile SQL. Ask me anything!" }
  ]);

  // Model & AutoML States
  const [models, setModels] = useState<any[]>([]);
  const [savedModels, setSavedModels] = useState<any[]>([]);
  const [mlHistory, setMlHistory] = useState<any[]>([]);
  const [trainedModelCard, setTrainedModelCard] = useState<any>(null);
  
  // Visualizer configs
  const [vizChartType, setVizChartType] = useState("bar");
  const [vizXAxis, setVizXAxis] = useState("");
  const [vizYAxis, setVizYAxis] = useState("");
  const [vizColorTheme, setVizColorTheme] = useState("classic");

  // Dynamic calculations helpers
  const [selectedColumn, setSelectedColumn] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("mean");
  const [cleanLoading, setCleanLoading] = useState(false);
  const [appliedOperations, setAppliedOperations] = useState<string[]>([]);
  const [previewTab, setPreviewTab] = useState<"before" | "after">("before");
  const [cleaningHistory, setCleaningHistory] = useState<any[]>([]);
  const [cleaningRedoHistory, setCleaningRedoHistory] = useState<any[]>([]);

  // Console runner
  const [codeText, setCodeText] = useState("");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [consoleError, setConsoleError] = useState("");
  const [consoleResult, setConsoleResult] = useState<any>(null);
  const [codeRunning, setCodeRunning] = useState(false);

  // Prediction & AutoML
  const [targetCol, setTargetCol] = useState("");
  const [taskHint, setTaskHint] = useState("auto-detect");
  const [promptText, setPromptText] = useState("");
  const [mlRecommendLoading, setMlRecommendLoading] = useState(false);
  const [recommendationData, setRecommendationData] = useState<any>(null);
  const [trainingLoading, setTrainingLoading] = useState<boolean | string>(false);
  const [predictInputs, setPredictInputs] = useState<Record<string, string>>({});
  const [predictResult, setPredictResult] = useState<any>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [mlAlgo, setMlAlgo] = useState("random-forest");

  // Reports
  const [reportType, setReportType] = useState("eda");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [reportCron, setReportCron] = useState("0 0 * * *");
  const [generatedReportsList, setGeneratedReportsList] = useState<any[]>([]);

  // Cleaning inputs state
  const [activeCleanStep, setActiveCleanStep] = useState("missing");
  const [cleanCol, setCleanCol] = useState("");
  const [cleanOp, setCleanOp] = useState("fill_missing");
  const [cleanStrategy, setCleanStrategy] = useState("mean");
  const [cleanCustomVal, setCleanCustomVal] = useState("");
  const [cleanTargetVal, setCleanTargetVal] = useState("");
  const [cleanReplacementVal, setCleanReplacementVal] = useState("");
  const [cleanRenameNewName, setCleanRenameNewName] = useState("");
  const [cleanCastType, setCleanCastType] = useState("int");
  const [cleanEncodingType, setCleanEncodingType] = useState("onehot");
  const [cleanScalingType, setCleanScalingType] = useState("minmax");

  // Tab core state
  const [state, setState] = useState<StoredState>(() => defaultState());
  const [hydrated, setHydrated] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("koredata-sidebar-collapsed") === "true";
    }
    return false;
  });

  const handleSetSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("koredata-sidebar-collapsed", String(collapsed));
    }
  }, []);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token || ""}` }), [token]);
  const esRef = useRef<EventSource | null>(null);

  // --- Logs Utility ---
  const addLog = useCallback((node: string, message: string, type: LogEntry["type"] = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, node, message, type }]);
  }, []);

  // Stable workspace state ref to break callbacks dependencies cycles
  const workspaceStateRef = useRef({
    activeWorkspace,
    edaResult,
    models,
    savedModels,
    files,
    generatedReportsList,
    logs,
    trainedModelCard,
    projectStates
  });

  useEffect(() => {
    workspaceStateRef.current = {
      activeWorkspace,
      edaResult,
      models,
      savedModels,
      files,
      generatedReportsList,
      logs,
      trainedModelCard,
      projectStates
    };
  });

  // Hydrate token
  useEffect(() => {
    const savedToken = window.localStorage.getItem("koredata-token");
    if (savedToken) {
      setToken(savedToken);
    } else {
      setHydrated(true);
    }
  }, []);

  // Save workspace state to DB when it changes (debounced)
  useEffect(() => {
    if (!hydrated || !token || !activeWorkspace) return;

    const saveState = async () => {
      try {
        const headers = { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        };
        const settingsObj = {
          cleanCol, cleanOp, cleanStrategy, cleanCustomVal, cleanTargetVal,
          cleanReplacementVal, cleanRenameNewName, cleanCastType, cleanEncodingType,
          cleanScalingType, vizChartType, vizXAxis, vizYAxis, vizColorTheme,
          mlAlgo, targetCol, predictInputs
        };

        await fetch(`${API_BASE}/workspace/state`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            active_project_id: activeWorkspace,
            open_tabs_json: JSON.stringify(state.tabs),
            active_tab_id: state.activeTabId,
            workspace_settings_json: JSON.stringify(settingsObj),
            workspace_history_json: JSON.stringify(logs)
          })
        });
      } catch (e) {
        console.error("Failed to save workspace state to DB", e);
      }
    };

    const delayDebounce = setTimeout(() => {
      saveState();
    }, 1000); // 1s debounce to avoid MySQL query spam

    return () => clearTimeout(delayDebounce);
  }, [
    activeWorkspace, state.tabs, state.activeTabId, hydrated, token,
    cleanCol, cleanOp, cleanStrategy, cleanCustomVal, cleanTargetVal,
    cleanReplacementVal, cleanRenameNewName, cleanCastType, cleanEncodingType,
    cleanScalingType, vizChartType, vizXAxis, vizYAxis, vizColorTheme,
    mlAlgo, targetCol, predictInputs, logs
  ]);

  const openSection = useCallback((sectionId: SectionId) => {
    setState((prev) => {
      const existing = prev.tabs.find((t) => t.sectionId === sectionId);
      if (existing) {
        return { ...prev, activeTabId: existing.id };
      }
      const meta = SECTION_REGISTRY[sectionId];
      const newTab: WorkspaceTab = {
        id: `tab-${sectionId}-${Date.now()}`,
        sectionId,
        title: meta.label,
        pinned: false,
        closable: true
      };
      return { tabs: [...prev.tabs, newTab], activeTabId: newTab.id };
    });
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setState((prev) => {
      const target = prev.tabs.find((t) => t.id === tabId);
      if (!target || !target.closable) return prev;

      const index = prev.tabs.findIndex((t) => t.id === tabId);
      const nextTabs = prev.tabs.filter((t) => t.id !== tabId);
      let nextActive = prev.activeTabId;

      if (prev.activeTabId === tabId) {
        const fallback = nextTabs[index] || nextTabs[index - 1] || nextTabs[0];
        nextActive = fallback ? fallback.id : null;
      }

      return { tabs: nextTabs, activeTabId: nextActive };
    });
  }, []);

  const setActiveTab = useCallback((tabId: string) => {
    setState((prev) => ({ ...prev, activeTabId: tabId }));
  }, []);

  const togglePin = useCallback((tabId: string) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) => (t.id === tabId ? { ...t, pinned: !t.pinned } : t))
    }));
  }, []);

  const reorderTab = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const tabs = [...prev.tabs];
      const [moved] = tabs.splice(fromIndex, 1);
      tabs.splice(toIndex, 0, moved);
      return { ...prev, tabs };
    });
  }, []);

  const activeTab = useMemo(
    () => state.tabs.find((t) => t.id === state.activeTabId) || null,
    [state.tabs, state.activeTabId]
  );

  // --- Fetch APIs initialization & Project CRUD Helpers ---
  const loadProjects = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/projects`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        const dbProjects = data.projects || [];
        const normalizedDb = dbProjects.map(validateAndNormalizeProject).filter(Boolean);
        const samples = SEED_PROJECTS.map(validateAndNormalizeProject).filter(Boolean).filter((p) => p.isSample);
        setProjects([...samples, ...normalizedDb]);
      }
    } catch (e) {
      console.error("Failed to load projects", e);
    }
  }, [token, authHeaders]);

  const changeWorkspace = useCallback(async (wsId: string) => {
    const isSample = ["sales", "churn", "marketing", "revenue"].includes(wsId);
    const currentRef = workspaceStateRef.current;
    const prevIsSample = ["sales", "churn", "marketing", "revenue"].includes(currentRef.activeWorkspace);
    
    if (!prevIsSample && currentRef.activeWorkspace && currentRef.activeWorkspace !== "custom") {
      setProjectStates((prev: any) => ({
        ...prev,
        [currentRef.activeWorkspace]: {
          edaResult: currentRef.edaResult,
          models: currentRef.models,
          savedModels: currentRef.savedModels,
          files: currentRef.files,
          generatedReportsList: currentRef.generatedReportsList,
          logs: currentRef.logs,
          trainedModelCard: currentRef.trainedModelCard
        }
      }));
    }

    setActiveWorkspace(wsId);

    if (isSample) {
      const ws = getMockWorkspaceData(wsId as any);
      setEdaResult(ws.edaResult);
      setModels(ws.models);
      setSavedModels(ws.savedModels);
      setFiles(ws.files);
      setGeneratedReportsList(ws.reports);
      setTrainedModelCard(ws.savedModels[0] || null);
      setPredictResult(null);
      setPredictInputs({});
      setLogs(ws.logs);

      const cols = ws.edaResult?.dataset_slices?.col_names || [];
      if (cols.length > 0) {
        setTargetCol(cols[cols.length - 1]);
        setSelectedColumn(cols[0]);
        setCleanCol(cols[0]);
        setVizXAxis(cols[0]);
        setVizYAxis(cols[1] || cols[0]);
      }
      
      addLog("Workspace", `Swapped to sample project: ${wsId.toUpperCase()}`, "success");
    } else {
      addLog("Workspace", `Activating project workspace ${wsId}...`, "info");
      try {
        const actRes = await fetch(`${API_BASE}/workspace/activate`, {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: wsId })
        });
        if (!actRes.ok) throw new Error("Failed to activate workspace in backend");

        const [filesRes, savedRes, historyRes, projRes, notifRes, reportsRes, vizRes, aiRes] = await Promise.all([
          fetch(`${API_BASE}/my-files?project_id=${wsId}`, { headers: authHeaders }),
          fetch(`${API_BASE}/ml/saved?project_id=${wsId}`, { headers: authHeaders }),
          fetch(`${API_BASE}/ml/history?project_id=${wsId}`, { headers: authHeaders }),
          fetch(`${API_BASE}/projects/${wsId}`, { headers: authHeaders }),
          fetch(`${API_BASE}/notifications?project_id=${wsId}`, { headers: authHeaders }),
          fetch(`${API_BASE}/reports?project_id=${wsId}`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/visualizations?project_id=${wsId}`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/ai/chat/history?project_id=${wsId}`, { headers: authHeaders }).catch(() => null)
        ]);

        let currentFiles: UploadedFile[] = [];
        if (filesRes.ok) {
          const d = await filesRes.json();
          currentFiles = d.files || [];
          setFiles(currentFiles);
        }
        if (savedRes.ok) {
          const d = await savedRes.json();
          setSavedModels(d.saved_models || []);
        }
        if (historyRes.ok) {
          const d = await historyRes.json();
          setMlHistory(d.history || []);
        }
        if (notifRes.ok) {
          const d = await notifRes.json();
          setNotifications(d.notifications || []);
        }
        if (reportsRes && reportsRes.ok) {
          const d = await reportsRes.json();
          setGeneratedReportsList(d.reports || []);
        }
        if (aiRes && aiRes.ok) {
          const d = await aiRes.json();
          const msgs = (d.history || []).flatMap((h: any) => [
            { sender: "user" as const, text: h.prompt },
            { sender: "ai" as const, text: h.response }
          ]);
          setAiMessages(msgs);
        }

        if (projRes.ok) {
          const projData = await projRes.json();
          const activeDs = projData.project?.active_dataset;
          if (activeDs) {
            const fileRow = currentFiles.find((f: any) => f.file_name === activeDs);
            if (fileRow) {
              const edaRes = await fetch(`${API_BASE}/my-files/${fileRow.id}/eda`, { headers: authHeaders });
              if (edaRes.ok) {
                setEdaResult(await edaRes.json());
              }
            }
          } else {
            setEdaResult(null);
          }

          if (projData.activity) {
            setLogs(projData.activity.map((a: any) => ({
              timestamp: new Date(a.created_at).toLocaleTimeString(),
              node: a.entity || "System",
              message: `${a.action}: ${a.new_value || ""}`,
              type: "info"
            })));
          }
        }

        addLog("Workspace", `Project ${wsId} active and synced successfully.`, "success");
      } catch (err: any) {
        addLog("Workspace", `Failed to activate project: ${err.message}`, "error");
        
        const cached = currentRef.projectStates ? currentRef.projectStates[wsId] : null;
        if (cached) {
          setEdaResult(cached.edaResult);
          setModels(cached.models);
          setSavedModels(cached.savedModels);
          setFiles(cached.files);
          setGeneratedReportsList(cached.generatedReportsList);
          setTrainedModelCard(cached.trainedModelCard);
          setPredictResult(null);
          setPredictInputs({});
          setLogs(cached.logs);

          const cols = cached.edaResult?.dataset_slices?.col_names || [];
          if (cols.length > 0) {
            setTargetCol(cols[cols.length - 1]);
            setSelectedColumn(cols[0]);
            setCleanCol(cols[0]);
            setVizXAxis(cols[0]);
            setVizYAxis(cols[1] || cols[0]);
          }
        } else {
          setEdaResult(null);
          setModels([]);
          setSavedModels([]);
          setFiles([]);
          setGeneratedReportsList([]);
          setTrainedModelCard(null);
          setPredictResult(null);
          setPredictInputs({});
          setLogs([
            { timestamp: new Date().toLocaleTimeString(), node: "System", message: "New workspace initialized.", type: "success" }
          ]);
        }
      }
    }
  }, [authHeaders, addLog]);

  // Consolidated single initialization flow
  useEffect(() => {
    if (!token) return;

    const initializeWorkspace = async () => {
      setApiStatus("loading");
      setStatusMessage("Loading Python cloud packages...");
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Verify User (/me)
        const profileRes = await fetch(`${API_BASE}/me`, { headers });
        if (!profileRes.ok) {
          window.localStorage.removeItem("koredata-token");
          window.localStorage.removeItem("koredata-login-id");
          window.location.href = "/login";
          return;
        }
        const userProfile = await profileRes.json();
        setUser(userProfile);
        addLog("Security", "User session verified securely.", "success");

        // 2. Load Workspace State Preferences (/workspace/state)
        let selectedWs = "custom";
        const wsRes = await fetch(`${API_BASE}/workspace/state`, { headers }).catch(() => null);
        if (wsRes?.ok) {
          const stateData = await wsRes.json();
          if (stateData) {
            if (stateData.active_project_id) {
              selectedWs = stateData.active_project_id;
            }

            // Restore settings
            if (stateData.workspace_settings_json) {
              try {
                const settings = JSON.parse(stateData.workspace_settings_json);
                if (settings) {
                  if (settings.cleanCol) setCleanCol(settings.cleanCol);
                  if (settings.cleanOp) setCleanOp(settings.cleanOp);
                  if (settings.cleanStrategy) setCleanStrategy(settings.cleanStrategy);
                  if (settings.cleanCustomVal) setCleanCustomVal(settings.cleanCustomVal);
                  if (settings.cleanTargetVal) setCleanTargetVal(settings.cleanTargetVal);
                  if (settings.cleanReplacementVal) setCleanReplacementVal(settings.cleanReplacementVal);
                  if (settings.cleanRenameNewName) setCleanRenameNewName(settings.cleanRenameNewName);
                  if (settings.cleanCastType) setCleanCastType(settings.cleanCastType);
                  if (settings.cleanEncodingType) setCleanEncodingType(settings.cleanEncodingType);
                  if (settings.cleanScalingType) setCleanScalingType(settings.cleanScalingType);

                  if (settings.vizChartType) setVizChartType(settings.vizChartType);
                  if (settings.vizXAxis) setVizXAxis(settings.vizXAxis);
                  if (settings.vizYAxis) setVizYAxis(settings.vizYAxis);
                  if (settings.vizColorTheme) setVizColorTheme(settings.vizColorTheme);

                  if (settings.mlAlgo) setMlAlgo(settings.mlAlgo);
                  if (settings.targetCol) setTargetCol(settings.targetCol);

                  if (settings.predictInputs) setPredictInputs(settings.predictInputs);
                }
              } catch (e) {
                console.error("Failed to parse settings JSON", e);
              }
            }

            // Restore logs
            if (stateData.workspace_history_json) {
              try {
                const parsedLogs = JSON.parse(stateData.workspace_history_json);
                if (Array.isArray(parsedLogs)) {
                  setLogs(parsedLogs);
                }
              } catch (e) {
                console.error("Failed to parse logs JSON", e);
              }
            }

            // Restore tabs
            if (stateData.open_tabs_json) {
              try {
                const parsedTabs = JSON.parse(stateData.open_tabs_json);
                if (Array.isArray(parsedTabs) && parsedTabs.length > 0) {
                  setState({
                    tabs: parsedTabs,
                    activeTabId: stateData.active_tab_id || parsedTabs[0].id
                  });
                }
              } catch (e) {
                console.error("Failed to parse open_tabs_json", e);
              }
            }
          }
        }

        // 3. Load Projects (/projects)
        const projsRes = await fetch(`${API_BASE}/projects`, { headers }).catch(() => null);
        let currentProjects = [];
        const samples = SEED_PROJECTS.map(validateAndNormalizeProject).filter(Boolean).filter((p) => p.isSample);
        if (projsRes?.ok) {
          const pData = await projsRes.json();
          currentProjects = (pData.projects || []).map(validateAndNormalizeProject).filter(Boolean);
          setProjects([...samples, ...currentProjects]);
        } else {
          setProjects(samples);
        }

        // 4. Fallback if no active project, create one
        if (!selectedWs || selectedWs === "custom") {
          const validUserProj = currentProjects.find((p: any) => !p.isDeleted && !p.isArchived);
          if (validUserProj) {
            selectedWs = validUserProj.id;
          } else {
            addLog("Projects", "No active project found. Generating default private workspace...", "info");
            const createRes = await fetch(`${API_BASE}/projects`, {
              method: "POST",
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({
                name: "My Sandbox Project",
                description: "A private workspace for analyzing datasets and building ML models.",
                project_type: "Standard",
                industry: "General",
                visibility: "private",
                color_theme: "blue",
                icon: "folder"
              })
            });
            if (createRes.ok) {
              const createData = await createRes.json();
              selectedWs = createData.project_id;
              const projsResNew = await fetch(`${API_BASE}/projects`, { headers }).catch(() => null);
              if (projsResNew?.ok) {
                const newDbProjs = ((await projsResNew.json()).projects || []).map(validateAndNormalizeProject).filter(Boolean);
                setProjects([...samples, ...newDbProjs]);
              }
            }
          }
        }

        // 5. Activate Selected Workspace
        if (selectedWs) {
          setActiveWorkspace(selectedWs);
          // Directly call backend sync endpoints sequentially
          try {
            const isSample = ["sales", "churn", "marketing", "revenue"].includes(selectedWs);
            if (isSample) {
              const ws = getMockWorkspaceData(selectedWs as any);
              setEdaResult(ws.edaResult);
              setModels(ws.models);
              setSavedModels(ws.savedModels);
              setFiles(ws.files);
              setGeneratedReportsList(ws.reports);
              setTrainedModelCard(ws.savedModels[0] || null);
              setPredictResult(null);
              setPredictInputs({});
              setLogs(ws.logs);
            } else {
              const actRes = await fetch(`${API_BASE}/workspace/activate`, {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({ project_id: selectedWs })
              });
              if (actRes.ok) {
                const [filesRes, savedRes, historyRes, projRes, notifRes, reportsRes, vizRes, aiRes] = await Promise.all([
                  fetch(`${API_BASE}/my-files?project_id=${selectedWs}`, { headers }),
                  fetch(`${API_BASE}/ml/saved?project_id=${selectedWs}`, { headers }),
                  fetch(`${API_BASE}/ml/history?project_id=${selectedWs}`, { headers }),
                  fetch(`${API_BASE}/projects/${selectedWs}`, { headers }),
                  fetch(`${API_BASE}/notifications?project_id=${selectedWs}`, { headers }),
                  fetch(`${API_BASE}/reports?project_id=${selectedWs}`, { headers }).catch(() => null),
                  fetch(`${API_BASE}/visualizations?project_id=${selectedWs}`, { headers }).catch(() => null),
                  fetch(`${API_BASE}/ai/chat/history?project_id=${selectedWs}`, { headers }).catch(() => null)
                ]);

                let currentFiles: UploadedFile[] = [];
                if (filesRes.ok) {
                  const d = await filesRes.json();
                  currentFiles = d.files || [];
                  setFiles(currentFiles);
                }
                if (savedRes.ok) {
                  const d = await savedRes.json();
                  setSavedModels(d.saved_models || []);
                }
                if (historyRes.ok) {
                  const d = await historyRes.json();
                  setMlHistory(d.history || []);
                }
                if (notifRes.ok) {
                  const d = await notifRes.json();
                  setNotifications(d.notifications || []);
                }
                if (reportsRes && reportsRes.ok) {
                  const d = await reportsRes.json();
                  setGeneratedReportsList(d.reports || []);
                }
                if (aiRes && aiRes.ok) {
                  const d = await aiRes.json();
                  const msgs = (d.history || []).flatMap((h: any) => [
                    { sender: "user" as const, text: h.prompt },
                    { sender: "ai" as const, text: h.response }
                  ]);
                  setAiMessages(msgs);
                }

                if (projRes.ok) {
                  const projData = await projRes.json();
                  const activeDs = projData.project?.active_dataset;
                  if (activeDs) {
                    const fileRow = currentFiles.find((f: any) => f.file_name === activeDs);
                    if (fileRow) {
                      const edaRes = await fetch(`${API_BASE}/my-files/${fileRow.id}/eda`, { headers });
                      if (edaRes.ok) {
                        setEdaResult(await edaRes.json());
                      }
                    }
                  } else {
                    setEdaResult(null);
                  }

                  if (projData.activity) {
                    setLogs(projData.activity.map((a: any) => ({
                      timestamp: new Date(a.created_at).toLocaleTimeString(),
                      node: a.entity || "System",
                      message: `${a.action}: ${a.new_value || ""}`,
                      type: "info"
                    })));
                  }
                }
              }
            }
          } catch (activateErr) {
            console.error("Failed workspace activation on startup", activateErr);
          }
        }

        setApiStatus("ready");
        setStatusMessage("AI cloud runtime initialized");
        addLog("Runtime", "All endpoints bound successfully.", "success");
      } catch (err) {
        // Safe offline fallback
        const ws = getMockWorkspaceData(activeWorkspace);
        if (ws.edaResult) {
          setEdaResult(ws.edaResult);
          setModels(ws.models);
          setSavedModels(ws.savedModels);
          setFiles(ws.files);
          setGeneratedReportsList(ws.reports);
          setLogs(ws.logs);
        }
        setApiStatus("ready");
        setStatusMessage("Offline demo mode active");
        addLog("Runtime", "Connected in Offline Demo mode.", "success");
      } finally {
        setHydrated(true);
      }
    };

    initializeWorkspace();
  }, [token, addLog]);

  // Set default code text
  useEffect(() => {
    if (edaResult) {
      setCodeText(
        `# 'dataset' contains your current uploaded data (data: list of dicts, columns: list)\n` +
        `# Write custom python logic here. Assign output to 'result' to return it.\n\n` +
        `import pandas as pd\n` +
        `df = pd.DataFrame(dataset.get('data', []), columns=dataset.get('columns', []))\n\n` +
        `print("Data columns:", df.columns.tolist())\n` +
        `print("Data shape:", df.shape)\n\n` +
        `result = df.describe().to_dict()`
      );

      const cols = edaResult.dataset_slices?.col_names || [];
      if (cols.length > 0) {
        setTargetCol(cols[cols.length - 1]);
        setSelectedColumn(cols[0]);
        setCleanCol(cols[0]);
        setVizXAxis(cols[0]);
        setVizYAxis(cols[0]);
      }
    }
  }, [edaResult]);

  // Persist projects state
  useEffect(() => {
    localStorage.setItem("koredata-projects", JSON.stringify(projects));
  }, [projects]);


  const addProject = useCallback(async (projectData: any) => {
    addLog("Projects", `Creating project "${projectData.name}"...`, "info");
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectData.name,
          description: projectData.description || "",
          project_type: projectData.projectType || "Standard",
          industry: projectData.industryTemplate || "General",
          visibility: projectData.visibility || "private",
          color_theme: projectData.colorTheme || "blue",
          icon: projectData.icon || "folder"
        })
      });
      if (res.ok) {
        const data = await res.json();
        addLog("Projects", `Project "${projectData.name}" created successfully.`, "success");
        await loadProjects();
        if (data.project_id) {
          changeWorkspace(data.project_id);
          openSection("dashboard");
        }
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to create project");
      }
    } catch (e: any) {
      addLog("Projects", `Error creating project: ${e.message}`, "error");
    }
  }, [authHeaders, addLog, loadProjects, changeWorkspace, openSection]);

  const deleteProject = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    addLog("Projects", `Deleting project ID ${id}...`, "info");
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: "DELETE",
        headers: authHeaders
      });
      if (res.ok) {
        addLog("Projects", `Project ID ${id} deleted.`, "success");
        await loadProjects();
        if (activeWorkspace === id) {
          const nextWs = projects.find(p => p.id !== id && !p.isSample)?.id || "sales";
          changeWorkspace(nextWs);
        }
      } else {
        alert("Failed to delete project");
      }
    } catch (e: any) {
      addLog("Projects", `Error deleting project: ${e.message}`, "error");
    }
  }, [authHeaders, addLog, loadProjects, activeWorkspace, changeWorkspace, projects]);

  const duplicateProject = useCallback(async (id: string) => {
    addLog("Projects", `Duplicating project ID ${id}...`, "info");
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/duplicate`, {
        method: "POST",
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        addLog("Projects", `Project duplicated successfully.`, "success");
        await loadProjects();
        if (data.project_id) {
          changeWorkspace(data.project_id);
        }
      } else {
        alert("Failed to duplicate project");
      }
    } catch (e: any) {
      addLog("Projects", `Error duplicating project: ${e.message}`, "error");
    }
  }, [authHeaders, addLog, loadProjects, changeWorkspace]);

  const updateProject = useCallback(async (id: string, updates: any) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updates.name,
          description: updates.description,
          project_type: updates.projectType || updates.project_type,
          industry: updates.industry,
          visibility: updates.visibility,
          color_theme: updates.colorTheme || updates.color_theme,
          icon: updates.icon,
          is_favorite: updates.isFavorite !== undefined ? (updates.isFavorite ? 1 : 0) : undefined,
          is_archived: updates.isArchived !== undefined ? (updates.isArchived ? 1 : 0) : undefined
        })
      });
      if (res.ok) {
        await loadProjects();
      }
    } catch (e) {
      console.error("Error updating project", e);
    }
  }, [authHeaders, loadProjects]);

  const toggleFavoriteProject = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/favorite`, {
        method: "POST",
        headers: authHeaders
      });
      if (res.ok) {
        await loadProjects();
      }
    } catch (e) {
      console.error("Error favoriting project", e);
    }
  }, [authHeaders, loadProjects]);

  const createProjectFromTemplate = useCallback((templateKey: string) => {
    const config = TEMPLATE_CONFIGS[templateKey] || TEMPLATE_CONFIGS["blank"];
    addProject({
      name: `My ${config.name}`,
      description: config.description,
      projectType: config.projectType,
      industryTemplate: config.industryTemplate,
      colorTheme: config.colorTheme,
      icon: config.icon,
      visibility: "private"
    });
  }, [addProject]);

  // --- Handlers & API functions ---
  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setEdaResult(null);
    setRecommendationData(null);
    setTrainedModelCard(null);
    setPredictResult(null);
    setStatusMessage(`Ingesting data file ${file.name}...`);
    addLog("Ingestion", `Uploading file: ${file.name}`, "info");

    const isSample = ["sales", "churn", "marketing", "revenue"].includes(activeWorkspace);
    const projQuery = isSample ? "" : `?project_id=${activeWorkspace}`;

    try {
      const res = await fetch(`${API_BASE}/upload${projQuery}`, {
        method: "POST",
        headers: authHeaders,
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        setStatusMessage(data.error || "Upload failed.");
        addLog("Ingestion", `Inference table upload failed: ${data.error}`, "error");
        return;
      }

      setEdaResult(data);
      setStatusMessage("Dataset EDA indexing complete");
      addLog("Ingestion", `Dataset analysis complete. Rows: ${data.overview?.rows}, Cols: ${data.overview?.columns}`, "success");

      const filesRes = await fetch(`${API_BASE}/my-files${isSample ? "" : `?project_id=${activeWorkspace}`}`, { headers: authHeaders }).catch(() => null);
      if (filesRes?.ok) {
        const filesData = await filesRes.json();
        setFiles(filesData.files || []);
      }
      
      if (!isSample) {
        await loadProjects();
      }
    } catch {
      setStatusMessage("Upload failed.");
      addLog("Ingestion", "Connection timeout during file processing.", "error");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleReuseFile = async (fileId: number, fileName: string) => {
    addLog("Runtime", `Restoring dataset profile for: ${fileName}...`, "info");
    try {
      const res = await fetch(`${API_BASE}/my-files/${fileId}/eda`, { headers: authHeaders });
      if (!res.ok) {
        throw new Error("Failed to retrieve cached EDA results");
      }
      const cachedEda = await res.json();
      setActiveWorkspace("custom");
      setEdaResult(cachedEda);
      addLog("Runtime", `Restored workspace dataset: ${fileName}`, "success");
      openSection("eda");
    } catch (err: any) {
      alert(`Could not reuse dataset: ${err.message}`);
      addLog("Runtime", `Failed to restore cached profile for: ${fileName}`, "error");
    }
  };

  const handleRemoveFile = async (fileId: number) => {
    if (!confirm("Are you sure you want to remove this dataset from the database?")) return;
    addLog("Database", `Deleting dataset ID: ${fileId}...`, "info");
    try {
      const res = await fetch(`${API_BASE}/my-files/${fileId}`, {
        method: "DELETE",
        headers: authHeaders
      });
      if (res.ok) {
        setFiles(files.filter((f) => f.id !== fileId));
        addLog("Database", `Removed dataset ID: ${fileId} successfully.`, "success");
      } else {
        alert("Failed to delete dataset.");
        addLog("Database", `Failed to delete file ID: ${fileId}`, "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartSimulation = () => {
    if (simRunning && esRef.current) return;
    
    setSimRunning(true);
    setSimProgress(0);
    setCurrentStageKey("upload");
    setStageStatuses(SIMULATION_STAGES.reduce((acc, s) => ({ ...acc, [s.key]: "idle" }), {}));
    addLog("Simulation", "Automated execution pipeline triggered.", "info");

    const es = new EventSource(`${API_BASE}/simulation/run`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "complete") {
          setSimProgress(100);
          setSimRunning(false);
          setCurrentStageKey(null);
          addLog("Simulation", "Pipeline execution completed successfully.", "success");
          es.close();
          esRef.current = null;
        } else {
          const category = data.key;
          const status = data.status;

          setStageStatuses((prev) => {
            const next = { ...prev };
            SIMULATION_STAGES.forEach((stage) => {
              if (stage.category === category) {
                next[stage.key] = status === "running" ? "running" : "success";
                if (status === "running") {
                  setCurrentStageKey(stage.key);
                  addLog("Pipeline", `${stage.label} active...`, "info");
                }
              }
            });
            return next;
          });

          setSimProgress(data.progress);
        }
      } catch (err) {
        console.error(err);
      }
    };

    es.onerror = () => {
      setSimRunning(false);
      addLog("Simulation", "Pipeline execution failed or disconnected.", "error");
      es.close();
      esRef.current = null;
    };
  };

  const handleStopAllOperations = () => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setSimRunning(false);
    setSimProgress(0);
    setCurrentStageKey(null);
    setStageStatuses(SIMULATION_STAGES.reduce((acc, s) => ({ ...acc, [s.key]: "idle" }), {}));
    addLog("Runtime", "Workspace processes terminated by emergency abort command.", "error");
  };

  const handleApplyImputation = async () => {
    if (!edaResult || !selectedColumn || cleanLoading) return;
    setCleanLoading(true);
    addLog("Cleaning", `Applying Imputation on column: ${selectedColumn}`, "info");

    try {
      const dataSlices = edaResult.dataset_slices || {};
      const payload = {
        column: selectedColumn,
        strategy: selectedStrategy,
        rows: dataSlices.head?.["100"] || [],
        columns: dataSlices.col_names || [],
      };

      const res = await fetch(`${API_BASE}/dataset/apply-missing`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Imputation failed.");
        addLog("Cleaning", "Missing cells imputation failed.", "error");
        return;
      }

      setStatusMessage(`Re-calculating EDA stats...`);
      const editRes = await fetch(`${API_BASE}/dataset/edit`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          rows: data.rows,
          columns: payload.columns,
        }),
      });

      const editData = await editRes.json();
      if (!editRes.ok) {
        setStatusMessage(editData.detail || "EDA re-run failed.");
        return;
      }

      setEdaResult(editData);
      setStatusMessage("EDA updated successfully");
      addLog("Cleaning", `Filled missing cells in ${selectedColumn}. Quality score: ${editData.data_quality?.quality_score}%`, "success");
      alert(`Imputation applied successfully.`);
    } catch (err) {
      console.error(err);
      alert("Error applying imputation.");
    } finally {
      setCleanLoading(false);
    }
  };

  const handleExecuteCleaningSimulation = async (col: string, op: string, params: any) => {
    if (!edaResult || cleanLoading) return;
    setCleanLoading(true);
    const colName = col || allColumns[0];
    addLog("Cleaning", `Executing operation: ${op.toUpperCase()} on column: ${colName}`, "info");

    try {
      const dataSlices = edaResult.dataset_slices || {};
      const fullRows = dataSlices.head?.["100"] || [];
      const currentCols = allColumns;

      setCleaningHistory((prev) => [...prev, { rows: fullRows, columns: currentCols }]);
      setCleaningRedoHistory([]);

      const result = simulateCleaning(fullRows, currentCols, colName, op, params);

      setStatusMessage(`Re-calculating EDA stats...`);
      const editRes = await fetch(`${API_BASE}/dataset/edit`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          rows: result.rows,
          columns: result.columns,
        }),
      });

      const editData = await editRes.json();
      if (!editRes.ok) {
        alert(editData.detail || "Profiling recalculation failed.");
        addLog("Cleaning", "Profiling recalculation failed.", "error");
        setCleaningHistory((prev) => prev.slice(0, -1));
        return;
      }

      setEdaResult(editData);
      setStatusMessage("EDA updated successfully");
      
      const opLabel = `${op.toUpperCase()} applied to '${colName}'`;
      setAppliedOperations((prev) => [...prev, opLabel]);
      addLog("Cleaning", `Executed ${opLabel}. Quality Score is now: ${editData.data_quality?.quality_score}%`, "success");
    } catch (err) {
      console.error(err);
      alert("Error applying cleaning operation.");
    } finally {
      setCleanLoading(false);
    }
  };

  const handleUndoCleaning = async () => {
    if (cleaningHistory.length === 0 || cleanLoading) return;
    setCleanLoading(true);
    addLog("Cleaning", "Undoing last cleaning operation", "info");

    try {
      const previousState = cleaningHistory[cleaningHistory.length - 1];
      const dataSlices = edaResult.dataset_slices || {};
      const currentRows = dataSlices.head?.["100"] || [];
      const currentCols = allColumns;

      setCleaningRedoHistory((prev) => [...prev, { rows: currentRows, columns: currentCols }]);
      setCleaningHistory((prev) => prev.slice(0, -1));

      setStatusMessage(`Re-calculating EDA stats...`);
      const editRes = await fetch(`${API_BASE}/dataset/edit`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          rows: previousState.rows,
          columns: previousState.columns,
        }),
      });

      const editData = await editRes.json();
      if (!editRes.ok) {
        alert(editData.detail || "Profiling rollback failed.");
        addLog("Cleaning", "Profiling rollback failed.", "error");
        return;
      }

      setEdaResult(editData);
      setStatusMessage("EDA reverted successfully");
      setAppliedOperations((prev) => prev.slice(0, -1));
      addLog("Cleaning", `Rolled back last operation. Quality Score: ${editData.data_quality?.quality_score}%`, "success");
    } catch (err) {
      console.error(err);
      alert("Error performing undo.");
    } finally {
      setCleanLoading(false);
    }
  };

  const handleRedoCleaning = async () => {
    if (cleaningRedoHistory.length === 0 || cleanLoading) return;
    setCleanLoading(true);
    addLog("Cleaning", "Redoing last cleaning operation", "info");

    try {
      const nextState = cleaningRedoHistory[cleaningRedoHistory.length - 1];
      const dataSlices = edaResult.dataset_slices || {};
      const currentRows = dataSlices.head?.["100"] || [];
      const currentCols = allColumns;

      setCleaningHistory((prev) => [...prev, { rows: currentRows, columns: currentCols }]);
      setCleaningRedoHistory((prev) => prev.slice(0, -1));

      setStatusMessage(`Re-calculating EDA stats...`);
      const editRes = await fetch(`${API_BASE}/dataset/edit`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          rows: nextState.rows,
          columns: nextState.columns,
        }),
      });

      const editData = await editRes.json();
      if (!editRes.ok) {
        alert(editData.detail || "Profiling forward redo failed.");
        addLog("Cleaning", "Profiling forward redo failed.", "error");
        return;
      }

      setEdaResult(editData);
      setStatusMessage("EDA re-applied successfully");
      setAppliedOperations((prev) => [...prev, "Redone Operation"]);
      addLog("Cleaning", `Re-applied operation. Quality Score: ${editData.data_quality?.quality_score}%`, "success");
    } catch (err) {
      console.error(err);
      alert("Error performing redo.");
    } finally {
      setCleanLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!edaResult || codeRunning) return;
    setCodeRunning(true);
    setConsoleOutput("Running script on backend...");
    setConsoleError("");
    setConsoleResult(null);
    addLog("Console", "Initializing sandboxed Python compilation.", "info");

    try {
      const dataSlices = edaResult.dataset_slices || {};
      const payload = {
        code: codeText,
        dataset: {
          data: dataSlices.head?.["100"] || [],
          columns: dataSlices.col_names || [],
        },
      };

      const res = await fetch(`${API_BASE}/code-run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setConsoleOutput("");
        setConsoleError(data.detail || "Compilation crash.");
        addLog("Console", "Python compilation syntax check failed.", "error");
        return;
      }

      setConsoleOutput(data.stdout || "");
      setConsoleError(data.stderr || "");
      setConsoleResult(data.result);
      addLog("Console", "Python execution cycle completed successfully.", "success");
    } catch (err) {
      console.error(err);
      setConsoleOutput("");
      setConsoleError("API connection crash during code execution.");
    } finally {
      setCodeRunning(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!edaResult || mlRecommendLoading) return;
    setMlRecommendLoading(true);
    setRecommendationData(null);
    addLog("ML Studio", "Retrieving algorithm recommendations...", "info");

    if (activeWorkspace !== "custom") {
      setMlRecommendLoading(true);
      addLog("ML Studio", "Retrieving algorithm recommendations...", "info");
      setTimeout(() => {
        let rec = "Gradient Boosting Regressor";
        if (activeWorkspace === "churn") rec = "XGBoost Classifier";
        else if (activeWorkspace === "marketing") rec = "Ridge Regression";
        else if (activeWorkspace === "revenue") rec = "LSTM Regressor";

        setRecommendationData({ recommended_model: rec, suggested_model: rec });
        addLog("ML Studio", `Model recommendation compiled successfully: ${rec}`, "success");
        setMlRecommendLoading(false);
      }, 1000);
      return;
    }

    try {
      let endpoint = `${API_BASE}/ml/recommend`;
      const paramsObj = {
        target: targetCol || allColumns[allColumns.length - 1],
        task: taskHint,
        prompt: promptText
      };

      if (promptText) {
        endpoint = `${API_BASE}/ml/suggest`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({
          overview: edaResult.overview,
          ...paramsObj
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Recommendations fetch failed.");
        addLog("ML Studio", "Failed to retrieve model recommendations.", "error");
        return;
      }

      setRecommendationData(data);
      addLog("ML Studio", "Model recommendations compiled.", "success");
    } catch (err) {
      console.error(err);
      alert("Error getting recommendations.");
    } finally {
      setMlRecommendLoading(false);
    }
  };

  const handleTrainModel = async () => {
    if (!edaResult || trainingLoading) return;
    
    const isSample = ["sales", "churn", "marketing", "revenue"].includes(activeWorkspace);
    if (isSample) {
      setTrainingLoading(true);
      setTrainedModelCard(null);
      addLog("ML Studio", `Training model: ${mlAlgo.toUpperCase()} on target: ${targetCol}...`, "info");
      setTimeout(() => {
        let metrics = { accuracy: 0.941, f1: 0.935 };
        let name = "Gradient Boosting Regressor";
        if (activeWorkspace === "churn") {
          metrics = { accuracy: 0.948, f1: 0.932 };
          name = "XGBoost Classifier";
        } else if (activeWorkspace === "marketing") {
          metrics = { accuracy: 0.884, f1: 0.865 };
          name = "Ridge Regression";
        } else if (activeWorkspace === "revenue") {
          metrics = { accuracy: 0.965, f1: 0.958 };
          name = "LSTM Regressor";
        }

        const newModel = {
          model_key: `${activeWorkspace}-model-${Date.now()}`,
          name,
          metrics,
          registered_at: new Date().toISOString().slice(0, 16).replace("T", " ")
        };

        setTrainedModelCard(newModel);
        setSavedModels((prev) => [newModel, ...prev]);
        addLog("ML Studio", `Trained model metrics compiled. F1 Score: ${metrics.f1.toFixed(3)}`, "success");
        setTrainingLoading(false);
      }, 1500);
      return;
    }

    setTrainingLoading(true);
    setTrainedModelCard(null);
    addLog("ML Studio", `Training model: ${mlAlgo.toUpperCase()} on target: ${targetCol}...`, "info");

    try {
      const dataSlices = edaResult.dataset_slices || {};
      let endpoint = `${API_BASE}/ml/train`;
      const payload = {
        model_key: mlAlgo,
        target_col: targetCol,
        data: dataSlices.head?.["100"] || [],
        columns: dataSlices.col_names || [],
        project_id: activeWorkspace,
        dataset_id: edaResult.dataset_id || undefined
      };

      if (mlAlgo === "xgboost") {
        endpoint = `${API_BASE}/ml/auto`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Training failed.");
        addLog("ML Studio", "Model compiler training crashed.", "error");
        return;
      }

      setTrainedModelCard(data);
      addLog("ML Studio", `Trained model metrics compiled. F1 Score: ${data.metrics?.f1?.toFixed(3) || "0.912"}`, "success");

      const projParam = `?project_id=${activeWorkspace}`;
      const [savedRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/ml/saved${projParam}`, { headers: authHeaders }).catch(() => null),
        fetch(`${API_BASE}/ml/history${projParam}`, { headers: authHeaders }).catch(() => null)
      ]);
      if (savedRes?.ok) {
        const dataS = await savedRes.json();
        setSavedModels(dataS.saved_models || []);
      }
      if (historyRes?.ok) {
        const dataH = await historyRes.json();
        setMlHistory(dataH.history || []);
      }
      
      await loadProjects();
    } catch (err) {
      console.error(err);
      alert("Error training model.");
    } finally {
      setTrainingLoading(false);
    }
  };

  const handleRunPrediction = async () => {
    if (!trainedModelCard || predictLoading) return;
    
    const isSample = ["sales", "churn", "marketing", "revenue"].includes(activeWorkspace);
    if (isSample) {
      setPredictLoading(true);
      setPredictResult(null);
      addLog("Predictor", "Submitting inference inputs...", "info");
      setTimeout(() => {
        let prediction = "No";
        if (activeWorkspace === "sales") {
          prediction = `$ ${(150 + Math.random() * 800).toFixed(2)}`;
        } else if (activeWorkspace === "churn") {
          prediction = Math.random() > 0.45 ? "No (Low Risk)" : "Yes (High Risk)";
        } else if (activeWorkspace === "marketing") {
          prediction = `${(1.5 + Math.random() * 4.5).toFixed(2)}x ROI`;
        } else if (activeWorkspace === "revenue") {
          prediction = `$ ${(450000 + Math.random() * 350000).toLocaleString(undefined, { maximumFractionDigits: 0 })} MRR`;
        }

        setPredictResult({ prediction });
        addLog("Predictor", `Inference complete. Value: ${prediction}`, "success");
        setPredictLoading(false);
      }, 1000);
      return;
    }

    setPredictLoading(true);
    setPredictResult(null);
    addLog("Predictor", "Submitting inference inputs...", "info");

    try {
      const res = await fetch(`${API_BASE}/ml/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({
          model_key: trainedModelCard.model_key,
          inputs: predictInputs,
          project_id: activeWorkspace
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Prediction failed.");
        addLog("Predictor", "Inference execution crashed.", "error");
        return;
      }

      setPredictResult(data);
      addLog("Predictor", `Inference complete. Value: ${data.prediction}`, "success");
    } catch (err) {
      console.error(err);
      alert("Error executing prediction.");
    } finally {
      setPredictLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    addLog("Reports", `Compiling PDF summary report...`, "info");
    
    const isSample = ["sales", "churn", "marketing", "revenue"].includes(activeWorkspace);
    if (isSample) {
      setTimeout(() => {
        const newReport = {
          file_name: `${activeWorkspace.toUpperCase()}_Report_${Date.now().toString().slice(-4)}.pdf`,
          file_type: "PDF",
          generated_at: new Date().toISOString().slice(0, 16).replace("T", " ")
        };
        setGeneratedReportsList((prev) => [...prev, newReport]);
        addLog("Reports", `Report compiled successfully: ${newReport.file_name}`, "success");
        alert(`Report generated: ${newReport.file_name}`);
      }, 1000);
      return;
    }

    try {
      const reportRes = await fetch(`${API_BASE}/ml/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({
          type: reportType,
          format: reportFormat,
          cron: reportCron,
          project_id: activeWorkspace
        }),
      });

      if (!reportRes.ok) {
        throw new Error("Failed to generate compiler summary");
      }

      const reportData = await reportRes.json();
      setGeneratedReportsList((prev) => [...prev, reportData]);
      addLog("Reports", `Report compiled successfully: ${reportData.file_name}`, "success");
      alert(`Report generated: ${reportData.file_name}`);
      
      await loadProjects();
    } catch (err) {
      console.error(err);
      alert("Error generating report.");
    }
  };

  const allColumns = useMemo(() => {
    if (!edaResult) return [];
    const over = edaResult.overview || {};
    return [
      ...(over.numeric_columns || []),
      ...(over.categorical_columns || []),
      ...(over.datetime_columns || [])
    ];
  }, [edaResult]);

  const columnDistribution = useMemo(() => {
    if (!edaResult || !vizXAxis) return [];
    const rows = edaResult.dataset_slices?.head?.["100"] || [];
    const vals = rows.map((r: any) => r[vizXAxis]).filter((v: any) => v !== null && v !== undefined);

    const isNumeric = vals.every((v: any) => !isNaN(parseFloat(v)));
    if (isNumeric && vals.length > 0) {
      const numVals = vals.map((v: any) => parseFloat(v));
      const min = Math.min(...numVals);
      const max = Math.max(...numVals);
      const range = max - min;
      const binCount = 5;
      const bins = Array(binCount).fill(0);
      const binWidth = range / binCount || 1;

      numVals.forEach((v: number) => {
        let bIdx = Math.floor((v - min) / binWidth);
        if (bIdx >= binCount) bIdx = binCount - 1;
        if (bIdx < 0) bIdx = 0;
        bins[bIdx]++;
      });

      return bins.map((cnt, i) => ({
        label: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`,
        value: cnt
      }));
    } else {
      const counts: Record<string, number> = {};
      vals.forEach((v: any) => {
        const k = String(v);
        counts[k] = (counts[k] || 0) + 1;
      });
      return Object.keys(counts).slice(0, 5).map((k) => ({
        label: k,
        value: counts[k]
      }));
    }
  }, [edaResult, vizXAxis]);

  const shareProject = useCallback(async (id: string, email: string, role: string) => {
    addLog("Projects", `Sharing project ID ${id} with ${email} as ${role}...`, "info");
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/share`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ email, role })
      });
      if (res.ok) {
        addLog("Projects", `Project shared successfully with ${email}.`, "success");
        await loadProjects();
        return true;
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to share project");
      }
    } catch (e: any) {
      addLog("Projects", `Error sharing project: ${e.message}`, "error");
    }
    return false;
  }, [authHeaders, addLog, loadProjects]);

  const value: WorkspaceContextValue = {
    // Active Workspace context (Sales, Churn, Marketing, Revenue, Custom)
    activeWorkspace,
    token,
    changeWorkspace,

    projects,
    setProjects,
    addProject,
    deleteProject,
    duplicateProject,
    updateProject,
    toggleFavoriteProject,
    shareProject,
    projectsFilter,
    setProjectsFilter,
    createProjectFromTemplate,

    // Tabs state
    tabs: state.tabs,
    activeTabId: state.activeTabId,
    activeTab,
    openSection,
    closeTab,
    setActiveTab,
    togglePin,
    reorderTab,

    // AI Drawer
    assistantOpen,
    setAssistantOpen,
    aiTab,
    setAiTab,
    aiMessages,
    setAiMessages,
    aiInputText,
    setAiInputText,

    // Shared calculations & datasets
    edaResult,
    setEdaResult,
    uploading,
    files,
    setFiles,
    simRunning,
    simProgress,
    currentStageKey,
    stageStatuses,
    logs,
    addLog,
    apiStatus,
    statusMessage,
    
    // Handlers
    handleUpload,
    handleReuseFile,
    handleRemoveFile,
    handleStartSimulation,
    handleStopAllOperations,

    // ML/AutoML
    models,
    savedModels,
    mlHistory,
    trainedModelCard,
    setTrainedModelCard,

    // Visualizer configs
    vizChartType,
    setVizChartType,
    vizXAxis,
    setVizXAxis,
    vizYAxis,
    setVizYAxis,
    vizColorTheme,
    setVizColorTheme,

    // Dynamic calculations
    allColumns,
    columnDistribution,
    selectedColumn,
    setSelectedColumn,
    selectedStrategy,
    setSelectedStrategy,
    cleanLoading,
    appliedOperations,
    previewTab,
    setPreviewTab,

    // Undo/Redo/Simulation Executer
    handleUndoCleaning,
    handleRedoCleaning,
    handleExecuteCleaningSimulation,
    handleApplyImputation,

    // Code sandbox
    codeText,
    setCodeText,
    consoleOutput,
    consoleError,
    consoleResult,
    codeRunning,
    handleRunCode,

    // ML Prediction forms
    targetCol,
    setTargetCol,
    taskHint,
    setTaskHint,
    promptText,
    setPromptText,
    mlRecommendLoading,
    recommendationData,
    setRecommendationData,
    trainingLoading,
    setTrainingLoading,
    predictInputs,
    setPredictInputs,
    predictResult,
    setPredictResult,
    predictLoading,
    handleRunPrediction,
    handleGetRecommendations,
    handleTrainModel,
    mlAlgo,
    setMlAlgo,

    // Reports compiler
    reportType,
    setReportType,
    reportFormat,
    setReportFormat,
    reportCron,
    setReportCron,
    handleGenerateReport,
    generatedReportsList,

    // UI cleaners state
    activeCleanStep,
    setActiveCleanStep,
    cleanCol,
    setCleanCol,
    cleanOp,
    setCleanOp,
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

    // Static variables helper details
    user,
    notifications,
    notificationsOpen,
    setNotificationsOpen,
    sidebarCollapsed,
    setSidebarCollapsed: handleSetSidebarCollapsed
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}

interface StoredState {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
}

function defaultState(): StoredState {
  const projectsTab: WorkspaceTab = {
    id: "tab-projects",
    sectionId: "projects",
    title: SECTION_REGISTRY.projects.label,
    pinned: true,
    closable: false
  };
  return { tabs: [projectsTab], activeTabId: projectsTab.id };
}
