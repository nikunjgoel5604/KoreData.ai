"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  name: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class PanelErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary - ${this.props.name}] render crash:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            minHeight: "350px",
            background: "var(--ws-card)",
            border: "1px solid var(--ws-border)",
            borderRadius: 16,
            textAlign: "center",
            margin: "20px"
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.1)",
              display: "grid",
              placeItems: "center",
              color: "var(--ws-danger)"
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--ws-text)", margin: "0 0 8px 0" }}>
              Workspace Module Error
            </h3>
            <p style={{ fontSize: 13, color: "var(--ws-text-muted)", margin: 0, maxWidth: 450, lineHeight: 1.6 }}>
              An unexpected error occurred while rendering the <strong>{this.props.name}</strong> module.
              The error has been safely trapped and logged to keep the remaining interface stable.
            </p>
            {this.state.error && (
              <pre
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: "var(--ws-workspace)",
                  border: "1px solid var(--ws-border)",
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "var(--ws-danger)",
                  overflowX: "auto",
                  maxWidth: "100%",
                  textAlign: "left"
                }}
              >
                {this.state.error.name}: {this.state.error.message}
              </pre>
            )}
          </div>
          <button
            type="button"
            className="ws-btn ws-btn-primary"
            onClick={this.handleReset}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 18px", height: 40, borderRadius: 8 }}
          >
            <RefreshCw size={14} />
            Reset Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
