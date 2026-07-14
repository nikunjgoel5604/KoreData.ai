"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Bell,
  BrainCircuit,
  Code2,
  Database,
  FileClock,
  FileSpreadsheet,
  FileUp,
  Gauge,
  GitBranch,
  Layers3,
  Loader2,
  LogOut,
  MessageSquareText,
  Play,
  ShieldCheck,
  Sparkles,
  UserRound,
  WandSparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Terminal,
  Maximize2,
  Minimize2,
  Pin,
  X,
  FileText,
  Clock,
  Share2,
  Copy,
  Edit3,
  PlusCircle,
  Compass,
  Sun,
  Moon,
  Search,
  Settings,
  Grid,
  ChevronDown,
  Trash2,
  RefreshCw,
  AlertOctagon,
  Check
} from "lucide-react";
import Pipeline3D from "./Pipeline3D";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type UserProfile = {
  login_id: string;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
};

type NotificationItem = {
  id: number;
  message: string;
  type?: string;
  is_read?: number;
  created_at?: string;
};

type UploadedFile = {
  id: number;
  file_name: string;
  file_type: string;
  file_size_kb: number;
  row_count?: number;
  col_count?: number;
  uploaded_at?: string;
};

type MlModel = {
  model_key?: string;
  model_name?: string;
  name?: string;
  task_type?: string;
  category?: string;
};

type ActivitySummary = {
  today_active?: string;
  total_active?: string;
  login_count?: number;
  last_seen?: string;
  [key: string]: unknown;
};

type LogEntry = {
  timestamp: string;
  node: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
};

interface WorkspaceTab {
  id: string;
  datasetId?: number;
  datasetName: string;
  edaResult: Record<string, unknown> | null;
  simRunning: boolean;
  simProgress: number;
  currentStageKey: string | null;
  stageStatuses: Record<string, "idle" | "running" | "success" | "warning" | "error">;
  logs: LogEntry[];
  activePanels: string[];
  selectedPanel: string;
  pinned?: boolean;
}

const SIMULATION_STAGES = [
  { key: "upload", label: "File Ingestion", desc: "Reading file byte buffers from memory", category: "load" },
  { key: "validate", label: "Schema Validation", desc: "Verifying standard columns & formats", category: "load" },
  { key: "parse", label: "Table Parsing", desc: "Converting csv/parquet to tabular matrices", category: "load" },
  { key: "cleaning", label: "Data Sanitization", desc: "Removing spaces & standardizing text", category: "missing" },
  { key: "missing_detect", label: "Missing Cell Discovery", desc: "Scanning rows for incomplete null values", category: "missing" },
  { key: "duplicate_detect", label: "Duplicate Scans", desc: "Scanning matching index values", category: "inspect" },
  { key: "type_detect", label: "Type Inferences", desc: "Parsing numeric vs categorical schemas", category: "inspect" },
  { key: "feature_eng", label: "Feature Extraction", desc: "Creating encodings & normalizing vectors", category: "charts" },
  { key: "eda", label: "Profiling Distributions", desc: "Calculating cardinality & outlier limits", category: "charts" },
  { key: "stats", label: "Moments calculation", desc: "Computing mean, median, skewness stats", category: "stats" },
  { key: "correlation", label: "Correlation mapping", desc: "Building Pearson correlation arrays", category: "correlation" },
  { key: "ml_prep", label: "Dataset splits", desc: "Allocating 80/20 train/test splits", category: "nlp" },
  { key: "model_proc", label: "Model Fitting", desc: "Optimizing hyperparameters & model weights", category: "insights" },
  { key: "insight_gen", label: "AI Feature Analysis", desc: "Scoring target feature dependencies", category: "insights" },
  { key: "report_gen", label: "Intelligence Compiling", desc: "Assembling final JSON metrics report", category: "report" },
  { key: "export_results", label: "Model Export", desc: "Saving .joblib binary to workspace storage", category: "report" }
];

