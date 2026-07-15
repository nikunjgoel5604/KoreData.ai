"use client";

import { useWorkspace } from "../WorkspaceContext";
import ModuleHeader from "./ModuleHeader";

export default function DatasetManagerPanel() {
  const { files, handleReuseFile, handleRemoveFile } = useWorkspace();

  return (
      <ModuleHeader sectionId="dataset-manager" />
      
      <div className="ws-card">
        <h2 className="ws-section-title" style={{ marginBottom: 16 }}>All Registered Workspace Datasets</h2>
        
        <div className="overflow-hidden" style={{ border: "1px solid var(--ws-border-soft)", borderRadius: "var(--ws-radius-sm)" }}>
          <table className="ws-table">
            <thead>
              <tr>
                <th>File name</th>
                <th>File Format</th>
                <th>Size</th>
                <th>Rows</th>
                <th>Columns</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td>
                    <span className="ws-table-name">{file.file_name}</span>
                  </td>
                  <td>
                    <span className="ws-badge" style={{ background: "var(--ws-blue)", color: "#000" }}>
                      {file.file_type || "CSV"}
                    </span>
                  </td>
                  <td>{file.file_size_kb ? `${file.file_size_kb.toFixed(1)} KB` : "NA"}</td>
                  <td>{file.row_count ?? "NA"}</td>
                  <td>{file.col_count ?? "NA"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button 
                      type="button" 
                      onClick={() => handleReuseFile(file.id, file.file_name)} 
                      className="ws-link" 
                      style={{ marginRight: 16, border: "none", background: "transparent", cursor: "pointer" }}
                    >
                      Reuse Profile
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
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--ws-text-muted)", padding: 24 }}>
                    No datasets registered in database.
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
