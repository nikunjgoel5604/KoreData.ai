"use client";

import { Check, X } from "lucide-react";
import { useWorkspace, SIMULATION_STAGES } from "../WorkspaceContext";
import type { PipelineStep } from "../workspace.types";

const STATUS_LABEL: Record<PipelineStep["status"], string> = {
  done: "Completed",
  current: "In Progress",
  pending: "Pending",
  failed: "Failed"
};

export default function PipelineStepper() {
  const { stageStatuses, currentStageKey, simRunning } = useWorkspace();

  const dynamicSteps: PipelineStep[] = SIMULATION_STAGES.map((stage, idx) => {
    const rawStatus = stageStatuses[stage.key] || "idle";
    let status: PipelineStep["status"] = "pending";

    if (rawStatus === "success") {
      status = "done";
    } else if (rawStatus === "running" || (simRunning && currentStageKey === stage.key)) {
      status = "current";
    } else if (rawStatus === "error") {
      status = "failed";
    }

    return {
      step: idx + 1,
      key: stage.key,
      name: stage.label,
      status
    };
  });

  return (
    <div className="ws-stepper ws-scroll">
      {dynamicSteps.map((s, i) => (
        <div key={s.key} style={{ display: "flex", alignItems: "flex-start" }}>
          <div className="ws-step">
            <div className={`ws-step-circle ${s.status}`}>
              {s.status === "done" ? <Check size={16} /> : s.status === "failed" ? <X size={16} /> : s.step}
            </div>
            <span className="ws-step-name">{s.name}</span>
            <span className={`ws-step-status ${s.status}`}>{STATUS_LABEL[s.status]}</span>
          </div>
          {i < dynamicSteps.length - 1 && (
            <div className={`ws-step-line ${s.status === "done" ? "done" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}
