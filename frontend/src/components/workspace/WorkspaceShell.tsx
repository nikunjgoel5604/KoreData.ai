"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import TabBar from "./TabBar";
import AiAssistantDrawer from "./AiAssistantDrawer";
import NotificationCenterDrawer from "./NotificationCenterDrawer";
import OverviewPanel from "./panels/OverviewPanel";
import GenericPanel from "./panels/GenericPanel";
import UploadPanel from "./panels/UploadPanel";
import EdaPanel from "./panels/EdaPanel";
import VisualizationPanel from "./panels/VisualizationPanel";
import MlStudioPanel from "./panels/MlStudioPanel";
import PredictionPanel from "./panels/PredictionPanel";
import AiInsightsPanel from "./panels/AiInsightsPanel";
import ReportsPanel from "./panels/ReportsPanel";
import ExportPanel from "./panels/ExportPanel";
import DatasetManagerPanel from "./panels/DatasetManagerPanel";
import PipelineHistoryPanel from "./panels/PipelineHistoryPanel";
import { WorkspaceProvider, useWorkspace } from "./WorkspaceContext";
import { SECTION_REGISTRY } from "./sections";

function ActivePanel() {
  const { activeTab } = useWorkspace();
  if (!activeTab) return null;

  switch (activeTab.sectionId) {
    case "dashboard":
      return <OverviewPanel />;
    case "import-dataset":
      return <UploadPanel />;
    case "eda":
      return <EdaPanel />;
    case "visualization":
      return <VisualizationPanel />;
    case "machine-learning":
      return <MlStudioPanel />;
    case "prediction":
      return <PredictionPanel />;
    case "ai-insights":
      return <AiInsightsPanel />;
    case "reports":
      return <ReportsPanel />;
    case "export":
      return <ExportPanel />;
    case "dataset-manager":
      return <DatasetManagerPanel />;
    case "pipeline-history":
      return <PipelineHistoryPanel />;
    default:
      return <GenericPanel section={SECTION_REGISTRY[activeTab.sectionId]} />;
  }
}

/** Reads the active module from context and sets data-module on the shell div */
function ModuleShell({ children }: { children: React.ReactNode }) {
  const { activeTab, assistantOpen, setAssistantOpen, sidebarCollapsed, setSidebarCollapsed, notificationsOpen, setNotificationsOpen } = useWorkspace();
  const moduleId = activeTab?.sectionId || "dashboard";

  // Window resize state for responsive layouts
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  // AI Copilot drag resizing state
  const [copilotWidth, setCopilotWidth] = useState(385);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 380 && newWidth <= 520) {
        setCopilotWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Handle window width and sidebar auto-collapse
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width < 1100) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarCollapsed]);

  const isOverlayMode = windowWidth < 900;
  const gridStyle = (assistantOpen && !isOverlayMode)
    ? { gridTemplateColumns: `var(--sidebar-width) minmax(0, 1fr) ${copilotWidth}px` }
    : { gridTemplateColumns: `var(--sidebar-width) minmax(0, 1fr)` };

  return (
    <div
      className="workspace-shell"
      data-module={moduleId}
      data-sidebar-collapsed={sidebarCollapsed}
      data-overlay-copilot={isOverlayMode}
      style={gridStyle}
    >
      <Sidebar />
      <div className="ws-main">
        <TopBar />
        <TabBar />
        <main className="ws-content ws-scroll" style={{ position: "relative" }}>
          {/* Subtle slow rotating background watermark */}
          <div className="ws-bg-watermark">
            <svg width="450" height="450" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 24V11L4 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="4" cy="9" r="1.3" fill="currentColor"/>
              <path d="M9 24V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="1.3" fill="currentColor"/>
              <path d="M12 24V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <circle cx="12" cy="7" r="1.3" fill="currentColor"/>
              <path d="M9 16L18 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <circle cx="18" cy="9" r="1.3" fill="currentColor"/>
              <path d="M9 16L18 23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <circle cx="18" cy="23" r="1.3" fill="currentColor"/>
              <path d="M14 6C21 6 25 9.5 25 16C25 22.5 21 26 14 26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="20" y1="12" x2="28" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="28" cy="12" r="0.9" fill="currentColor"/>
              <line x1="21" y1="14.5" x2="29" y2="14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="29" cy="14.5" r="0.9" fill="currentColor"/>
              <line x1="21" y1="17.5" x2="29" y2="17.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="29" cy="17.5" r="0.9" fill="currentColor"/>
              <line x1="20" y1="20" x2="28" y2="20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="28" cy="20" r="0.9" fill="currentColor"/>
            </svg>
          </div>
          <div key={moduleId} className="ws-page-transition" style={{ height: '100%', position: "relative", zIndex: 1 }}>
            <ActivePanel />
          </div>
        </main>
      </div>
      {assistantOpen && (
        <AiAssistantDrawer
          onClose={() => setAssistantOpen(false)}
          width={copilotWidth}
          startResizing={startResizing}
          isResizing={isResizing}
        />
      )}
      {notificationsOpen && (
        <NotificationCenterDrawer onClose={() => setNotificationsOpen(false)} />
      )}
    </div>
  );
}

export default function WorkspaceShell() {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    document.body.classList.add("workspace-mode");

    // Reuses the same auth token already set by the existing login flow
    // (see AuthForm.tsx -> "koredata-token"). Phase 2 will replace this
    // simple presence check with a live /auth/verify call.
    const token = window.localStorage.getItem("koredata-token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setAuthChecked(true);

    return () => {
      document.body.classList.remove("workspace-mode");
    };
  }, []);

  if (!authChecked) {
    return <div className="workspace-shell" style={{ gridTemplateColumns: "1fr" }} />;
  }

  return (
    <WorkspaceProvider>
      <ModuleShell>
        {null}
      </ModuleShell>
    </WorkspaceProvider>
  );
}
