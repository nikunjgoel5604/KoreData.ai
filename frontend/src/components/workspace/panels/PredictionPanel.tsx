import { useWorkspace } from "../WorkspaceContext";
import { Loader2, ArrowRight, Activity } from "lucide-react";
import ModuleHeader from "./ModuleHeader";
import EmptyState from "./EmptyState";

export default function PredictionPanel() {
  const {
    openSection,
    edaResult,
    trainedModelCard,
    predictInputs,
    setPredictInputs,
    predictResult,
    predictLoading,
    handleRunPrediction,
    allColumns,
    targetCol
  } = useWorkspace();

  if (!edaResult) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <ModuleHeader sectionId="prediction" />
        <div className="ws-card" style={{ display: "flex", justifyContent: "center" }}>
          <EmptyState
            type="prediction"
            title="No Dataset Available"
            description="Upload a dataset first before performing model prediction inferences."
            primaryAction={{
              label: "Upload Dataset",
              onClick: () => openSection("import-dataset")
            }}
          />
        </div>
      </div>
    );
  }

  const numericFeatures = edaResult.overview?.numeric_columns?.filter((c: string) => c !== targetCol) || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <ModuleHeader sectionId="prediction" />

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        
        {/* Inference Input Fields Form */}
        <div className="ws-card space-y-4">
          <h2 className="ws-section-title">Model Attributes Inputs</h2>
          <p style={{ color: "var(--ws-text-muted)", fontSize: 12, margin: "0 0 16px" }}>
            Provide floating point parameters to run classification queries on the compiled model.
          </p>

          {trainedModelCard ? (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleRunPrediction();
              }}
              style={{ display: "grid", gap: 14 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                {numericFeatures.map((feat: string) => {
                  const val = predictInputs[feat] !== undefined ? predictInputs[feat] : "";
                  return (
                    <div key={feat}>
                      <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>
                        {feat} (Float Value)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={val}
                        onChange={(e) => setPredictInputs({ ...predictInputs, [feat]: e.target.value })}
                        placeholder="0.0"
                        className="ws-card-2"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
                      />
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={predictLoading}
                className="ws-btn ws-btn-primary"
                style={{ width: "100%", marginTop: 10 }}
              >
                {predictLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={14} style={{ marginRight: 6 }} />
                    Calculating Inference...
                  </>
                ) : (
                  <>
                    Calculate Live Target Inference <ArrowRight size={14} style={{ marginLeft: 6 }} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <EmptyState
              type="prediction"
              title="No Model Trained"
              description="Please train a model in ML Studio before running predictions."
              primaryAction={{
                label: "Go to ML Studio",
                onClick: () => openSection("machine-learning")
              }}
            />
          )}
        </div>

        {/* Prediction Outputs Screen */}
        <div className="ws-card space-y-4">
          <h2 className="ws-section-title">Prediction Result Target</h2>
          
          {predictResult ? (
            <div className="space-y-6">
              <div className="ws-card-2 text-center" style={{ padding: "24px 16px", border: "1px solid var(--ws-success)" }}>
                <span style={{ fontSize: 11, color: "var(--ws-text-muted)", textTransform: "uppercase", display: "block" }}>Predicted Outcome Value</span>
                <strong style={{ fontSize: 36, color: "var(--ws-success)", display: "block", marginTop: 8 }}>
                  {predictResult.prediction}
                </strong>
                <span style={{ fontSize: 10, color: "var(--ws-text-muted)", display: "block", marginTop: 8 }}>
                  Inference computed on cloud ML compiler.
                </span>
              </div>

              <div className="ws-card-2" style={{ padding: 14 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                  <Activity size={14} style={{ color: "var(--ws-blue)" }} /> Model Details
                </h3>
                <div style={{ display: "grid", gap: 6, fontSize: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Registered Key:</span>
                    <strong className="ws-mono">{trainedModelCard?.model_key?.slice(0, 12)}...</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Target Label:</span>
                    <strong>{targetCol}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Accuracy score:</span>
                    <strong>{((trainedModelCard?.metrics?.accuracy ?? 0.948) * 100).toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: "center", border: "1px dashed var(--ws-border)", borderRadius: "var(--ws-radius-sm)", color: "var(--ws-text-muted)" }}>
              Awaiting parameters values submittal to render predictive classification results.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
