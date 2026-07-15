"use client";

import { useEffect, useState } from "react";
import { Bell, Moon, Search, Sun, ChevronDown, Sparkles, Database, History, Settings } from "lucide-react";
import { useWorkspace } from "./WorkspaceContext";

type Theme = "dark" | "light";

export default function TopBar() {
  const [theme, setTheme] = useState<Theme>("dark");
  const { assistantOpen, setAssistantOpen, simRunning } = useWorkspace();

  useEffect(() => {
    const saved = window.localStorage.getItem("koredata-theme") as Theme | null;
    const next = saved === "light" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("koredata-theme", next);
  };

  // Determine active badge properties based on execution state
  const statusText = simRunning ? "RUNNING" : "READY";
  const statusClass = simRunning ? "running" : "ready";

  return (
    <header className="ws-topbar">
      {/* Left Section: Workspace Selector & Status Badge */}
      <div className="ws-topbar-left">
        <div className="ws-workspace-selector-container">
          <div className="ws-workspace-selector">
            <Database size={16} className="ws-workspace-selector-icon" />
            <select defaultValue="Sales Analysis Q2" className="ws-workspace-select-input">
              <option>Sales Analysis Q2</option>
              <option>Customer Churn Prediction</option>
              <option>Marketing Campaign ROI</option>
              <option>Revenue Forecasting</option>
            </select>
            <ChevronDown size={14} className="ws-workspace-selector-arrow" />
          </div>
        </div>

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
        
        <button type="button" className="ws-icon-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="ws-badge">12</span>
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
          <div className="ws-profile-avatar">
            NG
          </div>
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
