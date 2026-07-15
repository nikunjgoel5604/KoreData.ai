"use client";

import { FileUp, Loader2 } from "lucide-react";
import { useWorkspace } from "../WorkspaceContext";
import ModuleHeader from "./ModuleHeader";

export default function UploadPanel() {
  const {
    uploading,
    files,
    handleUpload,
    handleReuseFile,
    handleRemoveFile,
    statusMessage
  } = useWorkspace();

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
        <div className="overflow-hidden" style={{ border: "1px solid var(--ws-border-soft)", borderRadius: "var(--ws-radius-sm)" }}>
          <table className="ws-table">
            <thead>
              <tr>
                <th>File name</th>
                <th>Rows</th>
                <th>Columns</th>
                <th>Date Ingested</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td>
                    <span className="ws-table-name">{file.file_name}</span>
                  </td>
                  <td>{file.row_count ?? "NA"}</td>
                  <td>{file.col_count ?? "NA"}</td>
                  <td>{file.uploaded_at ? new Date(file.uploaded_at).toLocaleString() : "NA"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button 
                      type="button" 
                      onClick={() => handleReuseFile(file.id, file.file_name)} 
                      className="ws-link" 
                      style={{ marginRight: 16, border: "none", background: "transparent", cursor: "pointer" }}
                    >
                      Reuse
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveFile(file.id)} 
                      className="ws-link" 
                      style={{ color: "var(--ws-danger)", border: "none", background: "transparent", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--ws-text-muted)", padding: 24 }}>
                    No uploads saved.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
