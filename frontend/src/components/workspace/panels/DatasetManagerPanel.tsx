"use client";

import React, { useState } from "react";
import { useWorkspace, type UploadedFile } from "../WorkspaceContext";
import ModuleHeader from "./ModuleHeader";
import DataTable, { type ColumnConfig } from "./DataTable";
import { FolderOpen, Trash2 } from "lucide-react";
import ConfirmDialog from "../ConfirmDialog";

export default function DatasetManagerPanel() {
  const { files, handleReuseFile, handleRemoveFile } = useWorkspace();
  const [deleteConfirm, setDeleteConfirm] = useState<UploadedFile | null>(null);

  const columns: ColumnConfig<UploadedFile>[] = [
    {
      key: "file_name",
      header: "File Name",
      sortable: true,
      type: "text",
      render: (row) => <span className="ws-table-name">{row.file_name}</span>
    },
    {
      key: "file_type",
      header: "File Format",
      sortable: true,
      type: "fileType"
    },
    {
      key: "file_size_kb",
      header: "Size",
      sortable: true,
      render: (row) => <span>{row.file_size_kb ? `${row.file_size_kb.toFixed(1)} KB` : "NA"}</span>
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
    }
  ];

  const actions = [
    {
      label: "Reuse Profile",
      icon: FolderOpen,
      onClick: (row: UploadedFile) => handleReuseFile(row.id, row.file_name)
    },
    {
      label: "Delete",
      icon: Trash2,
      danger: true,
      onClick: (row: UploadedFile) => {
        setDeleteConfirm(row);
      }
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <ModuleHeader sectionId="dataset-manager" />
      
      <div className="ws-card">
        <h2 className="ws-section-title" style={{ marginBottom: 16 }}>All Registered Workspace Datasets</h2>
        
        <DataTable
          data={files}
          columns={columns}
          actions={actions}
          searchPlaceholder="Search datasets..."
          searchFields={["file_name", "file_type"]}
          showPagination={true}
          defaultRowsPerPage={10}
          emptyTitle="No datasets registered."
          emptyDesc="Upload a dataset to begin analyzing."
        />
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Dataset"
          description={`Are you sure you want to permanently delete "${deleteConfirm.file_name}"? This action cannot be undone.`}
          confirmText="Delete"
          isDanger={true}
          onConfirm={() => {
            handleRemoveFile(deleteConfirm.id);
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
