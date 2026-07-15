"use client";

import { useWorkspace } from "./WorkspaceContext";
import {
  Sparkles,
  X,
  MessageSquareText,
  Wand2,
  FileCode2,
  Database,
  Send,
  Paperclip,
  ShieldCheck,
  Activity,
  AlertTriangle,
  History
} from "lucide-react";

export default function AiAssistantDrawer({ onClose }: { onClose?: () => void }) {
  const {
    activeTab,
    aiTab,
    setAiTab,
    aiMessages,
    setAiMessages,
    aiInputText,
    setAiInputText
  } = useWorkspace();

  const suggestedChips = [
    { text: "Explain Dataset", prompt: "Explain the main statistical findings and shape of this dataset." },
    { text: "Suggest Cleaning", prompt: "What data cleaning steps do you recommend for this dataset?" },
    { text: "Explain Metrics", prompt: "Explain the machine learning classification metrics in ML Studio." },
    { text: "Generate Python", prompt: "Write a Python script to build a random forest model on this dataset." }
  ];

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;
    setAiMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setAiInputText("");

    setTimeout(() => {
      const datasetName = activeTab?.title || "your dataset";
      setAiMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `I've analyzed the query: "${textToSend}". Based on the loaded workspace data: "${datasetName}", the variables are ready for feature scaling. Please use the Scaling option in step 12 of EDA to standardize your numeric fields.`
        }
      ]);
    }, 800);
  };

  const handleCopyCode = (code: string, alertText: string) => {
    navigator.clipboard.writeText(code);
    alert(alertText);
  };

  return (
    <aside className="ws-ai-drawer" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      
      {/* Header */}
      <div className="ws-ai-header">
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
          <Sparkles size={16} style={{ color: "var(--ws-blue)" }} />
          AI Assistant
        </span>
        <button type="button" onClick={onClose} aria-label="Close assistant" style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}>
          <X size={16} />
        </button>
      </div>

      {/* Tabs list Selector */}
      <div className="ws-ai-tabs" style={{ display: "flex", borderBottom: "1px solid var(--ws-border-soft)", padding: "4px 8px", gap: 4 }}>
        {[
          { id: "chat", label: "Chat", icon: MessageSquareText },
          { id: "code", label: "Code", icon: FileCode2 },
          { id: "insights", label: "Insights", icon: Sparkles },
          { id: "history", label: "History", icon: History }
        ].map((tab) => {
          const isActive = aiTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAiTab(tab.id as any)}
              className={`ws-btn${isActive ? " active" : ""}`}
              style={{
                flex: 1,
                fontSize: 11,
                padding: "6px 4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                background: isActive ? "rgba(56, 189, 248, 0.1)" : "transparent",
                color: isActive ? "var(--ws-blue)" : "var(--ws-text-muted)",
                border: "none",
                borderRadius: "var(--ws-radius-sm)",
                fontWeight: isActive ? 700 : 500
              }}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents area */}
      <div className="ws-ai-chat ws-scroll" style={{ flex: 1, padding: 16, overflowY: "auto" }}>
        
        {/* Chat tab */}
        {aiTab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
            {/* Suggested Prompts Grid */}
            <div>
              <span style={{ fontSize: 10, color: "var(--ws-text-muted)", textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 700 }}>
                Suggested Prompts
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {suggestedChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAiInputText(chip.prompt)}
                    className="ws-card-2"
                    style={{
                      padding: 8,
                      fontSize: 11,
                      textAlign: "left",
                      cursor: "pointer",
                      border: "1px solid var(--ws-border-soft)",
                      borderRadius: "var(--ws-radius-sm)"
                    }}
                  >
                    {chip.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversational timeline */}
            <div style={{ display: "grid", gap: 12, minHeight: 0 }}>
              {aiMessages.map((msg, idx) => {
                const isAI = msg.sender === "ai";
                return (
                  <div
                    key={idx}
                    className="ws-card-2"
                    style={{
                      padding: 12,
                      background: isAI ? "rgba(0,0,0,0.15)" : "rgba(56, 189, 248, 0.08)",
                      border: isAI ? "1px solid var(--ws-border-soft)" : "1px solid rgba(56, 189, 248, 0.2)",
                      borderRadius: "var(--ws-radius-sm)"
                    }}
                  >
                    <span style={{ fontSize: 9, color: "var(--ws-text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4, fontWeight: 700 }}>
                      {isAI ? "KoreData AI" : "User"}
                    </span>
                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{msg.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Code suggestions tab */}
        {aiTab === "code" && (
          <div style={{ display: "grid", gap: 14 }}>
            <span style={{ fontSize: 10, color: "var(--ws-text-muted)", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
              Recommended Code Snippets
            </span>
            
            {/* Snippet 1 */}
            <div className="ws-card-2" style={{ padding: 12, position: "relative" }}>
              <span style={{ fontSize: 10, color: "var(--ws-blue)", fontWeight: 700, display: "block", marginBottom: 6 }}>SQL Query: Clean Workspace Data</span>
              <pre className="ws-mono" style={{ fontSize: 10, padding: 8, background: "rgba(0,0,0,0.15)", overflowX: "auto", borderRadius: 4 }}>
{`SELECT 
  id, 
  COALESCE(age, (SELECT AVG(age) FROM dataset)) as age,
  COALESCE(income, 0) as income
FROM dataset;`}
              </pre>
              <button
                type="button"
                onClick={() => handleCopyCode("SELECT id, COALESCE(age, (SELECT AVG(age) FROM dataset)) as age, COALESCE(income, 0) as income FROM dataset;", "SQL Query copied!")}
                style={{ position: "absolute", top: 12, right: 12, fontSize: 10, background: "transparent", border: "none", cursor: "pointer", color: "var(--ws-blue)", fontWeight: 700 }}
              >
                Copy
              </button>
            </div>

            {/* Snippet 2 */}
            <div className="ws-card-2" style={{ padding: 12, position: "relative" }}>
              <span style={{ fontSize: 10, color: "var(--ws-success)", fontWeight: 700, display: "block", marginBottom: 6 }}>Python Script: Fit Model</span>
              <pre className="ws-mono" style={{ fontSize: 10, padding: 8, background: "rgba(0,0,0,0.15)", overflowX: "auto", borderRadius: 4 }}>
{`from sklearn.ensemble import RandomForestClassifier
# Fit model
clf = RandomForestClassifier(n_estimators=100)
clf.fit(X_train, y_train)
print("Accuracy:", clf.score(X_test, y_test))`}
              </pre>
              <button
                type="button"
                onClick={() => handleCopyCode("from sklearn.ensemble import RandomForestClassifier\nclf = RandomForestClassifier(n_estimators=100)\nclf.fit(X_train, y_train)\nprint(clf.score(X_test, y_test))", "Python script copied!")}
                style={{ position: "absolute", top: 12, right: 12, fontSize: 10, background: "transparent", border: "none", cursor: "pointer", color: "var(--ws-success)", fontWeight: 700 }}
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Insights tab */}
        {aiTab === "insights" && (
          <div style={{ display: "grid", gap: 12 }}>
            <span style={{ fontSize: 10, color: "var(--ws-text-muted)", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
              Pinned Insights & Anomalies
            </span>
            
            <div className="ws-card-2" style={{ padding: 12, borderLeft: "3px solid var(--ws-success)" }}>
              <div className="ws-row-between" style={{ marginBottom: 4 }}>
                <strong style={{ fontSize: 12, color: "var(--ws-success)" }}>High Data Quality</strong>
                <ShieldCheck size={14} style={{ color: "var(--ws-success)" }} />
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "var(--ws-text-muted)", lineHeight: 1.4 }}>
                Workspace health is computed at 98.4%. Standard deviation vectors contain zero critical NaN loops.
              </p>
            </div>

            <div className="ws-card-2" style={{ padding: 12, borderLeft: "3px solid var(--ws-blue)" }}>
              <div className="ws-row-between" style={{ marginBottom: 4 }}>
                <strong style={{ fontSize: 12, color: "var(--ws-blue)" }}>Correlations Detected</strong>
                <Activity size={14} style={{ color: "var(--ws-blue)" }} />
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "var(--ws-text-muted)", lineHeight: 1.4 }}>
                Strong positive linear linkage (r = 0.89) identified between variables <code className="ws-mono" style={{ fontSize: 10 }}>income</code> and <code className="ws-mono" style={{ fontSize: 10 }}>savings</code>.
              </p>
            </div>

            <div className="ws-card-2" style={{ padding: 12, borderLeft: "3px solid var(--ws-danger)" }}>
              <div className="ws-row-between" style={{ marginBottom: 4 }}>
                <strong style={{ fontSize: 12, color: "var(--ws-danger)" }}>Missing Target Cells</strong>
                <AlertTriangle size={14} style={{ color: "var(--ws-danger)" }} />
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "var(--ws-text-muted)", lineHeight: 1.4 }}>
                We detected 12.4% missing values on target column. Please use Imputation in Step 12 of EDA.
              </p>
            </div>
          </div>
        )}

        {/* History tab */}
        {aiTab === "history" && (
          <div style={{ display: "grid", gap: 12 }}>
            <span style={{ fontSize: 10, color: "var(--ws-text-muted)", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
              Workspace Prompt History
            </span>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                { time: "10:48 AM", text: "Explain missing cell ratios for age." },
                { time: "10:42 AM", text: "Generate Python script to standard scale numeric variables." },
                { time: "10:30 AM", text: "What clustering algorithms are available?" }
              ].map((item, idx) => (
                <div key={idx} className="ws-card-2" style={{ padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12 }}>{item.text}</span>
                  <small style={{ fontSize: 10, color: "var(--ws-text-muted)" }}>{item.time}</small>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Input panel footer */}
      <div className="ws-ai-input-row" style={{ borderTop: "1px solid var(--ws-border-soft)", padding: 12 }}>
        <div className="ws-ai-input-box" style={{ background: "rgba(0,0,0,0.15)", borderRadius: "var(--ws-radius-sm)", border: "1px solid var(--ws-border-soft)", padding: "6px 10px", display: "flex", alignItems: "center", gap: 8 }}>
          <Paperclip size={14} style={{ color: "var(--ws-text-muted)" }} />
          <input
            value={aiInputText}
            onChange={(e) => setAiInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage(aiInputText);
              }
            }}
            placeholder="Ask anything about your data..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "inherit", fontSize: 12 }}
          />
          <button 
            type="button" 
            onClick={() => handleSendMessage(aiInputText)}
            aria-label="Send message"
            style={{ background: "transparent", border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--ws-blue)" }}
          >
            <Send size={14} />
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <button 
            type="button" 
            className="ws-btn" 
            style={{ fontSize: 10, padding: "4px 8px" }}
            onClick={() => alert("Dataset attached successfully.")}
          >
            Attach Dataset
          </button>
          <span style={{ fontSize: 9, color: "var(--ws-text-muted)" }}>AI responses may vary. Verify insights.</span>
        </div>
      </div>

    </aside>
  );
}
