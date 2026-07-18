"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  Download,
  Minus,
  Settings,
  Plus
} from "lucide-react";

interface CopilotWindowState {
  left: number;
  top: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isPinned: boolean;
  lastOpenedAt: number;
  version: number;
}

interface AiAssistantDrawerProps {
  onClose?: () => void;
}

const CURRENT_STATE_VERSION = 2;

const getDefaultWindowState = (vw: number, vh: number): CopilotWindowState => {
  const w = 400;
  const h = 600;
  return {
    left: Math.max(12, vw - w - 24),
    top: Math.max(84, vh - h - 24),
    width: w,
    height: h,
    isMinimized: false,
    isMaximized: false,
    isPinned: false,
    lastOpenedAt: Date.now(),
    version: CURRENT_STATE_VERSION
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function AiAssistantDrawer({ onClose }: AiAssistantDrawerProps) {
  const {
    activeTab,
    openSection,
    edaResult,
    files,
    aiMessages,
    setAiMessages,
    aiInputText,
    setAiInputText,
    trainedModelCard,
    activeWorkspace,
    token
  } = useWorkspace();

  const [mounted, setMounted] = useState(false);
  const [modelSelector, setModelSelector] = useState("GPT-4o Enterprise");
  const [isTyping, setIsTyping] = useState(false);
  const [currentTab, setCurrentTab] = useState<"chat" | "insights" | "code" | "history">("chat");
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [snapPreview, setSnapPreview] = useState<React.CSSProperties | null>(null);

  const [viewport, setViewport] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800
  });

  const [windowState, setWindowState] = useState<CopilotWindowState>(() => {
    if (typeof window === "undefined") {
      return {
        left: 800,
        top: 100,
        width: 400,
        height: 600,
        isMinimized: false,
        isMaximized: false,
        isPinned: false,
        lastOpenedAt: Date.now(),
        version: CURRENT_STATE_VERSION
      };
    }
    const saved = localStorage.getItem("aiCopilot.windowState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.version === CURRENT_STATE_VERSION) {
          if (!isNaN(parsed.left) && !isNaN(parsed.top)) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return getDefaultWindowState(window.innerWidth, window.innerHeight);
  });

  const windowRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mounted guard for Next.js SSR Portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Monitor screen size adjustments
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load AI chat history from backend database when workspace or token changes
  useEffect(() => {
    if (!token || !activeWorkspace || activeWorkspace.startsWith("sample-")) return;

    const fetchHistory = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${API_BASE}/ai/chat/history?project_id=${activeWorkspace}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.history)) {
            if (data.history.length > 0) {
              setAiMessages(data.history);
            } else {
              setAiMessages([
                { sender: "ai", text: "Welcome to KoreData-EX AI Assistant. I can explain your dataset, recommend cleaning steps, generate reports, or compile SQL. Ask me anything!" }
              ]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch AI chat history", err);
      }
    };

    fetchHistory();
  }, [activeWorkspace, token, setAiMessages]);

  // Persist window state coordinate adjustments
  useEffect(() => {
    localStorage.setItem("aiCopilot.windowState", JSON.stringify(windowState));
  }, [windowState]);

  // Viewport Recovery System: prevents window from sliding offscreen
  useEffect(() => {
    setWindowState((prev) => {
      const maxLeft = viewport.width - prev.width - 12;
      const maxTop = viewport.height - prev.height - 12;
      const newLeft = Math.max(12, Math.min(prev.left, maxLeft));
      const newTop = Math.max(84, Math.min(prev.top, maxTop));
      if (newLeft !== prev.left || newTop !== prev.top) {
        return { ...prev, left: newLeft, top: newTop };
      }
      return prev;
    });
  }, [viewport]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isTyping]);

  // Escape key support to minimize or close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!windowState.isMinimized) {
          setWindowState((prev) => ({ ...prev, isMinimized: true }));
        } else {
          onClose?.();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [windowState.isMinimized, onClose]);

  // Quick Action triggers
  const handleQuickAction = (action: string, prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAiMessages((prev) => [...prev, { sender: "user", text: textToSend, time: timestamp }]);
    setAiInputText("");
    setIsTyping(true);

    if (token && activeWorkspace && !activeWorkspace.startsWith("sample-")) {
      try {
        const res = await fetch(`${API_BASE}/ai/chat`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            project_id: activeWorkspace,
            prompt: textToSend
          })
        });
        if (res.ok) {
          const data = await res.json();
          setIsTyping(false);
          if (data && data.success) {
            setAiMessages((prev) => [
              ...prev,
              {
                sender: "ai",
                text: data.response,
                time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to send AI chat message to backend", err);
      }
    }

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

  const handleNewChat = () => {
    setAiMessages([]);
    alert("New conversation started.");
  };

  // Draggable Handler using requestAnimationFrame (60 FPS)
  const startDragging = (e: React.MouseEvent) => {
    const isMobile = viewport.width < 640;
    const isTablet = viewport.width >= 640 && viewport.width < 1024;
    if (windowState.isMaximized || isMobile || isTablet) return;

    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("select")) return;

    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = windowState.left;
    const startTop = windowState.top;

    let finalLeft = startLeft;
    let finalTop = startTop;
    let activePreview: React.CSSProperties | null = null;
    let activeSnapState = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      finalLeft = startLeft + deltaX;
      finalTop = startTop + deltaY;

      // Restrict dragging boundaries (keeps title bar in view)
      const minLeftVisible = -windowState.width + 100;
      const maxLeftVisible = viewport.width - 100;
      const minTopVisible = 0;
      const maxTopVisible = viewport.height - 50;

      finalLeft = Math.max(minLeftVisible, Math.min(finalLeft, maxLeftVisible));
      finalTop = Math.max(minTopVisible, Math.min(finalTop, maxTopVisible));

      const mouseX = moveEvent.clientX;
      const mouseY = moveEvent.clientY;
      activePreview = null;
      activeSnapState = false;

      // Smart Snapping Edge Checkers (margin <= 20px)
      if (mouseY < 20) {
        // Snap to Maximize
        activePreview = {
          left: 12,
          top: 84,
          width: viewport.width - 24,
          height: viewport.height - 96,
          opacity: 0.15
        };
        activeSnapState = true;
      } else if (mouseX < 20) {
        if (mouseY < 120) {
          // Snap Quarter Top-Left
          activePreview = {
            left: 12,
            top: 84,
            width: viewport.width / 2 - 18,
            height: (viewport.height - 96) / 2 - 6,
            opacity: 0.15
          };
        } else if (mouseY > viewport.height - 120) {
          // Snap Quarter Bottom-Left
          activePreview = {
            left: 12,
            top: 84 + (viewport.height - 96) / 2 + 6,
            width: viewport.width / 2 - 18,
            height: (viewport.height - 96) / 2 - 6,
            opacity: 0.15
          };
        } else {
          // Snap Left Half
          activePreview = {
            left: 12,
            top: 84,
            width: viewport.width / 2 - 18,
            height: viewport.height - 96,
            opacity: 0.15
          };
        }
        activeSnapState = true;
      } else if (mouseX > viewport.width - 20) {
        if (mouseY < 120) {
          // Snap Quarter Top-Right
          activePreview = {
            left: viewport.width / 2 + 6,
            top: 84,
            width: viewport.width / 2 - 18,
            height: (viewport.height - 96) / 2 - 6,
            opacity: 0.15
          };
        } else if (mouseY > viewport.height - 120) {
          // Snap Quarter Bottom-Right
          activePreview = {
            left: viewport.width / 2 + 6,
            top: 84 + (viewport.height - 96) / 2 + 6,
            width: viewport.width / 2 - 18,
            height: (viewport.height - 96) / 2 - 6,
            opacity: 0.15
          };
        } else {
          // Snap Right Half
          activePreview = {
            left: viewport.width / 2 + 6,
            top: 84,
            width: viewport.width / 2 - 18,
            height: viewport.height - 96,
            opacity: 0.15
          };
        }
        activeSnapState = true;
      }

      window.requestAnimationFrame(() => {
        setSnapPreview(activePreview);
        if (windowRef.current && !activePreview) {
          windowRef.current.style.left = `${finalLeft}px`;
          windowRef.current.style.top = `${finalTop}px`;
        }
      });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      if (activePreview) {
        const mouseUpY = upEvent.clientY;
        setWindowState((prev) => ({
          ...prev,
          left: Number(activePreview!.left),
          top: Number(activePreview!.top),
          width: Number(activePreview!.width),
          height: Number(activePreview!.height),
          isMaximized: mouseUpY < 20
        }));
      } else {
        setWindowState((prev) => ({
          ...prev,
          left: finalLeft,
          top: finalTop
        }));
      }
      setSnapPreview(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Resizable Handler using requestAnimationFrame (60 FPS)
  const startResizing = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = windowState.width;
    const startHeight = windowState.height;
    const startLeft = windowState.left;
    const startTop = windowState.top;

    let finalWidth = startWidth;
    let finalHeight = startHeight;
    let finalLeft = startLeft;
    let finalTop = startTop;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      if (direction.includes("e")) {
        finalWidth = startWidth + deltaX;
      } else if (direction.includes("w")) {
        finalWidth = startWidth - deltaX;
        finalLeft = startLeft + deltaX;
      }

      if (direction.includes("s")) {
        finalHeight = startHeight + deltaY;
      } else if (direction.includes("n")) {
        finalHeight = startHeight - deltaY;
        finalTop = startTop + deltaY;
      }

      // Constraints bounds
      const minW = 320;
      const minH = 400;
      const maxW = Math.round(viewport.width * 0.9);
      const maxH = Math.round(viewport.height * 0.9);

      if (finalWidth < minW) {
        if (direction.includes("w")) finalLeft = startLeft + (startWidth - minW);
        finalWidth = minW;
      } else if (finalWidth > maxW) {
        if (direction.includes("w")) finalLeft = startLeft - (maxW - startWidth);
        finalWidth = maxW;
      }

      if (finalHeight < minH) {
        if (direction.includes("n")) finalTop = startTop + (startHeight - minH);
        finalHeight = minH;
      } else if (finalHeight > maxH) {
        if (direction.includes("n")) finalTop = startTop - (maxH - startHeight);
        finalHeight = maxH;
      }

      window.requestAnimationFrame(() => {
        if (windowRef.current) {
          windowRef.current.style.width = `${finalWidth}px`;
          windowRef.current.style.height = `${finalHeight}px`;
          windowRef.current.style.left = `${finalLeft}px`;
          windowRef.current.style.top = `${finalTop}px`;
        }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      setWindowState((prev) => ({
        ...prev,
        width: finalWidth,
        height: finalHeight,
        left: finalLeft,
        top: finalTop
      }));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleHeaderDoubleClick = () => {
    const isMobile = viewport.width < 640;
    const isTablet = viewport.width >= 640 && viewport.width < 1024;
    if (isMobile || isTablet) return;

    setWindowState((prev) => ({
      ...prev,
      isMaximized: !prev.isMaximized
    }));
  };

  const activeDatasetName = files.length > 0 ? files[0].file_name : "None (Pending upload)";
  const activeStageName = activeTab?.title || "Workspace Dashboard";

  if (!mounted) return null;

  // Minimized state renders FAB inside Portal
  if (windowState.isMinimized) {
    return createPortal(
      <button
        type="button"
        onClick={() => setWindowState((prev) => ({ ...prev, isMinimized: false }))}
        className="ws-ai-fab animate-fadeIn"
        aria-label="Restore AI Copilot"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--ws-ai) 0%, #6366F1 100%)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 12px 32px rgba(99, 102, 241, 0.45)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
        title="Restore AI Copilot"
      >
        <Sparkles size={24} className="animate-pulse" />
      </button>,
      document.body
    );
  }

  // Set sizing based on responsive breakpoints
  const isMobile = viewport.width < 640;
  const isTablet = viewport.width >= 640 && viewport.width < 1024;

  let containerStyle: React.CSSProperties = {
    position: "fixed",
    display: "flex",
    flexDirection: "column",
    background: "rgba(27, 38, 56, 0.85)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5)",
    zIndex: 9990,
    overflow: "hidden"
  };

  if (isMobile) {
    // Mobile Breakpoint - Full screen drawer
    containerStyle = {
      ...containerStyle,
      left: 0,
      top: 0,
      width: "100vw",
      height: "100vh",
      borderRadius: 0
    };
  } else if (isTablet) {
    // Tablet Breakpoint - Right slide-over
    containerStyle = {
      ...containerStyle,
      left: "auto",
      right: 0,
      top: 0,
      width: 440,
      height: "100vh",
      borderRadius: 0
    };
  } else if (windowState.isMaximized) {
    // Desktop break - Maximize stage
    containerStyle = {
      ...containerStyle,
      top: 84,
      bottom: 12,
      left: "calc(var(--sidebar-width) + 12px)",
      right: 12,
      width: "auto",
      height: "auto",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
    };
  } else {
    // Desktop break - Floating container state
    containerStyle = {
      ...containerStyle,
      left: windowState.left,
      top: windowState.top,
      width: windowState.width,
      height: windowState.height
    };
  }

  return createPortal(
    <>
      {/* Visual Snap Outline Backdrop Overlay */}
      {snapPreview && (
        <div
          style={{
            position: "fixed",
            ...snapPreview,
            background: "rgba(139, 92, 246, 0.12)",
            border: "2px dashed var(--ws-ai)",
            borderRadius: 18,
            zIndex: 9980,
            pointerEvents: "none",
            transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
            backdropFilter: "blur(2px)"
          }}
        />
      )}

      <aside
        ref={windowRef}
        className={`ws-ai-drawer ${(isDragging || isResizing) ? "dragging-resizing" : ""}`}
        role="dialog"
        aria-label="AI Assistant Window"
        style={containerStyle}
      >
        {/* Resize Handles (Only active on Desktop floating mode) */}
        {!windowState.isMaximized && !isMobile && !isTablet && (
          <>
            {/* North (Top) */}
            <div
              onMouseDown={(e) => startResizing(e, "n")}
              style={{ position: "absolute", top: -4, left: 6, right: 6, height: 8, cursor: "n-resize", zIndex: 100 }}
              title="Resize vertically"
            />
            {/* South (Bottom) */}
            <div
              onMouseDown={(e) => startResizing(e, "s")}
              style={{ position: "absolute", bottom: -4, left: 6, right: 6, height: 8, cursor: "s-resize", zIndex: 100 }}
              title="Resize vertically"
            />
            {/* West (Left) */}
            <div
              onMouseDown={(e) => startResizing(e, "w")}
              style={{ position: "absolute", left: -4, top: 6, bottom: 6, width: 8, cursor: "w-resize", zIndex: 100 }}
              title="Resize horizontally"
            />
            {/* East (Right) */}
            <div
              onMouseDown={(e) => startResizing(e, "e")}
              style={{ position: "absolute", right: -4, top: 6, bottom: 6, width: 8, cursor: "e-resize", zIndex: 100 }}
              title="Resize horizontally"
            />
            {/* North-West (Top-Left) */}
            <div
              onMouseDown={(e) => startResizing(e, "nw")}
              style={{ position: "absolute", top: -6, left: -6, width: 12, height: 12, cursor: "nw-resize", zIndex: 110 }}
              title="Resize diagonally"
            />
            {/* North-East (Top-Right) */}
            <div
              onMouseDown={(e) => startResizing(e, "ne")}
              style={{ position: "absolute", top: -6, right: -6, width: 12, height: 12, cursor: "ne-resize", zIndex: 110 }}
              title="Resize diagonally"
            />
            {/* South-West (Bottom-Left) */}
            <div
              onMouseDown={(e) => startResizing(e, "sw")}
              style={{ position: "absolute", bottom: -6, left: -6, width: 12, height: 12, cursor: "sw-resize", zIndex: 110 }}
              title="Resize diagonally"
            />
            {/* South-East (Bottom-Right) */}
            <div
              onMouseDown={(e) => startResizing(e, "se")}
              style={{ position: "absolute", bottom: -6, right: -6, width: 12, height: 12, cursor: "se-resize", zIndex: 110 }}
              title="Resize diagonally"
            />
          </>
        )}

        {/* Drag header handler */}
        <div
          onMouseDown={startDragging}
          onDoubleClick={handleHeaderDoubleClick}
          className="grab-handle"
          style={{
            padding: "16px 20px 12px",
            borderBottom: "1px solid var(--ws-border)",
            background: "rgba(32, 45, 66, 0.4)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            cursor: (windowState.isMaximized || isMobile || isTablet) ? "default" : "grab"
          }}
        >
          <div className="ws-row-between">
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--ws-text)" }}>
              <Sparkles size={16} style={{ color: "var(--ws-ai)" }} />
              AI Copilot
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Connection bullet */}
              <span className="ws-status-badge-header ready" style={{ padding: "3px 8px", marginRight: 4 }}>
                <span className="ws-status-bullet-header" style={{ background: "var(--ws-success)" }} />
                Ready
              </span>

              {/* Start New Chat */}
              <button
                type="button"
                onClick={handleNewChat}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ws-text-muted)", padding: 2 }}
                title="New Chat"
                aria-label="New Chat"
              >
                <Plus size={14} />
              </button>

              {/* Minimize action */}
              <button
                type="button"
                onClick={() => setWindowState((prev) => ({ ...prev, isMinimized: true }))}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ws-text-muted)", padding: 2 }}
                title="Minimize window"
                aria-label="Minimize Window"
              >
                <Minus size={14} />
              </button>

              {/* Maximize / Restore down */}
              {!isMobile && !isTablet && (
                <button
                  type="button"
                  onClick={() => setWindowState((prev) => ({ ...prev, isMaximized: !prev.isMaximized }))}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ws-text-muted)", padding: 2 }}
                  title={windowState.isMaximized ? "Restore down size" : "Maximize window"}
                  aria-label={windowState.isMaximized ? "Restore Window" : "Maximize Window"}
                >
                  {windowState.isMaximized ? <Square size={10} /> : <Maximize2 size={13} />}
                </button>
              )}

              {/* Close action */}
              <button
                type="button"
                onClick={onClose}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ws-text-muted)", padding: 2 }}
                title="Close window"
                aria-label="Close Window"
              >
                <X size={14} />
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

        {/* Top Toolbar tabs */}
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
                aria-label={`Select ${tab.label} tab`}
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

        {/* Main Copilot Content Scroll Area */}
        <div
          className="ws-scroll"
          style={{
            flex: 1,
            padding: 16,
            background: "var(--ws-card-2)",
            overflowY: "auto"
          }}
        >
          {currentTab === "chat" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Suggested prompts when clean messages */}
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

                  {/* Actions Grid */}
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

                  {/* Pills suggested */}
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

              {/* Chat thread list */}
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
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.text);
                              alert("Response copied to clipboard!");
                            }}
                            title="Copy response text"
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}
                          >
                            <Copy size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Blinking streaming circles */}
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
                    navigator.clipboard.writeText("SELECT id, COALESCE(age, (SELECT AVG(age) FROM dataset)) as age, COALESCE(income, 0) as income FROM dataset;");
                    alert("SQL script copied!");
                  }}
                  style={{ position: "absolute", top: 8, right: 8 }}
                  title="Copy SQL code"
                >
                  <Copy size={12} />
                </button>
              </div>

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
                    navigator.clipboard.writeText("from sklearn.ensemble import RandomForestClassifier\nclf = RandomForestClassifier(n_estimators=100)\nclf.fit(X_train, y_train)\nprint(\"Accuracy:\", clf.score(X_test, y_test))");
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
                  { time: "10:42 AM", text: "Generate Python script to scale variables." },
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

        {/* Input box row footer */}
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
          {/* Engine select and attachment info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <select
                value={modelSelector}
                onChange={(e) => setModelSelector(e.target.value)}
                className="ws-card-2"
                aria-label="Select AI Copilot Engine"
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

          {/* Form write area */}
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
    </>,
    document.body
  );
}
