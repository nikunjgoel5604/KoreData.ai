"use client";

import { ArrowLeftRight } from "lucide-react";
import { NAV_GROUPS, SECTION_REGISTRY } from "./sections";
import { useWorkspace } from "./WorkspaceContext";

export default function Sidebar() {
  const { activeTab, openSection } = useWorkspace();

  return (
    <aside className="ws-sidebar">
      <div className="ws-logo">
        <div className="ws-logo-mark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12L10 6M4 12L10 18M14 6L20 12L14 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="ws-logo-text">
          <strong>KOREDATA-EX</strong>
          <span>Enterprise AI Workspace</span>
        </div>
      </div>

      <nav className="ws-nav ws-scroll">
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <div className="ws-nav-group-label">{group.label}</div>
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
                    onClick={() => openSection(sectionId)}
                  >
                    <Icon />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="ws-sidebar-footer">
        <div className="ws-workspace-card">
          <small>Current Workspace</small>
          <strong>Sales Analysis Q2</strong>
          <span className="ws-status-dot">Active</span>
        </div>

        <div className="ws-profile">
          <div className="ws-avatar">NG</div>
          <div style={{ minWidth: 0 }}>
            <strong>Nikunj Goel</strong>
            <span>Data Scientist</span>
          </div>
          <ArrowLeftRight size={15} style={{ marginLeft: "auto", opacity: 0.6 }} />
        </div>
      </div>
    </aside>
  );
}