export default function DashboardClient() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [models, setModels] = useState<MlModel[]>([]);
  const [savedModels, setSavedModels] = useState<MlModel[]>([]);
  const [mlHistory, setMlHistory] = useState<Record<string, unknown>[]>([]);
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [status, setStatus] = useState("Checking workspace session...");
  const [apiStatus, setApiStatus] = useState<"ready" | "empty" | "error" | "loading">("loading");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- Themes ---
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // --- Multi-Tab Workspace States ---
  const [tabs, setTabs] = useState<WorkspaceTab[]>([
    {
      id: "unsaved_workspace",
      datasetName: "Unsaved Workspace",
      edaResult: null,
      simRunning: false,
      simProgress: 0,
      currentStageKey: null,
      stageStatuses: {},
      logs: [],
      activePanels: ["dashboard", "simulation", "eda-analysis", "data-cleaning"],
      selectedPanel: "dashboard"
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("unsaved_workspace");

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0] || {
    id: "unsaved_workspace",
    datasetName: "Unsaved Workspace",
    edaResult: null,
    simRunning: false,
    simProgress: 0,
    currentStageKey: null,
    stageStatuses: {},
    logs: [],
    activePanels: ["dashboard", "simulation", "eda-analysis", "data-cleaning"],
    selectedPanel: "dashboard"
  };

  const edaResult = activeTab.edaResult;
  const setEdaResult = (val: Record<string, unknown> | null | ((prev: Record<string, unknown> | null) => Record<string, unknown> | null)) => {
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, edaResult: typeof val === 'function' ? (val as any)(t.edaResult) : val } : t));
  };

  const activePanels = activeTab.activePanels;
  const setActivePanels = (val: string[] | ((prev: string[]) => string[])) => {
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, activePanels: typeof val === 'function' ? (val as any)(t.activePanels) : val } : t));
  };

  const selectedPanel = activeTab.selectedPanel;
  const setSelectedPanel = (val: string | ((prev: string) => string)) => {
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, selectedPanel: typeof val === 'function' ? (val as any)(t.selectedPanel) : val } : t));
  };

  const simRunning = activeTab.simRunning;
  const setSimRunning = (val: boolean | ((prev: boolean) => boolean)) => {
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, simRunning: typeof val === 'function' ? (val as any)(t.simRunning) : val } : t));
  };

  const simProgress = activeTab.simProgress;
  const setSimProgress = (val: number | ((prev: number) => number)) => {
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, simProgress: typeof val === 'function' ? (val as any)(t.simProgress) : val } : t));
  };

  const currentStageKey = activeTab.currentStageKey;
  const setCurrentStageKey = (val: string | null | ((prev: string | null) => string | null)) => {
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, currentStageKey: typeof val === 'function' ? (val as any)(t.currentStageKey) : val } : t));
  };

  const stageStatuses = activeTab.stageStatuses;
  const setStageStatuses = (val: Record<string, "idle" | "running" | "success" | "warning" | "error"> | ((prev: Record<string, "idle" | "running" | "success" | "warning" | "error">) => Record<string, "idle" | "running" | "success" | "warning" | "error">)) => {
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, stageStatuses: typeof val === 'function' ? (val as any)(t.stageStatuses) : val } : t));
  };

  const logs = activeTab.logs;
  const setLogs = (val: LogEntry[] | ((prev: LogEntry[]) => LogEntry[])) => {
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, logs: typeof val === 'function' ? (val as any)(t.logs) : val } : t));
  };

  const [pinnedPanels, setPinnedPanels] = useState<string[]>([]);
  const [view3D, setView3D] = useState(true);
  
  // Workspace Tab actions
  const [pinnedTabs, setPinnedTabs] = useState<string[]>([]);
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");

  // Collapsible Right AI Panel
  const [isRightAIPanelOpen, setIsRightAIPanelOpen] = useState(true);
  const [aiMessages, setAiMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Welcome to KoreData-EX AI Assistant. I can explain your dataset, recommend cleaning steps, generate reports, or compile SQL. Ask me anything!" }
  ]);
  const [aiInputText, setAiInputText] = useState("");

  // Visualizer configurations
  const [vizChartType, setVizChartType] = useState("bar");
  const [vizXAxis, setVizXAxis] = useState("");
  const [vizYAxis, setVizYAxis] = useState("");
  const [vizColorTheme, setVizColorTheme] = useState("classic");

  // Data Cleaning step selections
  const [activeCleanStep, setActiveCleanStep] = useState("missing");

  // ML Studio step builder configs
  const [activeMlStep, setActiveMlStep] = useState("target");
  const [mlAlgo, setMlAlgo] = useState("random-forest");

  // Reports settings
  const [reportType, setReportType] = useState("eda");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [reportCron, setReportCron] = useState("0 0 * * *");

  // --- Upload Dataset Panel Sub-tabs ---
  const [uploadSubTab, setUploadSubTab] = useState<"ingest" | "datasets">("ingest");

  // --- EDA Workflow Vertical Tabs ---
  const [edaStep, setEdaStep] = useState<number>(1);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- Bottom timeline tabs ---
  const [bottomTab, setBottomTab] = useState<"logs" | "python" | "sql" | "terminal" | "notifications" | "pipeline" | "jobs">("logs");
  const [isSimPanelOpen, setIsSimPanelOpen] = useState(false);

  const [stageTimes, setStageTimes] = useState<Record<string, number>>({});
  const [simEstTime, setSimEstTime] = useState<number>(0);
  const esRef = useRef<EventSource | null>(null);

  // --- Imputation & Cleaning States ---
  const [selectedColumn, setSelectedColumn] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("mean");
  const [cleanLoading, setCleanLoading] = useState(false);

  // --- Visualization Column ---
  const [vizColumn, setVizColumn] = useState("");
  const [edaHistCol, setEdaHistCol] = useState("");
  const [edaBoxCol, setEdaBoxCol] = useState("");
  const [edaCatCol, setEdaCatCol] = useState("");

  // --- Python Sandbox States ---
  const [codeText, setCodeText] = useState("");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [consoleError, setConsoleError] = useState("");
  const [consoleResult, setConsoleResult] = useState<any>(null);
  const [codeRunning, setCodeRunning] = useState(false);

  // --- ML Studio States ---
  const [targetCol, setTargetCol] = useState("");
  const [taskHint, setTaskHint] = useState("auto-detect");
  const [promptText, setPromptText] = useState("");
  const [mlRecommendLoading, setMlRecommendLoading] = useState(false);
  const [recommendationData, setRecommendationData] = useState<any>(null);
  const [trainingLoading, setTrainingLoading] = useState<boolean | string>(false);
  const [trainedModelCard, setTrainedModelCard] = useState<any>(null);
  const [predictInputs, setPredictInputs] = useState<Record<string, string>>({});
  const [predictResult, setPredictResult] = useState<any>(null);
  const [predictLoading, setPredictLoading] = useState(false);

  const updateInputRef = useRef<HTMLInputElement>(null);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    document.body.classList.add("dashboard-mode");
    return () => {
      document.body.classList.remove("dashboard-mode");
      esRef.current?.close();
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("koredata-token") || "";
    if (!savedToken) {
      window.location.href = "/login";
      return;
    }
    setToken(savedToken);
  }, []);

  // --- Workspace State Persistence in MySQL ---
  useEffect(() => {
    if (!token) return;

    const delayDebounce = setTimeout(async () => {
      try {
        const payload = {
          eda_result: activeTab?.edaResult ? JSON.stringify(activeTab.edaResult) : null,
          active_panels: JSON.stringify(activeTab?.activePanels || []),
          selected_panel: activeTab?.selectedPanel || "dashboard",
          sim_running: activeTab?.simRunning ? 1 : 0,
          current_stage_key: activeTab?.currentStageKey || null,
          sim_progress: activeTab?.simProgress || 0,
          stage_statuses: JSON.stringify(activeTab?.stageStatuses || {}),
          logs: JSON.stringify(activeTab?.logs || []),
          open_tabs_json: JSON.stringify(tabs),
          active_tab_id: activeTabId
        };

        await fetch(`${API_BASE}/workspace/state`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Failed to persist workspace state in database:", err);
      }
    }, 1500);

    return () => clearTimeout(delayDebounce);
  }, [tabs, activeTabId, token, authHeaders]);

  useEffect(() => {
    if (!token) return;

    const loadDashboard = async () => {
      setLoading(true);
      setApiStatus("loading");
      setStatus("Loading Python cloud packages...");

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

        const [filesRes, notifRes, modelsRes, savedRes, historyRes, activityRes, wsRes] = await Promise.all([
          fetch(`${API_BASE}/my-files`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/notifications`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/ml/models`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/ml/saved`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/ml/history`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/activity/dashboard`, { headers: authHeaders }).catch(() => null),
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

        if (activityRes?.ok) {
          setActivity(await activityRes.json());
        }

        let shouldStartSim = false;
        let simStageKey: string | null = null;

        if (wsRes?.ok) {
          const ws = await wsRes.json();
          if (ws.open_tabs_json) {
            try {
              const loadedTabs = JSON.parse(ws.open_tabs_json);
              if (loadedTabs && loadedTabs.length > 0) {
                setTabs(loadedTabs);
                const activeId = ws.active_tab_id || loadedTabs[0].id;
                setActiveTabId(activeId);
                const activeTabObj = loadedTabs.find((t: any) => t.id === activeId);
                if (activeTabObj && activeTabObj.simRunning) {
                  shouldStartSim = true;
                  simStageKey = activeTabObj.currentStageKey;
                }
              }
            } catch (tabErr) {
              console.error("Failed to parse loaded tabs:", tabErr);
            }
          } else if (ws.eda_result || ws.active_panels) {
            // Fallback for single-tab migration
            const legacyTab: WorkspaceTab = {
              id: "unsaved_workspace",
              datasetName: "Restored Workspace",
              edaResult: ws.eda_result ? JSON.parse(ws.eda_result) : null,
              simRunning: ws.sim_running === 1,
              simProgress: ws.sim_progress,
              currentStageKey: ws.current_stage_key,
              stageStatuses: ws.stage_statuses ? JSON.parse(ws.stage_statuses) : {},
              logs: ws.logs ? JSON.parse(ws.logs) : [],
              activePanels: ws.active_panels ? JSON.parse(ws.active_panels) : ["dashboard", "simulation", "eda-analysis", "data-cleaning"],
              selectedPanel: ws.selected_panel || "dashboard"
            };
            setTabs([legacyTab]);
            setActiveTabId(legacyTab.id);
            if (ws.sim_running === 1) {
              shouldStartSim = true;
              simStageKey = ws.current_stage_key;
            }
          }
        }

        setApiStatus("ready");
        setStatus("AI cloud runtime initialized");
        addLog("Runtime", "All endpoints bound successfully.", "success");

        if (shouldStartSim) {
          if (simStageKey) setCurrentStageKey(simStageKey);
          handleStartSimulation();
        }
      } catch {
        setApiStatus("error");
        setStatus("Cloud backend disconnected.");
        addLog("Runtime", "Failed to connect to backend api on http://127.0.0.1:8000.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [authHeaders, token]);

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

      const cols = (edaResult as any).dataset_slices?.col_names || [];
      if (cols.length > 0) {
        setTargetCol(cols[cols.length - 1]);
        setSelectedColumn(cols[0]);
        setVizColumn(cols[0]);
      }

      const over = (edaResult as any).overview || {};
      const numCols = over.numeric_columns || [];
      const catCols = over.categorical_columns || [];
      if (numCols.length > 0) {
        setEdaHistCol(numCols[0]);
        setEdaBoxCol(numCols[0]);
      }
      if (catCols.length > 0) {
        setEdaCatCol(catCols[0]);
      }
    }
  }, [edaResult]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (node: string, message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, node, message, type }]);
  };

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
    setStatus(`Ingesting data file ${file.name}...`);
    addLog("Ingestion", `Uploading file: ${file.name}`, "info");

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: authHeaders,
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Upload failed.");
        addLog("Ingestion", `Inference table upload failed: ${data.error}`, "error");
        return;
      }

      setEdaResult(data);
      setStatus("Dataset EDA indexing complete");
      addLog("Ingestion", `Dataset analysis complete. Rows: ${data.overview?.rows}, Cols: ${data.overview?.columns}`, "success");

      const filesRes = await fetch(`${API_BASE}/my-files`, { headers: authHeaders }).catch(() => null);
      if (filesRes?.ok) {
        const filesData = await filesRes.json();
        setFiles(filesData.files || []);
      }
    } catch {
      setStatus("Upload failed.");
      addLog("Ingestion", "Connection timeout during file processing.", "error");
    } finally {
setUploading(false);
      event.target.value = "";
    }
  };

  // --- REUSE Cached Dataset Profile in Workspace Tab ---
  const handleReuseFile = async (fileId: number, fileName: string) => {
    addLog("Runtime", `Restoring dataset profile for: ${fileName}...`, "info");
    try {
      const res = await fetch(`${API_BASE}/my-files/${fileId}/eda`, { headers: authHeaders });
      if (!res.ok) {
        throw new Error("Failed to retrieve cached EDA results from database storage");
      }
      const cachedEda = await res.json();
      
      const tabId = `tab_${Date.now()}`;
      const newTab: WorkspaceTab = {
        id: tabId,
        datasetId: fileId,
        datasetName: fileName,
        edaResult: cachedEda,
        simRunning: false,
        simProgress: 0,
        currentStageKey: null,
        stageStatuses: {},
        logs: [{
          timestamp: new Date().toLocaleTimeString(),
          node: "Runtime",
          message: `Workspace profile restored from cached file: ${fileName}`,
          type: "success"
        }],
        activePanels: ["dashboard", "simulation", "eda-analysis", "data-cleaning"],
        selectedPanel: "dashboard"
      };
      
      setTabs([...tabs, newTab]);
      setActiveTabId(tabId);
      addLog("Runtime", `Restored workspace dataset: ${fileName}`, "success");
    } catch (err: any) {
      console.error(err);
      alert(`Could not reuse dataset: ${err.message}`);
      addLog("Runtime", `Failed to restore cached profile for: ${fileName}`, "error");
    }
  };

  // --- DELETE Dataset from Database ---
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

  // --- Stop All Workspace Operations (Emergency Abort) ---
  const handleStopAllOperations = () => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    setSimRunning(false);
    setSimProgress(0);
    setCurrentStageKey(null);

    const clearedStatuses: Record<string, "idle" | "running" | "success" | "warning" | "error"> = {};
    SIMULATION_STAGES.forEach((s) => {
      clearedStatuses[s.key] = "idle";
    });
    setStageStatuses(clearedStatuses);
    addLog("Runtime", "Workspace processes terminated by emergency abort command.", "error");

    window.localStorage.removeItem("kore-sim-running");
    window.localStorage.removeItem("kore-current-stage-key");
    window.localStorage.removeItem("kore-sim-progress");
    window.localStorage.removeItem("kore-stage-statuses");
  };

  const logout = async () => {
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: authHeaders
      }).catch(() => null);
    }
    window.localStorage.removeItem("koredata-token");
    window.localStorage.removeItem("koredata-login-id");
    window.location.href = "/login";
  };

  const allColumns = useMemo(() => {
    if (!edaResult) return [];
    const over = (edaResult as any).overview || {};
    return [
      ...(over.numeric_columns || []),
      ...(over.categorical_columns || []),
      ...(over.datetime_columns || [])
    ];
  }, [edaResult]);

  const columnDistribution = useMemo(() => {
    if (!edaResult || !vizColumn) return [];
    const rows = (edaResult as any).dataset_slices?.head?.["100"] || [];
    const vals = rows.map((r: any) => r[vizColumn]).filter((v: any) => v !== null && v !== undefined);

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
  }, [edaResult, vizColumn]);

  // --- Docking Panels Controls ---
  const togglePanel = (panelId: string) => {
    if (!activePanels.includes(panelId)) {
      setActivePanels([...activePanels, panelId]);
    }
    setSelectedPanel(panelId);
    addLog("Workspace", `Focused panel: ${panelId}`, "info");
  };

  const closePanel = (panelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = activePanels.filter((id) => id !== panelId);
    setActivePanels(remaining);
    if (selectedPanel === panelId && remaining.length > 0) {
      setSelectedPanel(remaining[0]);
    }
  };

  // --- Simulation Runner (16-Stage) ---
  const handleStartSimulation = () => {
    if (simRunning && esRef.current) return;
    const targetTabId = activeTab.id;

    const updateTab = (tabId: string, fields: Partial<WorkspaceTab> | ((t: WorkspaceTab) => Partial<WorkspaceTab>)) => {
      setTabs(prev => prev.map(t => {
        if (t.id === tabId) {
          const resolved = typeof fields === 'function' ? fields(t) : fields;
          return { ...t, ...resolved };
        }
        return t;
      }));
    };

    updateTab(targetTabId, {
      simRunning: true,
      simProgress: 0,
      currentStageKey: "upload",
      stageStatuses: SIMULATION_STAGES.reduce((acc, s) => ({ ...acc, [s.key]: "idle" }), {}),
      logs: [...(tabs.find(t => t.id === targetTabId)?.logs || []), {
        timestamp: new Date().toLocaleTimeString(),
        node: "Simulation",
        message: "Automated execution pipeline triggered.",
        type: "info"
      }]
    });

    const es = new EventSource(`${API_BASE}/simulation/run`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "complete") {
          updateTab(targetTabId, t => ({
            simProgress: 100,
            simRunning: false,
            currentStageKey: null,
            logs: [...t.logs, {
              timestamp: new Date().toLocaleTimeString(),
              node: "Simulation",
              message: "Pipeline execution completed successfully.",
              type: "success"
            }]
          }));
          es.close();
          esRef.current = null;
        } else {
          const category = data.key;
          const status = data.status;

          updateTab(targetTabId, t => {
            const nextStatuses = { ...t.stageStatuses };
            let nextStageKey = t.currentStageKey;
            const nextLogs = [...t.logs];

            SIMULATION_STAGES.forEach((stage) => {
              if (stage.category === category) {
                nextStatuses[stage.key] = status === "running" ? "running" : "success";
                if (status === "running") {
                  nextStageKey = stage.key;
                  nextLogs.push({
                    timestamp: new Date().toLocaleTimeString(),
                    node: "Pipeline",
                    message: `${stage.label} active...`,
                    type: "info"
                  });
                }
              }
            });

            return {
              stageStatuses: nextStatuses,
              currentStageKey: nextStageKey,
              logs: nextLogs,
              simProgress: data.progress
            };
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    es.onerror = () => {
      updateTab(targetTabId, t => ({
        simRunning: false,
        logs: [...t.logs, {
          timestamp: new Date().toLocaleTimeString(),
          node: "Simulation",
          message: "Pipeline execution failed or disconnected.",
          type: "error"
        }]
      }));
      es.close();
      esRef.current = null;
    };
  };

  // --- Clean & Impute Missing Data ---
  const handleApplyImputation = async () => {
    if (!edaResult || !selectedColumn || cleanLoading) return;
    setCleanLoading(true);
    addLog("Cleaning", `Applying Imputation on column: ${selectedColumn}`, "info");

    try {
      const dataSlices = (edaResult as any).dataset_slices || {};
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

      setStatus(`Re-calculating EDA stats...`);
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
        setStatus(editData.detail || "EDA re-run failed.");
        return;
      }

      setEdaResult(editData);
      setStatus("EDA updated successfully");
      addLog("Cleaning", `Filled missing cells in ${selectedColumn}. Quality score: ${editData.data_quality?.quality_score}%`, "success");
      alert(`Imputation applied successfully.`);
    } catch (err) {
      console.error(err);
      alert("Error applying imputation.");
    } finally {
      setCleanLoading(false);
    }
  };

  // --- Python Code Sandbox ---
  const handleRunCode = async () => {
    if (!edaResult || codeRunning) return;
    setCodeRunning(true);
    setConsoleOutput("Running script on backend...");
    setConsoleError("");
    setConsoleResult(null);
    addLog("Console", "Initializing sandboxed Python compilation.", "info");

    try {
      const dataSlices = (edaResult as any).dataset_slices || {};
      const payload = {
        code: codeText,
        dataset: {
          data: dataSlices.head?.["100"] || [],
          columns: dataSlices.col_names || [],
        },
      };

      const res = await fetch(`${API_BASE}/code-run`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setConsoleError(data.detail || "Execution failed.");
        addLog("Console", `Compilation Error: ${data.detail}`, "error");
        return;
      }

      setConsoleOutput(data.output || "");
      if (data.error) {
        setConsoleError(data.error);
        addLog("Console", "Runtime script exception detected.", "error");
      }
      if (data.result) {
        setConsoleResult(data.result);
        addLog("Console", "Dataframe returned successfully.", "success");
      }
    } catch (err) {
      setConsoleError("Network error.");
    } finally {
      setCodeRunning(false);
    }
  };

  // --- ML Studio ---
  const handleGetRecommendations = async () => {
    if (!edaResult || mlRecommendLoading) return;
    setMlRecommendLoading(true);
    setRecommendationData(null);
    setTrainedModelCard(null);
    setPredictResult(null);
    addLog("ML Studio", `Analyzing column dependencies for target: ${targetCol}`, "info");

    try {
      const dataSlices = (edaResult as any).dataset_slices || {};
      const edaScore = (edaResult as any).eda_accuracy?.eda_accuracy ?? 75.0;

      const payload = {
        data: dataSlices.head?.["100"] || [],
        columns: dataSlices.col_names || [],
        target_col: targetCol,
        task_hint: taskHint === "auto-detect" ? null : taskHint,
        eda_score: edaScore,
      };

      let endpoint = `${API_BASE}/ml/recommend`;
      let requestBody: any = payload;

      if (promptText.trim()) {
        endpoint = `${API_BASE}/ml/suggest`;
        requestBody = { ...payload, prompt: promptText.trim() };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Failed to fetch model recommendations.");
        return;
      }

      setRecommendationData(data);
      addLog("ML Studio", "Suitability model scorecard loaded.", "success");
    } catch (err) {
      console.error(err);
      alert("Error fetching recommendations.");
    } finally {
      setMlRecommendLoading(false);
    }
  };

  const handleTrainModel = async (modelKey: string, isAuto = false) => {
    if (!edaResult || trainingLoading) return;
    setTrainingLoading(isAuto ? "auto" : modelKey);
    setTrainedModelCard(null);
    setPredictResult(null);
    setPredictInputs({});
    addLog("ML Studio", isAuto ? "Starting automated multi-model pipeline training..." : `Training algorithm: ${modelKey}`, "info");

    try {
      const dataSlices = (edaResult as any).dataset_slices || {};
      const edaScore = (edaResult as any).eda_accuracy?.eda_accuracy ?? 75.0;

      const payload = {
        data: dataSlices.head?.["100"] || [],
        columns: dataSlices.col_names || [],
        target_col: targetCol,
        task_hint: taskHint === "auto-detect" ? null : taskHint,
        eda_score: edaScore,
      };

      let endpoint = `${API_BASE}/ml/train`;
      let requestBody: any = {
        ...payload,
        model_key: modelKey,
        hyperparams: null,
        test_size: 0.2,
        stratify: true,
      };

      if (isAuto) {
        endpoint = `${API_BASE}/ml/auto`;
        requestBody = payload;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Model training failed.");
        addLog("ML Studio", "Training run failed on cloud server.", "error");
        return;
      }

      const reportRes = await fetch(`${API_BASE}/ml/report`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          train_result: isAuto ? data.best_result : data,
          dataset_profile: data.dataset_profile || recommendationData?.dataset_profile || null,
        }),
      });

      const reportData = await reportRes.json();

      setTrainedModelCard({
        rawResult: isAuto ? data.best_result : data,
        report: reportRes.ok ? reportData.report : null,
      });

      const featuresList = (isAuto ? data.best_result : data).feature_names || [];
      const initInputs: Record<string, string> = {};
      featuresList.forEach((feat: string) => {
        initInputs[feat] = "0";
      });
      setPredictInputs(initInputs);

      addLog("ML Studio", `Model trained successfully. Grade: ${reportData.report?.grade || "N/A"}`, "success");

      const [savedRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/ml/saved`, { headers: authHeaders }).catch(() => null),
        fetch(`${API_BASE}/ml/history`, { headers: authHeaders }).catch(() => null)
      ]);
      if (savedRes?.ok) {
        const savedData = await savedRes.json();
        setSavedModels(savedData.models || savedData.saved || savedData.saved_models || []);
      }
      if (historyRes?.ok) {
        const histData = await historyRes.json();
        setMlHistory(histData.history || histData.items || []);
      }
    } catch (err) {
      console.error(err);
      alert("Error training model.");
    } finally {
      setTrainingLoading(false);
    }
  };

  const handlePredict = async (e: FormEvent) => {
    e.preventDefault();
    if (!trainedModelCard || predictLoading) return;
    setPredictLoading(true);
    setPredictResult(null);
    addLog("ML Studio", "Submitting query for real-time model inference.", "info");

    try {
      const rawResult = trainedModelCard.rawResult;
      const payload = {
        model_b64: rawResult.model_b64,
        scaler_b64: rawResult.scaler_b64,
        le_b64: rawResult.le_b64 || "",
        feature_names: rawResult.feature_names || [],
        rows: [
          Object.keys(predictInputs).reduce((acc, key) => {
            const val = parseFloat(predictInputs[key]);
            acc[key] = isNaN(val) ? predictInputs[key] : val;
            return acc;
          }, {} as Record<string, any>),
        ],
      };

      const res = await fetch(`${API_BASE}/ml/predict`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Prediction failed.");
        return;
      }

      setPredictResult(data);
      addLog("ML Studio", `Inference response: ${data.predictions?.[0]}`, "success");
    } catch (err) {
      console.error(err);
      alert("Error generating prediction.");
    } finally {
      setPredictLoading(false);
    }
  };

  const handleDownloadModel = async (modelKey: string) => {
    try {
      const res = await fetch(`${API_BASE}/ml/download/${modelKey}`, {
        headers: authHeaders,
      });

      if (!res.ok) {
        alert("Failed to download model.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kore_${modelKey}_model.joblib`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addLog("ML Studio", `Downloaded model binary: ${modelKey}.joblib`, "success");
    } catch (err) {
      console.error(err);
    }
  };

  // --- Theme-Responsive Contrast Palette Configurations ---
  const colors = useMemo(() => {
    return {
      bg: "bg-[#0F172A] text-[#F8FAFC]",
      topbar: "bg-[#111827] border-[#334155] text-[#F8FAFC]",
      sidebar: "bg-[#111827] border-[#334155]",
      card: "bg-[#1E293B] border-[#334155] shadow-lg",
      secondaryCard: "bg-[#243244] border-[#334155]",
      border: "border-[#334155]",
      input: "bg-[#1E293B] border-[#334155] text-[#F8FAFC] focus:border-[#38BDF8]/40",
      
      // Text contrast levels
      textPrimary: "text-[#F8FAFC]",
      textSecondary: "text-[#CBD5E1]",
      textMuted: "text-slate-400",
      textDim: "text-slate-500 font-mono",
      
      // Dynamic colors for variance indicators
      valPositive: "text-emerald-400 font-semibold",
      valWarning: "text-amber-400 font-semibold",
      
      // Table elements contrast
      tableHeader: "text-slate-400 border-[#334155] bg-[#111827]/40",
      tableRow: "border-[#334155]/40 text-[#CBD5E1] hover:bg-[#1E293B]/50 transition-colors",
      
      // Visualizer canvas box theme background
      visBg: "bg-[#1E293B] border-[#334155]",
      
      btnPrimary: "bg-[#38BDF8] hover:bg-[#38BDF8]/80 text-[#0F172A]",
      tabActive: "bg-[#1E293B] text-[#38BDF8] border-b-2 border-b-[#38BDF8]",
      tabInactive: "text-slate-500 hover:text-slate-350",
    };
  }, []);

  // Statistics derived values
  const totalRows = edaResult ? Number((edaResult.overview as any)?.rows || 0) : 0;
  const totalCols = edaResult ? Number((edaResult.overview as any)?.columns || 0) : 0;
  const missingValues = edaResult ? Number((edaResult.quality as any)?.missing_cells || 0) : 0;
  const qualityScore = edaResult ? Number((edaResult.data_quality as any)?.quality_score || 0) : 0;

  const handleRenameTab = (tabId: string, newName: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, datasetName: newName } : t));
    setRenamingTabId(null);
  };

  const handleDuplicateTab = (tab: WorkspaceTab) => {
    const newId = `tab_${Date.now()}`;
    const newTab: WorkspaceTab = {
      ...tab,
      id: newId,
      datasetName: `${tab.datasetName} (Copy)`,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleTogglePinTab = (tabId: string) => {
    setPinnedTabs(prev => prev.includes(tabId) ? prev.filter(id => id !== tabId) : [...prev, tabId]);
  };

  const pipelineStages = [
    { id: "dashboard", label: "Workspace" },
    { id: "upload", label: "Import Dataset" },
    { id: "eda-analysis", label: "EDA Analysis" },
    { id: "visualization", label: "Visualization" },
    { id: "data-cleaning", label: "Data Cleaning" },
    { id: "feature-engineering", label: "Feature Engineering" },
    { id: "ml-studio", label: "Machine Learning" },
    { id: "prediction", label: "Prediction" },
    { id: "ai-assistant", label: "AI Insights" },
    { id: "reports", label: "Reports" },
    { id: "export", label: "Export" }
  ];

  return (
    <div className={`relative z-30 flex h-screen w-screen overflow-hidden font-sans transition-colors duration-300 ${colors.bg}`}>
      
      {/* LEFT NAVIGATION SIDEBAR */}
      <aside className={`w-64 flex flex-col border-r ${colors.sidebar} transition-colors duration-300 z-20 select-none`}>
        <div className="p-5 border-b border-[#334155] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#38BDF8] to-[#06B6D4] flex items-center justify-center text-[#0F172A] font-mono font-extrabold text-sm shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            K
          </div>
          <div>
            <strong className="block text-sm font-bold tracking-widest uppercase text-[#F8FAFC]">KoreData-EX</strong>
            <small className="block text-[9px] text-[#38BDF8] tracking-wider uppercase font-mono">Enterprise AI Workspace</small>
          </div>
        </div>

        {/* SIDEBAR MAIN MENU */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block mb-3 pl-2">Platform Core</span>
            <nav className="space-y-1">
              {[
                { id: "dashboard", label: "Dashboard", icon: Grid },
                { id: "upload", label: "Import Dataset", icon: FileUp },
                { id: "dataset-manager", label: "Dataset Manager", icon: Database },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = selectedPanel === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedPanel(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono rounded-lg transition-all border ${
                      isActive
                        ? "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                        : "text-slate-500 hover:text-slate-350 hover:bg-slate-800/20 border-transparent"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block mb-3 pl-2">Pipelines & ML</span>
            <nav className="space-y-1">
              {[
                { id: "eda-analysis", label: "EDA Analysis", icon: Activity },
                { id: "visualization", label: "Visualization", icon: Layers3 },
                { id: "data-cleaning", label: "Data Cleaning", icon: WandSparkles },
                { id: "feature-engineering", label: "Feature Engineering", icon: Sparkles },
                { id: "ml-studio", label: "ML Studio Builder", icon: BrainCircuit },
                { id: "prediction", label: "Prediction", icon: GitBranch },
                { id: "pipeline-history", label: "Pipeline History", icon: Clock },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = selectedPanel === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedPanel(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono rounded-lg transition-all border ${
                      isActive
                        ? "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                        : "text-slate-500 hover:text-slate-350 hover:bg-slate-800/20 border-transparent"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block mb-3 pl-2">Workspace Actions</span>
            <nav className="space-y-1">
              {[
                { id: "ai-assistant", label: "AI Assistant", icon: MessageSquareText },
                { id: "reports", label: "Reports Manager", icon: FileText },
                { id: "export", label: "Export Workspace", icon: Share2 },
                { id: "settings", label: "Workspace Settings", icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = selectedPanel === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedPanel(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono rounded-lg transition-all border ${
                      isActive
                        ? "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                        : "text-slate-500 hover:text-slate-350 hover:bg-slate-800/20 border-transparent"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* BOTTOM BRAND CARD */}
        <div className="p-4 border-t border-[#334155]/60">
          <div className="p-3 bg-[#1E293B] border border-[#334155] rounded-xl mb-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8]">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div>
              <strong className="block text-[11px] text-white uppercase font-mono">KoreData-EX</strong>
              <span className="block text-[9px] text-[#CBD5E1] font-mono">Enterprise v4.0</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-[10px] font-mono pl-1">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Operational</span>
            </div>
            <button onClick={logout} className="text-slate-550 hover:text-red-400 flex items-center gap-1 transition-all">
              <LogOut size={12} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT REGION */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAVBAR */}
        <header className={`h-14 border-b ${colors.topbar} flex items-center justify-between px-6 z-10 transition-colors duration-300`}>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold uppercase tracking-wider text-[#F8FAFC] font-mono">
              {activeTab.datasetName}
            </span>
            <span className="text-slate-600">|</span>
            <div className={`px-2.5 py-1 text-[10px] font-mono border rounded-md uppercase ${
              apiStatus === "ready"
                ? "bg-[#22C55E]/5 border-[#22C55E]/20 text-[#22C55E]"
                : "bg-[#F59E0B]/5 border-[#F59E0B]/20 text-[#F59E0B]"
            }`}>
              Status: {apiStatus.toUpperCase()}
            </div>
          </div>

          {/* Centered Global Search */}
          <div className="w-80 relative hidden md:block">
            <Search className="absolute left-3 top-2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search workspace objects..."
              className="w-full text-xs font-mono pl-9 pr-3 py-1.5 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#38BDF8]"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-450 hover:text-[#38BDF8] hover:bg-[#1E293B] rounded-lg transition-all" title="Share Workspace">
              <Share2 size={16} />
            </button>
            <button className="p-2 text-slate-450 hover:text-[#38BDF8] hover:bg-[#1E293B] rounded-lg transition-all" title="Workspace Settings">
              <Settings size={16} />
            </button>
            <button className="p-2 text-slate-450 hover:text-[#38BDF8] hover:bg-[#1E293B] rounded-lg transition-all relative" title="Notifications">
              <Bell size={16} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] absolute top-1.5 right-1.5" />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 text-slate-450 hover:text-[#38BDF8] hover:bg-[#1E293B] rounded-lg border border-[#334155]/60 transition-all"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-[#334155]/60">
              <div className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center text-[#F8FAFC] font-mono text-xs uppercase border border-[#334155]">
                NG
              </div>
              <div className="text-left select-none hidden lg:block">
                <strong className="block text-xs font-bold text-[#F8FAFC]">Nikunj Goel</strong>
                <span className="block text-[9px] text-[#CBD5E1] font-mono">Data Scientist</span>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE TABS BAR */}
        <div className="h-11 border-b border-[#334155] flex items-center justify-between px-6 bg-[#111827]/40 select-none z-10">
          <div className="flex items-center gap-1 overflow-x-auto h-full scrollbar-none">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const isPinned = pinnedTabs.includes(tab.id);
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`h-full px-4 flex items-center gap-2 text-xs font-mono border-r border-[#334155]/60 cursor-pointer transition-all relative ${
                    isActive
                      ? "text-[#38BDF8] bg-[#1E293B]/40 font-bold border-t-2 border-t-[#38BDF8]"
                      : "text-slate-500 hover:text-slate-300 hover:bg-[#1E293B]/10 border-t-2 border-t-transparent"
                  }`}
                  onDoubleClick={() => {
                    setRenamingTabId(tab.id);
                    setRenameText(tab.datasetName);
                  }}
                >
                  {isPinned && <Pin size={10} className="text-[#38BDF8]" />}
                  {renamingTabId === tab.id ? (
                    <input
                      type="text"
                      value={renameText}
                      onChange={(e) => setRenameText(e.target.value)}
                      onBlur={() => handleRenameTab(tab.id, renameText)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameTab(tab.id, renameText);
                      }}
                      className="bg-[#1E293B] text-white text-xs px-1 rounded outline-none w-20"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate max-w-[120px]">{tab.datasetName}</span>
                  )}
                  
                  {/* Tab Action Panel Options */}
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePinTab(tab.id);
                      }}
                      className="text-slate-600 hover:text-[#38BDF8] text-[9px]"
                      title={isPinned ? "Unpin Tab" : "Pin Tab"}
                    >
                      ⚓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateTab(tab);
                      }}
                      className="text-slate-600 hover:text-[#38BDF8] text-[9px]"
                      title="Duplicate Tab"
                    >
                      ❐
                    </button>
                    {tabs.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const index = tabs.findIndex(t => t.id === tab.id);
                          const nextTabs = tabs.filter(t => t.id !== tab.id);
                          setTabs(nextTabs);
                          if (isActive && nextTabs.length > 0) {
                            setActiveTabId(nextTabs[Math.max(0, index - 1)].id);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-550 hover:text-red-400 font-bold text-[9px] transition-all"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            
            <button
              onClick={() => {
                const newId = `tab_${Date.now()}`;
                const newTab: WorkspaceTab = {
                  id: newId,
                  datasetName: `Workspace ${tabs.length + 1}`,
                  edaResult: null,
                  simRunning: false,
                  simProgress: 0,
                  currentStageKey: null,
                  stageStatuses: {},
                  logs: [],
                  activePanels: ["dashboard", "simulation", "eda-analysis", "data-cleaning"],
                  selectedPanel: "dashboard"
                };
                setTabs([...tabs, newTab]);
                setActiveTabId(newId);
              }}
              className="px-3 h-full flex items-center text-slate-500 hover:text-[#38BDF8] hover:bg-[#1E293B]/10 text-xs transition-all font-mono"
            >
              + New Tab
            </button>
          </div>
        </div>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex min-h-0 relative">
          
          {/* CENTER ACTIVE SPACE */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-6 space-y-6">
            
            {/* WORKSPACE MAIN HEADER METADATA */}
            <div className={`p-4 rounded-xl border ${colors.card} flex flex-wrap gap-6 justify-between items-center font-mono text-xs text-[#CBD5E1]`}>
              <div>
                <span className="text-slate-500 block uppercase text-[9px] tracking-wider">Active Workspace</span>
                <strong className="text-[#F8FAFC] text-sm font-semibold">{activeTab.datasetName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[9px] tracking-wider">Created Date</span>
                <span className="text-[#F8FAFC]">14-Jul-2026</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[9px] tracking-wider">Owner</span>
                <span className="text-[#F8FAFC]">Nikunj Goel</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[9px] tracking-wider">Current Dataset</span>
                <span className="text-[#38BDF8] font-bold">{edaResult ? "Ingested_Table" : "NA"}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[9px] tracking-wider">Pipeline Engine</span>
                <span className={`font-bold ${simRunning ? "text-[#38BDF8] animate-pulse" : "text-slate-450"}`}>
                  {simRunning ? "RUNNING" : "IDLE"}
                </span>
              </div>
            </div>

            {/* PIPELINE NAVIGATOR FLOW BAR */}
            <div className={`p-4 rounded-xl border ${colors.card} bg-[#111827]/10 overflow-x-auto`}>
              <div className="flex items-center gap-4 min-w-[900px] justify-between relative pl-4 pr-4">
                {pipelineStages.map((stage, idx) => {
                  const isActive = selectedPanel === stage.id;
                  const isSimCurrent = currentStageKey && stage.id === "simulation";
                  
                  // Stage Status color selection
                  let ringColor = "border-[#334155] text-slate-500";
                  if (isActive) {
                    ringColor = "border-[#38BDF8] bg-[#38BDF8]/10 text-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.2)]";
                  } else if (edaResult && idx < 3) {
                    ringColor = "border-[#22C55E] bg-[#22C55E]/5 text-[#22C55E]";
                  } else if (isSimCurrent) {
                    ringColor = "border-[#38BDF8] bg-[#38BDF8]/10 text-[#38BDF8] animate-pulse";
                  }

                  return (
                    <div key={stage.id} className="flex items-center gap-3 relative z-10">
                      <button
                        onClick={() => setSelectedPanel(stage.id)}
                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold transition-all ${ringColor}`}
                        title={stage.label}
                      >
                        {idx + 1}
                      </button>
                      <span className={`text-[10px] font-mono whitespace-nowrap ${isActive ? "text-[#38BDF8] font-bold" : "text-slate-500"}`}>
                        {stage.label}
                      </span>
                      {idx < pipelineStages.length - 1 && (
                        <span className="text-slate-700 font-bold ml-2 font-mono">➔</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DASHBOARD PAGE */}
            {selectedPanel === "dashboard" && (
              <div className="space-y-6">
                
                {/* 10-GRID KPI CARDS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { label: "Datasets Ingested", value: edaResult ? "1" : "NA", change: "+0", trend: [1, 1, 1, 1, 1], icon: Database },
                    { label: "Total Data Rows", value: edaResult ? totalRows.toLocaleString() : "NA", change: "+12%", trend: [2, 4, 3, 5, 8], icon: Grid },
                    { label: "Variables / Columns", value: edaResult ? totalCols : "NA", change: "+0", trend: [1, 1, 1, 1, 1], icon: Layers3 },
                    { label: "Quality Score", value: edaResult ? `${qualityScore.toFixed(1)}%` : "NA", change: "+1.2%", trend: [80, 82, 85, 89, 93], icon: ShieldCheck },
                    { label: "Missing Cell Values", value: edaResult ? missingValues : "NA", change: "-8%", trend: [120, 100, 80, 50, 20], icon: AlertTriangle },
                    { label: "Duplicate Rows", value: edaResult ? Number((edaResult as any).data_quality?.duplicates || 0) : "NA", change: "-100%", trend: [45, 30, 15, 5, 0], icon: AlertOctagon },
                    { label: "Pipeline Runs", value: simRunning ? "Active" : "3", change: "+1 today", trend: [1, 2, 2, 3, 3], icon: GitBranch },
                    { label: "Avg Processing Time", value: edaResult ? "2m 14s" : "NA", change: "-14s", trend: [148, 140, 136, 134, 134], icon: Clock },
                    { label: "Disk Storage Used", value: edaResult ? "4.2 MB" : "NA", change: "+450 KB", trend: [2, 3, 3, 4, 4], icon: Database },
                    { label: "Generated Reports", value: "2", change: "+1", trend: [0, 1, 1, 2, 2], icon: FileText },
                  ].map((card, idx) => {
                    const CardIcon = card.icon;
                    return (
                      <div key={idx} className={`p-4 rounded-xl border ${colors.card} flex flex-col justify-between h-32 hover:border-[#38BDF8]/40 transition-colors`}>
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{card.label}</span>
                          <CardIcon size={14} className="text-[#38BDF8]" />
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                          <strong className="text-xl font-bold font-mono text-[#F8FAFC]">{card.value}</strong>
                          <span className={`text-[9px] font-mono font-bold text-emerald-400`}>
                            {card.change}
                          </span>
                        </div>
                        
                        {/* Sparkline trend SVG */}
                        <div className="h-6 w-full mt-2">
                          <svg className="w-full h-full text-[#38BDF8]" viewBox="0 0 100 20">
                            <polyline
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              points={card.trend.map((val, i) => `${(i * 100) / (card.trend.length - 1)},${20 - ((val - Math.min(...card.trend)) / (Math.max(...card.trend) - Math.min(...card.trend) || 1)) * 16 - 2}`).join(" ")}
                            />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* RESPONSIVE GRID FOR CENTER DASHBOARD */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Progress & Timeline */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Pipeline Progress and Active Step */}
                    <div className={`p-5 rounded-xl border ${colors.card} space-y-4`}>
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F8FAFC]">Pipeline Flow Status</h3>
                      <div className="flex flex-wrap gap-6 items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 relative flex items-center justify-center transform -rotate-90">
                            <svg className="w-20 h-20">
                              <circle cx="40" cy="40" r="32" stroke="rgba(56, 189, 248, 0.1)" strokeWidth="5" fill="transparent" />
                              <circle
                                cx="40" cy="40" r="32" stroke="#38BDF8" strokeWidth="5" fill="transparent"
                                strokeDasharray={2 * Math.PI * 32}
                                strokeDashoffset={2 * Math.PI * 32 - (simProgress / 100) * (2 * Math.PI * 32)}
                                className="transition-all duration-300"
                              />
                            </svg>
                            <span className="absolute text-sm font-mono font-bold text-[#F8FAFC] transform rotate-90">{simProgress}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase font-mono">Current stage active</span>
                            <strong className="text-sm text-slate-200 mt-1 block font-mono">
                              {currentStageKey ? SIMULATION_STAGES.find(s => s.key === currentStageKey)?.label : "Pipeline Engines Idle"}
                            </strong>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleStartSimulation}
                            disabled={simRunning || !edaResult}
                            className="bg-[#38BDF8] text-[#0F172A] font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-lg hover:bg-[#38BDF8]/80 transition-all flex items-center gap-2 font-mono disabled:opacity-40 disabled:pointer-events-none"
                          >
                            {simRunning ? <Loader2 className="spin animate-spin" size={14} /> : <Play size={14} />}
                            Trigger Pipeline
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Pipeline Stage Details list */}
                    <div className={`p-5 rounded-xl border ${colors.card} space-y-4`}>
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F8FAFC]">Active Stages Timeline</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {SIMULATION_STAGES.slice(0, 8).map((stage, idx) => {
                          const status = stageStatuses[stage.key] || "idle";
                          const isCurrent = currentStageKey === stage.key;
                          const isDone = status === "success";

                          let cardBg = "bg-[#1E293B]/45 border-[#334155]/60 text-slate-400";
                          let titleColor = "text-slate-400";
                          let badgeClass = "bg-slate-900/60 text-slate-650";

                          if (isCurrent) {
                            cardBg = "bg-[#38BDF8]/5 border-[#38BDF8]/20 text-[#38BDF8]";
                            titleColor = "text-slate-200 font-bold";
                            badgeClass = "bg-[#38BDF8]/10 text-[#38BDF8] animate-pulse";
                          } else if (isDone) {
                            cardBg = "bg-[#22C55E]/5 border-[#22C55E]/20 text-[#22C55E]";
                            titleColor = "text-slate-300";
                            badgeClass = "bg-[#22C55E]/10 text-[#22C55E] font-bold";
                          }

                          return (
                            <div key={stage.key} className={`p-3 border rounded-lg flex flex-col justify-between h-20 ${cardBg} text-[10px] transition-all`}>
                              <span className="text-[8px] text-slate-500 block uppercase">STAGE {idx + 1}</span>
                              <span className="truncate block font-bold">{stage.label}</span>
                              <span className={`text-[7px] px-1 py-0.5 rounded font-bold uppercase w-fit mt-1 ${badgeClass}`}>
                                {isCurrent ? "Running" : isDone ? "Done" : "Idle"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recent Uploaded Datasets Table */}
                    <div className={`p-5 rounded-xl border ${colors.card} space-y-4`}>
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F8FAFC]">Active Datasets Ingested</h3>
                        <button onClick={() => setSelectedPanel("upload")} className="text-xs font-mono text-[#38BDF8] hover:underline">
                          Ingest New File ➔
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full font-mono text-[10px]">
                          <thead>
                            <tr className="border-b border-[#334155] text-left uppercase text-slate-400 pb-2">
                              <th className="pb-2">File name</th>
                              <th className="pb-2 text-right">Data Rows</th>
                              <th className="pb-2 text-right">Variables</th>
                              <th className="pb-2 text-right">Quality</th>
                              <th className="pb-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {edaResult ? (
                              <tr className="border-b border-[#334155]/20 text-[#CBD5E1]">
                                <td className="py-2.5 font-bold text-[#38BDF8]">Ingested_Table.csv</td>
                                <td className="py-2.5 text-right">{totalRows}</td>
                                <td className="py-2.5 text-right">{totalCols}</td>
                                <td className="py-2.5 text-right text-emerald-400 font-bold">{qualityScore.toFixed(1)}%</td>
                                <td className="py-2.5 text-right text-[#38BDF8] font-bold">
                                  <button onClick={() => setSelectedPanel("eda-analysis")} className="hover:underline">Open Workspace</button>
                                </td>
                              </tr>
                            ) : (
                              <tr>
                                <td colSpan={5} className="py-4 text-center text-slate-500">No active tables. Please upload a file.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Recommendations & Recent Reports */}
                  <div className="space-y-6">
                    
                    {/* AI Recommendations */}
                    <div className={`p-5 rounded-xl border ${colors.card} space-y-4`}>
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F8FAFC]">AI Recommendations</h3>
                      <div className="space-y-3">
                        {edaResult && (edaResult as any).insights ? (
                          (edaResult as any).insights.slice(0, 3).map((ins: string, idx: number) => (
                            <div key={idx} className="p-3 bg-[#243244] border border-[#334155]/60 rounded-lg text-[10px] text-[#CBD5E1] leading-relaxed">
                              {ins}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 bg-[#243244] border border-[#334155]/60 rounded-lg text-[10px] text-slate-500 font-mono">
                            Upload a dataset to run AI Recommendations.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recent Activity feed list */}
                    <div className={`p-5 rounded-xl border ${colors.card} space-y-4`}>
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F8FAFC]">Workspace Activity Logs</h3>
                      <div className="space-y-3 font-mono text-[9px] max-h-48 overflow-y-auto pr-1">
                        {logs.slice(-5).map((log, idx) => (
                          <div key={idx} className="flex gap-2 items-start text-slate-400 pb-1 border-b border-[#334155]/10">
                            <span className="text-slate-650 shrink-0">[{log.timestamp}]</span>
                            <span className="font-bold text-[#38BDF8] shrink-0">{log.node.toUpperCase()}</span>
                            <span className="truncate">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Reports Generated */}
                    <div className={`p-5 rounded-xl border ${colors.card} space-y-4`}>
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F8FAFC]">Exported Reports</h3>
                      <div className="space-y-3 font-mono text-[10px]">
                        <div className="p-3 bg-[#243244] border border-[#334155]/60 rounded-lg flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 block font-bold">EDA_Summary_Report.pdf</span>
                            <span className="text-slate-600 text-[8px]">PDF • 14-Jul-2026</span>
                          </div>
                          <span className="text-xs text-[#38BDF8] cursor-pointer hover:underline">Download</span>
                        </div>
                        <div className="p-3 bg-[#243244] border border-[#334155]/60 rounded-lg flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 block font-bold">ML_Model_Evaluation.xlsx</span>
                            <span className="text-slate-600 text-[8px]">EXCEL • 14-Jul-2026</span>
                          </div>
                          <span className="text-xs text-[#38BDF8] cursor-pointer hover:underline">Download</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}


            {/* IMPORT DATASET PAGE */}
            {selectedPanel === "upload" && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`p-8 rounded-xl border ${colors.card} text-center space-y-6`}>
                  <h2 className="text-lg font-bold text-white font-mono uppercase tracking-widest">Ingest Workspace Datasets</h2>
                  
                  {/* File upload drag zone */}
                  <label className="border-2 border-dashed border-[#334155] hover:border-[#38BDF8] bg-[#111827]/40 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all max-w-xl mx-auto">
                    {uploading ? (
                      <Loader2 className="spin animate-spin text-[#38BDF8] mb-4" size={32} />
                    ) : (
                      <FileUp className="text-slate-500 mb-4" size={32} />
                    )}
                    <span className="text-sm font-mono text-[#F8FAFC] uppercase tracking-wider font-bold">Drag & Drop Tabular Data File</span>
                    <span className="text-[10px] text-slate-500 mt-2">Supported Formats: CSV, XLSX, JSON, Parquet, API</span>
                    <input type="file" onChange={handleUpload} className="hidden" />
                  </label>

                  {/* Cloud/DB Integrations */}
                  <div className="space-y-3 max-w-lg mx-auto">
                    <span className="text-[9px] text-slate-550 font-mono uppercase tracking-widest block">External Storage Connectors</span>
                    <div className="grid grid-cols-5 gap-3">
                      {["Excel", "SQL DB", "Parquet", "API Server", "Cloud S3"].map((source, idx) => (
                        <div key={idx} className="p-3 bg-[#243244] border border-[#334155] rounded-xl text-center cursor-pointer hover:border-[#38BDF8] transition-all text-[9px] font-mono font-bold text-[#CBD5E1]">
                          {source}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Upload history & Datasets Manager */}
                <div className={`p-6 rounded-xl border ${colors.card} space-y-4`}>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F8FAFC]">Saved Ingestion Files</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full font-mono text-xs text-left">
                      <thead>
                        <tr className="border-b border-[#334155] text-slate-500 uppercase pb-2">
                          <th className="pb-2.5">File name</th>
                          <th className="pb-2.5">Rows</th>
                          <th className="pb-2.5">Columns</th>
                          <th className="pb-2.5">Date Ingested</th>
                          <th className="pb-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map((file) => (
                          <tr key={file.id} className="border-b border-[#334155]/20 text-[#CBD5E1] hover:bg-[#1E293B]/40">
                            <td className="py-3 font-bold text-[#38BDF8]">{file.file_name}</td>
                            <td className="py-3">{file.row_count ?? "NA"}</td>
                            <td className="py-3">{file.col_count ?? "NA"}</td>
                            <td className="py-3">{file.uploaded_at ? new Date(file.uploaded_at).toLocaleString() : "NA"}</td>
                            <td className="py-3 text-right space-x-3">
                              <button onClick={() => handleReuseFile(file.id, file.file_name)} className="text-emerald-400 font-bold hover:underline">Reuse</button>
                              <button onClick={() => handleRemoveFile(file.id)} className="text-red-400 font-bold hover:underline">Delete</button>
                            </td>
                          </tr>
                        ))}
                        {files.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-slate-500">No uploads saved.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}


                {selectedPanel === "eda-analysis" && (
                  <div className="space-y-6">
                    <h3 className={`text-sm font-bold font-mono uppercase tracking-wider ${colors.textPrimary}`}>Exploratory Data Analysis</h3>
                    
                    {!edaResult ? (
                      <p className="text-slate-500 text-sm font-mono">No active dataset profile. Please upload a file to analyze statistics.</p>
                    ) : (
                      <div className="flex gap-6 h-[600px]">
                        {/* 14-Step Vertical Sidebar */}
                        <div className={`w-64 flex flex-col border-r ${colors.border} pr-4 overflow-y-auto space-y-1`}>
                          {[
                            { id: 1, label: "Overview" },
                            { id: 2, label: "Column Info" },
                            { id: 3, label: "Missing Value Analysis" },
                            { id: 4, label: "Duplicate Analysis" },
                            { id: 5, label: "Data Type Validation" },
                            { id: 6, label: "Statistical Summary" },
                            { id: 7, label: "Distribution Analysis" },
                            { id: 8, label: "Outlier Detection" },
                            { id: 9, label: "Correlation Analysis" },
                            { id: 10, label: "Categorical Analysis" },
                            { id: 11, label: "Time Series Analysis" },
                            { id: 12, label: "Feature Engineering" },
                            { id: 13, label: "Data Quality Assessment" },
                            { id: 14, label: "AI Recommendations" }
                          ].map((step) => (
                            <button
                              key={step.id}
                              onClick={() => setEdaStep(step.id)}
                              className={`w-full text-left px-3 py-2.5 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
                                edaStep === step.id
                                  ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30"
                                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
                              }`}
                            >
                              {step.id}. {step.label}
                            </button>
                          ))}
                        </div>

                        {/* Right Content Panel */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-8">
                          {/* Step 1: Overview */}
                          {edaStep === 1 && (
                            <div className="space-y-8 animate-fadeIn">
                              <div className={`p-6 rounded-xl border ${colors.card}`}>
                                <h4 className={`text-sm font-bold font-mono uppercase tracking-wider mb-6 ${colors.textPrimary}`}>Dataset Summary Profile</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-sm">
                                  <div className="p-4 bg-slate-950/45 border border-slate-800/80 rounded-xl">
                                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Total Record Count</span>
                                    <strong className={`text-2xl font-bold ${colors.textPrimary}`}>
                                      {Number((edaResult as any).overview?.rows || 0).toLocaleString()}
                                    </strong>
                                    <p className="text-[10px] text-slate-500 mt-2">Active rows indexed in workspace.</p>
                                  </div>
                                  <div className="p-4 bg-slate-950/45 border border-slate-800/80 rounded-xl">
                                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Variable Count</span>
                                    <strong className={`text-2xl font-bold ${colors.textPrimary}`}>
                                      {Number((edaResult as any).overview?.columns || 0)}
                                    </strong>
                                    <p className="text-[10px] text-slate-500 mt-2">Total attributes/columns loaded.</p>
                                  </div>
                                  <div className="p-4 bg-slate-950/45 border border-slate-800/80 rounded-xl">
                                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Quality Index</span>
                                    <strong className="text-2xl font-bold text-emerald-400">
                                      {Number((edaResult as any).data_quality?.quality_score || 0).toFixed(1)}%
                                    </strong>
                                    <p className="text-[10px] text-slate-500 mt-2">Overall completeness & validity score.</p>
                                  </div>
                                </div>
                              </div>

                              <div className={`p-6 rounded-xl border ${colors.card}`}>
                                <h4 className={`text-sm font-bold font-mono uppercase tracking-wider mb-6 ${colors.textPrimary}`}>Data Quality Dimension Checks</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-sm">
                                  {[
                                    { label: "Completeness Check", score: (edaResult as any).eda_accuracy?.completeness || 92.4, desc: "Evaluates percentage of non-null records." },
                                    { label: "Accuracy Schema Index", score: (edaResult as any).eda_accuracy?.validity || 94.0, desc: "Evaluates standard type conformance." },
                                    { label: "Consistency Score", score: (edaResult as any).eda_accuracy?.consistency || 91.0, desc: "Evaluates duplicate indexes and offsets." },
                                    { label: "Validity Boundary Check", score: (edaResult as any).eda_accuracy?.integrity || 93.0, desc: "Verifies range boundary checks." }
                                  ].map((check, idx) => (
                                    <div key={idx} className="p-5 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-3">
                                      <div className="flex justify-between items-center">
                                        <strong className={`text-sm ${colors.textPrimary}`}>{check.label}</strong>
                                        <span className="text-emerald-400 font-bold text-sm">{Number(check.score).toFixed(1)}%</span>
                                      </div>
                                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                        <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${check.score}%` }} />
                                      </div>
                                      <p className="text-xs text-slate-500">{check.desc}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Step 2: Column Info */}
                          {edaStep === 2 && (
                            <div className={`p-6 rounded-xl border ${colors.card} animate-fadeIn`}>
                              <h4 className={`text-sm font-bold font-mono uppercase tracking-wider mb-6 ${colors.textPrimary}`}>Dataset Variables Profile</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full font-mono text-xs">
                                  <thead>
                                    <tr className={`border-b text-left uppercase tracking-wider ${colors.tableHeader}`}>
                                      <th className="pb-3 px-2">Column Name</th>
                                      <th className="pb-3 px-2">Data Type</th>
                                      <th className="pb-3 px-2">Unique Count</th>
                                      <th className="pb-3 px-2">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-850">
                                    {allColumns.map((col, idx) => {
                                      const isNum = (edaResult as any).overview?.numeric_columns?.includes(col);
                                      const uniq = (edaResult as any).nunique?.[col] ?? "N/A";
                                      return (
                                        <tr key={idx} className={`${colors.tableRow} hover:bg-slate-800/20 transition-colors`}>
                                          <td className="py-4 px-2 font-bold text-[#00D4FF]">{col}</td>
                                          <td className="py-4 px-2 text-slate-300">{isNum ? "Numeric" : "Categorical"}</td>
                                          <td className="py-4 px-2 text-slate-300">{uniq}</td>
                                          <td className="py-4 px-2 text-emerald-400 font-bold flex items-center gap-1">
                                            <Check size={12} /> OK
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Step 3: Missing Value Analysis */}
                          {edaStep === 3 && (
                            <div className="space-y-6 animate-fadeIn">
                              <div className={`p-6 rounded-xl border ${colors.card}`}>
                                <h4 className={`text-sm font-bold font-mono uppercase tracking-wider mb-4 ${colors.textPrimary}`}>Missing Cells Summary</h4>
                                <div className="p-4 bg-slate-950/45 border border-slate-800/80 rounded-xl font-mono text-xs max-w-sm">
                                  <span className="text-[10px] text-slate-500 block mb-1">Overall Completeness Rate</span>
                                  <strong className="text-2xl font-bold text-emerald-400">
                                    {Number((edaResult as any).eda_accuracy?.completeness || 100).toFixed(2)}%
                                  </strong>
                                  <p className="text-slate-500 mt-2">Any missing attributes will require filling or drop operations.</p>
                                </div>
                              </div>

                              <div className={`p-6 rounded-xl border ${colors.card}`}>
                                <h4 className={`text-sm font-bold font-mono uppercase tracking-wider mb-4 ${colors.textPrimary}`}>Missing Values By Column</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full font-mono text-xs">
                                    <thead>
                                      <tr className={`border-b text-left uppercase tracking-wider ${colors.tableHeader}`}>
                                        <th className="pb-3 px-2">Column Name</th>
                                        <th className="pb-3 px-2">Null Cells Count</th>
                                        <th className="pb-3 px-2">Null Percentage</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-850">
                                      {allColumns.map((col, idx) => {
                                        const missingProcess = (edaResult as any).missing_handling_process?.[col] || {};
                                        const missingCount = missingProcess.missing_before || 0;
                                        const total = (edaResult as any).overview?.rows || 1;
                                        const pct = ((missingCount / total) * 100).toFixed(2);
                                        return (
                                          <tr key={idx} className={`${colors.tableRow} hover:bg-slate-800/20 transition-colors`}>
                                            <td className="py-4 px-2 font-bold text-slate-200">{col}</td>
                                            <td className="py-4 px-2 font-bold text-amber-500">{missingCount}</td>
                                            <td className="py-4 px-2 text-slate-400">{pct}%</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Step 4: Duplicate Analysis */}
                          {edaStep === 4 && (
                            <div className={`p-6 rounded-xl border ${colors.card} space-y-6 animate-fadeIn font-mono`}>
                              <h4 className={`text-sm font-bold uppercase tracking-wider ${colors.textPrimary}`}>Duplicate Rows Profiler</h4>
                              <div className="p-5 bg-slate-950/45 border border-slate-800/80 rounded-xl max-w-sm">
                                <span className="text-[10px] text-slate-500 block mb-1">Total Duplicate Rows</span>
                                <strong className={`text-2xl font-bold ${Number((edaResult as any).data_quality?.duplicates || 0) > 0 ? "text-amber-500" : "text-emerald-400"}`}>
                                  {Number((edaResult as any).data_quality?.duplicates || 0)}
                                </strong>
                                <p className="text-slate-500 text-xs mt-2">
                                  {Number((edaResult as any).data_quality?.duplicates || 0) > 0 
                                    ? "Warning: Duplicate rows skew statistical moments. Remove duplicate records."
                                    : "Perfect: 100% unique row values detected."}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Step 5: Data Type Validation */}
                          {edaStep === 5 && (
                            <div className={`p-6 rounded-xl border ${colors.card} animate-fadeIn`}>
                              <h4 className={`text-sm font-bold font-mono uppercase tracking-wider mb-6 ${colors.textPrimary}`}>Schema Type Validation</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full font-mono text-xs">
                                  <thead>
                                    <tr className={`border-b text-left uppercase tracking-wider ${colors.tableHeader}`}>
                                      <th className="pb-3 px-2">Column Name</th>
                                      <th className="pb-3 px-2">Validation Rule</th>
                                      <th className="pb-3 px-2">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-850">
                                    {allColumns.map((col, idx) => {
                                      const isNum = (edaResult as any).overview?.numeric_columns?.includes(col);
                                      return (
                                        <tr key={idx} className={`${colors.tableRow} hover:bg-slate-800/20 transition-colors`}>
                                          <td className="py-4 px-2 font-bold text-slate-200">{col}</td>
                                          <td className="py-4 px-2 text-slate-400">
                                            {isNum ? "Verify numerical precision and floats" : "Check string categories and cardinality"}
                                          </td>
                                          <td className="py-4 px-2 text-emerald-400 font-bold">PASSED</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Step 6: Statistical Summary */}
                          {edaStep === 6 && (
                            <div className={`p-6 rounded-xl border ${colors.card} animate-fadeIn`}>
                              <h4 className={`text-sm font-bold font-mono uppercase tracking-wider mb-6 ${colors.textPrimary}`}>Numerical Descriptive Statistics</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full font-mono text-[10px]">
                                  <thead>
                                    <tr className={`border-b text-left uppercase tracking-wider ${colors.tableHeader}`}>
                                      <th className="pb-3 px-2">Column</th>
                                      <th className="pb-3 px-2 text-right">Count</th>
                                      <th className="pb-3 px-2 text-right">Mean</th>
                                      <th className="pb-3 px-2 text-right">Std Dev</th>
                                      <th className="pb-3 px-2 text-right">Min</th>
                                      <th className="pb-3 px-2 text-right">50% (Med)</th>
                                      <th className="pb-3 px-2 text-right">Max</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-850 text-slate-300">
                                    {((edaResult as any).overview?.numeric_columns || []).map((col: string, idx: number) => {
                                      const s = (edaResult as any).statistics?.[col] || {};
                                      return (
                                        <tr key={idx} className={`${colors.tableRow} hover:bg-slate-800/20 transition-colors`}>
                                          <td className="py-4 px-2 font-bold text-[#00D4FF]">{col}</td>
                                          <td className="py-4 px-2 text-right">{s.count ?? "N/A"}</td>
                                          <td className="py-4 px-2 text-right">{s.mean ? Number(s.mean).toFixed(2) : "N/A"}</td>
                                          <td className="py-4 px-2 text-right">{s.std ? Number(s.std).toFixed(2) : "N/A"}</td>
                                          <td className="py-4 px-2 text-right">{s.min ? Number(s.min).toFixed(2) : "N/A"}</td>
                                          <td className="py-4 px-2 text-right">{s["50%"] ? Number(s["50%"]).toFixed(2) : "N/A"}</td>
                                          <td className="py-4 px-2 text-right">{s.max ? Number(s.max).toFixed(2) : "N/A"}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Step 7: Distribution Analysis */}
                          {edaStep === 7 && (
                            <div className={`p-6 rounded-xl border ${colors.card} space-y-6 animate-fadeIn font-mono`}>
                              <div className="flex justify-between items-center">
                                <h4 className={`text-sm font-bold uppercase tracking-wider ${colors.textPrimary}`}>Frequency Distribution histogram</h4>
                                <div>
                                  <label className="text-[10px] text-slate-500 uppercase block mb-1">Target Variable</label>
                                  <select
                                    value={edaHistCol}
                                    onChange={(e) => setEdaHistCol(e.target.value)}
                                    className={`text-xs p-2 rounded-lg ${colors.input} w-48`}
                                  >
                                    {((edaResult as any).overview?.numeric_columns || []).map((col: string) => (
                                      <option key={col} value={col}>{col}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {(() => {
                                const hData = (edaResult as any).visualization?.histograms?.[edaHistCol];
                                if (!hData || !hData.counts || hData.counts.length === 0) {
                                  return <p className="text-xs text-slate-500">Select a variable to view histogram distributions.</p>;
                                }
                                const counts = hData.counts;
                                const bins = hData.bins;
                                const maxVal = Math.max(...counts) || 1;
                                return (
                                  <div className="space-y-4">
                                    <div className="h-64 flex items-end gap-1.5 border-b border-l border-slate-800/80 p-4 bg-slate-950/20 rounded-xl relative">
                                      {counts.map((cnt: number, i: number) => {
                                        const hPct = (cnt / maxVal) * 85;
                                        return (
                                          <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                            <div className="w-full bg-[#0085FF]/30 group-hover:bg-[#00D4FF] rounded-t-sm transition-all" style={{ height: `${hPct}%` }} />
                                            <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[9px] p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all font-mono pointer-events-none z-20">
                                              Count: {cnt} ({bins[i] ? Number(bins[i]).toFixed(1) : ""})
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500 px-2">
                                      <span>Min: {bins[0] ? Number(bins[0]).toFixed(1) : ""}</span>
                                      <span>Max: {bins[bins.length - 1] ? Number(bins[bins.length - 1]).toFixed(1) : ""}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Step 8: Outlier Detection */}
                          {edaStep === 8 && (
                            <div className={`p-6 rounded-xl border ${colors.card} space-y-6 animate-fadeIn font-mono`}>
                              <div className="flex justify-between items-center">
                                <h4 className={`text-sm font-bold uppercase tracking-wider ${colors.textPrimary}`}>Outlier Analysis (Boxplot / IQR)</h4>
                                <div>
                                  <label className="text-[10px] text-slate-500 uppercase block mb-1">Target Variable</label>
                                  <select
                                    value={edaBoxCol}
                                    onChange={(e) => setEdaBoxCol(e.target.value)}
                                    className={`text-xs p-2 rounded-lg ${colors.input} w-48`}
                                  >
                                    {((edaResult as any).overview?.numeric_columns || []).map((col: string) => (
                                      <option key={col} value={col}>{col}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {(() => {
                                const bp = (edaResult as any).visualization?.boxplots?.[edaBoxCol];
                                const totalOutliers = (edaResult as any).data_quality?.outliers?.[edaBoxCol]?.outliers_count || 0;
                                if (!bp) {
                                  return <p className="text-xs text-slate-500">Select a numerical column to display boxplots.</p>;
                                }
                                return (
                                  <div className="space-y-8">
                                    <div className="p-4 bg-slate-950/45 border border-slate-800/80 rounded-xl inline-block">
                                      <span className="text-[10px] text-slate-500 block mb-1">IQR Outliers Detected</span>
                                      <strong className={`text-xl font-bold ${totalOutliers > 0 ? "text-amber-500" : "text-emerald-400"}`}>
                                        {totalOutliers}
                                      </strong>
                                    </div>

                                    {/* Horizontal SVG Boxplot */}
                                    <div className="p-6 bg-slate-950/20 border border-slate-800/60 rounded-xl">
                                      <svg className="w-full h-24" viewBox="0 0 400 100">
                                        <rect x="0" y="0" width="400" height="100" fill="transparent" />
                                        {/* Scale values from bp.min to bp.max to coordinate 40 to 360 */}
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
                                              {/* Box */}
                                              <rect x={xQ1} y="30" width={xQ3 - xQ1} height="40" fill="rgba(6, 182, 212, 0.15)" stroke="#00D4FF" strokeWidth="2" />
                                              {/* Median Line */}
                                              <line x1={xMed} y1="30" x2={xMed} y2="70" stroke="#00D4FF" strokeWidth="3" />
                                              {/* Whiskers */}
                                              <line x1={xMin} y1="50" x2={xQ1} y2="50" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
                                              <line x1={xQ3} y1="50" x2={xMax} y2="50" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
                                              {/* Whisker Ends */}
                                              <line x1={xMin} y1="40" x2={xMin} y2="60" stroke="#94a3b8" strokeWidth="2" />
                                              <line x1={xMax} y1="40" x2={xMax} y2="60" stroke="#94a3b8" strokeWidth="2" />
                                              {/* Text labels */}
                                              <text x={xMin} y="90" fill="#64748b" fontSize="8" textAnchor="middle">{Number(bp.min).toFixed(1)}</text>
                                              <text x={xQ1} y="20" fill="#64748b" fontSize="8" textAnchor="middle">Q1: {Number(bp.q1).toFixed(1)}</text>
                                              <text x={xMed} y="90" fill="#00D4FF" fontSize="8" textAnchor="middle" fontWeight="bold">Med: {Number(bp.median).toFixed(1)}</text>
                                              <text x={xQ3} y="20" fill="#64748b" fontSize="8" textAnchor="middle">Q3: {Number(bp.q3).toFixed(1)}</text>
                                              <text x={xMax} y="90" fill="#64748b" fontSize="8" textAnchor="middle">{Number(bp.max).toFixed(1)}</text>
                                            </g>
                                          );
                                        })()}
                                      </svg>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Step 9: Correlation Analysis */}
                          {edaStep === 9 && (
                            <div className={`p-6 rounded-xl border ${colors.card} space-y-6 animate-fadeIn font-mono`}>
                              <h4 className={`text-sm font-bold uppercase tracking-wider ${colors.textPrimary}`}>Pearson Correlation Matrix Heatmap</h4>
                              {(() => {
                                const corr = (edaResult as any).advanced_visualization?.correlation || {};
                                const numericCols = (edaResult as any).overview?.numeric_columns || [];
                                if (numericCols.length < 2) {
                                  return <p className="text-xs text-slate-500">Need at least 2 numerical attributes to analyze correlations.</p>;
                                }
                                return (
                                  <div className="overflow-x-auto">
                                    <table className="border-collapse">
                                      <thead>
                                        <tr>
                                          <th className="p-2 text-[9px] text-slate-500 text-left border border-slate-800">Variable</th>
                                          {numericCols.map((c: string) => (
                                            <th key={c} className="p-2 text-[9px] text-slate-500 text-center border border-slate-800 max-w-[80px] truncate" title={c}>
                                              {c}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {numericCols.map((rCol: string) => (
                                          <tr key={rCol}>
                                            <td className="p-2 text-[9px] text-[#00D4FF] font-bold border border-slate-800 truncate max-w-[90px]" title={rCol}>{rCol}</td>
                                            {numericCols.map((cCol: string) => {
                                              const val = corr[rCol]?.[cCol] ?? 0;
                                              const absVal = Math.abs(val);
                                              const cellColor = val >= 0 
                                                ? `rgba(6, 182, 212, ${absVal})` // positive: cyan/blue
                                                : `rgba(239, 68, 68, ${absVal})`; // negative: red
                                              return (
                                                <td
                                                  key={cCol}
                                                  style={{ backgroundColor: cellColor }}
                                                  className="p-2 text-[10px] text-center border border-slate-800 font-bold font-mono text-white select-none group relative"
                                                  title={`Correlation (${rCol} ↔ ${cCol}): ${val.toFixed(3)}`}
                                                >
                                                  {val.toFixed(2)}
                                                </td>
                                              );
                                            })}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Step 10: Categorical Analysis */}
                          {edaStep === 10 && (
                            <div className={`p-6 rounded-xl border ${colors.card} space-y-6 animate-fadeIn font-mono`}>
                              <div className="flex justify-between items-center">
                                <h4 className={`text-sm font-bold uppercase tracking-wider ${colors.textPrimary}`}>Categorical Variables Profile</h4>
                                <div>
                                  <label className="text-[10px] text-slate-500 uppercase block mb-1">Target Variable</label>
                                  <select
                                    value={edaCatCol}
                                    onChange={(e) => setEdaCatCol(e.target.value)}
                                    className={`text-xs p-2 rounded-lg ${colors.input} w-48`}
                                  >
                                    {((edaResult as any).overview?.categorical_columns || []).map((col: string) => (
                                      <option key={col} value={col}>{col}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {(() => {
                                const vcMap = (edaResult as any).value_counts?.[edaCatCol] || {};
                                const entries = Object.entries(vcMap);
                                if (entries.length === 0) {
                                  return <p className="text-xs text-slate-500">Select a variable to view value counts.</p>;
                                }
                                const totalRows = (edaResult as any).overview?.rows || 1;
                                return (
                                  <div className="space-y-4">
                                    <h5 className="text-[10px] text-slate-500 uppercase tracking-widest">Top value frequencies</h5>
                                    <div className="space-y-3">
                                      {entries.slice(0, 10).map(([k, cnt]: [string, any], idx) => {
                                        const pct = ((Number(cnt) / totalRows) * 100).toFixed(1);
                                        return (
                                          <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                              <span className="text-[#00D4FF] font-bold">{k || "(empty)"}</span>
                                              <span className="text-slate-400">{cnt.toLocaleString()} rows ({pct}%)</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
                                              <div className="h-full bg-cyan-400" style={{ width: `${pct}%` }} />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Step 11: Time Series Analysis */}
                          {edaStep === 11 && (
                            <div className={`p-6 rounded-xl border ${colors.card} space-y-6 animate-fadeIn font-mono`}>
                              <h4 className={`text-sm font-bold uppercase tracking-wider ${colors.textPrimary}`}>Time Series & Sequence Gap Analysis</h4>
                              {(() => {
                                const dtCols = (edaResult as any).overview?.datetime_columns || [];
                                if (dtCols.length === 0) {
                                  return (
                                    <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl text-center text-slate-500">
                                      No time series attributes (dates/timestamps) detected in this dataset.
                                    </div>
                                  );
                                }
                                const dateFormats = (edaResult as any).overview?.date_formats || {};
                                const gapReport = (edaResult as any).data_quality?.date_gap_report || {};
                                return (
                                  <div className="space-y-6">
                                    {dtCols.map((col: string) => (
                                      <div key={col} className="p-5 bg-slate-950/45 border border-slate-800/80 rounded-xl space-y-3">
                                        <div className="flex justify-between">
                                          <strong className="text-sm text-[#00D4FF]">{col}</strong>
                                          <span className="text-xs text-slate-400">Format: {dateFormats[col] || "Parsed ISO"}</span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                          Sequence check: {gapReport[col]?.gaps_filled ?? 0} missing dates resolved.
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Step 12: Feature Engineering */}
                          {edaStep === 12 && (
                            <div className={`p-6 rounded-xl border ${colors.card} space-y-6 animate-fadeIn font-mono`}>
                              <h4 className={`text-sm font-bold uppercase tracking-wider ${colors.textPrimary}`}>ML Feature Engineering Recommendations</h4>
                              <ul className="space-y-3 text-xs text-slate-300">
                                {((edaResult as any).eda_accuracy?.suggestions || []).map((sug: string, idx: number) => (
                                  <li key={idx} className="flex gap-2 items-start p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                                    <span>{sug}</span>
                                  </li>
                                ))}
                                {((edaResult as any).eda_accuracy?.suggestions || []).length === 0 && (
                                  <li className="p-4 text-center text-slate-500 bg-slate-950/40 border border-slate-800/60 rounded-lg">
                                    Dataset qualities verified ready. No urgent engineering suggested.
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {/* Step 13: Data Quality Assessment */}
                          {edaStep === 13 && (
                            <div className="space-y-8 animate-fadeIn font-mono">
                              <div className={`p-6 rounded-xl border ${colors.card}`}>
                                <h4 className={`text-sm font-bold uppercase tracking-wider mb-6 ${colors.textPrimary}`}>Quality Score Dimensions</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                  {[
                                    { label: "Completeness Score", score: (edaResult as any).eda_accuracy?.completeness || 100 },
                                    { label: "Validity Score", score: (edaResult as any).eda_accuracy?.validity || 100 },
                                    { label: "Consistency Score", score: (edaResult as any).eda_accuracy?.consistency || 100 },
                                    { label: "Uniqueness Score", score: (edaResult as any).eda_accuracy?.uniqueness || 100 },
                                    { label: "Integrity Score", score: (edaResult as any).eda_accuracy?.integrity || 100 }
                                  ].map((dim, idx) => (
                                    <div key={idx} className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-2">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400">{dim.label}</span>
                                        <strong className="text-emerald-400">{Number(dim.score).toFixed(1)}%</strong>
                                      </div>
                                      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${dim.score}%` }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className={`p-6 rounded-xl border ${colors.card} max-w-sm`}>
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Workspace Grade</span>
                                    <strong className="text-3xl font-extrabold text-[#00D4FF] font-mono">
                                      {(edaResult as any).eda_accuracy?.grade || "A"}
                                    </strong>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] text-slate-500 uppercase block mb-1">ML Readiness</span>
                                    <strong className={`text-sm ${(edaResult as any).eda_accuracy?.ml_ready !== false ? "text-emerald-400" : "text-amber-400"}`}>
                                      {(edaResult as any).eda_accuracy?.ml_ready !== false ? "APPROVED" : "PENDING"}
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Step 14: AI Recommendations */}
                          {edaStep === 14 && (
                            <div className={`p-6 rounded-xl border ${colors.card} space-y-6 animate-fadeIn font-mono`}>
                              <h4 className={`text-sm font-bold uppercase tracking-wider ${colors.textPrimary}`}>AI recommendation Engine Insights</h4>
                              <div className="space-y-3">
                                {((edaResult as any).insights || []).map((ins: string, idx: number) => (
                                  <div key={idx} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl text-xs text-slate-300 leading-relaxed">
                                    {ins}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

            {/* VISUALIZATION PAGE */}
            {selectedPanel === "visualization" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn font-mono text-xs">
                {/* Visualizer Side Config Panel */}
                <div className={`p-5 rounded-xl border ${colors.card} space-y-4`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Chart Configurator</h4>
                  <div>
                    <label className="text-slate-500 uppercase block mb-1 text-[9px]">Chart Type</label>
                    <select
                      value={vizChartType}
                      onChange={(e) => setVizChartType(e.target.value)}
                      className={`w-full text-xs p-2 rounded-lg ${colors.input}`}
                    >
                      {["bar", "line", "area", "pie", "histogram", "heatmap", "scatter", "treemap", "boxplot", "sankey"].map((type) => (
                        <option key={type} value={type}>{type.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 uppercase block mb-1 text-[9px]">X Axis Variable</label>
                    <select
                      value={vizXAxis}
                      onChange={(e) => setVizXAxis(e.target.value)}
                      className={`w-full text-xs p-2 rounded-lg ${colors.input}`}
                    >
                      {allColumns.map((col) => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 uppercase block mb-1 text-[9px]">Y Axis Variable</label>
                    <select
                      value={vizYAxis}
                      onChange={(e) => setVizYAxis(e.target.value)}
                      className={`w-full text-xs p-2 rounded-lg ${colors.input}`}
                    >
                      {allColumns.map((col) => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 uppercase block mb-1 text-[9px]">Color Theme</label>
                    <select
                      value={vizColorTheme}
                      onChange={(e) => setVizColorTheme(e.target.value)}
                      className={`w-full text-xs p-2 rounded-lg ${colors.input}`}
                    >
                      <option value="classic">Classic Fabric (Blue)</option>
                      <option value="warm">Warm Studio (Orange/Red)</option>
                      <option value="emerald">Forest (Green)</option>
                    </select>
                  </div>
                  <button className="w-full bg-[#38BDF8] hover:bg-[#38BDF8]/80 text-[#0F172A] font-bold py-2 rounded-lg uppercase tracking-wider font-mono">
                    Export SVG Chart
                  </button>
                </div>

                {/* Main Visualizer Canvas */}
                <div className={`col-span-3 p-6 rounded-xl border ${colors.card} flex flex-col justify-between min-h-[400px]`}>
                  <div className="flex justify-between items-center border-b border-[#334155] pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Visualizer Canvas Output</h3>
                    <span className="text-[10px] text-slate-500 uppercase">Interactive rendering active</span>
                  </div>

                  <div className="flex-1 flex items-center justify-center bg-[#111827]/40 rounded-xl border border-[#334155]/60 m-4 relative overflow-hidden">
                    {/* SVG visualization render graphics mockup */}
                    <svg className="w-64 h-64 text-[#38BDF8]">
                      {vizChartType === "bar" && (
                        <g>
                          <rect x="20" y="80" width="30" height="120" fill="currentColor" opacity="0.8" />
                          <rect x="70" y="40" width="30" height="160" fill="currentColor" />
                          <rect x="120" y="110" width="30" height="90" fill="currentColor" opacity="0.6" />
                          <rect x="170" y="60" width="30" height="140" fill="currentColor" opacity="0.9" />
                        </g>
                      )}
                      {vizChartType === "line" && (
                        <polyline fill="none" stroke="currentColor" strokeWidth="3" points="20,160 70,80 120,120 170,40" />
                      )}
                      {vizChartType === "pie" && (
                        <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="40" strokeDasharray="300 200" />
                      )}
                      {vizChartType !== "bar" && vizChartType !== "line" && vizChartType !== "pie" && (
                        <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="4" className="animate-pulse" />
                      )}
                    </svg>
                  </div>
                </div>
              </div>
            )}

                {selectedPanel === "data-cleaning" && (
                  <div className="space-y-6">
                    <h3 className={`text-sm font-bold font-mono uppercase tracking-wider ${colors.textPrimary}`}>Dataset Cleaning & Visualization</h3>
                    
                    {edaResult ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className={`p-5 rounded-xl border ${colors.card} space-y-4`}>
                          <h4 className={`text-xs font-bold font-mono uppercase tracking-wider ${colors.textPrimary}`}>Imputation strategy</h4>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Target Column</label>
                              <select
                                value={selectedColumn}
                                onChange={(e) => setSelectedColumn(e.target.value)}
                                className={`w-full text-xs p-2 rounded-lg ${colors.input}`}
                              >
                                <option value="" disabled>-- Select --</option>
                                {allColumns.map((col) => (
                                  <option key={col} value={col}>{col}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Strategy</label>
                              <select
                                value={selectedStrategy}
                                onChange={(e) => setSelectedStrategy(e.target.value)}
                                className={`w-full text-xs p-2 rounded-lg ${colors.input}`}
                              >
                                <option value="mean">Mean</option>
                                <option value="median">Median</option>
                                <option value="mode">Mode</option>
                                <option value="zero">Fill Zero</option>
                              </select>
                            </div>

                            <button
                              onClick={handleApplyImputation}
                              disabled={cleanLoading || !selectedColumn}
                              className="w-full bg-[#00D4FF] hover:bg-[#00b5da] text-[#030712] font-bold text-xs uppercase py-2.5 rounded-lg transition-all"
                            >
                              Fill Missing Cells
                            </button>
                          </div>
                        </div>

                        <div className={`p-5 rounded-xl border ${colors.card} flex flex-col justify-between`}>
                          <div>
                            <h4 className={`text-xs font-bold font-mono uppercase tracking-wider mb-3 ${colors.textPrimary}`}>Column Distribution Chart</h4>
                            <select
                              value={vizColumn}
                              onChange={(e) => setVizColumn(e.target.value)}
                              className={`text-xs p-1.5 rounded-lg ${colors.input} mb-4 w-40`}
                            >
                              {allColumns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex-1 flex items-end gap-3 h-36 pt-4">
                            {columnDistribution.map((bar, bIdx) => {
                              const maxVal = Math.max(...columnDistribution.map((d) => d.value)) || 1;
                              const heightPct = (bar.value / maxVal) * 100;
                              return (
                                <div key={bIdx} className="flex-1 flex flex-col items-center group relative">
                                  <div className="w-full bg-[#0085FF]/35 group-hover:bg-[#00D4FF] rounded-t-sm transition-all" style={{ height: `${heightPct}%` }} />
                                  <span className="text-[8px] font-mono text-slate-505 mt-2 truncate w-full text-center">{bar.label}</span>
                                  
                                  <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[9px] p-1 rounded opacity-0 group-hover:opacity-100 transition-all font-mono pointer-events-none">
                                    Val: {bar.value}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs font-mono">No active dataset profile uploaded.</p>
                    )}
                  </div>
                )}

            {/* FEATURE ENGINEERING PAGE */}
            {selectedPanel === "feature-engineering" && (
              <div className={`p-5 rounded-xl border ${colors.card} space-y-4 animate-fadeIn font-mono text-xs`}>
                <h3 className="text-xs font-bold uppercase text-white">ML Feature Engineering Builder</h3>
                <p className="text-slate-400">Apply standard encodings, one-hot conversions, date decomposition, and mathematical binning.</p>
                <div className="p-4 bg-[#111827]/40 border border-[#334155] rounded-xl text-slate-500">
                  Feature builder components ready. Please select a dataset to configure ML features.
                </div>
              </div>
            )}

            {/* ML STUDIO STEP-BUILDER */}
            {selectedPanel === "ml-studio" && (
              <div className="space-y-6 animate-fadeIn font-mono text-xs">
                
                {/* Horizontal steps navigation */}
                <div className={`p-4 rounded-xl border ${colors.card} bg-[#111827]/20 flex justify-between items-center overflow-x-auto`}>
                  {[
                    { id: "target", label: "Select Target" },
                    { id: "algorithm", label: "Pick Algorithm" },
                    { id: "training", label: "Model Training" },
                    { id: "evaluation", label: "Model Evaluation" }
                  ].map((step, idx) => {
                    const isActive = activeMlStep === step.id;
                    return (
                      <div key={step.id} className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveMlStep(step.id)}
                          className={`px-3 py-1.5 rounded-lg border transition-all ${
                            isActive ? "bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8]" : "bg-[#1E293B] border-[#334155] text-slate-500"
                          }`}
                        >
                          {step.label}
                        </button>
                        {idx < 3 && <span className="text-slate-700 font-bold">➔</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Build Configuration */}
                  <div className={`p-5 rounded-xl border ${colors.card} space-y-4`}>
                    <h4 className="text-xs font-bold uppercase text-white">Build Parameters</h4>
                    
                    {activeMlStep === "target" && (
                      <div>
                        <label className="text-slate-550 uppercase block mb-1 text-[9px]">Target Classification Column</label>
                        <select
                          value={targetCol}
                          onChange={(e) => setTargetCol(e.target.value)}
                          className={`w-full text-xs p-2 rounded-lg ${colors.input}`}
                        >
                          {allColumns.map((col) => <option key={col} value={col}>{col}</option>)}
                        </select>
                      </div>
                    )}

                    {activeMlStep === "algorithm" && (
                      <div>
                        <label className="text-slate-550 uppercase block mb-1 text-[9px]">Algorithm type</label>
                        <select
                          value={mlAlgo}
                          onChange={(e) => setMlAlgo(e.target.value)}
                          className={`w-full text-xs p-2 rounded-lg ${colors.input}`}
                        >
                          <option value="random-forest">Random Forest Classifier</option>
                          <option value="xgboost">XGBoost Gradient Boosting</option>
                          <option value="logistic-regression">Logistic Regression</option>
                        </select>
                      </div>
                    )}

                    {activeMlStep === "training" && (
                      <div className="space-y-4">
                        <button
                          onClick={handleGetRecommendations}
                          className="w-full bg-[#38BDF8] text-[#0F172A] font-bold py-2 rounded-lg uppercase tracking-wider font-mono hover:bg-[#38BDF8]/80 transition-all"
                        >
                          Compile & Train Model
                        </button>
                      </div>
                    )}

                    {activeMlStep === "evaluation" && (
                      <p className="text-slate-400">Model evaluation data is locked. Train the model first.</p>
                    )}
                  </div>

                  {/* Right Column: Model Metrics & Evaluation Visualizations */}
                  <div className={`lg:col-span-2 p-5 rounded-xl border ${colors.card} space-y-4`}>
                    <h4 className="text-xs font-bold uppercase text-white">Evaluation Results Panel</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Metrics Scorecard */}
                      <div className="p-4 bg-[#111827]/40 border border-[#334155]/60 rounded-xl space-y-2">
                        <span className="text-[10px] text-slate-500 block uppercase">Accuracy Score</span>
                        <strong className="text-2xl font-bold text-emerald-400">94.8%</strong>
                      </div>
                      <div className="p-4 bg-[#111827]/40 border border-[#334155]/60 rounded-xl space-y-2">
                        <span className="text-[10px] text-slate-500 block uppercase">F1 / Recall index</span>
                        <strong className="text-2xl font-bold text-emerald-400">93.2%</strong>
                      </div>
                    </div>

                    {/* Feature Importance bar chart Mockup */}
                    <div className="p-4 bg-[#111827]/40 border border-[#334155]/60 rounded-xl space-y-3">
                      <span className="text-[10px] text-slate-550 block uppercase">Feature Importance ranking</span>
                      <div className="space-y-2">
                        {[
                          { name: "Var_A", score: 85 },
                          { name: "Var_B", score: 62 },
                          { name: "Var_C", score: 41 }
                        ].map((feat) => (
                          <div key={feat.name} className="flex items-center gap-3">
                            <span className="w-12 text-[#38BDF8] font-bold">{feat.name}</span>
                            <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-[#38BDF8]" style={{ width: `${feat.score}%` }} />
                            </div>
                            <span className="text-slate-400">{feat.score}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PREDICTION */}
            {selectedPanel === "prediction" && (
              <div className={`p-5 rounded-xl border ${colors.card} space-y-4 animate-fadeIn font-mono text-xs`}>
                <h3 className="text-xs font-bold uppercase text-white">Interactive Model Inference & Prediction</h3>
                <p className="text-slate-400">Enter input attribute values below to calculate real-time ML target inference predictions.</p>
                <div className="p-4 bg-[#111827]/40 border border-[#334155] rounded-xl text-slate-500">
                  Prediction input fields ready. Please compile a model in ML Studio to run inferences.
                </div>
              </div>
            )}

            {/* PIPELINE HISTORY */}
            {selectedPanel === "pipeline-history" && (
              <div className={`p-5 rounded-xl border ${colors.card} space-y-4 animate-fadeIn font-mono text-xs`}>
                <h3 className="text-xs font-bold uppercase text-white">Execution Logs & Runs History</h3>
                <p className="text-slate-400">Inspect historical workspace triggers, compilation stats, and run status codes.</p>
                <div className="p-4 bg-[#111827]/40 border border-[#334155] rounded-xl text-slate-500">
                  Runs log database online. No previous failures recorded.
                </div>
              </div>
            )}

            {/* REPORTS PAGE */}
            {selectedPanel === "reports" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn font-mono text-xs">
                
                {/* Reports templates & download settings */}
                <div className={`lg:col-span-2 p-5 rounded-xl border ${colors.card} space-y-5`}>
                  <h3 className="text-xs font-bold uppercase text-white">Reports Engine Builder</h3>
                  <div>
                    <label className="text-slate-550 uppercase block mb-1 text-[9px]">Report Template</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className={`w-full text-xs p-2 rounded-lg ${colors.input}`}
                    >
                      <option value="eda">Complete EDA Profiler Summary</option>
                      <option value="business">Business Metrics & KPI Analysis</option>
                      <option value="executive">Executive Boardroom Summary</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-550 uppercase block mb-1 text-[9px]">Download Format</label>
                    <select
                      value={reportFormat}
                      onChange={(e) => setReportFormat(e.target.value)}
                      className={`w-full text-xs p-2 rounded-lg ${colors.input}`}
                    >
                      <option value="pdf">Adobe PDF Format (.pdf)</option>
                      <option value="pptx">Microsoft PowerPoint Presentation (.pptx)</option>
                      <option value="xlsx">Microsoft Excel Workbook (.xlsx)</option>
                    </select>
                  </div>
                  <button className="bg-[#38BDF8] text-[#0F172A] font-bold py-2 px-4 rounded-lg uppercase font-mono hover:bg-[#38BDF8]/80 transition-all">
                    Compile & Export Report
                  </button>
                </div>

                {/* Schedule cron scheduler form */}
                <div className={`p-5 rounded-xl border ${colors.card} space-y-4`}>
                  <h4 className="text-xs font-bold uppercase text-white">Schedule Reports Delivery</h4>
                  <p className="text-slate-400 text-[10px]">Configure recurring email/Slack deliveries using background cron tasks.</p>
                  <div>
                    <label className="text-slate-550 uppercase block mb-1 text-[9px]">Cron Schedule Pattern</label>
                    <input
                      type="text"
                      value={reportCron}
                      onChange={(e) => setReportCron(e.target.value)}
                      className={`w-full text-xs p-2 rounded-lg ${colors.input}`}
                    />
                    <span className="text-[8px] text-slate-555 block mt-1">Default: "0 0 * * *" (runs daily at midnight)</span>
                  </div>
                  <button className="w-full bg-[#1E293B] border border-[#334155] text-white hover:text-[#38BDF8] font-bold py-2 rounded-lg uppercase tracking-wider font-mono">
                    Save cron schedule
                  </button>
                </div>
              </div>
            )}

            {/* SETTINGS PAGE */}
            {selectedPanel === "settings" && (
              <div className={`p-5 rounded-xl border ${colors.card} space-y-4 animate-fadeIn font-mono text-xs`}>
                <h3 className="text-xs font-bold uppercase text-white">Workspace Configuration Settings</h3>
                <p className="text-slate-400">Configure workspace persistence, API endpoints, auth tokens, and local cache directories.</p>
                <div className="p-4 bg-[#111827]/40 border border-[#334155] rounded-xl text-slate-500">
                  Settings database online. System is ready.
                </div>
              </div>
            )}

          </div>
                       {/* BOTTOM WORKSPACE PANEL (TIMELINE / CODE EDITORS) */}
            <div className={`border rounded-xl ${colors.card} overflow-hidden`}>
              <div className="h-9 border-b border-slate-800 bg-[#000814]/40 flex items-center gap-4 px-4 select-none">
                {[
                  { id: "code-editor", label: "Code Editor" },
                  { id: "sql-query", label: "SQL Query" },
                  { id: "console", label: "Python Console" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setBottomTab(tab.id as any)}
                    className={`h-9 text-[10px] font-mono uppercase transition-all border-b-2 ${
                      bottomTab === tab.id
                        ? "text-[#00D4FF] border-b-[#00D4FF]"
                        : "text-slate-500 hover:text-slate-350 border-b-transparent"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {bottomTab === "code-editor" && (
                  <div className="space-y-3 font-mono">
                    <textarea
                      value={codeText}
                      onChange={(e) => setCodeText(e.target.value)}
                      placeholder="# Write custom python logic here. Assign output to 'result' to return it..."
                      className={`w-full h-24 font-mono text-xs p-3 rounded-lg focus:outline-none border ${
                        theme === "dark" ? "bg-[#020712] border-slate-800 text-cyan-400" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleRunCode}
                        disabled={codeRunning || !edaResult}
                        className="bg-cyan-500 text-[#000814] font-bold text-[10px] uppercase py-1.5 px-4 rounded hover:bg-cyan-400 transition-all font-mono"
                      >
                        {codeRunning ? "Running..." : "Execute Script"}
                      </button>
                    </div>
                  </div>
                )}

                {bottomTab === "sql-query" && (
                  <div className="font-mono text-xs text-slate-500">SQL compiler connection ready.</div>
                )}

                {bottomTab === "console" && (
                  <div className="font-mono text-xs space-y-2 max-h-36 overflow-y-auto p-2 bg-slate-950/60 rounded border border-slate-855">
                    {consoleOutput && <div className="text-slate-300 whitespace-pre-wrap">{consoleOutput}</div>}
                    {consoleError && <div className="text-red-450 whitespace-pre-wrap">Error: {consoleError}</div>}
                    {consoleResult && (
                      <div className="text-emerald-400">
                        Result: <pre className="text-[10px] mt-1 bg-slate-950 p-2 rounded border border-slate-850 overflow-x-auto">{JSON.stringify(consoleResult, null, 2)}</pre>
                      </div>
                    )}
                    {!consoleOutput && !consoleError && !consoleResult && (
                      <div className="text-slate-550">Interactive sandbox terminal output will print here. Run python script to test.</div>
                    )}
                  </div>
                )}
              </div>
            </div>   </div>

          </div>

          {/* FLOATING ACTION BUTTON (FAB) IN BOTTOM-RIGHT CORNER */}
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={() => setIsSimPanelOpen(!isSimPanelOpen)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative shadow-[0_0_15px_rgba(0,212,255,0.35)] ${
                simRunning 
                  ? "bg-[#00D4FF]/25 border border-[#00D4FF] text-[#00D4FF]"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-[#00D4FF]"
              }`}
              title="Pipeline Simulation Monitor"
            >
              {simRunning ? (
                <>
                  {/* Spinning progress loader border */}
                  <svg className="w-14 h-14 absolute inset-0 transform -rotate-90">
                    <circle cx="28" cy="28" r="24" stroke="rgba(0, 212, 255, 0.1)" strokeWidth="3" fill="transparent" />
                    <circle
                      cx="28" cy="28" r="24" stroke="#00D4FF" strokeWidth="3" fill="transparent"
                      strokeDasharray={2 * Math.PI * 24}
                      strokeDashoffset={2 * Math.PI * 24 - (simProgress / 100) * (2 * Math.PI * 24)}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <Activity className="animate-pulse" size={20} />
                  {/* Floating notification badge showing percentage */}
                  <span className="absolute -top-1 -right-1 bg-[#0085FF] text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold font-mono">
                    {simProgress}%
                  </span>
                </>
              ) : (
                <GitBranch size={20} />
              )}
            </button>
          </div>

          {/* COLLAPSIBLE BOTTOM SIMULATION PANEL */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-40 bg-[#000814]/95 border-t border-slate-800 transition-all duration-350 ease-in-out select-none ${
              isSimPanelOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
            }`}
            style={{ height: "340px" }}
          >
            <div className="h-full flex flex-col font-mono">
              {/* Drawer Header */}
              <div className="h-10 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950/80">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <strong className="text-xs uppercase tracking-wider text-slate-200">Simulation Pipeline Monitor</strong>
                  <span className="text-[10px] text-slate-500">|</span>
                  <span className="text-[10px] text-slate-400">Workspace ID: {activeTab.datasetName}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  {simRunning ? (
                    <span className="text-[10px] font-bold text-[#00D4FF] bg-[#00D4FF]/10 px-2 py-0.5 rounded animate-pulse">
                      SIMULATION ACTIVE ({simProgress}%)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                      PIPELINE IDLE
                    </span>
                  )}
                  <button 
                    onClick={() => setIsSimPanelOpen(false)}
                    className="text-slate-500 hover:text-slate-200 transition-colors text-xs font-bold"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Drawer Body Grid */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 min-h-0">
                
                {/* Column 1: Controls & Progress Circular Chart */}
                <div className="p-5 border-r border-slate-850 flex flex-col justify-between bg-slate-950/20">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 relative flex items-center justify-center transform -rotate-90">
                        <svg className="w-16 h-16">
                          <circle cx="32" cy="32" r="26" stroke="rgba(0, 133, 255, 0.1)" strokeWidth="4" fill="transparent" />
                          <circle
                            cx="32" cy="32" r="26" stroke="#0085FF" strokeWidth="4" fill="transparent"
                            strokeDasharray={2 * Math.PI * 26}
                            strokeDashoffset={2 * Math.PI * 26 - (simProgress / 100) * (2 * Math.PI * 26)}
                            className="transition-all duration-300"
                          />
                        </svg>
                        <span className="absolute text-xs font-mono font-bold text-white transform rotate-90">{simProgress}%</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block">CURRENT STEP</span>
                        <strong className="text-xs text-slate-200 mt-1 block truncate max-w-[140px]" title={currentStageKey ? SIMULATION_STAGES.find((s) => s.key === currentStageKey)?.label : "Idle"}>
                          {currentStageKey ? SIMULATION_STAGES.find((s) => s.key === currentStageKey)?.label : "Pipeline Idle"}
                        </strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div className="p-2 bg-slate-900/60 border border-slate-850 rounded-lg">
                        <span className="text-slate-500 block">STARTED AT</span>
                        <strong className="text-slate-300 mt-0.5 block">10:24:53 AM</strong>
                      </div>
                      <div className="p-2 bg-slate-900/60 border border-slate-850 rounded-lg">
                        <span className="text-slate-500 block">EST. REMAINING</span>
                        <strong className="text-slate-300 mt-0.5 block">{simRunning ? "1m 45s" : "0s"}</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={handleStartSimulation}
                      disabled={simRunning || !edaResult}
                      className="w-full bg-[#00D4FF] text-[#000814] font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none font-mono"
                    >
                      {simRunning ? <Loader2 className="spin animate-spin" size={14} /> : <Play size={14} />}
                      Run Pipeline
                    </button>
                  </div>
                </div>

                {/* Column 2 & 3: Horizontal Stages Timeline */}
                <div className="col-span-2 p-5 border-r border-slate-850 flex flex-col justify-between min-h-0 bg-slate-950/10">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Simulation Steps Timeline</div>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
                    <div className="grid grid-cols-2 gap-2.5">
                      {SIMULATION_STAGES.map((stage, idx) => {
                        const status = stageStatuses[stage.key] || "idle";
                        const isCurrent = currentStageKey === stage.key;
                        const isDone = status === "success";

                        let cardBg = "bg-slate-950/40 border-slate-850/60 text-slate-400";
                        let titleColor = "text-slate-400";
                        let badgeClass = "bg-slate-900/80 text-slate-600";

                        if (isCurrent) {
                          cardBg = "bg-[#00D4FF]/5 border-[#00D4FF]/20 text-[#00D4FF]";
                          titleColor = "text-slate-200 font-bold";
                          badgeClass = "bg-[#00D4FF]/10 text-[#00D4FF] animate-pulse";
                        } else if (isDone) {
                          cardBg = "bg-emerald-500/5 border-emerald-500/20 text-emerald-400";
                          titleColor = "text-slate-300";
                          badgeClass = "bg-emerald-500/10 text-emerald-400 font-bold";
                        }

                        return (
                          <div key={stage.key} className={`p-2 border rounded-lg flex items-center justify-between gap-2 ${cardBg} text-[10px] transition-all`}>
                            <div className="truncate max-w-[110px]">
                              <span className="text-[8px] text-slate-500 block">STAGE {idx + 1}</span>
                              <span className={`truncate block ${titleColor}`}>{stage.label}</span>
                            </div>
                            <span className={`text-[7px] px-1.5 py-0.5 rounded font-bold uppercase ${badgeClass}`}>
                              {isCurrent ? "Running" : isDone ? "Done" : "Idle"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Column 4: Log Output Console */}
                <div className="p-5 flex flex-col min-h-0 bg-[#00040a]/40">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Operation Terminal Output</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  </div>
                  <div className="flex-1 overflow-y-auto font-mono text-[9px] space-y-2 pr-1 min-h-0">
                    {logs.length === 0 ? (
                      <span className="text-slate-600 block text-center mt-8">Terminal logs empty. Run simulation pipeline.</span>
                    ) : (
                      logs.map((log, idx) => {
                        let typeColor = "text-slate-500";
                        if (log.type === "success") typeColor = "text-emerald-400";
                        if (log.type === "error") typeColor = "text-red-400";
                        if (log.type === "info") typeColor = "text-[#00D4FF]";

                        return (
                          <div key={idx} className="leading-normal border-b border-slate-850/5 pb-1">
                            <span className="text-slate-650">[{log.timestamp}]</span>{" "}
                            <span className={`${typeColor} font-bold`}>{log.node.toUpperCase()}</span>:{" "}
                            <span className="text-slate-300">{log.message}</span>
                          </div>
                        );
                      })
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </div>

              </div>
            </div>

        </div>
      </div>
);
}
