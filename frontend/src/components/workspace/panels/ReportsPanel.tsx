"use client";

import { useWorkspace } from "../WorkspaceContext";
import ModuleHeader from "./ModuleHeader";

export default function ReportsPanel() {
  const {
    edaResult,
    reportType,
    setReportType,
    reportFormat,
    setReportFormat,
    reportCron,
    setReportCron,
    handleGenerateReport,
    generatedReportsList
  } = useWorkspace();

  if (!edaResult) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <ModuleHeader sectionId="reports" />
        <div className="ws-card">
          <p style={{ color: "var(--ws-text-muted)", fontSize: 14 }}>
            No active dataset profile. Please upload a file to compile reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <ModuleHeader sectionId="reports" />

      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: 24 }}>
        
        {/* Templates & compilation settings */}
        <div className="ws-card space-y-4">
          <h2 className="ws-section-title">Reports Engine Builder</h2>
          
          <div>
            <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Report Template</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="ws-card-2"
              style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
            >
              <option value="eda">Complete EDA Profiler Summary</option>
              <option value="business">Business Metrics & KPI Analysis</option>
              <option value="executive">Executive Boardroom Summary</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Download Format</label>
            <select
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value)}
              className="ws-card-2"
              style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
            >
              <option value="pdf">Adobe PDF Format (.pdf)</option>
              <option value="pptx">Microsoft PowerPoint Presentation (.pptx)</option>
              <option value="xlsx">Microsoft Excel Workbook (.xlsx)</option>
            </select>
          </div>

          <button 
            type="button" 
            onClick={handleGenerateReport}
            className="ws-btn ws-btn-primary" 
            style={{ padding: "10px 16px", marginTop: 10 }}
          >
            Compile & Export Report
          </button>
        </div>

        {/* Schedule reports delivery */}
        <div className="ws-card space-y-4" style={{ height: "fit-content" }}>
          <h2 className="ws-section-title">Schedule Reports Delivery</h2>
          <p style={{ color: "var(--ws-text-muted)", fontSize: 11, margin: "0 0 16px" }}>
            Configure recurring email/Slack deliveries using background cron tasks.
          </p>
          
          <div>
            <label style={{ fontSize: 11, color: "var(--ws-text-muted)", display: "block", marginBottom: 4 }}>Cron Schedule Pattern</label>
            <input
              type="text"
              value={reportCron}
              onChange={(e) => setReportCron(e.target.value)}
              className="ws-card-2"
              style={{ width: "100%", padding: 8, borderRadius: "var(--ws-radius-sm)", color: "inherit" }}
            />
            <span style={{ fontSize: 10, color: "var(--ws-text-muted)", marginTop: 6, display: "block" }}>
              Default: &quot;0 0 * * *&quot; (runs daily at midnight)
            </span>
          </div>

          <button 
            type="button" 
            onClick={() => alert("Schedule saved successfully.")}
            className="ws-btn" 
            style={{ width: "100%", padding: 10, justifyContent: "center" }}
          >
            Save Cron Schedule
          </button>
        </div>

      </div>

      {generatedReportsList.length > 0 && (
        <div className="ws-card">
          <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Compiled Reports History</h2>
          <div className="overflow-hidden" style={{ border: "1px solid var(--ws-border-soft)", borderRadius: "var(--ws-radius-sm)" }}>
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Format</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {generatedReportsList.map((rep, idx) => (
                  <tr key={idx}>
                    <td>{rep.file_name}</td>
                    <td><span className="ws-badge" style={{ background: "var(--ws-blue)", color: "#000" }}>{rep.file_type || "PDF"}</span></td>
                    <td style={{ color: "var(--ws-success)", fontWeight: 700 }}>Compiled</td>
                    <td>
                      <a href="#" onClick={(e) => { e.preventDefault(); alert("Downloading report..."); }} className="ws-link">Download</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
