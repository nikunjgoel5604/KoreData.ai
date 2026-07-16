"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export default function ConfirmDialog({
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDanger = false,
}: ConfirmDialogProps) {
  return (
    <div className="ws-dialog-backdrop" onClick={onCancel}>
      <div className="ws-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="ws-dialog-header">
          <div className="ws-dialog-title">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: isDanger ? "color-mix(in srgb, var(--ws-danger) 15%, transparent)" : "color-mix(in srgb, var(--ws-warning) 15%, transparent)",
                color: isDanger ? "var(--ws-danger)" : "var(--ws-warning)",
                display: "grid",
                placeItems: "center"
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--ws-text)" }}>{title}</h2>
            </div>
          </div>
          <button
            type="button"
            className="ws-action-btn"
            onClick={onCancel}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="ws-dialog-body" style={{ marginTop: -12 }}>
          <p className="ws-dialog-desc">{description}</p>
        </div>

        <div className="ws-dialog-footer">
          <button type="button" className="ws-btn ws-btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`ws-btn ${isDanger ? "ws-btn-danger" : "ws-btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
