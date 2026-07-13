"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
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
  ArrowRight
} from "lucide-react";

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

type SimulationStep =
  | string
  | {
      key?: string;
      label?: string;
      description?: string;
      section?: string;
      duration_ms?: number;
      accuracy_dimension?: string;
      accuracy_contribution?: number;
    };

type ApiStatus = "ready" | "empty" | "error" | "loading";

const operations = [
  ["Upload", "POST /upload", "Dataset upload and EDA processing", FileUp],
  ["Files", "GET /my-files", "User upload history", FileSpreadsheet],
  ["EDA Engine", "eda_engine.py", "Overview, missing values, quality and stats", BarChart3],
  ["Code Runner", "POST /code-run", "Run safe Python analysis over data", Code2],
  ["Dataset Edit", "POST /dataset/edit", "Edit rows and re-run EDA", Database],
  ["Missing Values", "POST /dataset/apply-missing", "Mean, median, mode or zero fill", WandSparkles],
  ["ML Registry", "GET /ml/models", "Available model catalog", BrainCircuit],
  ["ML Recommend", "POST /ml/recommend", "Model recommendations from data", Sparkles],
  ["ML Train", "POST /ml/train", "Train selected model", Gauge],
  ["ML Auto", "POST /ml/auto", "Automatic model workflow", Layers3],
  ["ML History", "GET /ml/history", "Training run history", History],
  ["Saved Models", "GET /ml/saved", "Persisted model files", FileClock],
  ["Simulation Steps", "GET /simulation/steps", "Pipeline mechanism steps", GitBranch],
  ["Simulation Run", "GET /simulation/run", "Stream backend simulation", Play],
  ["Activity", "GET /activity/dashboard", "Login and active time metrics", Activity],
  ["Notifications", "GET /notifications", "User alert center", Bell],
  ["Account", "GET /me", "Protected user profile", UserRound],
  ["Security", "GET /auth/verify", "Bearer token verification", ShieldCheck]
] as const;

