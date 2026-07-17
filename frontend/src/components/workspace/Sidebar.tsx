"use client";

import { useState, useEffect } from "react";
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  LogOut, 
  Settings2,
  Database,
  LayoutGrid,
  Folder,
  Star,
  Share2,
  Layout,
  Users,
  User,
  Settings,
  UploadCloud,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  FolderOpen
} from "lucide-react";
import { NAV_GROUPS, SECTION_REGISTRY } from "./sections";
import { useWorkspace } from "./WorkspaceContext";

const SIDEBAR_TEMPLATES = [
  { key: "blank", label: "Blank Project" },
  { key: "sales", label: "Sales Analytics" },
  { key: "finance", label: "Finance Analytics" },
  { key: "churn", label: "Customer Churn" },
  { key: "marketing", label: "Marketing Campaign" },
  { key: "manufacturing", label: "Manufacturing" },
  { key: "retail", label: "Retail Analytics" },
  { key: "healthcare", label: "Healthcare" },
  { key: "custom", label: "Custom Template" }
];

export default function Sidebar() {
  const { 
    activeTab, 
    openSection,
    sidebarCollapsed,
    setSidebarCollapsed,
    edaResult,
    simRunning,
    simProgress,
    activeWorkspace,
    changeWorkspace,
    projects,
    projectsFilter,
    setProjectsFilter,
    toggleFavoriteProject,
    createProjectFromTemplate
  } = useWorkspace();

  // Expanded menus states stored in localStorage
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("koredata-sidebar-expanded-menus");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      myProjects: true,
      favorites: false,
      shared: false,
      templates: false,
      samples: false
    };
  });

  // User Profile Menu Popup State
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (typeof window !== "undefined") {
        localStorage.setItem("koredata-sidebar-expanded-menus", JSON.stringify(next));
      }
      return next;
    });
  };

  const toggleTheme = () => {
    const saved = window.localStorage.getItem("koredata-theme");
    const next = saved === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("koredata-theme", next);
  };

  const workspaceLabels = {
    sales: "Sales Analysis Q2",
    churn: "Customer Churn Prediction",
    marketing: "Marketing Campaign ROI",
    revenue: "Revenue Forecasting",
    custom: "Personal Sandbox"
  };
  const activeProj = projects.find(p => p.id === activeWorkspace);
  const activeWorkspaceLabel = activeProj ? activeProj.name : (workspaceLabels[activeWorkspace as keyof typeof workspaceLabels] || "My Projects");

  const datasetName = edaResult?.overview?.dataset_name || "sales_q2.csv";
  const workspaceStatus = simRunning ? "Running" : (edaResult ? "Active" : "Idle");
  const progressPercent = simRunning ? simProgress : (edaResult ? 100 : 0);

  const handleLogout = () => {
    window.localStorage.removeItem("koredata-token");
    window.location.href = "/login";
  };

  // Sub-items computed lists
  const favoriteProjects = projects.filter((p) => p.isFavorite);
  const sharedProjects = projects.filter((p) => p.sharedBy);
  const sampleProjects = projects.filter((p) => p.isSample);

  return (
    <aside className="ws-sidebar" data-collapsed={sidebarCollapsed} style={{ position: "relative" }}>
      {/* Logo Header Area */}
      <div className="ws-logo">
        <div className="ws-logo-mark">
          <svg width="38" height="38" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 24V11L4 9" stroke="var(--ws-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="4" cy="9" r="1.8" fill="var(--ws-accent)"/>
            <path d="M9 24V7" stroke="var(--ws-text)" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="1.8" fill="var(--ws-accent)"/>
            <path d="M12 24V7" stroke="var(--ws-text)" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="12" cy="7" r="1.8" fill="var(--ws-accent)"/>
            <path d="M9 16L18 9" stroke="var(--ws-text)" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="18" cy="9" r="1.8" fill="var(--ws-accent)"/>
            <path d="M9 16L18 23" stroke="var(--ws-text)" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="18" cy="23" r="1.8" fill="var(--ws-accent)"/>
            <path d="M14 6C21 6 25 9.5 25 16C25 22.5 21 26 14 26" stroke="var(--ws-text)" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="20" y1="12" x2="28" y2="12" stroke="var(--ws-text)" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="28" cy="12" r="1.2" fill="var(--ws-accent)"/>
            <line x1="21" y1="14.5" x2="29" y2="14.5" stroke="var(--ws-text)" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="29" cy="14.5" r="1.2" fill="var(--ws-accent)"/>
            <line x1="21" y1="17.5" x2="29" y2="17.5" stroke="var(--ws-text)" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="29" cy="17.5" r="1.2" fill="var(--ws-accent)"/>
            <line x1="20" y1="20" x2="28" y2="20" stroke="var(--ws-text)" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="28" cy="20" r="1.2" fill="var(--ws-accent)"/>
          </svg>
        </div>
        {!sidebarCollapsed && (
          <div className="ws-logo-text">
            <svg className="ws-brand-title-svg" width="177" height="26" viewBox="0 0 177 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
              <g stroke="var(--ws-accent)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 4 4 V 24 M 4 14 L 13 4 M 4 14 L 13 24" />
                <path d="M 31 14 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0" />
                <path d="M 50 4 V 24 M 50 4 H 56 C 59.5 4 61.5 5.5 61.5 9 C 61.5 12.5 56 14 53 14 H 50 M 56 14 L 62 24" />
                <path d="M 73 6 H 82 M 73 14 H 82 M 73 22 H 82" />
              </g>
              <g stroke="var(--ws-text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 93 4 V 24 M 93 4 H 99 C 104 4 106.5 7.5 106.5 14 C 106.5 20.5 104 24 99 24 H 93" />
                <path d="M 117 24 L 123 4 L 129 24" />
                <path d="M 140 4 H 150 M 145 4 V 24" />
                <path d="M 161 24 L 167 4 L 173 24" />
              </g>
            </svg>
            <div className="ws-brand-tagline">TRANSFORM DATA INTO INTELLIGENCE</div>
          </div>
        )}
      </div>

      {/* Navigation Group Items */}
      <nav className="ws-nav ws-scroll" style={{ paddingBottom: 80 }}>
        {/* Platform section */}
        <div className="ws-nav-group-container">
          {!sidebarCollapsed && <div className="ws-nav-group-label">Platform</div>}
          <div className="ws-nav-group">
            {/* Dashboard Home */}
            <button
              type="button"
              className={`ws-nav-item${activeTab?.sectionId === "dashboard" ? " active" : ""}`}
              onClick={() => openSection("dashboard")}
              data-tooltip="Dashboard Home"
            >
              <LayoutGrid size={16} />
              {!sidebarCollapsed && <span>Dashboard Home</span>}
            </button>

            {/* My Projects Header (Folder open when expanded) */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div 
                className={`ws-nav-item${activeTab?.sectionId === "projects" && projectsFilter === "all" ? " active" : ""}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                onClick={() => {
                  setProjectsFilter("all");
                  openSection("projects");
                  toggleMenu("myProjects");
                }}
                data-tooltip="My Projects"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {expandedMenus.myProjects ? <FolderOpen size={16} /> : <Folder size={16} />}
                  {!sidebarCollapsed && <span>My Projects</span>}
                </div>
                {!sidebarCollapsed && (
                  <div style={{ display: "grid", placeItems: "center" }}>
                    {expandedMenus.myProjects ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                )}
              </div>

              {/* Collapsible Children lists of My Projects */}
              {expandedMenus.myProjects && !sidebarCollapsed && (
                <div style={{ display: "flex", flexDirection: "column", borderLeft: "1px solid var(--ws-border)", marginLeft: 22, paddingLeft: 4 }}>
                  {/* FAVORITES */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      className={`ws-nav-item`}
                      style={{ height: 34, fontSize: 12, justifyContent: "space-between", opacity: 0.85, cursor: "pointer" }}
                      onClick={() => {
                        setProjectsFilter("favorites");
                        openSection("projects");
                        toggleMenu("favorites");
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Star size={13} fill="currentColor" style={{ color: "#EAB308" }} />
                        <span>Favorites</span>
                      </div>
                      {expandedMenus.favorites ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </div>

                    {/* Starred Projects list */}
                    {expandedMenus.favorites && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 12, marginBottom: 6 }}>
                        {favoriteProjects.length === 0 ? (
                          <span style={{ fontSize: 10, color: "var(--ws-text-muted)", padding: "4px 8px" }}>No starred projects</span>
                        ) : (
                          favoriteProjects.map((p) => (
                            <div
                              key={`side-fav-${p.id}`}
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", borderRadius: 6 }}
                              className="ws-switcher-item-hover"
                            >
                              <span
                                onClick={() => { changeWorkspace(p.id); openSection("dashboard"); }}
                                style={{ fontSize: 11, cursor: "pointer", color: activeWorkspace === p.id ? "var(--ws-module-accent)" : "var(--ws-text)", fontWeight: activeWorkspace === p.id ? 700 : 500 }}
                              >
                                {p.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleFavoriteProject(p.id)}
                                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#EAB308", padding: 2 }}
                              >
                                <Star size={11} fill="#EAB308" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* SHARED WITH ME */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      className={`ws-nav-item`}
                      style={{ height: 34, fontSize: 12, justifyContent: "space-between", opacity: 0.85, cursor: "pointer" }}
                      onClick={() => {
                        setProjectsFilter("shared");
                        openSection("projects");
                        toggleMenu("shared");
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Users size={13} />
                        <span>Shared with Me</span>
                      </div>
                      {expandedMenus.shared ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </div>

                    {/* Shared Projects List */}
                    {expandedMenus.shared && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 12, marginBottom: 6 }}>
                        {sharedProjects.length === 0 ? (
                          <span style={{ fontSize: 10, color: "var(--ws-text-muted)", padding: "4px 8px" }}>No shared projects</span>
                        ) : (
                          sharedProjects.map((p) => (
                            <div
                              key={`side-shared-${p.id}`}
                              onClick={() => { changeWorkspace(p.id); openSection("dashboard"); }}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                padding: "6px 8px",
                                borderRadius: 6,
                                cursor: "pointer",
                                border: activeWorkspace === p.id ? "1px solid var(--ws-module-accent)" : "1px solid transparent"
                              }}
                              className="ws-switcher-item-hover"
                            >
                              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ws-text)" }}>{p.name}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, opacity: 0.8 }}>
                                <div
                                  style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    background: "var(--ws-module-accent)",
                                    color: "#fff",
                                    fontSize: 8,
                                    display: "grid",
                                    placeItems: "center",
                                    fontWeight: 700
                                  }}
                                >
                                  {p.sharedBy?.avatar}
                                </div>
                                <span style={{ fontSize: 9, color: "var(--ws-text-muted)" }}>
                                  {p.sharedBy?.name} • <span style={{ fontStyle: "italic" }}>{p.sharedBy?.role}</span>
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>



                  {/* SAMPLE PROJECTS */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      className={`ws-nav-item`}
                      style={{ height: 34, fontSize: 12, justifyContent: "space-between", opacity: 0.85, cursor: "pointer" }}
                      onClick={() => {
                        setProjectsFilter("samples");
                        openSection("projects");
                        toggleMenu("samples");
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Database size={13} />
                        <span>Sample Projects</span>
                      </div>
                      {expandedMenus.samples ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </div>

                    {/* Samples list */}
                    {expandedMenus.samples && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 12, marginBottom: 6 }}>
                        {sampleProjects.map((p) => {
                          const isActive = activeWorkspace === p.id && activeTab?.sectionId === "dashboard";
                          return (
                            <div
                              key={`side-sample-${p.id}`}
                              onClick={() => {
                                changeWorkspace(p.id);
                                openSection("dashboard");
                              }}
                              style={{
                                padding: "4px 8px",
                                fontSize: 11,
                                borderRadius: 4,
                                cursor: "pointer",
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? "var(--ws-module-accent)" : "var(--ws-text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: 6
                              }}
                              className="ws-switcher-item-hover"
                            >
                              <Database size={10} style={{ opacity: 0.7 }} />
                              {p.name}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Import Dataset */}
            <button
              type="button"
              className={`ws-nav-item${activeTab?.sectionId === "import-dataset" ? " active" : ""}`}
              onClick={() => {
                const isSample = ["sales", "churn", "marketing", "revenue"].includes(activeWorkspace);
                if (isSample) {
                  const firstUserProj = projects.find((p) => !p.isSample && p.id !== "custom" && !p.is_deleted && !p.is_archived);
                  if (firstUserProj) {
                    changeWorkspace(firstUserProj.id);
                  }
                }
                openSection("import-dataset");
              }}
              data-tooltip="Import Dataset"
            >
              <UploadCloud size={16} />
              {!sidebarCollapsed && <span>Import Dataset</span>}
            </button>
          </div>
          {sidebarCollapsed && <div className="ws-nav-group-divider" />}
        </div>

        {/* Analytics Pipeline */}
        {NAV_GROUPS.map((group) => {
          if (group.id === "platform" || group.id === "admin") return null;

          return (
            <div key={group.id} className="ws-nav-group-container" style={{ marginTop: 12 }}>
              {!sidebarCollapsed && <div className="ws-nav-group-label">{group.label}</div>}
              <div className="ws-nav-group">
                {group.sections.map((sectionId) => {
                  const meta = SECTION_REGISTRY[sectionId];
                  const Icon = meta.icon;
                  const isActive = activeTab?.sectionId === sectionId;
                  
                  return (
                    <button
                      key={sectionId}
                      type="button"
                      className={`ws-nav-item${isActive ? " active" : ""}`}
                      onClick={() => {
                        openSection(sectionId);
                      }}
                      data-tooltip={meta.label}
                    >
                      <Icon size={16} />
                      {!sidebarCollapsed && <span>{meta.label}</span>}
                    </button>
                  );
                })}
              </div>
              {sidebarCollapsed && <div className="ws-nav-group-divider" />}
            </div>
          );
        })}

        {/* Administration Section */}
        <div className="ws-nav-group-container" style={{ marginTop: 12 }}>
          {!sidebarCollapsed && <div className="ws-nav-group-label">Administration</div>}
          <div className="ws-nav-group">
            {/* Settings */}
            <button
              type="button"
              className={`ws-nav-item${activeTab?.sectionId === "workspace-settings" ? " active" : ""}`}
              onClick={() => openSection("workspace-settings")}
              data-tooltip="Settings"
            >
              <Settings size={16} />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
            {/* Account */}
            <button
              type="button"
              className={`ws-nav-item${activeTab?.sectionId === "account" ? " active" : ""}`}
              onClick={() => openSection("account")}
              data-tooltip="Account"
            >
              <User size={16} />
              {!sidebarCollapsed && <span>Account</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* Footer Area with current workspace and profile */}
      <div className="ws-sidebar-footer" style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--ws-sidebar)", borderTop: "1px solid var(--ws-border)", zIndex: 110 }}>
        {/* Current Workspace Card */}
        {!sidebarCollapsed ? (
          <div className="ws-workspace-card" style={{ margin: "10px 14px", padding: 12, borderRadius: 12 }}>
            <div className="ws-workspace-header">
              <small>CURRENT WORKSPACE</small>
              <span className={`ws-status-badge ${workspaceStatus.toLowerCase()}`}>
                <span className="ws-status-bullet" />
                {workspaceStatus}
              </span>
            </div>
            <strong>{activeWorkspaceLabel}</strong>
            <div className="ws-workspace-meta" style={{ marginTop: 6 }}>
              <span className="ws-meta-label">Dataset:</span>
              <span className="ws-meta-val" style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {datasetName}
              </span>
            </div>
            <div className="ws-workspace-meta">
              <span className="ws-meta-label">Last Updated:</span>
              <span className="ws-meta-val">{activeProj?.lastModified || "Today"}</span>
            </div>
            <div className="ws-workspace-progress" style={{ marginTop: 6 }}>
              <div className="ws-progress-bar">
                <div className="ws-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="ws-progress-text">{progressPercent}%</span>
            </div>
          </div>
        ) : (
          <div className="ws-workspace-card-collapsed" data-tooltip={`${activeWorkspaceLabel} (${workspaceStatus})`} style={{ margin: "10px auto" }}>
            <Database size={18} className="ws-workspace-icon-collapsed" />
            <span className="ws-status-bullet-collapsed" style={{ background: workspaceStatus === "Active" ? "var(--ws-success)" : "var(--ws-danger)" }} />
          </div>
        )}

        {/* User Profile Info */}
        <div className="ws-profile-container" style={{ position: "relative" }}>
          {/* Custom Profile Menu Popover Overlay */}
          {profileMenuOpen && (
            <>
              <div 
                onClick={() => setProfileMenuOpen(false)} 
                style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, zIndex: 999 }}
              />
              <div
                className="ws-card-2"
                style={{
                  position: "absolute",
                  bottom: "115%",
                  left: 10,
                  right: 10,
                  background: "var(--ws-card)",
                  border: "1px solid var(--ws-border)",
                  borderRadius: 12,
                  padding: "8px 0",
                  boxShadow: "0 -8px 24px rgba(0,0,0,0.4)",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2
                }}
              >
                <button
                  type="button"
                  onClick={() => { setProfileMenuOpen(false); openSection("account"); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "none", background: "transparent", color: "var(--ws-text)", fontSize: 12, textAlign: "left", width: "100%", cursor: "pointer" }}
                  className="ws-switcher-item-hover"
                >
                  <User size={13} />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => { setProfileMenuOpen(false); openSection("account"); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "none", background: "transparent", color: "var(--ws-text)", fontSize: 12, textAlign: "left", width: "100%", cursor: "pointer" }}
                  className="ws-switcher-item-hover"
                >
                  <Settings2 size={13} />
                  Account Settings
                </button>
                <button
                  type="button"
                  onClick={() => { setProfileMenuOpen(false); openSection("workspace-settings"); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "none", background: "transparent", color: "var(--ws-text)", fontSize: 12, textAlign: "left", width: "100%", cursor: "pointer" }}
                  className="ws-switcher-item-hover"
                >
                  <Settings size={13} />
                  Preferences
                </button>
                <button
                  type="button"
                  onClick={() => { setProfileMenuOpen(false); toggleTheme(); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "none", background: "transparent", color: "var(--ws-text)", fontSize: 12, textAlign: "left", width: "100%", cursor: "pointer" }}
                  className="ws-switcher-item-hover"
                >
                  <Layout size={13} />
                  Toggle Theme
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    alert("KoreData Keyboard Shortcuts:\n\n- Ctrl + K: Toggle Project Switcher\n- Ctrl + Shift + A: Toggle AI Copilot\n- Esc: Minimize AI Copilot\n- Double-Click AI Titlebar: Toggle Maximize");
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "none", background: "transparent", color: "var(--ws-text)", fontSize: 12, textAlign: "left", width: "100%", cursor: "pointer" }}
                  className="ws-switcher-item-hover"
                >
                  <HelpCircle size={13} />
                  Help
                </button>
                <hr style={{ border: "none", borderTop: "1px solid var(--ws-border)", margin: "4px 0" }} />
                <button
                  type="button"
                  onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "none", background: "transparent", color: "var(--ws-danger)", fontSize: 12, textAlign: "left", width: "100%", cursor: "pointer" }}
                  className="ws-switcher-item-hover"
                >
                  <LogOut size={13} />
                  Logout
                </button>
              </div>
            </>
          )}

          {/* Main profile row - clicking triggers popover menu */}
          <div className="ws-profile" style={{ cursor: "pointer", width: "100%" }} onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
            <div className="ws-avatar" data-tooltip="Nikunj Goel (Data Scientist)">NG</div>
            {!sidebarCollapsed && (
              <div className="ws-profile-details">
                <strong>Nikunj Goel</strong>
                <span>Data Scientist</span>
              </div>
            )}
          </div>
          
          {/* Action Row */}
          <div className="ws-profile-actions">
            <button 
              type="button" 
              className="ws-profile-action-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
            {!sidebarCollapsed && (
              <>
                <button 
                  type="button" 
                  className="ws-profile-action-btn" 
                  onClick={() => openSection("workspace-settings")}
                  title="Workspace Settings"
                >
                  <Settings2 size={16} />
                </button>
                <button 
                  type="button" 
                  className="ws-profile-action-btn logout" 
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
