"use client";

import { useEffect, useState } from "react";
import { Bell, CalendarClock, HelpCircle, Moon, Search, Sun, ChevronDown, Sparkles } from "lucide-react";
import { useWorkspace } from "./WorkspaceContext";

type Theme = "dark" | "light";

export default function TopBar() {
  const [theme, setTheme] = useState<Theme>("dark");
  const { assistantOpen, setAssistantOpen } = useWorkspace();

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

  return (
    <header className="ws-topbar">
      <div className="ws-project-select">
        <label>Workspace</label>
        <select defaultValue="Sales Analysis Q2">
          <option>Sales Analysis Q2</option>
          <option>Customer Churn Prediction</option>
          <option>Marketing Campaign ROI</option>
          <option>Revenue Forecasting</option>
        </select>
      </div>

      <span className="ws-status-pill">STATUS: READY</span>

      <div className="ws-search">
        <div className="ws-search-inner">
          <Search size={16} />
          <input placeholder="Search datasets, columns, reports, models..." />
          <span className="ws-search-kbd">Ctrl + K</span>
        </div>
      </div>

      <div className="ws-topbar-actions">
        <button 
          type="button" 
          className="ws-icon-btn" 
          aria-label="Toggle AI Assistant"
          onClick={() => setAssistantOpen(!assistantOpen)}
          style={{ color: assistantOpen ? "var(--ws-module-accent)" : "inherit" }}
        >
          <Sparkles size={18} />
        </button>
        <button type="button" className="ws-icon-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="ws-badge">12</span>
        </button>
        <button type="button" className="ws-icon-btn" aria-label="Activity log">
          <CalendarClock size={18} />
        </button>
        <button type="button" className="ws-icon-btn" aria-label="Help">
          <HelpCircle size={18} />
        </button>
        <button type="button" className="ws-icon-btn" aria-label="Toggle theme" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="ws-profile-menu">
          <div className="ws-avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
            NG
          </div>
          <strong>Nikunj Goel</strong>
          <ChevronDown size={14} />
        </div>
      </div>
    </header>
  );
}