export default function DashboardClient() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [models, setModels] = useState<MlModel[]>([]);
  const [savedModels, setSavedModels] = useState<MlModel[]>([]);
  const [mlHistory, setMlHistory] = useState<Record<string, unknown>[]>([]);
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [edaResult, setEdaResult] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState("Checking secure session...");
  const [apiStatus, setApiStatus] = useState<ApiStatus>("loading");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- Simulation running states ---
  const [simRunning, setSimRunning] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [simCompletedAt, setSimCompletedAt] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [activeStepStatus, setActiveStepStatus] = useState<Record<string, "idle" | "running" | "done">>({});

  // --- Cleansing/Imputation states ---
  const [selectedColumn, setSelectedColumn] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("mean");
  const [cleanLoading, setCleanLoading] = useState(false);

  // --- Python Code Sandbox states ---
  const [codeText, setCodeText] = useState("");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [consoleError, setConsoleError] = useState("");
  const [consoleResult, setConsoleResult] = useState<any>(null);
  const [codeRunning, setCodeRunning] = useState(false);

  // --- ML Studio states ---
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
      setStatus("Loading all Python operations...");

      try {
        const profileRes = await fetch(`${API_BASE}/me`, { headers: authHeaders });
        if (!profileRes.ok) {
          window.localStorage.removeItem("koredata-token");
          window.localStorage.removeItem("koredata-login-id");
          window.location.href = "/login";
          return;
        }

        setUser(await profileRes.json());

        const [filesRes, notifRes, modelsRes, savedRes, historyRes, stepsRes, activityRes] = await Promise.all([
          fetch(`${API_BASE}/my-files`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/notifications`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/ml/models`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/ml/saved`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/ml/history`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE}/simulation/steps`, { headers: authHeaders }).catch(() => null),
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

        if (stepsRes?.ok) {
          const data = await stepsRes.json();
          setSimulationSteps(data.steps || data.pipeline || []);
        }

        if (activityRes?.ok) {
          setActivity(await activityRes.json());
        }

        setApiStatus("ready");
        setStatus("All available Python modules connected");
      } catch {
        setApiStatus("error");
        setStatus("Backend not reachable. Start FastAPI on http://127.0.0.1:8000.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [authHeaders, token]);

  // Set default parameters when edaResult updates
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
    setStatus(`Uploading ${file.name} through Python EDA...`);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: authHeaders,
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Upload failed.");
        return;
      }

      setEdaResult(data);
      setStatus("EDA complete");

      const filesRes = await fetch(`${API_BASE}/my-files`, { headers: authHeaders }).catch(() => null);
      if (filesRes?.ok) {
        const filesData = await filesRes.json();
        setFiles(filesData.files || []);
      }
    } catch {
      setStatus("Upload failed. Check backend server.");
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

  // --- Real-time Simulation SSE Stream ---
  const handleStartSimulation = () => {
    if (simRunning) return;

    setSimRunning(true);
    setSimProgress(0);
    setSimCompletedAt(null);
    setCurrentStepIndex(null);
    setActiveStepStatus({});

    const es = new EventSource(`${API_BASE}/simulation/run`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "complete") {
          setSimProgress(100);
          setSimCompletedAt(data.completed_at);
          setSimRunning(false);
          es.close();
        } else {
          setSimProgress(data.progress);
          setCurrentStepIndex(data.step);
          setActiveStepStatus((prev) => ({
            ...prev,
            [data.key]: data.status,
          }));
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    es.onerror = (err) => {
      console.error("SSE error", err);
      setSimRunning(false);
      es.close();
    };
  };

  // --- Clean & Impute Missing Data ---
  const handleApplyImputation = async () => {
    if (!edaResult || !selectedColumn || cleanLoading) return;
    setCleanLoading(true);

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
        return;
      }

      // Re-run EDA by editing the dataset
      setStatus(`Re-calculating EDA stats after imputation on ${selectedColumn}...`);
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
      alert(`Imputation applied! Missing values in '${selectedColumn}' filled using '${selectedStrategy}'.`);
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
        return;
      }

      setConsoleOutput(data.output || "");
      if (data.error) {
        setConsoleError(data.error);
      }
      if (data.result) {
        setConsoleResult(data.result);
      }
    } catch (err) {
      setConsoleError("Network error. Failed to reach code execution server.");
    } finally {
      setCodeRunning(false);
    }
  };

  // --- ML Studio Recommendations & Suggest ---
  const handleGetRecommendations = async () => {
    if (!edaResult || mlRecommendLoading) return;
    setMlRecommendLoading(true);
    setRecommendationData(null);
    setTrainedModelCard(null);
    setPredictResult(null);

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
        requestBody = {
          ...payload,
          prompt: promptText.trim(),
        };
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
    } catch (err) {
      console.error(err);
      alert("Error fetching recommendations.");
    } finally {
      setMlRecommendLoading(false);
    }
  };

  // --- Model Training & Auto-train ---
  const handleTrainModel = async (modelKey: string, isAuto = false) => {
    if (!edaResult || trainingLoading) return;
    setTrainingLoading(isAuto ? "auto" : modelKey);
    setTrainedModelCard(null);
    setPredictResult(null);
    setPredictInputs({});

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
        return;
      }

      // Generate training report
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

      // Initialize predict inputs
      const featuresList = (isAuto ? data.best_result : data).feature_names || [];
      const initInputs: Record<string, string> = {};
      featuresList.forEach((feat: string) => {
        initInputs[feat] = "0";
      });
      setPredictInputs(initInputs);

      // Refresh saved models and history counts
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

      alert("Model trained successfully!");
    } catch (err) {
      console.error(err);
      alert("Error training model.");
    } finally {
      setTrainingLoading(false);
    }
  };

  // --- Predict on New Inputs ---
  const handlePredict = async (e: FormEvent) => {
    e.preventDefault();
    if (!trainedModelCard || predictLoading) return;
    setPredictLoading(true);
    setPredictResult(null);

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
    } catch (err) {
      console.error(err);
      alert("Error generating prediction.");
    } finally {
      setPredictLoading(false);
    }
  };

  // --- Download Model Binary securely ---
  const handleDownloadModel = async (modelKey: string) => {
    try {
      const res = await fetch(`${API_BASE}/ml/download/${modelKey}`, {
        headers: authHeaders,
      });

      if (!res.ok) {
        alert("Failed to download model. Ensure the model is saved on the server.");
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
    } catch (err) {
      console.error(err);
      alert("Error downloading model.");
    }
  };

  const overview = edaResult?.overview as { rows?: number; columns?: number } | undefined;
  const quality = edaResult?.quality as { score?: number } | undefined;

  return (
    <main className="ops-shell">
      <aside className="ops-sidebar">
        <div className="ops-brand">
          <span>KD</span>
          <div>
            <strong>KoreData</strong>
            <small>Operations</small>
          </div>
        </div>

        <nav className="ops-nav" aria-label="Dashboard sections">
          {[
            ["Overview", Activity],
            ["Upload & EDA", FileUp],
            ["ML Studio", BrainCircuit],
            ["Simulation", GitBranch],
            ["Activity", Gauge],
            ["Notifications", Bell],
            ["Account", UserRound]
          ].map(([label, Icon]) => (
            <a href={`#${String(label).toLowerCase().replaceAll(" ", "-").replace("&", "and")}`} key={String(label)}>
              <Icon size={17} />
              <span>{String(label)}</span>
            </a>
          ))}
        </nav>

        <button className="ops-logout" onClick={logout}>
          <LogOut size={17} />
          Logout
        </button>
      </aside>

      <section className="ops-main">
        <header className="ops-topbar" id="overview">
          <div>
            <span className={`ops-status ${apiStatus}`}>{apiStatus}</span>
            <h1>{loading ? "Loading workspace" : "Python operations dashboard"}</h1>
            <p>{status}</p>
          </div>
          <div className="ops-user">
            <UserRound size={18} />
            <div>
              <strong>{user?.name || "User"}</strong>
              <span>{user?.login_id || "Checking..."}</span>
            </div>
          </div>
        </header>

        <section className="ops-metrics">
          <Metric icon={Database} label="Files" value={files.length} />
          <Metric icon={BrainCircuit} label="ML Models" value={models.length} />
          <Metric icon={FileClock} label="Saved Models" value={savedModels.length} />
          <Metric icon={Bell} label="Notifications" value={notifications.length} />
          <Metric icon={History} label="ML Runs" value={mlHistory.length} />
          <Metric icon={GitBranch} label="Simulation Steps" value={simulationSteps.length} />
        </section>

        <section className="ops-layout">
          {/* UPLOAD & EDA PANEL */}
          <article className="ops-panel ops-upload-panel" id="upload-and-eda">
            <div className="ops-panel-head">
              <div><FileUp size={18} /><span>Upload & EDA Engine</span></div>
              <code>POST /upload</code>
            </div>
            <p>Upload a dataset and let your existing Python `eda_engine.py` produce overview, quality, missing data, and performance metrics.</p>
            <label className="ops-upload">
              {uploading ? <Loader2 className="spin" size={22} /> : <FileUp size={22} />}
              <strong>{uploading ? "Python is analyzing..." : "Choose dataset"}</strong>
              <span>CSV, Excel, JSON, Parquet, XML</span>
              <input type="file" accept=".csv,.xlsx,.xls,.json,.parquet,.xml" onChange={handleUpload} />
            </label>
            <div className="ops-mini-grid">
              <Info label="Rows" value={overview?.rows ?? "-"} />
              <Info label="Columns" value={overview?.columns ?? "-"} />
              <Info label="Quality" value={quality?.score ?? "-"} />
            </div>

            {edaResult && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <WandSparkles size={16} style={{ color: "#00d4ff" }} />
                  <span style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5, color: "#fff" }}>Impute Missing Values</span>
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ fontSize: 11, color: "#9fc9de", display: "block", marginBottom: 4 }}>Select Column</label>
                    <select
                      value={selectedColumn}
                      onChange={(e) => setSelectedColumn(e.target.value)}
                      style={{ width: "100%", padding: 8, background: "rgba(0,8,20,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", fontSize: 13 }}
                    >
                      <option value="" disabled>-- Select Column --</option>
                      {allColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ fontSize: 11, color: "#9fc9de", display: "block", marginBottom: 4 }}>Imputation Strategy</label>
                    <select
                      value={selectedStrategy}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                      style={{ width: "100%", padding: 8, background: "rgba(0,8,20,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", fontSize: 13 }}
                    >
                      <option value="mean">Mean (Numeric columns)</option>
                      <option value="median">Median (Numeric columns)</option>
                      <option value="mode">Mode (Most frequent category)</option>
                      <option value="zero">Fill with Zero / Constant</option>
                    </select>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handleApplyImputation}
                    disabled={cleanLoading || !selectedColumn}
                    style={{ padding: "8px 16px", height: 38 }}
                  >
                    {cleanLoading ? <Loader2 className="spin" size={16} /> : "Impute Data"}
                  </button>
                </div>
              </div>
            )}
          </article>

          {/* PYTHON SANDBOX PANEL */}
          {edaResult && (
            <article className="ops-panel" id="python-sandbox">
              <div className="ops-panel-head">
                <div><Code2 size={18} /><span>Python Code Sandbox</span></div>
                <code>POST /code-run</code>
              </div>
              <p>
                Write safe, server-side Python to transform the loaded dataset. 
                Assign your output dataframe or calculations to the <code>result</code> variable.
              </p>

              <textarea
                value={codeText}
                onChange={(e) => setCodeText(e.target.value)}
                style={{
                  width: "100%",
                  height: 140,
                  fontFamily: "monospace",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  color: "#00d4ff",
                  padding: 10,
                  fontSize: 12,
                  lineHeight: "1.5",
                  resize: "vertical"
                }}
              />

              <div style={{ margin: "12px 0" }}>
                <button
                  className="btn btn-primary"
                  onClick={handleRunCode}
                  disabled={codeRunning}
                >
                  {codeRunning ? (
                    <>
                      <Loader2 className="spin" size={16} style={{ marginRight: 6 }} />
                      Running Script...
                    </>
                  ) : (
                    "Run Code"
                  )}
                </button>
              </div>

              {(consoleOutput || consoleError || consoleResult) && (
                <div
                  style={{
                    background: "#010a15",
                    border: "1px solid rgba(0,212,255,0.25)",
                    borderRadius: 6,
                    padding: 12,
                    fontFamily: "monospace",
                    fontSize: 11
                  }}
                >
                  <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 6, marginBottom: 8, color: "#658ba0", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Console Output
                  </div>
                  
                  {consoleOutput && (
                    <pre style={{ margin: 0, color: "#fff", whiteSpace: "pre-wrap" }}>
                      {consoleOutput}
                    </pre>
                  )}

                  {consoleError && (
                    <pre style={{ margin: "8px 0 0 0", color: "#ff4a4a", whiteSpace: "pre-wrap" }}>
                      {consoleError}
                    </pre>
                  )}

                  {consoleResult && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                      <span style={{ color: "#00ff88", display: "block", marginBottom: 4 }}>Execution Result:</span>
                      <pre style={{ margin: 0, color: "#00ff88", whiteSpace: "pre-wrap", overflowX: "auto" }}>
                        {typeof consoleResult === "string" 
                          ? consoleResult 
                          : JSON.stringify(consoleResult, null, 2).slice(0, 1000) + (JSON.stringify(consoleResult).length > 1000 ? "\n... (truncated)" : "")
                        }
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </article>
          )}

          {/* ML STUDIO PANEL */}
          <article className="ops-panel" id="ml-studio" style={{ gridColumn: "span 2" }}>
            <div className="ops-panel-head">
              <div><BrainCircuit size={18} /><span>ML Studio Console</span></div>
              <code>/ml/*</code>
            </div>

            {!edaResult ? (
              <div className="ops-list">
                {models.slice(0, 6).map((model, index) => (
                  <div key={model.model_key || model.name || index}>
                    <span>{model.model_name || model.name || model.model_key || "Model"}</span>
                    <strong>{model.task_type || model.category || "ready"}</strong>
                  </div>
                ))}
                {!models.length && <p>No model registry data yet. Backend endpoint: `/ml/models`.</p>}
              </div>
            ) : (
              <div>
                <p>
                  Perform AI modeling on your clean dataset. Choose a target column, describe your prediction goal, or let our AI auto-train models.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, margin: "16px 0" }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#9fc9de", display: "block", marginBottom: 4 }}>Target Column</label>
                    <select
                      value={targetCol}
                      onChange={(e) => setTargetCol(e.target.value)}
                      style={{ width: "100%", padding: 8, background: "rgba(0,8,20,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", fontSize: 13 }}
                    >
                      {allColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: "#9fc9de", display: "block", marginBottom: 4 }}>Task Type</label>
                    <select
                      value={taskHint}
                      onChange={(e) => setTaskHint(e.target.value)}
                      style={{ width: "100%", padding: 8, background: "rgba(0,8,20,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", fontSize: 13 }}
                    >
                      <option value="auto-detect">Auto-detect from target data</option>
                      <option value="classification">Classification (Categories)</option>
                      <option value="regression">Regression (Continuous values)</option>
                      <option value="clustering">Clustering (Groups)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: "#9fc9de", display: "block", marginBottom: 4 }}>Describe prediction goal (Optional)</label>
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="e.g. predict pricing using features like room count and square footage"
                    style={{ width: "100%", height: 50, padding: 8, background: "rgba(0,8,20,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", fontSize: 12, resize: "none" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleGetRecommendations}
                    disabled={mlRecommendLoading}
                  >
                    {mlRecommendLoading ? <Loader2 className="spin" size={16} /> : "Get Recommendations"}
                  </button>

                  <button
                    className="btn"
                    onClick={() => handleTrainModel("", true)}
                    disabled={trainingLoading !== false}
                  >
                    {trainingLoading === "auto" ? <Loader2 className="spin" size={16} /> : "Auto-Train Best Model"}
                  </button>
                </div>

                {recommendationData && (
                  <div style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 8, padding: 16, marginBottom: 20 }}>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#00d4ff", display: "flex", alignItems: "center", gap: 6 }}>
                      <Sparkles size={16} />
                      AI Model Recommendations
                    </h3>
                    <p style={{ margin: "0 0 16px 0", fontSize: 12, color: "#d9f3ff", lineHeight: 1.5 }}>
                      {recommendationData.explanation || recommendationData.prompt_note}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {recommendationData.recommendations?.slice(0, 4).map((rec: any) => {
                        const isThisTraining = trainingLoading === rec.model_key;
                        return (
                          <div
                            key={rec.model_key}
                            style={{
                              background: "rgba(255,255,255,0.02)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 6,
                              padding: 12,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 12
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <strong style={{ color: "#fff", fontSize: 13 }}>{rec.name}</strong>
                                <span style={{ fontSize: 10, background: "rgba(255,255,255,0.1)", padding: "1px 6px", borderRadius: 10, color: "#9fc9de" }}>
                                  {rec.speed}
                                </span>
                              </div>
                              <div style={{ fontSize: 11, color: "#658ba0", marginTop: 4 }}>
                                {rec.category} • Score: <strong style={{ color: "#00ff88" }}>{rec.score}/100</strong>
                              </div>
                              {rec.warnings?.map((warn: string, i: number) => (
                                <div key={i} style={{ fontSize: 10, color: "#ff4a4a", marginTop: 2 }}>
                                  ⚠️ {warn}
                                </div>
                              ))}
                            </div>

                            <button
                              className="btn btn-primary"
                              onClick={() => handleTrainModel(rec.model_key)}
                              disabled={trainingLoading !== false}
                              style={{ padding: "6px 12px", fontSize: 12 }}
                            >
                              {isThisTraining ? <Loader2 className="spin" size={14} /> : "Train Model"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {trainedModelCard && (
                  <div style={{ background: "rgba(0,255,136,0.03)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 8, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                      <div>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: 14, color: "#00ff88", display: "flex", alignItems: "center", gap: 6 }}>
                          <ShieldCheck size={16} />
                          Model Training Report
                        </h3>
                        <span style={{ fontSize: 12, color: "#d9f3ff" }}>
                          Model: <strong>{trainedModelCard.rawResult.model_name}</strong>
                        </span>
                      </div>
                      
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, background: "rgba(0,255,136,0.1)", color: "#00ff88", fontWeight: "bold" }}>
                          Grade: {trainedModelCard.report?.grade || "A"}
                        </span>
                        {trainedModelCard.report?.deploy_ready && (
                          <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, background: "rgba(0,212,255,0.1)", color: "#00d4ff", fontWeight: "bold" }}>
                            Deploy Ready
                          </span>
                        )}
                      </div>
                    </div>

                    <p style={{ margin: "0 0 16px 0", fontSize: 12, color: "#9fc9de", lineHeight: 1.5 }}>
                      {trainedModelCard.report?.summary}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
                      {Object.keys(trainedModelCard.rawResult.metrics || {}).map((mKey) => (
                        <div key={mKey} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 6, padding: 8, textAlign: "center" }}>
                          <span style={{ fontSize: 10, color: "#658ba0", display: "block" }}>{mKey.toUpperCase().replace("_", " ")}</span>
                          <strong style={{ fontSize: 14, color: "#fff" }}>{trainedModelCard.rawResult.metrics[mKey]}</strong>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleDownloadModel(trainedModelCard.rawResult.model_key)}
                        style={{ padding: "6px 12px", fontSize: 12 }}
                      >
                        Download Model (.joblib)
                      </button>
                    </div>

                    {trainedModelCard.rawResult.feature_names && trainedModelCard.rawResult.feature_names.length > 0 && (
                      <form onSubmit={handlePredict} style={{ marginTop: 16, borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: 16 }}>
                        <strong style={{ color: "#00d4ff", display: "block", marginBottom: 8, fontSize: 13 }}>Run Real-time Inference</strong>
                        <p style={{ margin: "0 0 12px 0", fontSize: 11, color: "#9fc9de" }}>
                          Enter feature values below to query the trained model.
                        </p>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 12 }}>
                          {trainedModelCard.rawResult.feature_names.map((feat: string) => (
                            <div key={feat}>
                              <label style={{ fontSize: 10, color: "#658ba0", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={feat}>
                                {feat}
                              </label>
                              <input
                                type="text"
                                value={predictInputs[feat] || "0"}
                                onChange={(e) => setPredictInputs({ ...predictInputs, [feat]: e.target.value })}
                                style={{ width: "100%", padding: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#fff", fontSize: 12 }}
                                required
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          className="btn btn-primary"
                          type="submit"
                          disabled={predictLoading}
                          style={{ padding: "6px 12px", fontSize: 12 }}
                        >
                          {predictLoading ? <Loader2 className="spin" size={14} /> : "Run Inference"}
                        </button>

                        {predictResult && (
                          <div style={{ marginTop: 12, padding: 10, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: 6 }}>
                            <span style={{ fontSize: 11, color: "#00ff88", display: "block", fontWeight: "bold" }}>Model Prediction:</span>
                            <strong style={{ fontSize: 18, color: "#fff", display: "block", margin: "4px 0" }}>
                              {predictResult.predictions?.[0]}
                            </strong>
                            {predictResult.probabilities?.[0] && (
                              <div style={{ fontSize: 10, color: "#9fc9de", marginTop: 4 }}>
                                Probabilities: {JSON.stringify(predictResult.probabilities[0])}
                              </div>
                            )}
                          </div>
                        )}
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </article>

          {/* SIMULATION WORKING MECHANISM PANEL */}
          <article className="ops-panel" id="simulation">
            <div className="ops-panel-head">
              <div><GitBranch size={18} /><span>Working Mechanism</span></div>
              <code>/simulation/run</code>
            </div>
            <p>
              Trigger a Server-Sent Events (SSE) stream simulating the end-to-end dataset pipeline.
            </p>

            <div style={{ margin: "16px 0", display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                className="btn btn-primary"
                onClick={handleStartSimulation}
                disabled={simRunning}
              >
                {simRunning ? (
                  <>
                    <Loader2 className="spin" size={16} style={{ marginRight: 6 }} />
                    Running SSE Pipeline...
                  </>
                ) : (
                  <>
                    <Play size={16} style={{ marginRight: 6 }} />
                    Run Simulation Pipeline
                  </>
                )}
              </button>

              {simRunning && (
                <span className="live-dot" style={{ backgroundColor: "#00ff88" }} />
              )}
            </div>

            {simRunning && (
              <div className="sim-progress-container" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                  <span>Pipeline Progress</span>
                  <strong>{simProgress}%</strong>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${simProgress}%`, height: "100%", background: "#00d4ff", transition: "width 0.3s ease" }} />
                </div>
              </div>
            )}

            {simCompletedAt && (
              <div className="auth-alert auth-success" style={{ margin: "10px 0" }}>
                Pipeline completed successfully at {new Date(simCompletedAt).toLocaleTimeString()}
              </div>
            )}

            <div className="ops-timeline">
              {(simulationSteps.length ? simulationSteps : []).map((step, index) => {
                const key = typeof step === "string" ? step : step.key || `step-${index}`;
                const label = typeof step === "string" ? step : step.label || key;
                const description = typeof step === "string" ? "" : step.description || "";
                
                const status = activeStepStatus[key] || "idle";
                const isCurrent = currentStepIndex === index;
                const isDone = currentStepIndex !== null && index < currentStepIndex;

                let statusText = "Idle";
                let color = "#658ba0";
                if (status === "running" || isCurrent) {
                  statusText = "Running";
                  color = "#00d4ff";
                } else if (status === "done" || isDone || simCompletedAt) {
                  statusText = "Completed";
                  color = "#00ff88";
                }

                return (
                  <div
                    key={`${key}-${index}`}
                    style={{
                      opacity: isCurrent ? 1 : 0.8,
                      borderLeft: isCurrent ? "2px solid #00d4ff" : "2px solid rgba(255,255,255,0.1)",
                      paddingLeft: 12,
                      marginLeft: 2,
                      marginBottom: 16,
                      position: "relative"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: 11, color }}>{String(index + 1).padStart(2, "0")}</span>
                      <strong style={{ color: isCurrent ? "#ffffff" : "#d9f3ff" }}>{label}</strong>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: isCurrent ? "rgba(0,212,255,0.1)" : isDone || simCompletedAt ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.05)",
                          color
                        }}
                      >
                        {statusText}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#9fc9de" }}>{description}</p>
                  </div>
                );
              })}
            </div>
          </article>

          {/* ACTIVITY TRACKING */}
          <article className="ops-panel" id="activity">
            <div className="ops-panel-head">
              <div><Activity size={18} /><span>Activity Tracking</span></div>
              <code>/activity/dashboard</code>
            </div>
            <div className="ops-mini-grid">
              <Info label="Today Active" value={activity?.today_active || "-"} />
              <Info label="Total Active" value={activity?.total_active || "-"} />
              <Info label="Logins" value={activity?.login_count ?? "-"} />
            </div>
          </article>

          {/* NOTIFICATIONS PANEL */}
          <article className="ops-panel" id="notifications">
            <div className="ops-panel-head">
              <div><Bell size={18} /><span>Notifications</span></div>
              <code>GET /notifications</code>
            </div>
            <div className="ops-list">
              {notifications.slice(0, 5).map((item) => (
                <div key={item.id}>
                  <span>{item.message}</span>
                  <strong>{item.type || "info"}</strong>
                </div>
              ))}
              {!notifications.length && <p>No notifications yet.</p>}
            </div>
          </article>

          {/* ACCOUNT PANEL */}
          <article className="ops-panel" id="account">
            <div className="ops-panel-head">
              <div><ShieldCheck size={18} /><span>Secure Account</span></div>
              <code>GET /me</code>
            </div>
            <div className="ops-list">
              <div><span>Login ID</span><strong>{user?.login_id || "-"}</strong></div>
              <div><span>Name</span><strong>{user?.name || "-"}</strong></div>
              <div><span>Email</span><strong>{user?.email || "-"}</strong></div>
              <div><span>Token</span><strong>{token ? "verified" : "missing"}</strong></div>
            </div>
          </article>
        </section>

        {/* OPERATIONS CATALOG */}
        <section className="ops-panel ops-all-operations">
          <div className="ops-panel-head">
            <div><Layers3 size={18} /><span>All Python Operations</span></div>
            <code>backend/*.py</code>
          </div>
          <div className="ops-operation-grid">
            {operations.map(([title, endpoint, description, Icon]) => (
              <div className="ops-operation" key={title}>
                <Icon size={18} />
                <strong>{title}</strong>
                <code>{endpoint}</code>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string | number }) {
  return (
    <article className="ops-metric">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="ops-info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
