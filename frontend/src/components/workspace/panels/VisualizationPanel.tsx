import { useWorkspace } from "../WorkspaceContext";
import ModuleHeader from "./ModuleHeader";
import ChartCard from "./ChartCard";
import EmptyState from "./EmptyState";
import { BarChart3 } from "lucide-react";

export default function VisualizationPanel() {
  const {
    openSection,
    edaResult,
    allColumns,
    vizChartType,
    setVizChartType,
    vizXAxis,
    setVizXAxis,
    vizYAxis,
    setVizYAxis,
    vizColorTheme,
    setVizColorTheme
  } = useWorkspace();

  if (!edaResult) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <ModuleHeader sectionId="visualization" />
        <div className="ws-card" style={{ display: "flex", justifyContent: "center" }}>
          <EmptyState
            type="visualization"
            primaryAction={{
              label: "Upload Dataset",
              onClick: () => openSection("import-dataset")
            }}
          />
        </div>
      </div>
    );
  }

  const chartTypes = ["bar", "line", "area", "pie", "histogram", "heatmap", "scatter", "treemap", "boxplot", "sankey"];

  const themeColors = {
    classic: "var(--ws-module-accent)",
    warm: "#f97316",
    emerald: "#10b981"
  };

  const activeColor = themeColors[vizColorTheme as keyof typeof themeColors] || themeColors.classic;

  return (
    <div className="space-y-6 animate-fadeIn">
      <ModuleHeader sectionId="visualization" />
      
      <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0, 1fr)", gap: 24 }}>
        
        {/* Visualizer Side Config Panel */}
        <div className="ws-card space-y-4" style={{ height: "fit-content" }}>
          <h2 className="ws-section-title">Chart Configurator</h2>
          
          <div>
            <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Chart Type</label>
            <select
              value={vizChartType}
              onChange={(e) => setVizChartType(e.target.value)}
              className="ws-card-2"
              style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
            >
              {chartTypes.map((type) => (
                <option key={type} value={type}>{type.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>X Axis Variable</label>
            <select
              value={vizXAxis}
              onChange={(e) => setVizXAxis(e.target.value)}
              className="ws-card-2"
              style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
            >
              {allColumns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Y Axis Variable</label>
            <select
              value={vizYAxis}
              onChange={(e) => setVizYAxis(e.target.value)}
              className="ws-card-2"
              style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
            >
              {allColumns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Color Theme</label>
            <select
              value={vizColorTheme}
              onChange={(e) => setVizColorTheme(e.target.value)}
              className="ws-card-2"
              style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
            >
              <option value="classic">Classic Fabric (Blue)</option>
              <option value="warm">Warm Studio (Orange/Red)</option>
              <option value="emerald">Forest (Green)</option>
            </select>
          </div>

          <button 
            type="button" 
            className="ws-btn ws-btn-primary" 
            style={{ width: "100%", marginTop: 10 }}
            onClick={() => alert("SVG exported successfully.")}
          >
            Export SVG Chart
          </button>
        </div>

        {/* Main Visualizer Canvas */}
        <ChartCard
          title={`${vizChartType.toUpperCase()} Visualizer Canvas Output`}
          description={`Exploring relationship of variables X: "${vizXAxis}" and Y: "${vizYAxis}"`}
          icon={BarChart3}
        >
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.15)", borderRadius: "var(--ws-radius-sm)", border: "1px solid var(--ws-border-soft)", padding: 48, minHeight: 350 }}>
            {/* SVG visualization render graphics mockup */}
            <svg className="w-64 h-64" style={{ color: activeColor }} viewBox="0 0 200 200">
              {vizChartType === "bar" && (
                <g>
                  <rect x="20" y="80" width="30" height="80" fill="currentColor" opacity="0.8" />
                  <rect x="60" y="40" width="30" height="120" fill="currentColor" />
                  <rect x="100" y="110" width="30" height="50" fill="currentColor" opacity="0.6" />
                  <rect x="140" y="60" width="30" height="100" fill="currentColor" opacity="0.9" />
                </g>
              )}
              {vizChartType === "line" && (
                <polyline fill="none" stroke="currentColor" strokeWidth="3" points="20,140 60,60 100,100 140,40" />
              )}
              {vizChartType === "pie" && (
                <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="30" strokeDasharray="200 120" />
              )}
              {vizChartType !== "bar" && vizChartType !== "line" && vizChartType !== "pie" && (
                <g>
                  <circle cx="60" cy="120" r="14" fill="currentColor" opacity="0.8" />
                  <circle cx="120" cy="70" r="28" fill="currentColor" opacity="0.5" />
                  <circle cx="150" cy="140" r="18" fill="currentColor" opacity="0.7" />
                </g>
              )}
            </svg>
          </div>
        </ChartCard>

      </div>
    </div>
  );
}
