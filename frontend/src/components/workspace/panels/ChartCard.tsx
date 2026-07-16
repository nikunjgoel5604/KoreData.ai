"use client";

import React, { useState } from "react";
import {
  Download,
  Settings,
  Maximize2,
  Minimize2,
  Clock,
  EyeOff,
  Share2,
  Copy,
  FileSpreadsheet,
  FileText
} from "lucide-react";

interface ChartCardProps {
  title: string;
  description: string;
  icon: any; // Lucide icon
  lastUpdated?: string;
  children: React.ReactNode;
  onSettingsClick?: () => void;
  empty?: boolean;
  emptyTitle?: string;
  emptyDesc?: string;
}

export default function ChartCard({
  title,
  description,
  icon: Icon,
  lastUpdated = "Updated just now",
  children,
  onSettingsClick,
  empty = false,
  emptyTitle = "No data available",
  emptyDesc = "Upload a dataset to generate this visualization."
}: ChartCardProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const handleExport = (format: string) => {
    alert(`Exporting chart as ${format}...`);
    setShowExportMenu(false);
  };

  return (
    <>
      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#111827",
            zIndex: 9999,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 24,
            overflowY: "auto"
          }}
        >
          <div className="ws-row-between" style={{ borderBottom: "1px solid #2E3B52", paddingBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(59, 130, 246, 0.1)",
                  color: "#3B82F6",
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <Icon size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#F8FAFC" }}>{title}</h2>
                <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>{description}</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                className="ws-action-btn"
                onClick={toggleFullscreen}
                title="Exit Fullscreen"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#1B2638",
              borderRadius: 18,
              border: "1px solid #2E3B52",
              padding: 48,
              minHeight: 400
            }}
          >
            <div style={{ width: "100%", maxWidth: 800 }}>{children}</div>
          </div>
        </div>
      )}

      {/* Main Chart Card */}
      <div
        className="ws-form-card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          position: "relative"
        }}
      >
        {/* Card Header */}
        <div className="ws-row-between" style={{ alignItems: "start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(59, 130, 246, 0.1)",
                color: "#3B82F6",
                display: "grid",
                placeItems: "center",
                flexShrink: 0
              }}
            >
              <Icon size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#F8FAFC" }}>{title}</h3>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: "2px 0 0" }}>{description}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
            {/* Time Metadata */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                color: "#64748B",
                marginRight: 8
              }}
            >
              <Clock size={10} />
              <span>{lastUpdated}</span>
            </div>

            {/* Export Dropdown Trigger */}
            <button
              type="button"
              className="ws-action-btn"
              onClick={() => setShowExportMenu((p) => !p)}
              title="Export Visualization"
            >
              <Download size={14} />
            </button>

            {showExportMenu && (
              <>
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 99
                  }}
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="ws-menu-popup" style={{ right: 80 }}>
                  <div className="ws-menu-popup-item" onClick={() => handleExport("PNG")}>
                    <FileText size={14} />
                    <span>Download PNG</span>
                  </div>
                  <div className="ws-menu-popup-item" onClick={() => handleExport("SVG")}>
                    <FileText size={14} />
                    <span>Download SVG</span>
                  </div>
                  <div className="ws-menu-popup-item" onClick={() => handleExport("PDF")}>
                    <FileText size={14} />
                    <span>Download PDF</span>
                  </div>
                  <div className="ws-menu-popup-item" onClick={() => handleExport("CSV")}>
                    <FileSpreadsheet size={14} />
                    <span>Export CSV</span>
                  </div>
                </div>
              </>
            )}

            {/* Fullscreen Trigger */}
            <button
              type="button"
              className="ws-action-btn"
              onClick={toggleFullscreen}
              title="Fullscreen Mode"
            >
              <Maximize2 size={14} />
            </button>

            {/* Settings Trigger */}
            {onSettingsClick && (
              <button
                type="button"
                className="ws-action-btn"
                onClick={onSettingsClick}
                title="Chart Settings"
              >
                <Settings size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Card Content Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {empty ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                background: "rgba(0,0,0,0.15)",
                borderRadius: "var(--ws-radius-sm)",
                border: "1px dashed var(--ws-border-soft)",
                margin: "auto 0"
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(100, 116, 139, 0.08)",
                  color: "#64748B",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 12px"
                }}
              >
                <EyeOff size={20} />
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#CBD5E1", margin: "0 0 4px" }}>
                {emptyTitle}
              </h4>
              <p style={{ fontSize: 12, color: "#64748B", maxWidth: 280, margin: "0 auto" }}>
                {emptyDesc}
              </p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </>
  );
}
