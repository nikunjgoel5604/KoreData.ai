"use client";

import { useEffect, useState, useRef } from "react";
import {
  Bell,
  Moon,
  Search,
  Sun,
  ChevronDown,
  Sparkles,
  Database,
  History,
  Settings,
  Star,
  Plus,
  Folder,
  X
} from "lucide-react";
import { useWorkspace } from "./WorkspaceContext";

type Theme = "dark" | "light";

export default function TopBar() {
  const [theme, setTheme] = useState<Theme>("dark");
  const {
    assistantOpen,
    setAssistantOpen,
    simRunning,
    notificationsOpen,
    setNotificationsOpen,
    activeWorkspace,
    changeWorkspace,
    projects,
    openSection,
    setProjectsFilter
  } = useWorkspace();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("koredata-theme") as Theme | null;
    const next = saved === "light" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  // Keyboard shortcut Ctrl+K to toggle switcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSwitcherOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close switcher
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("koredata-theme", next);
  };

  // Determine active project label
  const activeProj = projects.find((p) => p.id === activeWorkspace);
  const activeLabel = activeProj ? activeProj.name : "My Projects";

  // Filter projects for switcher list
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favorites = filteredProjects.filter((p) => p.isFavorite);
  const personal = filteredProjects.filter((p) => !p.isSample);
  const samples = filteredProjects.filter((p) => p.isSample);

  const statusText = simRunning ? "RUNNING" : "READY";
  const statusClass = simRunning ? "running" : "ready";

  return (
    <header className="ws-topbar" style={{ position: "relative", zIndex: 900 }}>
      {/* Left Section: Workspace Selector & Status Badge */}
      <div className="ws-topbar-left" style={{ position: "relative" }} ref={switcherRef}>
        <div className="ws-workspace-selector-container">
          <div
            className="ws-workspace-selector"
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "var(--ws-workspace)", borderRadius: 10, border: "1px solid var(--ws-border)" }}
            onClick={() => setSwitcherOpen(!switcherOpen)}
          >
            <Database size={16} className="ws-workspace-selector-icon" style={{ color: "var(--ws-accent)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ws-text)" }}>
              {activeLabel}
            </span>
            <ChevronDown size={14} className="ws-workspace-selector-arrow" style={{ opacity: 0.7 }} />
          </div>
        </div>

        {/* Project Switcher Dropdown Popup */}
        {switcherOpen && (
          <div
            className="ws-card-2"
            style={{
              position: "absolute",
              top: "110%",
              left: 0,
              width: 320,
              maxHeight: 480,
              background: "var(--ws-card)",
              border: "1px solid var(--ws-border)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              borderRadius: 14,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              zIndex: 9999
            }}
          >
            <div className="ws-row-between" style={{ borderBottom: "1px solid var(--ws-border)", paddingBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ws-text)" }}>Switch Workspace</span>
              <kbd style={{ fontSize: 10, background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, color: "var(--ws-text-muted)" }}>
                Ctrl + K
              </kbd>
            </div>

            {/* Search input inside switcher */}
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ws-text-muted)" }} />
              <input
                type="text"
                autoFocus
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: 34,
                  padding: "0 12px 0 32px",
                  background: "var(--ws-workspace)",
                  border: "1px solid var(--ws-border)",
                  borderRadius: 8,
                  color: "var(--ws-text)",
                  fontSize: 12,
                  outline: "none"
                }}
              />
            </div>

            {/* Scrollable projects list */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, maxHeight: 280, paddingRight: 4 }}>
              {/* Favorites */}
              {favorites.length > 0 && (
                <div>
                  <small style={{ fontSize: 9, fontWeight: 700, color: "var(--ws-accent)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Favorites
                  </small>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {favorites.map((p) => (
                      <div
                        key={`fav-${p.id}`}
                        onClick={() => {
                          changeWorkspace(p.id);
                          setSwitcherOpen(false);
                          openSection("dashboard");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          borderRadius: 6,
                          cursor: "pointer",
                          background: activeWorkspace === p.id ? "rgba(255,255,255,0.06)" : "transparent"
                        }}
                        className="ws-switcher-item-hover"
                      >
                        <span style={{ fontSize: 12, fontWeight: 550, color: "var(--ws-text)" }}>{p.name}</span>
                        <Star size={12} fill="#EAB308" color="#EAB308" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Workspaces */}
              {personal.length > 0 && (
                <div>
                  <small style={{ fontSize: 9, fontWeight: 700, color: "var(--ws-text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Personal Projects
                  </small>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {personal.map((p) => (
                      <div
                        key={`pers-${p.id}`}
                        onClick={() => {
                          changeWorkspace(p.id);
                          setSwitcherOpen(false);
                          openSection("dashboard");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "6px 10px",
                          borderRadius: 6,
                          cursor: "pointer",
                          background: activeWorkspace === p.id ? "rgba(255,255,255,0.06)" : "transparent",
                          fontSize: 12,
                          fontWeight: 550,
                          color: "var(--ws-text)"
                        }}
                        className="ws-switcher-item-hover"
                      >
                        <Folder size={12} style={{ marginRight: 8, opacity: 0.6 }} />
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Dashboards */}
              {samples.length > 0 && (
                <div>
                  <small style={{ fontSize: 9, fontWeight: 700, color: "var(--ws-text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Sample Dashboards
                  </small>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {samples.map((p) => (
                      <div
                        key={`sample-${p.id}`}
                        onClick={() => {
                          changeWorkspace(p.id);
                          setSwitcherOpen(false);
                          openSection("dashboard");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "6px 10px",
                          borderRadius: 6,
                          cursor: "pointer",
                          background: activeWorkspace === p.id ? "rgba(255,255,255,0.06)" : "transparent",
                          fontSize: 12,
                          fontWeight: 550,
                          color: "var(--ws-text)"
                        }}
                        className="ws-switcher-item-hover"
                      >
                        <Database size={12} style={{ marginRight: 8, opacity: 0.6 }} />
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ borderTop: "1px solid var(--ws-border)", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                className="ws-btn ws-btn-secondary"
                onClick={() => {
                  setSwitcherOpen(false);
                  setProjectsFilter("all");
                  openSection("projects");
                }}
                style={{ height: 28, padding: "0 10px", fontSize: 10, borderRadius: 6 }}
              >
                Manage All
              </button>
              <button
                type="button"
                className="ws-btn ws-btn-primary"
                onClick={() => {
                  setSwitcherOpen(false);
                  setProjectsFilter("all");
                  openSection("projects");
                  // Trigger redirect to project listing page
                }}
                style={{ height: 28, padding: "0 10px", fontSize: 10, borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}
              >
                <Plus size={10} />
                New Project
              </button>
            </div>
          </div>
        )}

        <span className={`ws-status-badge-header ${statusClass}`}>
          <span className="ws-status-bullet-header" />
          {statusText}
        </span>
      </div>

      {/* Center Section: Global Search Bar */}
      <div className="ws-search">
        <div className="ws-search-inner">
          <Search size={16} className="ws-search-icon" />
          <input placeholder="Search datasets, columns, reports, models..." />
          <span className="ws-search-kbd">Ctrl + K</span>
        </div>
      </div>

      {/* Right Section: Action Controls & User Account Menu */}
      <div className="ws-topbar-actions">
        <button
          type="button"
          className={`ws-icon-btn ${assistantOpen ? "active" : ""}`}
          aria-label="Toggle AI Assistant"
          onClick={() => setAssistantOpen(!assistantOpen)}
        >
          <Sparkles size={18} />
        </button>

        <button
          type="button"
          className={`ws-icon-btn ${notificationsOpen ? "active" : ""}`}
          aria-label="Notifications"
          onClick={() => setNotificationsOpen(!notificationsOpen)}
        >
          <Bell size={18} />
          <span className="ws-badge">5</span>
        </button>

        <button type="button" className="ws-icon-btn" aria-label="Recent Activity">
          <History size={18} />
        </button>

        <button type="button" className="ws-icon-btn" aria-label="Toggle theme" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button type="button" className="ws-icon-btn" aria-label="Settings">
          <Settings size={18} />
        </button>

        <div className="ws-profile-menu">
          <div className="ws-profile-avatar">NG</div>
          <div className="ws-profile-meta">
            <strong>Nikunj Goel</strong>
            <span>Data Scientist</span>
          </div>
          <ChevronDown size={14} className="ws-profile-arrow" />
        </div>
      </div>
    </header>
  );
}
