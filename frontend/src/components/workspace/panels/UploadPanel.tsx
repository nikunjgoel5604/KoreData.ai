"use client";

import { FileUp, Loader2, FolderOpen, Trash2 } from "lucide-react";
import { useWorkspace, type UploadedFile } from "../WorkspaceContext";
import ModuleHeader from "./ModuleHeader";
import DataTable, { type ColumnConfig } from "./DataTable";

export default function UploadPanel() {
  const {
    uploading,
    files,
    handleUpload,
    handleReuseFile,
    handleRemoveFile,
    statusMessage
  } = useWorkspace();

  const columns: ColumnConfig<UploadedFile>[] = [
    {
      key: "file_name",
      header: "File name",
      sortable: true,
      type: "text",
      render: (row) => <span className="ws-table-name">{row.file_name}</span>
    },
    {
      key: "row_count",
      header: "Rows",
      sortable: true,
      type: "number"
    },
    {
      key: "col_count",
      header: "Columns",
      sortable: true,
      type: "number"
    },
    {
      key: "uploaded_at",
      header: "Date Ingested",
      sortable: true,
      type: "date"
    }
  ];

  const actions = [
    {
      label: "Reuse",
      icon: FolderOpen,
      onClick: (row: UploadedFile) => handleReuseFile(row.id, row.file_name)
    },
    {
      label: "Delete",
      icon: Trash2,
      danger: true,
      onClick: (row: UploadedFile) => {
        if (confirm(`Are you sure you want to delete the dataset "${row.file_name}"? This action cannot be undone.`)) {
          handleRemoveFile(row.id);
        }
      }
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <ModuleHeader sectionId="import-dataset" />
      <div className="ws-card text-center" style={{ padding: "32px auto" }}>
        <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Ingest Workspace Datasets</h2>
        
        {/* File upload drag zone */}
        <label 
          className="ws-card-2"
          style={{
            border: "2px dashed var(--ws-border)",
            borderRadius: "var(--ws-radius-card)",
            padding: 48,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            maxWidth: 580,
            margin: "0 auto 24px",
            transition: "border-color 0.15s ease"
          }}
        >
          {uploading ? (
            <Loader2 className="animate-spin" style={{ color: "var(--ws-blue)", marginBottom: 16 }} size={32} />
          ) : (
            <FileUp style={{ color: "var(--ws-text-muted)", marginBottom: 16 }} size={32} />
          )}
          <span style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
            Drag & Drop Tabular Data File
          </span>
          <span style={{ fontSize: 11, color: "var(--ws-text-muted)", marginTop: 8 }}>
            Supported Formats: CSV, XLSX, JSON, Parquet, API
          </span>
          <input type="file" onChange={handleUpload} className="hidden" />
        </label>

        {uploading && (
          <div style={{ fontSize: 13, color: "var(--ws-blue)", fontWeight: 600, marginBottom: 16 }}>
            {statusMessage}
          </div>
        )}

        {/* Cloud/DB Integrations */}
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <span style={{ fontSize: 11, color: "var(--ws-text-muted)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 12 }}>
            External Storage Connectors
          </span>
          <div className="ws-quick-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            {["Excel", "SQL DB", "Parquet", "API Server", "Cloud S3"].map((source) => (
              <div 
                key={source} 
                className="ws-card-2" 
                style={{
                  padding: 12,
                  borderRadius: "var(--ws-radius-sm)",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  border: "1px solid var(--ws-border-soft)",
                  textAlign: "center"
                }}
              >
                {source}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload history & Datasets Manager */}
      <div className="ws-card">
        <h2 className="ws-section-title" style={{ marginBottom: 16 }}>Saved Ingestion Files</h2>
        
        <DataTable
          data={files}
          columns={columns}
          actions={actions}
          searchPlaceholder="Search files..."
          searchFields={["file_name"]}
          showPagination={true}
          defaultRowsPerPage={5}
          emptyTitle="No uploads saved."
          emptyDesc="Ingest datasets to build the profile history."
        />
      </div>
    </div>
  );
}
