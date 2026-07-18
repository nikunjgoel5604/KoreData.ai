"use client";

import { useState } from "react";
import { Pin, PinOff, Plus, X } from "lucide-react";
import { NAV_GROUPS, SECTION_REGISTRY } from "./sections";
import { useWorkspace } from "./WorkspaceContext";
import type { SectionId } from "./workspace.types";

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, togglePin, openSection, reorderTab } =
    useWorkspace();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const openSectionIds = new Set((tabs || []).map((t) => t.sectionId));
  const allSections: SectionId[] = NAV_GROUPS.flatMap((g) => g.sections);

  return (
    <div className="ws-tabbar" role="tablist">
      {(tabs || []).map((tab, index) => {
        const meta = SECTION_REGISTRY[tab.sectionId];
        const Icon = meta.icon;
        const isActive = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            className={`ws-tab${isActive ? " active" : ""}`}
            role="tab"
            aria-selected={isActive}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null && dragIndex !== index) {
                reorderTab(dragIndex, index);
              }
              setDragIndex(null);
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={14} />
            <span>{tab.title}</span>
            <button
              type="button"
              title={tab.pinned ? "Unpin tab" : "Pin tab"}
              onClick={(e) => {
                e.stopPropagation();
                togglePin(tab.id);
              }}
            >
              {tab.pinned ? <PinOff size={12} /> : <Pin size={12} />}
            </button>
            {tab.closable && (
              <button
                type="button"
                title="Close tab"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}

      <div style={{ position: "relative" }}>
        <button
          type="button"
          className="ws-tab-add"
          title="Open a new section"
          onClick={() => setPickerOpen((v) => !v)}
        >
          <Plus size={15} />
        </button>

        {pickerOpen && (
          <>
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 19
              }}
              onClick={() => setPickerOpen(false)}
            />
            <div
              className="ws-menu-popup ws-scroll"
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: "auto",
                zIndex: 20,
                width: 240,
                maxHeight: 320,
                display: "grid",
                gap: 2,
                marginTop: 6
              }}
            >
              {allSections
                .filter((id) => !openSectionIds.has(id))
                .map((id) => {
                  const meta = SECTION_REGISTRY[id];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={id}
                      className="ws-menu-popup-item"
                      onClick={() => {
                        openSection(id);
                        setPickerOpen(false);
                      }}
                    >
                      <Icon size={16} />
                      <span>{meta.label}</span>
                    </div>
                  );
                })}
              {allSections.every((id) => openSectionIds.has(id)) && (
                <span style={{ fontSize: 12, color: "var(--ws-text-muted)", padding: 8 }}>
                  All sections are already open.
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
