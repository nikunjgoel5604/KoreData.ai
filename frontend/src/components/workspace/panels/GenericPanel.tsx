"use client";

import type { SectionMeta } from "../sections";
import ModuleHeader from "./ModuleHeader";
import type { SectionId } from "../workspace.types";

export default function GenericPanel({ section }: { section: SectionMeta }) {
  const Icon = section.icon;

  return (
    <>
      <ModuleHeader sectionId={section.id as SectionId} />
      <div className="ws-card">
        <div className="ws-placeholder">
          <span className="ws-placeholder-icon">
            <Icon size={26} />
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ws-text)" }}>
              {section.label} is scaffolded and ready
            </div>
            <p style={{ maxWidth: 460, margin: "8px auto 0" }}>{section.description}</p>
          </div>
          <span style={{ fontSize: 12, color: "var(--ws-text-muted)" }}>
            This panel will be wired to its backend endpoint in the next build phase.
          </span>
        </div>
      </div>
    </>
  );
}
