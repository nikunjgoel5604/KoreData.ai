"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import TabBar from "./TabBar";
import AiAssistantDrawer from "./AiAssistantDrawer";
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
  const { activeTab, assistantOpen, setAssistantOpen, sidebarCollapsed } = useWorkspace();
  const moduleId = activeTab?.sectionId || "dashboard";

  return (
    <div className="workspace-shell" data-module={moduleId} data-sidebar-collapsed={sidebarCollapsed}>
      <Sidebar />
      <div className="ws-main">
        <TopBar />
        <TabBar />
        <main className="ws-content ws-scroll">
          <ActivePanel />
        </main>
      </div>
      {assistantOpen && <AiAssistantDrawer onClose={() => setAssistantOpen(false)} />}
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
