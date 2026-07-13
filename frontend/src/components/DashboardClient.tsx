"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bell,
  BrainCircuit,
  Code2,
  Database,
  FileClock,
  FileSpreadsheet,
  FileUp,
  Gauge,
  GitBranch,
  History,
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
  Compass
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

  // --- Docking / Workspace Layout ---
  const [activePanels, setActivePanels] = useState<string[]>(["overview", "upload-and-eda", "ml-studio", "simulation"]);
  const [selectedPanel, setSelectedPanel] = useState<string>("overview");
  const [maximizedPanel, setMaximizedPanel] = useState<string | null>(null);
  const [pinnedPanels, setPinnedPanels] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- 16-Stage Simulation States ---
  const [simRunning, setSimRunning] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [currentStageKey, setCurrentStageKey] = useState<string | null>(null);
  const [stageStatuses, setStageStatuses] = useState<Record<string, "idle" | "running" | "success" | "warning" | "error">>({});
  const [stageTimes, setStageTimes] = useState<Record<string, number>>({});
  const [simEstTime, setSimEstTime] = useState<number>(0); // in seconds
  const [simStartTime, setSimStartTime] = useState<number | null>(null);

  // --- Imputation & Edit States ---
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

  // Set default values when edaResult updates
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

  const allColumns = useMemo(() => {
    if (!edaResult) return [];
    const over = (edaResult as any).overview || {};
    return [
      ...(over.numeric_columns || []),
      ...(over.categorical_columns || []),
      ...(over.datetime_columns || [])
    ];
  }, [edaResult]);

  // Autoscroll live logs box
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

  // --- Docking Tab Controls ---
  const togglePanel = (panelId: string) => {
    if (activePanels.includes(panelId)) {
      setSelectedPanel(panelId);
    } else {
      setActivePanels([...activePanels, panelId]);
      setSelectedPanel(panelId);
    }
    addLog("Workspace", `Opened workspace tab: ${panelId}`, "info");
  };

  const closePanel = (panelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = activePanels.filter((id) => id !== panelId);
    setActivePanels(remaining);
    if (selectedPanel === panelId && remaining.length > 0) {
      setSelectedPanel(remaining[0]);
    }
    if (maximizedPanel === panelId) {
      setMaximizedPanel(null);
    }
    addLog("Workspace", `Closed workspace tab: ${panelId}`, "info");
  };

  const togglePin = (panelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedPanels((prev) =>
      prev.includes(panelId) ? prev.filter((id) => id !== panelId) : [...prev, panelId]
    );
  };

  // --- Real-Time 16-Stage SSE simulation ---
  const handleStartSimulation = () => {
    if (simRunning) return;

    setSimRunning(true);
    setSimProgress(0);
    setSimStartTime(Date.now());
    setCurrentStageKey("upload");

    // Initialize all stage states
    const initStatus: Record<string, "idle" | "running" | "success" | "warning" | "error"> = {};
    const initTimes: Record<string, number> = {};
    SIMULATION_STAGES.forEach((s) => {
      initStatus[s.key] = "idle";
      initTimes[s.key] = 0;
    });
    setStageStatuses(initStatus);
    setStageTimes(initTimes);
    setSimEstTime(12);

    addLog("Simulation", "Real-time SSE simulation graph started.", "info");

    const es = new EventSource(`${API_BASE}/simulation/run`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "complete") {
          setSimProgress(100);
          setSimRunning(false);
          setCurrentStageKey(null);
          addLog("Simulation", "Real-time analysis pipeline complete.", "success");
          es.close();
        } else {
          // Advance frontend sub-stages mapped to backend pipeline category
          const category = data.key; // e.g. "load", "missing", "inspect", etc.
          const status = data.status; // "running" | "done"
          
          SIMULATION_STAGES.forEach((stage, idx) => {
            if (stage.category === category) {
              setStageStatuses((prev) => ({
                ...prev,
                [stage.key]: status === "running" ? "running" : "success",
              }));
              if (status === "running") {
                setCurrentStageKey(stage.key);
                setStageTimes((prev) => ({ ...prev, [stage.key]: (prev[stage.key] || 0) + 1 }));
                addLog("Pipeline", `${stage.label} is currently active...`, "info");
              } else {
                addLog("Pipeline", `${stage.label} completed successfully.`, "success");
              }
            }
          });

          // Sync global progress bar
          setSimProgress(data.progress);
        }
      } catch (err) {
        console.error(err);
      }
    };

    es.onerror = () => {
      setSimRunning(false);
      es.close();
      addLog("Simulation", "SSE connection dropped.", "error");
    };
  };

  // --- Clean & Impute Missing Data ---
  const handleApplyImputation = async () => {
    if (!edaResult || !selectedColumn || cleanLoading) return;
    setCleanLoading(true);
    addLog("EDA Engine", `Applying Imputation on column: ${selectedColumn}`, "info");

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
        addLog("EDA Engine", "Missing cells imputation failed.", "error");
        return;
      }

      // Re-run EDA by editing the dataset
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
      addLog("EDA Engine", `Filled missing cells in ${selectedColumn}. Quality score: ${editData.data_quality?.quality_score}%`, "success");
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
    addLog("Code Runner", "Initializing sandboxed Python compilation.", "info");

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
        addLog("Code Runner", `Compilation Error: ${data.detail}`, "error");
        return;
      }

      setConsoleOutput(data.output || "");
      if (data.error) {
        setConsoleError(data.error);
        addLog("Code Runner", "Runtime script exception detected.", "error");
      }
      if (data.result) {
        setConsoleResult(data.result);
        addLog("Code Runner", "Dataframe returned successfully.", "success");
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

      // Reload model stats
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

  const overview = edaResult?.overview as { rows?: number; columns?: number } | undefined;
  const quality = edaResult?.quality as { score?: number } | undefined;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020712] text-slate-100 font-sans">
      
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className="w-16 flex flex-col items-center justify-between border-r border-slate-800 bg-[#000814] py-4 z-20">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 rounded-lg border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-extrabold text-sm shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-slate-900/50">
            K∂
          </div>
          
          <nav className="flex flex-col gap-3">
            {[
              { id: "overview", label: "Overview", icon: Activity },
              { id: "upload-and-eda", label: "Upload & EDA", icon: FileUp },
              { id: "python-sandbox", label: "Sandbox", icon: Code2 },
              { id: "ml-studio", label: "ML Studio", icon: BrainCircuit },
              { id: "simulation", label: "Pipeline SIM", icon: GitBranch },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = selectedPanel === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => togglePanel(item.id)}
                  title={item.label}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </nav>
        </div>

        <button onClick={logout} title="Log Out" className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={18} />
        </button>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 2. TOP NAVBAR */}
        <header className="h-14 border-b border-slate-800 bg-[#000814]/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${apiStatus === "ready" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <h1 className="text-sm font-mono tracking-wider text-slate-300">KOREDATA.AI // {status}</h1>
          </div>

          {simRunning && (
            <div className="flex items-center gap-4 w-72">
              <span className="text-xs text-cyan-400 font-mono animate-pulse">PIPELINE RUNNING:</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${simProgress}%` }} />
              </div>
              <span className="text-xs font-mono text-cyan-400">{simProgress}%</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <UserRound size={14} className="text-cyan-500" />
            <span>ID: {user?.login_id || "KD-0000"}</span>
          </div>
        </header>

        {/* WORKSPACE & BOTTOM TIMELINE SPLIT */}
        <div className="flex-1 flex min-h-0">
          
          {/* CENTER PANEL SPACE & RIGHT SIDEBAR PANEL */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* 3. CENTER WORKSPACE (IDE TABS & CONTENT) */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#030914]">
              {/* IDE TABS HEADER */}
              <div className="h-9 border-b border-slate-800/80 bg-[#000814]/40 flex items-center justify-between px-4">
                <div className="flex items-center gap-1 overflow-x-auto select-none">
                  {activePanels.map((panelId) => {
                    const isSelected = selectedPanel === panelId;
                    const isPinned = pinnedPanels.includes(panelId);
                    return (
                      <div
                        key={panelId}
                        onClick={() => setSelectedPanel(panelId)}
                        className={`group h-9 px-3 flex items-center gap-2 border-r border-slate-800/60 cursor-pointer text-xs font-mono transition-all ${
                          isSelected
                            ? "bg-[#030914] text-cyan-400 font-bold border-b border-b-cyan-500"
                            : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/20"
                        }`}
                      >
                        <span className="capitalize">{panelId.replaceAll("-", " ")}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => togglePin(panelId, e)}
                            className={`p-0.5 rounded hover:bg-slate-800 ${isPinned ? "text-cyan-400" : "text-slate-600"}`}
                          >
                            <Pin size={10} />
                          </button>
                          <button onClick={(e) => closePanel(panelId, e)} className="p-0.5 rounded hover:bg-slate-800 text-slate-600 hover:text-red-400">
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {selectedPanel && (
                  <button
                    onClick={() => setMaximizedPanel(maximizedPanel ? null : selectedPanel)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                  >
                    {maximizedPanel ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  </button>
                )}
              </div>

              {/* TABS WORKSPACE CONTENT (STATE PERSISTED via DISPLAY NONE) */}
              <div className="flex-1 overflow-y-auto p-6 relative">
                
                {/* OVERVIEW PANEL */}
                <div style={{ display: selectedPanel === "overview" ? "block" : "none" }}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="text-xl font-bold mb-2 text-white">System Environment</h2>
                    <p className="text-slate-400 text-sm mb-6">Overview of current cloud active files, pipeline models, and database telemetry.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
                        <small className="text-slate-500 font-mono uppercase text-[10px]">Ingested Files</small>
                        <strong className="block text-2xl mt-1 text-cyan-400">{files.length}</strong>
                      </div>
                      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
                        <small className="text-slate-500 font-mono uppercase text-[10px]">Cloud Models</small>
                        <strong className="block text-2xl mt-1 text-purple-400">{models.length}</strong>
                      </div>
                      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
                        <small className="text-slate-500 font-mono uppercase text-[10px]">Notifications</small>
                        <strong className="block text-2xl mt-1 text-emerald-400">{notifications.length}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                        <h3 className="text-sm font-bold text-slate-200 mb-3 uppercase tracking-wider font-mono">Dataset Overview</h3>
                        {edaResult ? (
                          <div className="space-y-3 font-mono text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-800/40">
                              <span className="text-slate-500">Rows</span>
                              <strong className="text-white">{overview?.rows}</strong>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800/40">
                              <span className="text-slate-500">Columns</span>
                              <strong className="text-white">{overview?.columns}</strong>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-500">EDA Quality Score</span>
                              <strong className="text-emerald-400">{quality?.score}%</strong>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-500 text-xs font-mono">No active dataset. Ingest a dataset first.</p>
                        )}
                      </div>

                      <div className="p-5 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                        <h3 className="text-sm font-bold text-slate-200 mb-3 uppercase tracking-wider font-mono">ML Studio Stats</h3>
                        <div className="space-y-3 font-mono text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-800/40">
                            <span className="text-slate-500">Saved Joblibs</span>
                            <strong className="text-white">{savedModels.length}</strong>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Training Runs Logged</span>
                            <strong className="text-white">{mlHistory.length}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* UPLOAD & EDA PANEL */}
                <div style={{ display: selectedPanel === "upload-and-eda" ? "block" : "none" }}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl mb-6">
                      <h2 className="text-lg font-bold mb-2 text-white">Upload & EDA Engine</h2>
                      <p className="text-slate-400 text-sm mb-4">Select or drop tabular files. Python EDA computes schemas, anomalies, and statistics.</p>
                      
                      <label className="border-2 border-dashed border-slate-800 hover:border-cyan-500/40 bg-slate-950/40 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all">
                        {uploading ? (
                          <Loader2 className="spin text-cyan-400 mb-3" size={24} />
                        ) : (
                          <FileUp className="text-slate-500 mb-3" size={24} />
                        )}
                        <span className="text-sm font-mono text-slate-300 uppercase tracking-wider">
                          {uploading ? "Parsing File..." : "Choose Dataset"}
                        </span>
                        <span className="text-xs text-slate-600 mt-1 font-mono">CSV, EXCEL, JSON, PARQUET</span>
                        <input type="file" accept=".csv,.xlsx,.xls,.json,.parquet,.xml" onChange={handleUpload} className="hidden" />
                      </label>
                    </div>

                    {edaResult && (
                      <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono flex items-center gap-2">
                          <WandSparkles size={16} className="text-cyan-400" />
                          Impute Missing Values
                        </h3>
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
                              <option value="mean">Mean (Numerical Only)</option>
                              <option value="median">Median (Numerical Only)</option>
                              <option value="mode">Mode (Most Common)</option>
                              <option value="zero">Fill zero constant</option>
                            </select>
                          </div>

                          <button
                            onClick={handleApplyImputation}
                            disabled={cleanLoading || !selectedColumn}
                            className="bg-cyan-500 text-[#000814] font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all h-9"
                          >
                            {cleanLoading ? <Loader2 className="spin" size={14} /> : "Apply Cleaning"}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* PYTHON CODE SANDBOX */}
                <div style={{ display: selectedPanel === "python-sandbox" ? "block" : "none" }}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                      <h2 className="text-lg font-bold mb-2 text-white">Python Workspace Console</h2>
                      <p className="text-slate-400 text-sm mb-4">Run safe, sandboxed Python code to clean and model the active dataset.</p>
                      
                      <textarea
                        value={codeText}
                        onChange={(e) => setCodeText(e.target.value)}
                        className="w-full h-40 bg-slate-950/70 border border-slate-800 rounded-xl p-4 font-mono text-cyan-400 text-xs leading-relaxed focus:outline-none focus:border-cyan-500/40 mb-4"
                      />

                      <button
                        onClick={handleRunCode}
                        disabled={codeRunning || !edaResult}
                        className="bg-cyan-500 text-[#000814] font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-lg hover:bg-cyan-400 transition-all mb-6"
                      >
                        {codeRunning ? "Running Script..." : "Execute Python"}
                      </button>

                      {(consoleOutput || consoleError || consoleResult) && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest block border-b border-slate-850 pb-2 mb-2">Stdout stream logs</span>
                          {consoleOutput && <pre className="text-slate-300 whitespace-pre-wrap">{consoleOutput}</pre>}
                          {consoleError && <pre className="text-red-400 mt-2 whitespace-pre-wrap">{consoleError}</pre>}
                          {consoleResult && (
                            <div className="mt-3 pt-3 border-t border-slate-850">
                              <span className="text-[10px] text-emerald-400 uppercase tracking-widest block mb-2">Evaluated Result:</span>
                              <pre className="text-emerald-400 whitespace-pre-wrap overflow-x-auto">
                                {typeof consoleResult === "string" ? consoleResult : JSON.stringify(consoleResult, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* ML STUDIO PANEL */}
                <div style={{ display: selectedPanel === "ml-studio" ? "block" : "none" }}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                      <h2 className="text-lg font-bold mb-2 text-white">Machine Learning Studio</h2>
                      
                      {!edaResult ? (
                        <p className="text-slate-500 text-sm font-mono">No active dataset. Upload a dataset to begin ML training.</p>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Target Column</label>
                              <select
                                value={targetCol}
                                onChange={(e) => setTargetCol(e.target.value)}
                                className="w-full bg-[#020712] border border-slate-800 text-slate-300 text-xs p-2 rounded-lg"
                              >
                                {allColumns.map((col) => (
                                  <option key={col} value={col}>{col}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Task Hint</label>
                              <select
                                value={taskHint}
                                onChange={(e) => setTaskHint(e.target.value)}
                                className="w-full bg-[#020712] border border-slate-800 text-slate-300 text-xs p-2 rounded-lg"
                              >
                                <option value="auto-detect">Auto-detect task</option>
                                <option value="classification">Classification</option>
                                <option value="regression">Regression</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Prompt / prediction goal (Optional)</label>
                            <textarea
                              value={promptText}
                              onChange={(e) => setPromptText(e.target.value)}
                              placeholder="e.g. classify user behavior patterns..."
                              className="w-full h-16 bg-[#020712] border border-slate-800 text-slate-300 text-xs p-2 rounded-lg resize-none"
                            />
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={handleGetRecommendations}
                              disabled={mlRecommendLoading}
                              className="bg-cyan-500 text-[#000814] font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-lg hover:bg-cyan-400 transition-all"
                            >
                              {mlRecommendLoading ? <Loader2 className="spin" size={14} /> : "Analyze Suitability"}
                            </button>

                            <button
                              onClick={() => handleTrainModel("", true)}
                              disabled={trainingLoading !== false}
                              className="bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-lg hover:bg-slate-700 transition-all"
                            >
                              {trainingLoading === "auto" ? <Loader2 className="spin" size={14} /> : "Auto-Train Best"}
                            </button>
                          </div>

                          {recommendationData && (
                            <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl space-y-4">
                              <h4 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={14} />
                                Model Recommendations
                              </h4>
                              <p className="text-slate-300 text-xs leading-relaxed">{recommendationData.explanation || recommendationData.prompt_note}</p>
                              
                              <div className="space-y-2">
                                {recommendationData.recommendations?.slice(0, 3).map((rec: any) => {
                                  const isTrainingThis = trainingLoading === rec.model_key;
                                  return (
                                    <div key={rec.model_key} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-lg">
                                      <div className="font-mono text-xs">
                                        <div className="flex items-center gap-2">
                                          <strong className="text-white">{rec.name}</strong>
                                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{rec.speed}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 mt-1 block">Score: {rec.score}/100</span>
                                      </div>
                                      <button
                                        onClick={() => handleTrainModel(rec.model_key)}
                                        disabled={trainingLoading !== false}
                                        className="bg-cyan-500 text-[#000814] font-bold text-[10px] uppercase tracking-wider py-1 px-3 rounded hover:bg-cyan-400 transition-all"
                                      >
                                        {isTrainingThis ? <Loader2 className="spin" size={12} /> : "Train"}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {trainedModelCard && (
                            <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-4">
                              <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3">
                                <div>
                                  <h4 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-widest">Trained Model Artifact</h4>
                                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">{trainedModelCard.rawResult.model_name}</span>
                                </div>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase font-mono">
                                  Grade: {trainedModelCard.report?.grade}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                {Object.keys(trainedModelCard.rawResult.metrics || {}).map((mKey) => (
                                  <div key={mKey} className="p-2 bg-slate-950/40 border border-slate-850 rounded-lg text-center">
                                    <span className="text-[9px] text-slate-500 font-mono uppercase block">{mKey.replaceAll("_", " ")}</span>
                                    <strong className="text-sm font-mono text-white mt-1 block">{trainedModelCard.rawResult.metrics[mKey]}</strong>
                                  </div>
                                ))}
                              </div>

                              <button
                                onClick={() => handleDownloadModel(trainedModelCard.rawResult.model_key)}
                                className="w-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs uppercase py-2 rounded-lg hover:bg-slate-800 transition-all"
                              >
                                Download joblib Model
                              </button>

                              {trainedModelCard.rawResult.feature_names && (
                                <form onSubmit={handlePredict} className="border-t border-slate-850 pt-4 mt-2">
                                  <span className="text-xs font-bold text-cyan-400 font-mono block mb-3 uppercase tracking-wider">Deploy & Run Inference</span>
                                  
                                  <div className="grid grid-cols-2 gap-2 mb-3">
                                    {trainedModelCard.rawResult.feature_names.map((feat: string) => (
                                      <div key={feat}>
                                        <label className="text-[9px] text-slate-500 font-mono block mb-1 truncate">{feat}</label>
                                        <input
                                          type="text"
                                          value={predictInputs[feat] || "0"}
                                          onChange={(e) => setPredictInputs({ ...predictInputs, [feat]: e.target.value })}
                                          className="w-full bg-slate-950 border border-slate-850 text-white text-xs p-1.5 rounded"
                                          required
                                        />
                                      </div>
                                    ))}
                                  </div>

                                  <button
                                    type="submit"
                                    disabled={predictLoading}
                                    className="bg-cyan-500 text-[#000814] font-bold text-xs uppercase py-1.5 px-3 rounded hover:bg-cyan-400 transition-all"
                                  >
                                    {predictLoading ? <Loader2 className="spin" size={12} /> : "Run Inference"}
                                  </button>

                                  {predictResult && (
                                    <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                      <span className="text-[9px] text-emerald-400 font-mono block uppercase">Output prediction</span>
                                      <strong className="text-lg font-mono text-white mt-1 block">{predictResult.predictions?.[0]}</strong>
                                    </div>
                                  )}
                                </form>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* SIMULATION PIPELINE */}
                <div style={{ display: selectedPanel === "simulation" ? "block" : "none" }}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                      <h2 className="text-lg font-bold mb-2 text-white">Simulation Pipeline Control</h2>
                      <p className="text-slate-400 text-sm mb-4">Run SSE events stream mapping the full 16-stage pipeline node execution.</p>

                      <button
                        onClick={handleStartSimulation}
                        disabled={simRunning}
                        className="bg-cyan-500 text-[#000814] font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-lg hover:bg-cyan-400 transition-all flex items-center gap-2"
                      >
                        {simRunning ? <Loader2 className="spin" size={14} /> : <Play size={14} />}
                        Run Simulation Pipeline
                      </button>
                    </div>
                  </motion.div>
                </div>

              </div>
            </div>

            {/* 5. BOTTOM PANEL (16-STAGE TIMELINE / CONSOLE) */}
            <footer className="h-48 border-t border-slate-800 bg-[#000814]/90 flex flex-col min-h-[12rem] z-10 select-none">
              {/* TIMELINE CONTROLS HEADER */}
              <div className="h-8 border-b border-slate-850 px-6 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <div className="flex items-center gap-2">
                  <Terminal size={12} className="text-cyan-500" />
                  <span className="uppercase tracking-widest">Active Execution Timeline</span>
                </div>
                <span>16 STAGES INTEGRATED</span>
              </div>

              {/* TIMELINE HORIZONTAL SCROLL BOX (FIXED OVERLAPPING WITH PROPER SPACING) */}
              <div className="flex-1 overflow-x-auto flex items-center px-6 gap-6 py-4">
                {SIMULATION_STAGES.map((stage, index) => {
                  const status = stageStatuses[stage.key] || "idle";
                  const isCurrent = currentStageKey === stage.key;
                  const isDone = status === "success";

                  let colorClass = "text-slate-500 border-slate-800 bg-slate-900/10";
                  let badgeColor = "bg-slate-800 text-slate-500";
                  let borderGlow = "";

                  if (isCurrent) {
                    colorClass = "text-cyan-400 border-cyan-500/40 bg-cyan-500/5";
                    badgeColor = "bg-cyan-500/10 text-cyan-400";
                    borderGlow = "shadow-[0_0_15px_rgba(6,182,212,0.1)]";
                  } else if (isDone) {
                    colorClass = "text-emerald-400 border-emerald-500/40 bg-emerald-500/5";
                    badgeColor = "bg-emerald-500/10 text-emerald-400";
                  }

                  return (
                    <div
                      key={stage.key}
                      className={`flex-shrink-0 w-52 p-3 border rounded-xl flex flex-col justify-between h-28 transition-all ${colorClass} ${borderGlow}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold text-slate-500">{String(index + 1).padStart(2, "0")}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${badgeColor}`}>
                          {isCurrent ? "Active" : isDone ? "Done" : "Idle"}
                        </span>
                      </div>
                      
                      <div className="mt-2">
                        <h4 className="text-xs font-bold text-slate-200 truncate">{stage.label}</h4>
                        <p className="text-[9px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </footer>

          </div>

          {/* 4. RIGHT SIDEBAR (3D SCENE & LIVE LOGS TERMINAL) */}
          <aside className="w-80 border-l border-slate-800 bg-[#000814]/90 flex flex-col z-15 min-w-[20rem]">
            {/* Embedded 3D scene visualizer */}
            <div className="p-4 border-b border-slate-850">
              <Pipeline3D activeStage={currentStageKey} />
            </div>

            {/* LIVE SCROLLING LOGS BOX */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="h-8 border-b border-slate-850 px-4 flex items-center justify-between text-[10px] font-mono text-slate-500 select-none">
                <span className="uppercase tracking-widest">Synchronized Logs</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
              </div>

              <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-2 bg-[#00040a]/40">
                {logs.length === 0 ? (
                  <span className="text-slate-600 block text-center mt-8">Terminal logs stream empty.</span>
                ) : (
                  logs.map((log, i) => {
                    let typeColor = "text-slate-500";
                    if (log.type === "success") typeColor = "text-emerald-400";
                    if (log.type === "warning") typeColor = "text-amber-400";
                    if (log.type === "error") typeColor = "text-red-400";
                    if (log.type === "info") typeColor = "text-cyan-400";

                    return (
                      <div key={i} className="leading-relaxed border-b border-slate-850/20 pb-1.5">
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

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <article className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl flex items-center justify-between">
      <div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
        <strong className="block text-xl font-mono text-cyan-400 mt-1">{value}</strong>
      </div>
      <Icon size={20} className="text-slate-700" />
    </article>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-lg">
      <span className="text-[9px] text-slate-500 font-mono uppercase block">{label}</span>
      <strong className="text-sm font-mono text-white mt-1 block">{value}</strong>
    </div>
  );
}
