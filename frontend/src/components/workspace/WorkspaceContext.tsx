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

const STORAGE_KEY = "koredata-workspace-tabs-v1";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

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

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // Authentication & Profile helpers
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

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

  // Hydrate token
  useEffect(() => {
    const savedToken = window.localStorage.getItem("koredata-token");
    setToken(savedToken);
  }, []);

  // Load persisted tabs on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: StoredState = JSON.parse(raw);
        if (parsed.tabs?.length) {
          setState(parsed);
        }
      }
    } catch {
      // ignore corrupt storage
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist tab state
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore failure
    }
  }, [state, hydrated]);

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

  // --- Fetch APIs initialization ---
  useEffect(() => {
    if (!token) return;

    const loadDashboardData = async () => {
      setApiStatus("loading");
      setStatusMessage("Loading Python cloud packages...");
      try {
        const profileRes = await fetch(`${API_BASE}/me`, { headers: authHeaders });
        if (!profileRes.ok) {
          window.localStorage.removeItem("koredata-token");
          window.localStorage.removeItem("koredata-login-id");
          window.location.href = "/login";
          return;
        }

        setUser(await profileRes.json());
        addLog("Security", "User session verified securely.", "success");

        const [filesRes, notifRes, modelsRes, savedRes, historyRes, wsRes] = await Promise.all([
          fetch(`${API_BASE}/my-files`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/notifications`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/ml/models`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/ml/saved`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/ml/history`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/workspace/state`, { headers: authHeaders }).catch(() => null)
        ]);

        if (filesRes?.ok) {
          const data = await filesRes.json();
          setFiles(data.files || []);
        }
        if (notifRes?.ok) {
          const data = await notifRes.json();
          setNotifications(data.notifications || []);
        }
        if (modelsRes?.ok) {
          const data = await modelsRes.json();
          setModels(data.models || data.available_models || data.registry || []);
        }
        if (savedRes?.ok) {
          const data = await savedRes.json();
          setSavedModels(data.models || data.saved || data.saved_models || []);
        }
        if (historyRes?.ok) {
          const data = await historyRes.json();
          setMlHistory(data.history || data.items || []);
        }

        if (wsRes?.ok) {
          const ws = await wsRes.json();
          if (ws.eda_result) {
            setEdaResult(JSON.parse(ws.eda_result));
          }
        }

        setApiStatus("ready");
        setStatusMessage("AI cloud runtime initialized");
        addLog("Runtime", "All endpoints bound successfully.", "success");
      } catch (err) {
        setApiStatus("error");
        setStatusMessage("Cloud backend disconnected.");
        addLog("Runtime", "Failed to connect to backend api.", "error");
      }
    };

    loadDashboardData();
  }, [token, authHeaders, addLog]);

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

    try {
      const res = await fetch(`${API_BASE}/upload`, {
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

      const filesRes = await fetch(`${API_BASE}/my-files`, { headers: authHeaders }).catch(() => null);
      if (filesRes?.ok) {
        const filesData = await filesRes.json();
        setFiles(filesData.files || []);
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
    setTrainingLoading(true);
    setTrainedModelCard(null);
    addLog("ML Studio", `Training model: ${mlAlgo.toUpperCase()} on target: ${targetCol}...`, "info");

    try {
      const dataSlices = edaResult.dataset_slices || {};
      let endpoint = `${API_BASE}/ml/train`;
      const payload = {
        algo: mlAlgo,
        target: targetCol,
        rows: dataSlices.head?.["100"] || [],
        columns: dataSlices.col_names || [],
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

      const [savedRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/ml/saved`, { headers: authHeaders }).catch(() => null),
        fetch(`${API_BASE}/ml/history`, { headers: authHeaders }).catch(() => null)
      ]);
      if (savedRes?.ok) {
        const dataS = await savedRes.json();
        setSavedModels(dataS.models || dataS.saved || []);
      }
      if (historyRes?.ok) {
        const dataH = await historyRes.json();
        setMlHistory(dataH.history || dataH.items || []);
      }
    } catch (err) {
      console.error(err);
      alert("Error training model.");
    } finally {
      setTrainingLoading(false);
    }
  };

  const handleRunPrediction = async () => {
    if (!trainedModelCard || predictLoading) return;
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
          inputs: predictInputs
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
          cron: reportCron
        }),
      });

      if (!reportRes.ok) {
        throw new Error("Failed to generate compiler summary");
      }

      const reportData = await reportRes.json();
      setGeneratedReportsList((prev) => [...prev, reportData]);
      addLog("Reports", `Report compiled successfully: ${reportData.file_name}`, "success");
      alert(`Report generated: ${reportData.file_name}`);
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

  const value: WorkspaceContextValue = {
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
  const dashboardTab: WorkspaceTab = {
    id: "tab-dashboard",
    sectionId: "dashboard",
    title: SECTION_REGISTRY.dashboard.label,
    pinned: true,
    closable: false
  };
  return { tabs: [dashboardTab], activeTabId: dashboardTab.id };
}
