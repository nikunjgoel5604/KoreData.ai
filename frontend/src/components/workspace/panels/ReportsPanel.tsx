import { useWorkspace } from "../WorkspaceContext";
import ModuleHeader from "./ModuleHeader";
import DataTable, { type ColumnConfig } from "./DataTable";
import EmptyState from "./EmptyState";
import { Download } from "lucide-react";

export default function ReportsPanel() {
  const {
    openSection,
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
        <div className="ws-card" style={{ display: "flex", justifyContent: "center" }}>
          <EmptyState
            type="reports"
            primaryAction={{
              label: "Upload Dataset",
              onClick: () => openSection("import-dataset")
            }}
          />
        </div>
      </div>
    );
  }

  const columns: ColumnConfig<any>[] = [
    {
      key: "file_name",
      header: "Report Name",
      sortable: true,
      type: "text"
    },
    {
      key: "file_type",
      header: "Format",
      sortable: true,
      type: "fileType"
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      type: "status"
    }
  ];

  const actions = [
    {
      label: "Download",
      icon: Download,
      onClick: (row: any) => {
        alert(`Downloading ${row.file_name}...`);
      }
    }
  ];

  // Map status property to rows for the DataTable component
  const tableData = generatedReportsList.map(rep => ({
    ...rep,
    file_type: rep.file_type || "PDF",
    status: "Compiled"
  }));

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
            style={{ marginTop: 10 }}
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
            style={{ width: "100%" }}
          >
            Save Cron Schedule
          </button>
        </div>

      </div>

      {generatedReportsList.length > 0 && (
        <div className="ws-card">
          <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Compiled Reports History</h2>
          
          <DataTable
            data={tableData}
            columns={columns}
            actions={actions}
            searchPlaceholder="Search reports..."
            searchFields={["file_name", "file_type"]}
            showPagination={true}
            defaultRowsPerPage={5}
            emptyTitle="No reports compiled."
            emptyDesc="Click 'Compile & Export Report' above to start generating files."
          />
        </div>
      )}
    </div>
  );
}
