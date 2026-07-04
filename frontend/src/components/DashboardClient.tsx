"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
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
  WandSparkles
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
          setSavedModels(data.models || data.saved || []);
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

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setEdaResult(null);
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
          </article>

          <article className="ops-panel" id="ml-studio">
            <div className="ops-panel-head">
              <div><BrainCircuit size={18} /><span>ML Studio</span></div>
              <code>/ml/*</code>
            </div>
            <div className="ops-list">
              {models.slice(0, 6).map((model, index) => (
                <div key={model.model_key || model.name || index}>
                  <span>{model.model_name || model.name || model.model_key || "Model"}</span>
                  <strong>{model.task_type || model.category || "ready"}</strong>
                </div>
              ))}
              {!models.length && <p>No model registry data yet. Backend endpoint: `/ml/models`.</p>}
            </div>
          </article>

          <article className="ops-panel" id="simulation">
            <div className="ops-panel-head">
              <div><GitBranch size={18} /><span>Working Mechanism</span></div>
              <code>/simulation/steps</code>
            </div>
            <div className="ops-timeline">
              {(simulationSteps.length ? simulationSteps : ["Upload", "Clean", "EDA", "ML", "Report"]).slice(0, 8).map((step, index) => {
                const label = typeof step === "string" ? step : step.label || step.key || `Step ${index + 1}`;
                const description = typeof step === "string" ? "" : step.description || step.section || "";

                return (
                <div key={`${label}-${index}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{label}{description ? ` - ${description}` : ""}</strong>
                </div>
                );
              })}
            </div>
          </article>

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
