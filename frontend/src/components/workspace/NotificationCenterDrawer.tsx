"use client";

import React, { useState } from "react";
import { useWorkspace } from "./WorkspaceContext";
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Sparkles,
  Play,
  Clock,
  Search,
  Filter,
  Check,
  Trash2,
  Pin,
  Archive,
  ArrowRight,
  Loader2
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: "success" | "warning" | "error" | "info" | "ai" | "task";
  priority: "critical" | "high" | "medium" | "low";
  read: boolean;
  pinned?: boolean;
}

export default function NotificationCenterDrawer({ onClose }: { onClose: () => void }) {
  const { notifications, openSection } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "ai" | "errors" | "tasks">("all");

  // Local notifications mock list with realistic enterprise alerts
  const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "Model Training Completed",
      desc: "Random Forest Classifier successfully fitted on sales_2025.csv.",
      time: "2 mins ago",
      type: "success",
      priority: "high",
      read: false,
      pinned: true
    },
    {
      id: "2",
      title: "Data Imputation Recommendation",
      desc: "AI detected 12.4% missing cells in target label. Impute with median.",
      time: "10 mins ago",
      type: "ai",
      priority: "medium",
      read: false
    },
    {
      id: "3",
      title: "Failed SQL Migration Task",
      desc: "Syntax error on query: column 'client_id' does not exist in dataset schema.",
      time: "32 mins ago",
      type: "error",
      priority: "critical",
      read: false
    },
    {
      id: "4",
      title: "Workspace Config Saved",
      desc: "Role permissions and API token settings updated successfully.",
      time: "1 hour ago",
      type: "info",
      priority: "low",
      read: true
    },
    {
      id: "5",
      title: "Outlier Anomaly Warning",
      desc: "EDA flagged 42 values outside 3x standard deviation threshold.",
      time: "2 hours ago",
      type: "warning",
      priority: "high",
      read: true
    }
  ]);

  // Running Background Jobs
  const [backgroundJobs, setBackgroundJobs] = useState([
    { name: "EDA Analysis", progress: 72, eta: "1m 15s" },
    { name: "Training XGBoost Model", progress: 45, eta: "3m 45s" },
    { name: "Compiling Executive PDF Report", progress: 90, eta: "12s" }
  ]);

  // Quick action triggers
  const handleMarkAllRead = () => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handleTogglePin = (id: string) => {
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const handleDelete = (id: string) => {
    setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleCancelJob = (jobName: string) => {
    setBackgroundJobs((prev) => prev.filter((j) => j.name !== jobName));
    alert(`Cancelled job: ${jobName}`);
  };

  // Filter & Search logic
  const filtered = localNotifications.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.desc.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === "unread") return !n.read;
    if (activeFilter === "ai") return n.type === "ai";
    if (activeFilter === "errors") return n.type === "error";
    if (activeFilter === "tasks") return n.type === "task";

    return true;
  });

  const getPriorityStyle = (priority: NotificationItem["priority"]) => {
    switch (priority) {
      case "critical":
        return { bg: "rgba(239, 68, 68, 0.15)", text: "#EF4444", label: "Critical" };
      case "high":
        return { bg: "rgba(245, 158, 11, 0.15)", text: "#F97316", label: "High" };
      case "medium":
        return { bg: "rgba(59, 130, 246, 0.15)", text: "#3B82F6", label: "Medium" };
      case "low":
        return { bg: "rgba(100, 116, 139, 0.15)", text: "#94A3B8", label: "Low" };
    }
  };

  const getTypeIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={16} style={{ color: "#22C55E" }} />;
      case "warning":
        return <AlertTriangle size={16} style={{ color: "#F59E0B" }} />;
      case "error":
        return <XCircle size={16} style={{ color: "#EF4444" }} />;
      case "ai":
        return <Sparkles size={16} style={{ color: "#8B5CF6" }} />;
      case "task":
        return <Loader2 size={16} className="animate-spin" style={{ color: "#06B6D4" }} />;
      default:
        return <Info size={16} style={{ color: "#3B82F6" }} />;
    }
  };

  return (
    <>
      {/* Background Overlay */}
      <div className="ws-drawer-backdrop" onClick={onClose} />

      {/* Main Slide-out Panel */}
      <aside className="ws-drawer">
        {/* Header Block */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--ws-border)",
            background: "var(--ws-topnav)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "color-mix(in srgb, var(--ws-blue) 12%, transparent)",
                color: "var(--ws-blue)",
                display: "grid",
                placeItems: "center"
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--ws-text)" }}>
                Notification Hub
              </h2>
              <span style={{ fontSize: 11, color: "var(--ws-text-muted)" }}>
                Keep track of jobs and project status
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ws-text-muted)" }}
            title="Close Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters and Controls */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ws-border)", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Quick Actions Row */}
          <div className="ws-row-between">
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { id: "all", label: "All" },
                { id: "unread", label: "Unread" },
                { id: "ai", label: "AI Suggestions" }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id as any)}
                  className="ws-btn"
                  style={{
                    fontSize: 10,
                    padding: "4px 10px",
                    height: "auto",
                    minWidth: "auto",
                    borderRadius: 6,
                    background: activeFilter === f.id ? "var(--ws-blue)" : "color-mix(in srgb, var(--ws-text) 3%, transparent)",
                    color: activeFilter === f.id ? "#FFFFFF" : "var(--ws-text-muted)",
                    borderColor: activeFilter === f.id ? "var(--ws-blue)" : "var(--ws-border)"
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{
                fontSize: 11,
                color: "var(--ws-blue)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              Mark all read
            </button>
          </div>

          {/* Search bar */}
          <div className="ws-search-inner" style={{ background: "var(--ws-card-2)" }}>
            <Search size={14} className="ws-search-icon" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notifications..."
              style={{ padding: "6px 8px" }}
            />
          </div>
        </div>

        {/* Scrollable Contents: Background Tasks, Timeline, Notifications */}
        <div className="ws-scroll" style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Running Background Jobs */}
          {backgroundJobs.length > 0 && (
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--ws-text-muted)", textTransform: "uppercase", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <Loader2 size={12} className="animate-spin" style={{ color: "var(--ws-accent)" }} /> Active Background Jobs
              </h3>
              <div style={{ display: "grid", gap: 10 }}>
                {backgroundJobs.map((job) => (
                  <div
                    key={job.name}
                    className="ws-card-2"
                    style={{ padding: 12, background: "var(--ws-card-2)", border: "1px solid var(--ws-border)", borderRadius: 12 }}
                  >
                    <div className="ws-row-between" style={{ marginBottom: 6 }}>
                      <strong style={{ fontSize: 12, color: "var(--ws-text)" }}>{job.name}</strong>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, color: "var(--ws-text-muted)" }}>ETA: {job.eta}</span>
                        <button
                          type="button"
                          onClick={() => handleCancelJob(job.name)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--ws-danger)",
                            fontSize: 10,
                            padding: 0
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="ws-quality-bar-track" style={{ flex: 1, height: 6 }}>
                        <div className="ws-quality-bar-fill" style={{ width: `${job.progress}%`, height: "100%" }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ws-blue)", minWidth: 28, textAlign: "right" }}>
                        {job.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflow Timeline Track */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--ws-text-muted)", textTransform: "uppercase", margin: "0 0 14px" }}>
              Workspace Workflow Timeline
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingLeft: 12, borderLeft: "2px solid var(--ws-border)", marginLeft: 8 }}>
              {[
                { time: "10:20 AM", text: "Dataset sales_2025.csv uploaded" },
                { time: "10:22 AM", text: "EDA quality profiling completed" },
                { time: "10:25 AM", text: "Linear correlation matrix generated" },
                { time: "10:28 AM", text: "Random Forest classifier trained" }
              ].map((step, idx) => (
                <div key={idx} style={{ position: "relative", paddingBottom: 16 }}>
                  {/* Timeline point bullet */}
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      left: -19,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: idx === 3 ? "var(--ws-blue)" : "var(--ws-border)",
                      border: "2px solid var(--ws-bg)",
                      boxShadow: idx === 3 ? "0 0 8px var(--ws-blue)" : "none"
                    }}
                  />
                  <div style={{ fontSize: 12, color: "var(--ws-text)" }}>{step.text}</div>
                  <small style={{ fontSize: 10, color: "var(--ws-text-muted)" }}>{step.time}</small>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts Timeline List */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--ws-text-muted)", textTransform: "uppercase", margin: "0 0 10px" }}>
              Alerts & Notifications
            </h3>
            <div style={{ display: "grid", gap: 10 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "var(--ws-text-muted)", fontSize: 12 }}>
                  No matching notifications found.
                </div>
              ) : (
                filtered.map((item) => {
                  const pStyle = getPriorityStyle(item.priority);
                  return (
                    <div
                      key={item.id}
                      className="ws-card-2"
                      style={{
                        padding: 14,
                        background: item.read ? "color-mix(in srgb, var(--ws-card-2) 60%, transparent)" : "var(--ws-card-2)",
                        border: "1px solid var(--ws-border)",
                        borderRadius: 12,
                        position: "relative",
                        display: "flex",
                        gap: 12,
                        opacity: item.read ? 0.75 : 1,
                        transition: "all 0.2s ease"
                      }}
                    >
                      {/* Left: Icon matching type */}
                      <div style={{ marginTop: 2 }}>{getTypeIcon(item.type)}</div>

                      {/* Content */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                        <div className="ws-row-between">
                          <strong style={{ fontSize: 12, color: "var(--ws-text)" }}>{item.title}</strong>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: pStyle.text,
                              background: pStyle.bg,
                              padding: "2px 6px",
                              borderRadius: 4
                            }}
                          >
                            {pStyle.label}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--ws-text-2)", lineHeight: 1.4 }}>
                          {item.desc}
                        </p>
                        <span style={{ fontSize: 10, color: "var(--ws-text-muted)", marginTop: 4 }}>
                          {item.time}
                        </span>

                        {/* Inline Actions */}
                        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleToggleRead(item.id)}
                            style={{
                              fontSize: 10,
                              color: "var(--ws-blue)",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              padding: 0
                            }}
                          >
                            {item.read ? "Mark Unread" : "Mark Read"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePin(item.id)}
                            style={{
                              fontSize: 10,
                              color: item.pinned ? "var(--ws-ai)" : "var(--ws-text-muted)",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                              gap: 2
                            }}
                          >
                            <Pin size={8} /> {item.pinned ? "Pinned" : "Pin"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            style={{
                              fontSize: 10,
                              color: "var(--ws-danger)",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                              gap: 2
                            }}
                          >
                            <Trash2 size={8} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
