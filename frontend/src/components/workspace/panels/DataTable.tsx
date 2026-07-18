"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  Download,
  Eye,
  Trash2,
  Copy,
  Printer,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Sparkles,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import EmptyState from "./EmptyState";
import { safeCompareString, safeCompareDate, safeParseFloat } from "@/utils/stability";

export interface ColumnConfig<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  type?: "text" | "number" | "date" | "status" | "quality" | "fileType" | "custom";
  render?: (row: T, index: number) => React.ReactNode;
}

export interface TableAction<T> {
  label: string;
  icon: any; // Lucide icon component
  onClick: (row: T) => void;
  danger?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  searchPlaceholder?: string;
  searchFields?: (keyof T | string)[];
  actions?: TableAction<T>[];
  onRefresh?: () => void;
  loading?: boolean;
  emptyTitle?: string;
  emptyDesc?: string;
  showPagination?: boolean;
  defaultRowsPerPage?: number;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Search records...",
  searchFields = [],
  actions = [],
  onRefresh,
  loading = false,
  emptyTitle = "No records found.",
  emptyDesc = "Upload a dataset or add entries to begin.",
  showPagination = true,
  defaultRowsPerPage = 10
}: DataTableProps<T>) {
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((col) => {
      initial[col.key] = true;
    });
    return initial;
  });
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  // Sort function
  const handleSort = (columnKey: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Toggle column visibility
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      // Ensure at least one column is visible
      const visibleKeys = Object.keys(prev).filter((k) => prev[k]);
      if (visibleKeys.length === 1 && prev[key]) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  // Filter & Search logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm && searchFields.length > 0) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) =>
        searchFields.some((field) => {
          const val = row[field as string];
          return val ? String(val).toLowerCase().includes(term) : false;
        })
      );
    }

    // Sort order
    if (sortColumn) {
      const colConfig = columns.find(c => c.key === sortColumn);
      const colType = colConfig?.type || "text";

      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (colType === "number" || colType === "quality" || sortColumn === "file_size_kb" || sortColumn === "row_count" || sortColumn === "col_count") {
          const numA = safeParseFloat(valA);
          const numB = safeParseFloat(valB);
          return sortDirection === "asc" ? numA - numB : numB - numA;
        } else if (colType === "date") {
          return safeCompareDate(valA, valB, sortDirection === "desc");
        } else {
          return safeCompareString(valA, valB, sortDirection === "desc");
        }
      });
    }

    return result;
  }, [data, searchTerm, searchFields, sortColumn, sortDirection]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  // Export handlers
  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    
    // Headers
    const visibleCols = columns.filter((col) => visibleColumns[col.key]);
    const headers = visibleCols.map((c) => c.header).join(",");
    
    // Rows
    const rows = filteredData.map((row) =>
      visibleCols
        .map((col) => {
          const cellVal = row[col.key];
          return `"${String(cellVal ?? "").replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    if (filteredData.length === 0) return;
    const visibleCols = columns.filter((col) => visibleColumns[col.key]);
    const headers = visibleCols.map((c) => c.header).join("\t");
    const rows = filteredData.map((row) =>
      visibleCols.map((col) => String(row[col.key] ?? "")).join("\t")
    );
    const text = [headers, ...rows].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      alert("Table data copied to clipboard.");
    });
  };

  // Render helpers
  const renderCellContent = (row: any, col: ColumnConfig<T>, index: number) => {
    if (col.render) {
      return col.render(row, index);
    }

    const value = row[col.key];

    if (value === undefined || value === null) {
      return <span style={{ color: "var(--ws-text-muted)" }}>NULL</span>;
    }

    switch (col.type) {
      case "status":
        const normalizedStatus = String(value).toLowerCase();
        let badgeClass = "ws-badge-draft";
        if (normalizedStatus.includes("complete") || normalizedStatus.includes("success") || normalizedStatus.includes("healthy") || normalizedStatus.includes("live") || normalizedStatus === "updated") {
          badgeClass = "ws-badge-completed";
        } else if (normalizedStatus.includes("run") || normalizedStatus.includes("progress")) {
          badgeClass = "ws-badge-running";
        } else if (normalizedStatus.includes("pend") || normalizedStatus.includes("queue")) {
          badgeClass = "ws-badge-pending";
        } else if (normalizedStatus.includes("fail") || normalizedStatus.includes("error") || normalizedStatus.includes("warn")) {
          badgeClass = "ws-badge-failed";
        }
        return <span className={badgeClass}>{String(value)}</span>;

      case "quality":
        const score = Number(value);
        let qualityClass = "low";
        if (score >= 85) qualityClass = "high";
        else if (score >= 70) qualityClass = "mid";

        return (
          <div className="ws-table-quality">
            <span className={`ws-table-quality-badge ${qualityClass}`}>{score.toFixed(1)}%</span>
            <div className="ws-table-quality-track">
              <div className={`ws-table-quality-fill ${qualityClass}`} style={{ width: `${score}%` }} />
            </div>
          </div>
        );

      case "fileType":
        const type = String(value).toLowerCase();
        let typeClass = "ws-tag-csv";
        if (type === "xlsx" || type === "excel") typeClass = "ws-tag-xlsx";
        else if (type === "json") typeClass = "ws-tag-json";
        else if (type === "parquet") typeClass = "ws-tag-parquet";
        else if (type === "sql") typeClass = "ws-tag-sql";
        else if (type === "xml") typeClass = "ws-tag-xml";
        return <span className={typeClass}>{type}</span>;

      case "number":
        return typeof value === "number" ? value.toLocaleString() : String(value);

      case "date":
        try {
          return new Date(value).toLocaleString();
        } catch {
          return String(value);
        }

      default:
        return String(value);
    }
  };

  return (
    <div className="ws-table-container">
      {/* Table Toolbar */}
      <div className="ws-table-toolbar">
        <div className="ws-table-toolbar-left">
          {searchFields.length > 0 && (
            <div className="ws-toolbar-search">
              <Search size={16} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>

        <div className="ws-table-toolbar-right">
          {onRefresh && (
            <button
              type="button"
              className="ws-action-btn"
              onClick={onRefresh}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          )}

          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="ws-action-btn"
              onClick={() => setShowVisibilityMenu((p) => !p)}
              title="Column Visibility"
            >
              <SlidersHorizontal size={14} />
            </button>

            {showVisibilityMenu && (
              <>
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 99
                  }}
                  onClick={() => setShowVisibilityMenu(false)}
                />
                <div className="ws-menu-popup">
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748B",
                      padding: "4px 8px 8px",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #2E3B52",
                      marginBottom: 6
                    }}
                  >
                    Visible Columns
                  </div>
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className="ws-menu-popup-item"
                      onClick={() => toggleColumn(col.key)}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.key]}
                        onChange={() => {}}
                        style={{ width: 14, height: 14, cursor: "pointer" }}
                      />
                      <span>{col.header}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            className="ws-action-btn"
            onClick={exportToCSV}
            disabled={filteredData.length === 0}
            title="Export CSV"
          >
            <Download size={14} />
          </button>

          <button
            type="button"
            className="ws-action-btn"
            onClick={copyToClipboard}
            disabled={filteredData.length === 0}
            title="Copy Table"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* Main Table Wrapper */}
      <div className="ws-table-wrapper">
        <table className="ws-table">
          <thead>
            <tr>
              {columns
                .filter((col) => visibleColumns[col.key])
                .map((col) => (
                  <th
                    key={col.key}
                    className={`${col.sortable ? "sortable" : ""} ${
                      col.align ? `ws-col-${col.align}` : ""
                    }`}
                    onClick={() => handleSort(col.key, col.sortable)}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <span>{col.header}</span>
                      {col.sortable && sortColumn === col.key && (
                        sortDirection === "asc" ? (
                          <ChevronUp size={14} style={{ color: "#38BDF8" }} />
                        ) : (
                          <ChevronDown size={14} style={{ color: "#38BDF8" }} />
                        )
                      )}
                    </div>
                  </th>
                ))}
              {actions.length > 0 && (
                <th className="ws-col-right" style={{ width: 100 }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: rowsPerPage }).map((_, i) => (
                <tr key={i} className="ws-skeleton-row">
                  {columns
                    .filter((col) => visibleColumns[col.key])
                    .map((col) => (
                      <td key={col.key}>
                        <div />
                      </td>
                    ))}
                  {actions.length > 0 && (
                    <td>
                      <div style={{ marginLeft: "auto" }} />
                    </td>
                  )}
                </tr>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={idx}>
                  {columns
                    .filter((col) => visibleColumns[col.key])
                    .map((col) => (
                      <td
                        key={col.key}
                        className={col.align ? `ws-col-${col.align}` : ""}
                      >
                        {renderCellContent(row, col, idx)}
                      </td>
                    ))}
                  {actions.length > 0 && (
                    <td className="ws-col-right">
                      <div className="ws-row-actions">
                        {actions.map((act) => {
                          const Icon = act.icon;
                          return (
                            <button
                              key={act.label}
                              type="button"
                              className={`ws-action-btn ${
                                act.danger ? "danger" : ""
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                act.onClick(row);
                              }}
                              title={act.label}
                            >
                              <Icon />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              // Empty State
              <tr>
                <td
                  colSpan={
                    columns.filter((col) => visibleColumns[col.key]).length +
                    (actions.length > 0 ? 1 : 0)
                  }
                >
                  <EmptyState
                    type="table"
                    title={emptyTitle}
                    description={emptyDesc}
                    primaryAction={onRefresh ? {
                      label: "Refresh Records",
                      onClick: onRefresh
                    } : undefined}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {showPagination && filteredData.length > 0 && (
        <div className="ws-table-pagination">
          <div className="ws-table-pagination-info">
            Showing{" "}
            <strong>
              {(currentPage - 1) * rowsPerPage + 1}–
              {Math.min(currentPage * rowsPerPage, filteredData.length)}
            </strong>{" "}
            of <strong>{filteredData.length.toLocaleString()}</strong> records
          </div>

          <div className="ws-table-pagination-controls">
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 12 }}>
              <span style={{ fontSize: 12, color: "#64748B" }}>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  height: 32,
                  padding: "0 28px 0 10px",
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #334155"
                }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="ws-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} />
              Prev
            </button>

            <span style={{ fontSize: 13, fontWeight: 600, color: "#F8FAFC", margin: "0 8px" }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="ws-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
