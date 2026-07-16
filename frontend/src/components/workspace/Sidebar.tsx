"use client";

import { 
  ArrowLeftRight, 
  PanelLeftClose, 
  PanelLeftOpen, 
  LogOut, 
  Settings2,
  Database,
  Dot,
  LayoutGrid,
  FolderOpen
} from "lucide-react";
import { NAV_GROUPS, SECTION_REGISTRY } from "./sections";
import { useWorkspace } from "./WorkspaceContext";

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
    changeWorkspace
  } = useWorkspace();

  const workspaceLabels = {
    sales: "Sales Analysis Q2",
    churn: "Customer Churn Prediction",
    marketing: "Marketing Campaign ROI",
    revenue: "Revenue Forecasting",
    custom: "Custom Dataset"
  };
  const activeWorkspaceLabel = workspaceLabels[activeWorkspace as keyof typeof workspaceLabels] || "Sales Analysis Q2";

  const datasetName = edaResult?.overview?.dataset_name || "sales_q2.csv";
  const workspaceStatus = simRunning ? "Running" : (edaResult ? "Active" : "Idle");
  const progressPercent = simRunning ? simProgress : (edaResult ? 100 : 0);

  const handleLogout = () => {
    window.localStorage.removeItem("koredata-token");
    window.location.href = "/login";
  };

  return (
    <aside className="ws-sidebar" data-collapsed={sidebarCollapsed}>
      {/* Logo Header Area */}
      <div className="ws-logo">
        <div className="ws-logo-mark">
          <svg width="38" height="38" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left-most vertical line that bends left at top */}
            <path d="M6 24V11L4 9" stroke="var(--ws-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="4" cy="9" r="1.8" fill="var(--ws-accent)"/>
            
            {/* Second vertical line straight to top node */}
            <path d="M9 24V7" stroke="var(--ws-text)" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="1.8" fill="var(--ws-accent)"/>
            
            {/* Third vertical line straight to top node */}
            <path d="M12 24V7" stroke="var(--ws-text)" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="12" cy="7" r="1.8" fill="var(--ws-accent)"/>
            
            {/* Main K center diagonals and circuit paths inside the loop */}
            <path d="M9 16L18 9" stroke="var(--ws-text)" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="18" cy="9" r="1.8" fill="var(--ws-accent)"/>
            
            <path d="M9 16L18 23" stroke="var(--ws-text)" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="18" cy="23" r="1.8" fill="var(--ws-accent)"/>
            
            {/* Semicircle circuit loop representing D or outer orbit */}
            <path d="M14 6C21 6 25 9.5 25 16C25 22.5 21 26 14 26" stroke="var(--ws-text)" strokeWidth="2.2" strokeLinecap="round"/>
            
            {/* Four horizontal terminal lines extending out from D */}
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
              {/* KOR + E (Accent) */}
              <g stroke="var(--ws-accent)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                {/* K */}
                <path d="M 4 4 V 24 M 4 14 L 13 4 M 4 14 L 13 24" />
                {/* O */}
                <path d="M 31 14 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0" />
                {/* R */}
                <path d="M 50 4 V 24 M 50 4 H 56 C 59.5 4 61.5 5.5 61.5 9 C 61.5 12.5 56 14 53 14 H 50 M 56 14 L 62 24" />
                {/* E (3 bars) */}
                <path d="M 73 6 H 82 M 73 14 H 82 M 73 22 H 82" />
              </g>
              
              {/* DATA (Text) */}
              <g stroke="var(--ws-text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                {/* D */}
                <path d="M 93 4 V 24 M 93 4 H 99 C 104 4 106.5 7.5 106.5 14 C 106.5 20.5 104 24 99 24 H 93" />
                {/* A */}
                <path d="M 117 24 L 123 4 L 129 24" />
                {/* T */}
                <path d="M 140 4 H 150 M 145 4 V 24" />
                {/* A */}
                <path d="M 161 24 L 167 4 L 173 24" />
              </g>
            </svg>
            <div className="ws-brand-tagline">TRANSFORM DATA INTO INTELLIGENCE</div>
          </div>
        )}
      </div>

      {/* Navigation Group Items */}
      <nav className="ws-nav ws-scroll">
        {/* Core Workspace & Platform Contexts */}
        <div className="ws-nav-group-container">
          {!sidebarCollapsed && <div className="ws-nav-group-label">Platform</div>}
          <div className="ws-nav-group">
            {/* Dashboard Home */}
            <button
              type="button"
              className={`ws-nav-item${activeTab?.sectionId === "dashboard" && activeWorkspace !== "custom" ? " active" : ""}`}
              onClick={() => openSection("dashboard")}
              data-tooltip="Dashboard Home"
            >
              <LayoutGrid size={16} />
              {!sidebarCollapsed && <span>Dashboard Home</span>}
            </button>

            {/* My Projects (User Workspace) */}
            <button
              type="button"
              className={`ws-nav-item${activeWorkspace === "custom" ? " active" : ""}`}
              onClick={() => {
                changeWorkspace("custom");
                openSection("dashboard");
              }}
              data-tooltip="My Projects"
            >
              <FolderOpen size={16} style={{ color: activeWorkspace === "custom" ? "var(--ws-module-accent)" : "inherit" }} />
              {!sidebarCollapsed && <span>My Projects</span>}
            </button>
          </div>
          {sidebarCollapsed && <div className="ws-nav-group-divider" />}
        </div>

        {/* Sample Dashboards Nav Section */}
        <div className="ws-nav-group-container" style={{ marginTop: 12 }}>
          {!sidebarCollapsed && <div className="ws-nav-group-label">Sample Dashboards</div>}
          <div className="ws-nav-group">
            {[
              { id: "sales", label: "Sales Analysis Q2" },
              { id: "churn", label: "Customer Churn" },
              { id: "marketing", label: "Marketing ROI" },
              { id: "revenue", label: "Revenue Forecast" }
            ].map((dash) => {
              const isActive = activeWorkspace === dash.id;
              return (
                <button
                  key={dash.id}
                  type="button"
                  className={`ws-nav-item${isActive ? " active" : ""}`}
                  onClick={() => {
                    changeWorkspace(dash.id as any);
                    openSection("dashboard");
                  }}
                  data-tooltip={dash.label}
                >
                  <Database size={16} style={{ color: isActive ? "var(--ws-module-accent)" : "inherit" }} />
                  {!sidebarCollapsed && <span>{dash.label}</span>}
                </button>
              );
            })}
          </div>
          {sidebarCollapsed && <div className="ws-nav-group-divider" />}
        </div>

        {/* Analytics & Management Tools */}
        {NAV_GROUPS.map((group) => {
          // If group is 'platform', we only render sections other than 'dashboard' (e.g. 'import-dataset')
          const sectionsToRender = group.id === "platform" 
            ? group.sections.filter(s => s !== "dashboard") 
            : group.sections;

          if (sectionsToRender.length === 0) return null;

          return (
            <div key={group.id} className="ws-nav-group-container" style={{ marginTop: 12 }}>
              {!sidebarCollapsed && <div className="ws-nav-group-label">{group.label}</div>}
              <div className="ws-nav-group">
                {sectionsToRender.map((sectionId) => {
                  const meta = SECTION_REGISTRY[sectionId];
                  const Icon = meta.icon;
                  const isActive = activeTab?.sectionId === sectionId;
                  
                  return (
                    <button
                      key={sectionId}
                      type="button"
                      className={`ws-nav-item${isActive ? " active" : ""}`}
                      onClick={() => {
                        // If user clicks import dataset and is NOT in custom workspace, swap them to custom!
                        if (sectionId === "import-dataset" && activeWorkspace !== "custom") {
                          changeWorkspace("custom");
                        }
                        openSection(sectionId);
                      }}
                      data-tooltip={meta.label}
                    >
                      <Icon />
                      {!sidebarCollapsed && <span>{meta.label}</span>}
                    </button>
                  );
                })}
              </div>
              {sidebarCollapsed && <div className="ws-nav-group-divider" />}
            </div>
          );
        })}
      </nav>

      {/* Footer Area with current workspace and profile */}
      <div className="ws-sidebar-footer">
        {/* Current Workspace Card */}
        {!sidebarCollapsed ? (
          <div className="ws-workspace-card">
            <div className="ws-workspace-header">
              <small>Current Workspace</small>
              <span className={`ws-status-badge ${workspaceStatus.toLowerCase()}`}>
                <span className="ws-status-bullet" />
                {workspaceStatus}
              </span>
            </div>
            <strong>{activeWorkspaceLabel}</strong>
            <div className="ws-workspace-meta">
              <span className="ws-meta-label">Dataset:</span>
              <span className="ws-meta-val">{datasetName}</span>
            </div>
            <div className="ws-workspace-progress">
              <div className="ws-progress-bar">
                <div className="ws-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="ws-progress-text">{progressPercent}%</span>
            </div>
          </div>
        ) : (
          <div className="ws-workspace-card-collapsed" data-tooltip={`${activeWorkspaceLabel} (Active)`}>
            <Database size={18} className="ws-workspace-icon-collapsed" />
            <span className="ws-status-bullet-collapsed" />
          </div>
        )}

        {/* User Profile Info */}
        <div className="ws-profile-container">
          <div className="ws-profile">
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
