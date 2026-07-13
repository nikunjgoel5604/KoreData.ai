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
  Compass,
  Sun,
  Moon,
  Search,
  Settings,
  Grid,
  ChevronDown
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
  const [edaResult, setEdaResult] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState("Checking workspace session...");
  const [apiStatus, setApiStatus] = useState<"ready" | "empty" | "error" | "loading">("loading");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- Themes ---
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // --- Workspace Docking Tabs ---
  const [activePanels, setActivePanels] = useState<string[]>(["dashboard", "simulation", "eda-analysis", "data-cleaning"]);
  const [selectedPanel, setSelectedPanel] = useState<string>("dashboard");
  const [pinnedPanels, setPinnedPanels] = useState<string[]>([]);
  const [view3D, setView3D] = useState(true);

  // --- Right Sidebar logs ---
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- Bottom timeline tabs ---
  const [bottomTab, setBottomTab] = useState<"timeline" | "code-editor" | "sql-query" | "console">("timeline");

  // --- 16-Stage Simulation States ---
  const [simRunning, setSimRunning] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [currentStageKey, setCurrentStageKey] = useState<string | null>(null);
  const [stageStatuses, setStageStatuses] = useState<Record<string, "idle" | "running" | "success" | "warning" | "error">>({});
  const [stageTimes, setStageTimes] = useState<Record<string, number>>({});
  const [simEstTime, setSimEstTime] = useState<number>(0);

  // --- Imputation & Cleaning States ---
  const [selectedColumn, setSelectedColumn] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("mean");
  const [cleanLoading, setCleanLoading] = useState(false);

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

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    document.body.classList.add("dashboard-mode");
    return () => document.body.classList.remove("dashboard-mode");
  }, []);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("koredata-token") || "";
    if (!savedToken) {
      window.location.href = "/login";
      return;
    }
    setToken(savedToken);
  }, []);

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

        const [filesRes, notifRes, modelsRes, savedRes, historyRes, activityRes] = await Promise.all([
          fetch(`${API_BASE}/my-files`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/notifications`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/ml/models`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/ml/saved`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/ml/history`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/activity/dashboard`, { headers: authHeaders }).catch(() => null)
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

        setApiStatus("ready");
        setStatus("AI cloud runtime initialized");
        addLog("Runtime", "All endpoints bound successfully.", "success");
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
    if (simRunning) return;

    setSimRunning(true);
    setSimProgress(0);
    setCurrentStageKey("upload");

    const initStatus: Record<string, "idle" | "running" | "success" | "warning" | "error"> = {};
    const initTimes: Record<string, number> = {};
    SIMULATION_STAGES.forEach((s) => {
      initStatus[s.key] = "idle";
      initTimes[s.key] = 0;
    });
    setStageStatuses(initStatus);
    setStageTimes(initTimes);
    setSimEstTime(12);

    addLog("Simulation", "Automated execution pipeline triggered.", "info");

    const es = new EventSource(`${API_BASE}/simulation/run`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "complete") {
          setSimProgress(100);
          setSimRunning(false);
          setCurrentStageKey(null);
          addLog("Simulation", "Pipeline execution completed successfully.", "success");
          es.close();
        } else {
          const category = data.key;
          const status = data.status;
          
          SIMULATION_STAGES.forEach((stage) => {
            if (stage.category === category) {
              setStageStatuses((prev) => ({
                ...prev,
                [stage.key]: status === "running" ? "running" : "success",
              }));
              if (status === "running") {
                setCurrentStageKey(stage.key);
                setStageTimes((prev) => ({ ...prev, [stage.key]: (prev[stage.key] || 0) + 1 }));
                addLog("Pipeline", `${stage.label} active...`, "info");
              }
            }
          });

          setSimProgress(data.progress);
        }
      } catch (err) {
        console.error(err);
      }
    };

    es.onerror = () => {
      setSimRunning(false);
      es.close();
      addLog("Simulation", "Pipeline execution failed or disconnected.", "error");
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

  // --- Dynamic Color Configurations ---
  const colors = useMemo(() => {
    const isDark = theme === "dark";
    return {
      bg: isDark ? "bg-[#030712] text-slate-100" : "bg-[#f8fafc] text-slate-800",
      topbar: isDark ? "bg-[#0b1329]/95 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800 shadow-sm",
      sidebar: isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-sm",
      card: isDark ? "bg-[#0f172a]/95 border-slate-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.25)]" : "bg-white border-slate-200 shadow-[0_4px_16px_rgba(0,0,0,0.03)]",
      cardHover: isDark ? "hover:border-[#00D4FF]/40 hover:shadow-[0_0_15px_rgba(0,212,255,0.06)]" : "hover:border-blue-500/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]",
      border: isDark ? "border-slate-800/80" : "border-slate-200",
      input: isDark ? "bg-[#020712] border-slate-800 text-slate-200 focus:border-[#00D4FF]/40" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500",
      textMuted: isDark ? "text-slate-400" : "text-slate-500",
      textDim: isDark ? "text-slate-500 font-mono" : "text-slate-400 font-mono",
      btnPrimary: isDark ? "bg-[#00D4FF] hover:bg-[#00b5da] text-[#030712]" : "bg-blue-600 hover:bg-blue-700 text-white",
      tabActive: isDark ? "bg-[#0f172a] text-[#00D4FF] border-b-2 border-b-[#00D4FF]" : "bg-white text-blue-600 border-b-2 border-b-blue-600",
      tabInactive: isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-800",
    };
  }, [theme]);

  // Statistics derived values
  const totalRows = edaResult ? Number((edaResult.overview as any)?.rows || 0) : 25680;
  const totalCols = edaResult ? Number((edaResult.overview as any)?.columns || 0) : 18;
  const missingValues = edaResult ? Number((edaResult.quality as any)?.missing_cells || 0) : 1256;
  const qualityScore = edaResult ? Number((edaResult.data_quality as any)?.quality_score || 0) : 92.4;

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans transition-colors duration-300 ${colors.bg}`}>
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className={`w-64 flex flex-col border-r ${colors.sidebar} transition-colors duration-300 z-20 select-none`}>
        <div className="p-5 border-b border-slate-800/40 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#0085FF] to-[#00D4FF] flex items-center justify-center text-white font-mono font-extrabold text-sm shadow-[0_0_15px_rgba(0,212,255,0.2)]">
            K
          </div>
          <div>
            <strong className="block text-sm font-bold text-white tracking-widest uppercase">KoreData-EX</strong>
            <small className="block text-[9px] text-[#00D4FF] tracking-wider uppercase font-mono">AI-Powered Data Analytics</small>
          </div>
        </div>

        {/* SIDEBAR MAIN MENU */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block mb-3 pl-2">Main Navigation</span>
            <nav className="space-y-1">
              {[
                { id: "dashboard", label: "Dashboard", icon: Grid },
                { id: "upload", label: "Upload Dataset", icon: FileUp },
                { id: "simulation", label: "Simulation Pipeline", icon: GitBranch },
                { id: "eda-analysis", label: "EDA Analysis", icon: Activity },
                { id: "data-cleaning", label: "Data Cleaning", icon: WandSparkles },
                { id: "ml-studio", label: "Machine Learning", icon: BrainCircuit },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = selectedPanel === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => togglePanel(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono rounded-lg transition-all ${
                      isActive
                        ? "bg-[#0085FF]/10 text-[#00D4FF] border border-[#0085FF]/20"
                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/20"
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
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block mb-3 pl-2">Workspace</span>
            <nav className="space-y-1">
              {[
                { id: "projects", label: "My Projects", icon: Compass },
                { id: "saved", label: "Saved Pipelines", icon: FileClock },
                { id: "sources", label: "Data Sources", icon: Database },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-mono text-slate-500 hover:text-slate-300 hover:bg-slate-800/10 rounded-lg"
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
        <div className="p-4 border-t border-slate-800/40">
          <div className="p-4 bg-slate-900/60 border border-slate-800/60 rounded-xl mb-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div>
              <strong className="block text-[11px] text-white uppercase font-mono">KoreData-EX</strong>
              <span className="block text-[9px] text-slate-500 font-mono">Enterprise v2.0</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-[10px] font-mono pl-1">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Operational</span>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-red-400 flex items-center gap-1 transition-all">
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
            <div className={`px-2.5 py-1 text-[10px] font-mono border rounded-md uppercase ${
              apiStatus === "ready"
                ? "bg-green-500/5 border-green-500/20 text-green-400"
                : "bg-amber-500/5 border-amber-500/20 text-amber-400"
            }`}>
              Project: Retail_Analytics
            </div>

            <label className="flex items-center bg-slate-950/20 border border-slate-800/40 rounded-lg px-3 py-1.5 gap-2 cursor-pointer hover:border-slate-800 transition-all text-xs font-mono">
              <FileUp size={14} className="text-slate-500" />
              <span>Upload New Data</span>
              <input type="file" onChange={handleUpload} className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle (Sun/Moon) */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-2 rounded-lg border transition-all ${
                theme === "dark" ? "border-slate-800 text-slate-400 hover:text-white" : "border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800/40">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 font-mono text-xs uppercase border border-slate-700">
                NG
              </div>
              <div className="text-left select-none hidden md:block">
                <strong className="block text-xs font-bold text-slate-200">Nikunj Goel</strong>
                <span className="block text-[9px] text-slate-500 font-mono">Data Scientist</span>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA & BOTTOM TIMELINE SPLIT */}
        <div className="flex-1 flex min-h-0">
          
          {/* CENTER ACTIVE SPACE */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-6 space-y-6">
            
            {/* TOP STATS CARDS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Stat card 1: Total Rows */}
              <div className={`p-4 rounded-xl border ${colors.card} flex flex-col justify-between h-28`}>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Rows</span>
                  <div className="w-16 h-8 flex items-end">
                    <svg className="w-full h-full text-green-400" viewBox="0 0 50 15">
                      <rect x="2" y="10" width="4" height="5" fill="currentColor" />
                      <rect x="10" y="7" width="4" height="8" fill="currentColor" />
                      <rect x="18" y="11" width="4" height="4" fill="currentColor" />
                      <rect x="26" y="5" width="4" height="10" fill="currentColor" />
                      <rect x="34" y="2" width="4" height="13" fill="currentColor" />
                      <rect x="42" y="4" width="4" height="11" fill="currentColor" />
                    </svg>
                  </div>
                </div>
                <div>
                  <strong className="text-2xl font-mono text-white block mt-1">{totalRows.toLocaleString()}</strong>
                  <span className="text-[9px] font-mono text-emerald-400 mt-1 block">↑ 12.5% vs last upload</span>
                </div>
              </div>

              {/* Stat card 2: Total Columns */}
              <div className={`p-4 rounded-xl border ${colors.card} flex flex-col justify-between h-28`}>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Columns</span>
                  <Database size={16} className="text-cyan-400" />
                </div>
                <div>
                  <strong className="text-2xl font-mono text-white block mt-1">{totalCols}</strong>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 block">No change</span>
                </div>
              </div>

              {/* Stat card 3: Missing Values */}
              <div className={`p-4 rounded-xl border ${colors.card} flex flex-col justify-between h-28`}>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Missing Values</span>
                  <AlertTriangle size={16} className="text-amber-500" />
                </div>
                <div>
                  <strong className="text-2xl font-mono text-white block mt-1">{missingValues.toLocaleString()}</strong>
                  <span className="text-[9px] font-mono text-amber-500 mt-1 block">↓ 8.3% vs last upload</span>
                </div>
              </div>

              {/* Stat card 4: Data Quality Score */}
              <div className={`p-4 rounded-xl border ${colors.card} flex flex-col justify-between h-28`}>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Quality Score</span>
                  <div className="w-10 h-10 flex items-center justify-center transform -rotate-90">
                    <svg className="w-10 h-10">
                      <circle cx="20" cy="20" r="16" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="3" fill="transparent" />
                      <circle
                        cx="20" cy="20" r="16" stroke="#10B981" strokeWidth="3" fill="transparent"
                        strokeDasharray={2 * Math.PI * 16}
                        strokeDashoffset={2 * Math.PI * 16 - (qualityScore / 100) * (2 * Math.PI * 16)}
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <strong className="text-2xl font-mono text-white block mt-1">{qualityScore}%</strong>
                  <span className="text-[9px] font-mono text-emerald-400 mt-1 block">↑ 6.7% vs last upload</span>
                </div>
              </div>

              {/* Stat card 5: Processing Time */}
              <div className={`p-4 rounded-xl border ${colors.card} flex flex-col justify-between h-28`}>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Processing Time</span>
                  <Clock size={16} className="text-purple-400" />
                </div>
                <div>
                  <strong className="text-2xl font-mono text-white block mt-1">3m 42s</strong>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 block">Total Pipeline Time</span>
                </div>
              </div>
            </div>

            {/* TABBED CENTER PIECE TABS HEADER */}
            <div className={`border rounded-xl ${colors.card} overflow-hidden`}>
              <div className="h-10 border-b border-slate-800 bg-[#000814]/40 flex items-center justify-between px-4 select-none">
                <div className="flex gap-2">
                  {[
                    { id: "dashboard", label: "Dashboard", icon: Grid },
                    { id: "simulation", label: "Run Simulation", icon: GitBranch },
                    { id: "eda-analysis", label: "EDA Analysis", icon: Activity },
                    { id: "data-cleaning", label: "Data Cleaning", icon: WandSparkles },
                  ].map((panel) => {
                    const Icon = panel.icon;
                    const isSelected = selectedPanel === panel.id;
                    return (
                      <button
                        key={panel.id}
                        onClick={() => setSelectedPanel(panel.id)}
                        className={`h-10 px-3 flex items-center gap-2 text-xs font-mono transition-all border-b-2 ${
                          isSelected
                            ? "text-[#00D4FF] border-b-[#00D4FF] bg-slate-900/20"
                            : "text-slate-500 hover:text-slate-300 border-b-transparent"
                        }`}
                      >
                        <Icon size={14} />
                        <span>{panel.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setView3D(!view3D)}
                    className="px-2 py-1 text-[9px] font-mono border border-slate-800 hover:border-[#00D4FF] rounded text-slate-400 hover:text-white transition-all"
                  >
                    {view3D ? "2D View" : "3D View"}
                  </button>
                </div>
              </div>

              {/* CENTER WORKSPACE TABS */}
              <div className="p-6">
                {selectedPanel === "dashboard" && (
                  <div className="space-y-6">
                    {/* Visualizer Area */}
                    <div className="w-full relative rounded-xl border border-slate-800/80 overflow-hidden bg-slate-950/40">
                      {view3D ? (
                        <Pipeline3D activeStage={currentStageKey} />
                      ) : (
                        <div className="p-8 flex items-center justify-center min-h-[260px] font-mono text-xs">
                          {/* SVG flow diagram */}
                          <svg className="w-full max-w-xl h-24" viewBox="0 0 600 80">
                            <defs>
                              <linearGradient id="cyan-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#0085FF" />
                                <stop offset="100%" stopColor="#00D4FF" />
                              </linearGradient>
                            </defs>
                            {/* Connector line */}
                            <path d="M 50 40 L 550 40" stroke="url(#cyan-blue)" strokeWidth="3" fill="none" className="stroke-dasharray animate-[dash_2s_linear_infinite]" strokeDasharray="10, 5" />
                            {/* Render stages */}
                            {["Upload", "Cleaning", "EDA", "ML Studio", "Report"].map((label, idx) => {
                              const x = 50 + idx * 125;
                              return (
                                <g key={idx}>
                                  <circle cx={x} cy="40" r="16" fill="#0b1329" stroke="#00D4FF" strokeWidth="2.5" />
                                  <text x={x} y="44" fill="#00D4FF" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">{idx + 1}</text>
                                  <text x={x} y="72" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">{label}</text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Bottom Analytics Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Data Preview Table */}
                      <div className={`p-5 rounded-xl border ${colors.card} col-span-1 lg:col-span-2`}>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <FileSpreadsheet size={14} className="text-cyan-400" />
                            Data Preview
                          </h3>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full font-mono text-[10px] text-slate-400">
                            <thead>
                              <tr className="border-b border-slate-800 text-left text-slate-500 uppercase tracking-wider">
                                <th className="pb-2">Row ID</th>
                                <th className="pb-2">Column 1</th>
                                <th className="pb-2">Column 2</th>
                                <th className="pb-2">Column 3</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {edaResult ? (
                                (edaResult as any).dataset_slices?.head?.["100"]?.slice(0, 4).map((row: any, rIdx: number) => (
                                  <tr key={rIdx}>
                                    <td className="py-2.5 text-cyan-400 font-bold">#{rIdx + 1}</td>
                                    {Object.values(row).slice(0, 3).map((val: any, cIdx: number) => (
                                      <td key={cIdx} className="py-2.5 text-slate-300 truncate max-w-[120px]">{String(val)}</td>
                                    ))}
                                  </tr>
                                ))
                              ) : (
                                [1, 2, 3, 4].map((i) => (
                                  <tr key={i}>
                                    <td className="py-2.5 text-cyan-400 font-bold">#{i}</td>
                                    <td className="py-2.5 text-slate-300">CA-2016-152156</td>
                                    <td className="py-2.5 text-slate-300">Furniture</td>
                                    <td className="py-2.5 text-slate-300">261.96</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Radar Quality Score Chart */}
                      <div className={`p-5 rounded-xl border ${colors.card} flex flex-col justify-between`}>
                        <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-4">
                          Data Quality Dimensions
                        </h3>
                        
                        <div className="flex-1 flex items-center justify-center min-h-[140px]">
                          {/* Beautiful SVG Radar graph representation */}
                          <svg className="w-36 h-36" viewBox="0 0 100 100">
                            {/* Spider grid circles */}
                            <polygon points="50,10 88,38 73,83 27,83 12,38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                            <polygon points="50,25 78,45 67,73 33,73 22,45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                            <polygon points="50,40 68,52 61,63 39,63 32,52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                            
                            {/* Axis lines */}
                            <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                            <line x1="50" y1="50" x2="88" y2="38" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                            <line x1="50" y1="50" x2="73" y2="83" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                            <line x1="50" y1="50" x2="27" y2="83" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                            <line x1="50" y1="50" x2="12" y2="38" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                            {/* Data polygon */}
                            <polygon points="50,18 84,40 69,76 34,79 19,41" fill="rgba(6, 182, 212, 0.2)" stroke="#00D4FF" strokeWidth="1.5" />
                          </svg>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
                            <span>Validity: 93%</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
                            <span>Accuracy: 94%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPanel === "simulation" && (
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <button
                        onClick={handleStartSimulation}
                        disabled={simRunning}
                        className="bg-cyan-500 text-[#000814] font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-lg hover:bg-cyan-400 transition-all flex items-center gap-2"
                      >
                        {simRunning ? <Loader2 className="spin" size={14} /> : <Play size={14} />}
                        Run Simulation Pipeline
                      </button>
                    </div>

                    <div className="p-5 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                      <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-4">Python Sandbox Code Runner</h3>
                      <textarea
                        value={codeText}
                        onChange={(e) => setCodeText(e.target.value)}
                        className="w-full h-32 bg-[#020712] border border-slate-800 text-cyan-400 font-mono text-xs p-3 rounded-lg focus:outline-none mb-4"
                      />
                      <button
                        onClick={handleRunCode}
                        disabled={codeRunning || !edaResult}
                        className="bg-cyan-500 text-[#000814] font-bold text-xs uppercase py-2 px-4 rounded-lg hover:bg-cyan-400 transition-all"
                      >
                        {codeRunning ? "Running..." : "Execute Script"}
                      </button>
                    </div>
                  </div>
                )}

                {selectedPanel === "eda-analysis" && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Exploratory Data Analysis</h3>
                    <p className="text-slate-400 text-xs font-mono">Upload a dataset to compute correlation matrices and charts automatically.</p>
                  </div>
                )}

                {selectedPanel === "data-cleaning" && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Data Cleaning & Imputation</h3>
                    
                    {edaResult ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Target Column</label>
                          <select
                            value={selectedColumn}
                            onChange={(e) => setSelectedColumn(e.target.value)}
                            className="w-full bg-[#020712] border border-slate-800 text-slate-300 text-xs p-2 rounded-lg"
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
                            className="w-full bg-[#020712] border border-slate-800 text-slate-300 text-xs p-2 rounded-lg"
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
                          className="bg-cyan-500 text-[#000814] font-bold text-xs uppercase py-2 px-4 rounded-lg hover:bg-cyan-400 transition-all h-9"
                        >
                          Fill Missing Cells
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs font-mono">No active dataset uploaded.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* BOTTOM WORKSPACE PANEL (TIMELINE / CODE EDITORS) */}
            <div className={`border rounded-xl ${colors.card} overflow-hidden`}>
              <div className="h-9 border-b border-slate-800 bg-[#000814]/40 flex items-center gap-4 px-4 select-none">
                {[
                  { id: "timeline", label: "Pipeline Timeline" },
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
                        : "text-slate-500 hover:text-slate-300 border-b-transparent"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {bottomTab === "timeline" && (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {SIMULATION_STAGES.slice(0, 10).map((stage, idx) => {
                      const status = stageStatuses[stage.key] || "idle";
                      const isCurrent = currentStageKey === stage.key;
                      const isDone = status === "success";

                      let badgeClass = "bg-slate-800 text-slate-500";
                      if (isCurrent) badgeClass = "bg-[#00D4FF]/10 text-[#00D4FF] animate-pulse";
                      if (isDone) badgeClass = "bg-emerald-500/10 text-emerald-400";

                      return (
                        <div key={stage.key} className="flex-shrink-0 w-44 p-3 bg-slate-950/20 border border-slate-850 rounded-lg">
                          <span className="text-[9px] font-mono text-slate-500 uppercase">Stage {idx + 1}</span>
                          <h4 className="text-xs font-bold text-slate-200 mt-1 truncate">{stage.label}</h4>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase block w-fit mt-2 ${badgeClass}`}>
                            {isCurrent ? "In Progress" : isDone ? "Completed" : "Pending"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {bottomTab === "code-editor" && (
                  <div className="font-mono text-xs text-slate-500">Code editor panel loaded. Ready for script configurations.</div>
                )}

                {bottomTab === "sql-query" && (
                  <div className="font-mono text-xs text-slate-500">SQL compiler connection ready.</div>
                )}

                {bottomTab === "console" && (
                  <div className="font-mono text-xs text-slate-500">Interactive sandbox terminal online.</div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR PANEL */}
          <aside className="w-80 border-l border-slate-800 bg-[#000814]/95 flex flex-col z-10 select-none">
            
            {/* Simulation Progress Card */}
            <div className="p-5 border-b border-slate-850 space-y-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Simulation Progress</span>
              
              <div className="flex items-center gap-4">
                {/* Circular Progress Ring */}
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
                  <span className="text-[10px] text-slate-500 font-mono block">Current Step</span>
                  <strong className="text-xs text-slate-200 mt-1 block truncate">
                    {currentStageKey ? SIMULATION_STAGES.find((s) => s.key === currentStageKey)?.label : "Pipeline Idle"}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[9px] font-mono">
                <div className="p-2 bg-slate-900/60 border border-slate-850 rounded-lg">
                  <span className="text-slate-500 block">STARTED AT</span>
                  <strong className="text-slate-300 mt-1 block">10:24:53 AM</strong>
                </div>
                <div className="p-2 bg-slate-900/60 border border-slate-850 rounded-lg">
                  <span className="text-slate-500 block">ETA</span>
                  <strong className="text-slate-300 mt-1 block">2m 18s</strong>
                </div>
              </div>
            </div>

            {/* LIVE LOGS SECTION */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="h-8 border-b border-slate-850 px-4 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="uppercase tracking-widest">Live Logs</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              </div>

              <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-2 bg-[#00040a]/30">
                {logs.length === 0 ? (
                  <span className="text-slate-600 block text-center mt-6">Log feed empty. Run pipeline.</span>
                ) : (
                  logs.map((log, idx) => {
                    let typeColor = "text-slate-500";
                    if (log.type === "success") typeColor = "text-emerald-400";
                    if (log.type === "error") typeColor = "text-red-400";
                    if (log.type === "info") typeColor = "text-[#00D4FF]";

                    return (
                      <div key={idx} className="leading-relaxed border-b border-slate-850/10 pb-1">
                        <span className="text-slate-600">[{log.timestamp}]</span>{" "}
                        <span className={`${typeColor} font-bold`}>{log.node.toUpperCase()}</span>:{" "}
                        <span className="text-slate-300">{log.message}</span>
                      </div>
                    );
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
