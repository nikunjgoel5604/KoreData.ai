"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWorkspace } from "./WorkspaceContext";
import {
  Sparkles,
  X,
  MessageSquareText,
  FileCode2,
  Database,
  Send,
  Paperclip,
  ShieldCheck,
  Activity,
  AlertTriangle,
  History,
  Mic,
  Copy,
  RotateCcw,
  Square,
  Search,
  Maximize2,
  ChevronDown,
  Terminal,
  Grid,
  TrendingUp,
  Cpu,
  Brain,
  Target,
  FileText,
  Download
} from "lucide-react";

interface AiAssistantDrawerProps {
  onClose?: () => void;
  width: number;
  startResizing: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

export default function AiAssistantDrawer({
  onClose,
  width,
  startResizing,
  isResizing
}: AiAssistantDrawerProps) {
  const {
    activeTab,
    openSection,
    edaResult,
    files,
    aiMessages,
    setAiMessages,
    aiInputText,
    setAiInputText,
    trainedModelCard
  } = useWorkspace();

  const [modelSelector, setModelSelector] = useState("GPT-4o Enterprise");
  const [isTyping, setIsTyping] = useState(false);
  const [currentTab, setCurrentTab] = useState<"chat" | "insights" | "code" | "history">("chat");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isTyping]);

  // Quick Action triggers
  const handleQuickAction = (action: string, prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAiMessages((prev) => [...prev, { sender: "user", text: textToSend, time: timestamp }]);
    setAiInputText("");
    setIsTyping(true);

    // AI typing simulation
    setTimeout(() => {
      setIsTyping(false);
      const datasetName = files.length > 0 ? files[0].file_name : "active_dataset.csv";
      const trainedText = trainedModelCard 
        ? `I see a Random Forest Classifier is active with an accuracy score of ${((trainedModelCard.metrics?.accuracy ?? 0.948) * 100).toFixed(1)}%.`
        : "No active model has been trained yet in ML Studio.";

      let reply = "";
      if (textToSend.toLowerCase().includes("cleaning")) {
        reply = `### Imputation & Outlier Strategy\nBased on your active dataset **${datasetName}**, I recommend performing median value imputation on columns with missing ratios exceeding 5%. Let's also apply Min-Max scaling on numeric fields. You can run these simulations inside the Data Cleaning panel.`;
      } else if (textToSend.toLowerCase().includes("model") || textToSend.toLowerCase().includes("algorithm")) {
        reply = `### Model Architecture Suggestions\n${trainedText}\nTo improve classification F1 scores, I recommend setting up a Feature Scaling preprocessing layer or switching to XGBoost with 150 estimators inside **ML Studio**.`;
      } else if (textToSend.toLowerCase().includes("explain")) {
        reply = `### Dataset Statistical Profile\n- **Rows**: ${edaResult?.overview?.rows || "2,450,000"}\n- **Columns**: ${edaResult?.overview?.columns || "48"}\n- **Data Types**: ${edaResult?.overview?.numeric_columns?.length || "8"} Numeric, ${edaResult?.overview?.categorical_columns?.length || "6"} Categorical\n\nI suggest checking the correlation matrix grid to flag multicollinearity before training linear models.`;
      } else {
        reply = `I've analyzed your data queries against the active context. Standard scaling looks healthy. Let's proceed with visual analysis or train models using ML Studio.`;
      }

      setAiMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1200);
  };

  const activeDatasetName = files.length > 0 ? files[0].file_name : "None (Pending upload)";
  const activeStageName = activeTab?.title || "Workspace Dashboard";

  return (
    <aside
      className="ws-ai-drawer"
      style={{
        width,
        minWidth: 380,
        maxWidth: 520,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--ws-card)",
        borderLeft: "1px solid var(--ws-border)",
        position: "relative"
      }}
    >
      {/* Resizer Handle */}
      <div
        onMouseDown={startResizing}
        style={{
          position: "absolute",
          top: 0,
          left: -3,
          width: 6,
          height: "100%",
          cursor: "col-resize",
          zIndex: 50,
          background: isResizing ? "var(--ws-ai)" : "transparent",
          transition: "background 0.2s ease"
        }}
      />

      {/* Header Info Panel */}
      <div
        style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid var(--ws-border)",
          background: "var(--ws-topnav)",
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}
      >
        <div className="ws-row-between">
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--ws-text)" }}>
            <Sparkles size={16} style={{ color: "var(--ws-ai)" }} />
            AI Copilot
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="ws-status-badge-header ready" style={{ padding: "3px 8px" }}>
              <span className="ws-status-bullet-header" style={{ background: "var(--ws-success)" }} />
              Ready
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Copilot"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ws-text-muted)" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Dynamic Context Fields */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: 8,
            padding: 8,
            fontSize: 10,
            color: "var(--ws-text-muted)"
          }}
        >
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ color: "var(--ws-text-muted)", display: "block" }}>WORKSPACE</span>
            <strong style={{ color: "var(--ws-text-2)" }}>Sales Analytics</strong>
          </div>
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ color: "var(--ws-text-muted)", display: "block" }}>DATASET</span>
            <strong style={{ color: "var(--ws-text-2)" }} title={activeDatasetName}>
              {activeDatasetName}
            </strong>
          </div>
          <div style={{ gridColumn: "span 2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 4 }}>
            <span style={{ color: "var(--ws-text-muted)", display: "block" }}>PIPELINE STAGE</span>
            <strong style={{ color: "var(--ws-text-2)" }}>{activeStageName}</strong>
          </div>
        </div>
      </div>

      {/* Top Toolbar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--ws-border)",
          padding: "6px 12px",
          gap: 4,
          background: "var(--ws-workspace)"
        }}
      >
        {[
          { id: "chat", label: "Chat Panel", icon: MessageSquareText },
          { id: "insights", label: "Findings", icon: Activity },
          { id: "code", label: "Code Room", icon: FileCode2 },
          { id: "history", label: "Logs", icon: History }
        ].map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCurrentTab(tab.id as any)}
              className="ws-btn"
              style={{
                flex: 1,
                fontSize: 10,
                padding: "6px 2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                background: isActive ? "rgba(139, 92, 246, 0.15)" : "transparent",
                color: isActive ? "#8B5CF6" : "#64748B",
                border: "none",
                borderRadius: 8,
                fontWeight: isActive ? 700 : 500
              }}
            >
              <Icon size={12} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Copilot Contents Area */}
      <div
        className="ws-scroll"
        style={{
          flex: 1,
          padding: 16,
          background: "var(--ws-card-2)",
          overflowY: "auto"
        }}
      >
        {/* Chat Panel */}
        {currentTab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Suggested prompts if empty list */}
            {aiMessages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "ws-fade-in 0.3s ease" }}>
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "rgba(139, 92, 246, 0.15)",
                      color: "#8B5CF6",
                      display: "grid",
                      placeItems: "center",
                      margin: "0 auto 12px"
                    }}
                  >
                    <Sparkles size={20} />
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#F8FAFC", margin: "0 0 4px" }}>
                    How can I help today?
                  </h4>
                  <p style={{ fontSize: 11, color: "#64748B", maxWidth: 260, margin: "0 auto" }}>
                    Ask about cleaning steps, statistics outliers, or run model classifications.
                  </p>
                </div>

                {/* Quick Action Cards Grid */}
                <div>
                  <span style={{ fontSize: 10, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 8, textTransform: "uppercase" }}>
                    Quick Copilot Actions
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { title: "Explain Dataset", desc: "Summarize columns shapes", icon: Database, p: "Explain the main statistical findings and shape of this dataset." },
                      { title: "Summarize EDA", desc: "Flag outliers and values", icon: Grid, p: "Run Exploratory Data Analysis outlier summaries." },
                      { title: "Recommend Cleaning", desc: "Median null interpolations", icon: TrendingUp, p: "What data cleaning steps do you recommend for this dataset?" },
                      { title: "Suggest Models", desc: "Assess random forest fits", icon: Brain, p: "Which machine learning model or algorithms do you recommend for this dataset?" }
                    ].map((act, idx) => {
                      const Icon = act.icon;
                      return (
                        <div
                          key={idx}
                          className="ws-card-2"
                          onClick={() => handleQuickAction(act.title, act.p)}
                          style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            border: "1px solid #334155",
                            borderRadius: 8
                          }}
                        >
                          <Icon size={14} style={{ color: "#8B5CF6", marginBottom: 4 }} />
                          <strong style={{ display: "block", fontSize: 11, color: "#E2E8F0" }}>{act.title}</strong>
                          <span style={{ fontSize: 9, color: "#64748B", display: "block", marginTop: 2 }}>{act.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Prompt Pills list */}
                <div>
                  <span style={{ fontSize: 10, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 8, textTransform: "uppercase" }}>
                    Suggested Prompts
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[
                      "Explain missing values.",
                      "Recommend a cleaning strategy.",
                      "Suggest important features."
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(p)}
                        className="ws-btn ws-btn-secondary"
                        style={{
                          fontSize: 10,
                          padding: "6px 10px",
                          height: "auto",
                          minWidth: "auto",
                          borderRadius: 20,
                          borderColor: "#334155"
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Conversational timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {aiMessages.map((msg, idx) => {
                const isAI = msg.sender === "ai";
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isAI ? "flex-start" : "flex-end",
                      gap: 4,
                      maxWidth: "85%",
                      alignSelf: isAI ? "flex-start" : "flex-end"
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 14,
                        background: isAI ? "var(--ws-card)" : "var(--ws-blue)",
                        border: isAI ? "1px solid var(--ws-border)" : "none",
                        color: isAI ? "var(--ws-text)" : "#FFFFFF",
                        fontSize: 12,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        boxShadow: "var(--ws-shadow-card)"
                      }}
                    >
                      {/* Markdown rendering mockup */}
                      {msg.text.startsWith("###") ? (
                        <div>
                          {msg.text.split("\n").map((line, lIdx) => {
                            if (line.startsWith("###")) {
                              return (
                                <strong key={lIdx} style={{ display: "block", color: isAI ? "var(--ws-ai)" : "inherit", marginBottom: 6, fontSize: 13 }}>
                                  {line.replace("###", "").trim()}
                                </strong>
                              );
                            }
                            if (line.startsWith("-")) {
                              return (
                                <div key={lIdx} style={{ display: "flex", gap: 6, marginLeft: 8, marginTop: 2 }}>
                                  <span>•</span>
                                  <span>{line.replace("-", "").trim()}</span>
                                </div>
                              );
                            }
                            return <p key={lIdx} style={{ margin: "4px 0" }}>{line}</p>;
                          })}
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                    {/* Timestamp & Actions */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 9,
                        color: "#64748B"
                      }}
                    >
                      <span>{(msg as any).time || "10:48 AM"}</span>
                      {isAI && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.text);
                              alert("Response copied to clipboard!");
                            }}
                            title="Copy response"
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}
                          >
                            <Copy size={10} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Streaming typing indicator */}
              {isTyping && (
                <div style={{ alignSelf: "flex-start", maxWidth: "85%", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: "var(--ws-card)",
                      border: "1px solid var(--ws-border)",
                      color: "var(--ws-text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <span className="ws-dot-stream">.</span>
                    <span className="ws-dot-stream" style={{ animationDelay: "0.2s" }}>.</span>
                    <span className="ws-dot-stream" style={{ animationDelay: "0.4s" }}>.</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* Insights tab */}
        {currentTab === "insights" && (
          <div style={{ display: "grid", gap: 12, animation: "ws-fade-in 0.3s ease" }}>
            <span style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
              Pinned Insights & Anomalies
            </span>
            
            <div className="ws-card-2" style={{ padding: 12, borderLeft: "3px solid #22C55E", background: "var(--ws-card)" }}>
              <div className="ws-row-between" style={{ marginBottom: 4 }}>
                <strong style={{ fontSize: 12, color: "#22C55E" }}>High Data Quality</strong>
                <ShieldCheck size={14} style={{ color: "#22C55E" }} />
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "var(--ws-text-2)", lineHeight: 1.4 }}>
                Workspace health is computed at 98.4%. Standard deviation vectors contain zero critical NaN loops.
              </p>
            </div>

            <div className="ws-card-2" style={{ padding: 12, borderLeft: "3px solid #3B82F6", background: "var(--ws-card)" }}>
              <div className="ws-row-between" style={{ marginBottom: 4 }}>
                <strong style={{ fontSize: 12, color: "#3B82F6" }}>Correlations Detected</strong>
                <Activity size={14} style={{ color: "#3B82F6" }} />
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "var(--ws-text-2)", lineHeight: 1.4 }}>
                Strong positive linear linkage (r = 0.89) identified between variables <code className="ws-mono" style={{ fontSize: 10 }}>income</code> and <code className="ws-mono" style={{ fontSize: 10 }}>savings</code>.
              </p>
            </div>

            <div className="ws-card-2" style={{ padding: 12, borderLeft: "3px solid #EF4444", background: "var(--ws-card)" }}>
              <div className="ws-row-between" style={{ marginBottom: 4 }}>
                <strong style={{ fontSize: 12, color: "#EF4444" }}>Missing Target Cells</strong>
                <AlertTriangle size={14} style={{ color: "#EF4444" }} />
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "var(--ws-text-2)", lineHeight: 1.4 }}>
                We detected 12.4% missing values on target column. Please use Imputation in Step 12 of EDA.
              </p>
            </div>
          </div>
        )}

        {/* Code Room tab */}
        {currentTab === "code" && (
          <div style={{ display: "grid", gap: 14, animation: "ws-fade-in 0.3s ease" }}>
            <span style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
              Recommended Code Snippets
            </span>
            
            {/* Snippet 1 */}
            <div className="ws-card-2" style={{ padding: 12, position: "relative", background: "var(--ws-card)" }}>
              <span style={{ fontSize: 10, color: "#06B6D4", fontWeight: 700, display: "block", marginBottom: 6 }}>SQL Query: Clean Workspace Data</span>
              <pre className="ws-mono" style={{ fontSize: 10, padding: 8, background: "rgba(0,0,0,0.1)", overflowX: "auto", borderRadius: 4, color: "var(--ws-text)" }}>
{`SELECT 
  id, 
  COALESCE(age, (SELECT AVG(age) FROM dataset)) as age,
  COALESCE(income, 0) as income
FROM dataset;`}
              </pre>
              <button
                type="button"
                className="ws-action-btn"
                onClick={() => {
                  navigator.clipboard.writeText("SELECT id, COALESCE(age, ...);");
                  alert("SQL script copied!");
                }}
                style={{ position: "absolute", top: 8, right: 8 }}
                title="Copy SQL code"
              >
                <Copy size={12} />
              </button>
            </div>

            {/* Snippet 2 */}
            <div className="ws-card-2" style={{ padding: 12, position: "relative", background: "var(--ws-card)" }}>
              <span style={{ fontSize: 10, color: "#22C55E", fontWeight: 700, display: "block", marginBottom: 6 }}>Python Script: Fit Model</span>
              <pre className="ws-mono" style={{ fontSize: 10, padding: 8, background: "rgba(0,0,0,0.1)", overflowX: "auto", borderRadius: 4, color: "var(--ws-text)" }}>
{`from sklearn.ensemble import RandomForestClassifier
# Fit model
clf = RandomForestClassifier(n_estimators=100)
clf.fit(X_train, y_train)
print("Accuracy:", clf.score(X_test, y_test))`}
              </pre>
              <button
                type="button"
                className="ws-action-btn"
                onClick={() => {
                  navigator.clipboard.writeText("from sklearn.ensemble import ...");
                  alert("Python script copied!");
                }}
                style={{ position: "absolute", top: 8, right: 8 }}
                title="Copy Python code"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>
        )}

        {/* History tab */}
        {currentTab === "history" && (
          <div style={{ display: "grid", gap: 12, animation: "ws-fade-in 0.3s ease" }}>
            <span style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
              Workspace Prompt History
            </span>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                { time: "10:48 AM", text: "Explain missing cell ratios for age." },
                { time: "10:42 AM", text: "Generate Python script to standard scale numeric variables." },
                { time: "10:30 AM", text: "What clustering algorithms are available?" }
              ].map((item, idx) => (
                <div key={idx} className="ws-card-2" style={{ padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ws-card)" }}>
                  <span style={{ fontSize: 12, color: "var(--ws-text)" }}>{item.text}</span>
                  <small style={{ fontSize: 10, color: "var(--ws-text-muted)" }}>{item.time}</small>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input row footer */}
      <div
        style={{
          borderTop: "1px solid var(--ws-border)",
          padding: 16,
          background: "var(--ws-card-2)",
          display: "flex",
          flexDirection: "column",
          gap: 10
        }}
      >
        {/* Model Selection and Attachment */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <select
              value={modelSelector}
              onChange={(e) => setModelSelector(e.target.value)}
              className="ws-card-2"
              style={{
                fontSize: 10,
                padding: "4px 20px 4px 8px",
                borderRadius: 6,
                border: "1px solid var(--ws-border)",
                color: "var(--ws-text)",
                cursor: "pointer"
              }}
            >
              <option value="GPT-4o Enterprise">GPT-4o Enterprise</option>
              <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
              <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
            </select>
          </div>

          <span style={{ fontSize: 9, color: "#64748B" }}>
            Model parameters active
          </span>
        </div>

        {/* Input box */}
        <div
          style={{
            background: "var(--ws-card)",
            borderRadius: 12,
            border: "1px solid var(--ws-border)",
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}
        >
          <textarea
            value={aiInputText}
            onChange={(e) => setAiInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(aiInputText);
              }
            }}
            placeholder="Ask anything about your data..."
            rows={2}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--ws-text)",
              fontSize: 12,
              resize: "none",
              fontFamily: "inherit"
            }}
          />

          <div className="ws-row-between" style={{ borderTop: "1px solid var(--ws-border)", paddingTop: 6 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => alert("File attachment opened...")}
                title="Attach Dataset File"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ws-text-muted)" }}
              >
                <Paperclip size={14} />
              </button>
              <button
                type="button"
                onClick={() => alert("Voice input activated...")}
                title="Voice Input"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ws-text-muted)" }}
              >
                <Mic size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSendMessage(aiInputText)}
              aria-label="Send message"
              style={{
                background: "var(--ws-ai)",
                border: "none",
                borderRadius: 8,
                width: 28,
                height: 28,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "#FFFFFF",
                boxShadow: "0 4px 10px color-mix(in srgb, var(--ws-ai) 30%, transparent)"
              }}
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
