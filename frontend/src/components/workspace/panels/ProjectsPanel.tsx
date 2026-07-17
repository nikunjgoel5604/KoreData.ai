"use client";

import React, { useState, useMemo } from "react";
import { useWorkspace } from "../WorkspaceContext";
import ModuleHeader from "./ModuleHeader";
import {
  TrendingUp,
  Brain,
  BarChart3,
  Database,
  Folder,
  MoreVertical,
  Star,
  Search,
  Plus,
  Share2,
  Trash2,
  Copy,
  Archive,
  Users,
  Info,
  SlidersHorizontal,
  FolderOpen,
  Calendar,
  Layers,
  HardDrive,
  Users2,
  UserCheck,
  CheckCircle,
  FileText,
  X
} from "lucide-react";
import ConfirmDialog from "../ConfirmDialog";

const ProjectIconMap: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  "trending-up": TrendingUp,
  "brain": Brain,
  "bar-chart": BarChart3,
  "database": Database,
  "folder": Folder
};

const themeColors: Record<string, string> = {
  blue: "#3B82F6",
  purple: "#8B5CF6",
  cyan: "#06B6D4",
  green: "#10B981",
  orange: "#F97316"
};

export default function ProjectsPanel() {
  const {
    projects,
    addProject,
    deleteProject,
    duplicateProject,
    updateProject,
    toggleFavoriteProject,
    changeWorkspace,
    openSection,
    projectsFilter,
    setProjectsFilter,
    activeWorkspace
  } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState("");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<"name" | "lastModified" | "progress" | "storage">("lastModified");

  // Create Project Modal States
  const [createOpen, setCreateOpen] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projIcon, setProjIcon] = useState("folder");
  const [projTheme, setProjTheme] = useState("blue");
  const [projTemplate, setProjTemplate] = useState("Custom");
  const [projType, setProjType] = useState("Predictive Analysis");
  const [projVisibility, setProjVisibility] = useState<"private" | "team" | "public">("private");
  const [projTags, setProjTags] = useState("");

  // Share Dialog States
  const [shareProj, setShareProj] = useState<any | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor" | "admin">("viewer");

  // Edit/Rename Dialog States
  const [editProj, setEditProj] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Project context menu active item
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter projects list
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Sidebar tab filters
      if (projectsFilter === "favorites" && !p.isFavorite) return false;
      if (projectsFilter === "shared" && p.isSample) return false; // mockup: shared with me excludes samples
      if (projectsFilter === "templates" && p.industryTemplate === "Custom") return false;

      // 2. Search query filter
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      // 3. Toolbar filters
      if (templateFilter !== "all" && p.industryTemplate !== templateFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;

      return true;
    }).sort((a, b) => {
      if (sortField === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortField === "progress") {
        return b.pipelineProgress - a.pipelineProgress;
      }
      if (sortField === "storage") {
        return b.storageUsed.localeCompare(a.storageUsed);
      }
      return b.lastModified.localeCompare(a.lastModified); // default last modified
    });
  }, [projects, projectsFilter, searchQuery, templateFilter, statusFilter, sortField]);

  // Handlers
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;

    addProject({
      name: projName,
      description: projDesc,
      icon: projIcon,
      colorTheme: projTheme,
      industryTemplate: projTemplate,
      projectType: projType,
      visibility: projVisibility,
      tags: projTags.split(",").map((t) => t.trim()).filter(Boolean)
    });

    // Reset fields
    setProjName("");
    setProjDesc("");
    setProjIcon("folder");
    setProjTheme("blue");
    setProjTemplate("Custom");
    setProjVisibility("private");
    setProjTags("");
    setCreateOpen(false);
  };

  const handleOpenProject = (id: string) => {
    changeWorkspace(id);
    openSection("dashboard");
  };

  const handleShareInvite = () => {
    if (!inviteEmail.trim() || !shareProj) return;
    const updatedMembers = [
      ...(shareProj.teamMembers || []),
      { name: inviteEmail.split("@")[0], email: inviteEmail, role: inviteRole }
    ];
    updateProject(shareProj.id, { teamMembers: updatedMembers });
    setInviteEmail("");
    alert(`Teammate invited: ${inviteEmail} as ${inviteRole}`);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProj || !editName.trim()) return;
    updateProject(editProj.id, { name: editName, description: editDesc });
    setEditProj(null);
  };

  const renderIcon = (iconName: string, color: string) => {
    const IconComponent = ProjectIconMap[iconName] || Folder;
    return <IconComponent size={20} style={{ color }} />;
  };

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24, minHeight: "100%" }}>
      {/* Dynamic Header */}
      <div className="ws-row-between">
        <ModuleHeader sectionId="projects" />
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="ws-btn ws-btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 18px", borderRadius: 10 }}
        >
          <Plus size={16} />
          Create Project
        </button>
      </div>

      {/* Projects Filters Sub-bar */}
      <div
        className="ws-card-2"
        style={{
          padding: 16,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 16,
          background: "var(--ws-card)",
          borderRadius: 14,
          border: "1px solid var(--ws-border)"
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
          <Search
            size={16}
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ws-text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search projects by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              height: 40,
              padding: "0 16px 0 42px",
              background: "var(--ws-workspace)",
              border: "1px solid var(--ws-border)",
              borderRadius: 10,
              color: "var(--ws-text)",
              outline: "none",
              fontSize: 13
            }}
          />
        </div>

        {/* Template Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ws-text-muted)" }}>Template:</span>
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            style={{
              height: 40,
              padding: "0 12px",
              background: "var(--ws-workspace)",
              border: "1px solid var(--ws-border)",
              borderRadius: 10,
              color: "var(--ws-text)",
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            <option value="all">All Templates</option>
            <option value="Finance">Finance</option>
            <option value="Telecom">Telecom</option>
            <option value="Marketing">Marketing</option>
            <option value="Retail">Retail</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ws-text-muted)" }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: 40,
              padding: "0 12px",
              background: "var(--ws-workspace)",
              border: "1px solid var(--ws-border)",
              borderRadius: 10,
              color: "var(--ws-text)",
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ws-text-muted)" }}>Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            style={{
              height: 40,
              padding: "0 12px",
              background: "var(--ws-workspace)",
              border: "1px solid var(--ws-border)",
              borderRadius: 10,
              color: "var(--ws-text)",
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            <option value="lastModified">Last Modified</option>
            <option value="name">Name</option>
            <option value="progress">Pipeline Progress</option>
            <option value="storage">Storage Used</option>
          </select>
        </div>
      </div>

      {/* Grid of Projects */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {filteredProjects.map((p) => {
          const accentColor = themeColors[p.colorTheme] || "#3B82F6";
          const isSample = p.isSample;

          return (
            <div
              key={p.id}
              className="ws-card-2 ws-project-card"
              style={{
                background: "var(--ws-card)",
                border: "1px solid var(--ws-border)",
                borderLeft: `5px solid ${accentColor}`,
                borderRadius: 16,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                cursor: "default"
              }}
            >
              {/* Header Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                      display: "grid",
                      placeItems: "center"
                    }}
                  >
                    {renderIcon(p.icon, accentColor)}
                  </div>
                  <div>
                    <h3
                      onClick={() => handleOpenProject(p.id)}
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--ws-text)",
                        margin: 0,
                        cursor: "pointer",
                        textDecoration: "none"
                      }}
                      className="ws-project-title-hover"
                    >
                      {p.name}
                    </h3>
                    <span style={{ fontSize: 11, color: "var(--ws-text-muted)" }}>
                      {p.industryTemplate} • {p.projectType}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 4, alignItems: "center", position: "relative" }}>
                  {/* Favorite Icon */}
                  <button
                    type="button"
                    onClick={() => toggleFavoriteProject(p.id)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: p.isFavorite ? "#EAB308" : "var(--ws-text-muted)", padding: 4 }}
                    title="Toggle Favorite"
                  >
                    <Star size={16} fill={p.isFavorite ? "#EAB308" : "transparent"} />
                  </button>

                  {/* Actions Menu */}
                  <button
                    type="button"
                    onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ws-text-muted)", padding: 4 }}
                    title="Actions Menu"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Dropdown Options */}
                  {activeMenuId === p.id && (
                    <>
                      <div
                        onClick={() => setActiveMenuId(null)}
                        style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, zIndex: 1000 }}
                      />
                      <div
                        className="ws-card"
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 28,
                          width: 170,
                          background: "var(--ws-card)",
                          border: "1px solid var(--ws-border)",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                          borderRadius: 10,
                          padding: "6px 0",
                          zIndex: 1010,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2
                        }}
                      >
                        <button
                          type="button"
                          className="ws-btn"
                          onClick={() => {
                            setActiveMenuId(null);
                            handleOpenProject(p.id);
                          }}
                          style={{
                            border: "none",
                            borderRadius: 0,
                            padding: "8px 14px",
                            fontSize: 12,
                            width: "100%",
                            textAlign: "left",
                            background: "transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                          }}
                        >
                          <FolderOpen size={13} />
                          Open
                        </button>
                        <button
                          type="button"
                          className="ws-btn"
                          onClick={() => {
                            setActiveMenuId(null);
                            setEditProj(p);
                            setEditName(p.name);
                            setEditDesc(p.description);
                          }}
                          style={{
                            border: "none",
                            borderRadius: 0,
                            padding: "8px 14px",
                            fontSize: 12,
                            width: "100%",
                            textAlign: "left",
                            background: "transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                          }}
                        >
                          <Calendar size={13} />
                          Rename / Edit
                        </button>
                        <button
                          type="button"
                          className="ws-btn"
                          onClick={() => {
                            setActiveMenuId(null);
                            duplicateProject(p.id);
                          }}
                          style={{
                            border: "none",
                            borderRadius: 0,
                            padding: "8px 14px",
                            fontSize: 12,
                            width: "100%",
                            textAlign: "left",
                            background: "transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                          }}
                        >
                          <Copy size={13} />
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="ws-btn"
                          onClick={() => {
                            setActiveMenuId(null);
                            setShareProj(p);
                          }}
                          style={{
                            border: "none",
                            borderRadius: 0,
                            padding: "8px 14px",
                            fontSize: 12,
                            width: "100%",
                            textAlign: "left",
                            background: "transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                          }}
                        >
                          <Share2 size={13} />
                          Share / Team
                        </button>
                        <button
                          type="button"
                          className="ws-btn"
                          onClick={() => {
                            setActiveMenuId(null);
                            if (isSample) return alert("Cannot archive sample projects.");
                            updateProject(p.id, { status: p.status === "Archived" ? "Active" : "Archived" });
                          }}
                          disabled={isSample}
                          style={{
                            border: "none",
                            borderRadius: 0,
                            padding: "8px 14px",
                            fontSize: 12,
                            width: "100%",
                            textAlign: "left",
                            background: "transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            opacity: isSample ? 0.4 : 1
                          }}
                        >
                          <Archive size={13} />
                          {p.status === "Archived" ? "Restore" : "Archive"}
                        </button>
                        <hr style={{ border: "none", borderTop: "1px solid var(--ws-border)", margin: "4px 0" }} />
                        <button
                          type="button"
                          className="ws-btn"
                          onClick={() => {
                            setActiveMenuId(null);
                            deleteProject(p.id);
                          }}
                          disabled={isSample}
                          style={{
                            border: "none",
                            borderRadius: 0,
                            padding: "8px 14px",
                            fontSize: 12,
                            width: "100%",
                            textAlign: "left",
                            background: "transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: "var(--ws-danger)",
                            opacity: isSample ? 0.4 : 1
                          }}
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: 12,
                  color: "var(--ws-text-muted)",
                  margin: 0,
                  lineHeight: 1.5,
                  minHeight: 36,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {p.description}
              </p>

              {/* Storage, Datasets, ML Models count tags */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  background: "var(--ws-workspace)",
                  padding: 10,
                  borderRadius: 10,
                  fontSize: 11
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <span style={{ display: "block", color: "var(--ws-text-muted)", fontSize: 9 }}>DATASETS</span>
                  <strong style={{ color: "var(--ws-text)" }}>{p.datasetCount}</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ display: "block", color: "var(--ws-text-muted)", fontSize: 9 }}>MODELS</span>
                  <strong style={{ color: "var(--ws-text)" }}>{p.modelsCount}</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ display: "block", color: "var(--ws-text-muted)", fontSize: 9 }}>STORAGE</span>
                  <strong style={{ color: "var(--ws-text)" }}>{p.storageUsed}</strong>
                </div>
              </div>

              {/* Pipeline Progress and Status */}
              <div>
                <div className="ws-row-between" style={{ fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: "var(--ws-text-muted)" }}>Pipeline Progress:</span>
                  <strong style={{ color: accentColor }}>{p.pipelineProgress}%</strong>
                </div>
                <div className="ws-progress-bar" style={{ height: 6 }}>
                  <div className="ws-progress-fill" style={{ width: `${p.pipelineProgress}%`, background: accentColor }} />
                </div>
              </div>

              {/* Footer row (Owner, team avatars, tags) */}
              <div
                className="ws-row-between"
                style={{
                  borderTop: "1px solid var(--ws-border)",
                  paddingTop: 12,
                  marginTop: 4,
                  fontSize: 11
                }}
              >
                {/* Team Members */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ display: "flex", marginLeft: 4 }}>
                    {(p.teamMembers || []).slice(0, 3).map((m: any, mIdx: number) => (
                      <div
                        key={mIdx}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${accentColor}, #4F46E5)`,
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 700,
                          display: "grid",
                          placeItems: "center",
                          border: "1px solid var(--ws-card)",
                          marginLeft: mIdx > 0 ? -6 : 0,
                          cursor: "default"
                        }}
                        title={`${m.name} (${m.role})`}
                      >
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                    ))}
                    {(p.teamMembers || []).length > 3 && (
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "#334155",
                          color: "#fff",
                          fontSize: 8,
                          display: "grid",
                          placeItems: "center",
                          border: "1px solid var(--ws-card)",
                          marginLeft: -6
                        }}
                      >
                        +{(p.teamMembers || []).length - 3}
                      </div>
                    )}
                  </div>
                  <span style={{ color: "var(--ws-text-muted)", fontSize: 10 }}>
                    {p.owner === "Nikunj Goel" ? "Owner: Me" : `Owner: ${p.owner}`}
                  </span>
                </div>

                {/* Status chip */}
                <span
                  className={`ws-status-badge ${p.status === "Active" ? "ready" : (p.status === "Archived" ? "failed" : "running")}`}
                  style={{ textTransform: "uppercase", fontSize: 9 }}
                >
                  <span className="ws-status-bullet" style={{ background: p.status === "Active" ? "var(--ws-success)" : "var(--ws-danger)" }} />
                  {p.status}
                </span>
              </div>

              {/* Tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {(p.tags || []).map((tag: string, tIdx: number) => (
                  <span
                    key={tIdx}
                    style={{
                      fontSize: 9,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "var(--ws-text-muted)"
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Project */}
      {createOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 10000
          }}
        >
          <div
            className="ws-card"
            style={{
              width: "100%",
              maxWidth: 500,
              background: "var(--ws-card)",
              border: "1px solid var(--ws-border)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: 20
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--ws-text)" }}>Create New Project</h3>
            <form onSubmit={handleCreateProject} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Name */}
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--ws-text-muted)", marginBottom: 6 }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Analysis Q2"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    background: "var(--ws-workspace)",
                    border: "1px solid var(--ws-border)",
                    borderRadius: 10,
                    color: "var(--ws-text)",
                    outline: "none"
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--ws-text-muted)", marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  placeholder="Enter a brief summary of the workspace target..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "var(--ws-workspace)",
                    border: "1px solid var(--ws-border)",
                    borderRadius: 10,
                    color: "var(--ws-text)",
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "none"
                  }}
                />
              </div>

              {/* Grid: Theme & Icon */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Icon */}
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--ws-text-muted)", marginBottom: 6 }}>
                    Project Icon
                  </label>
                  <select
                    value={projIcon}
                    onChange={(e) => setProjIcon(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 12px",
                      background: "var(--ws-workspace)",
                      border: "1px solid var(--ws-border)",
                      borderRadius: 10,
                      color: "var(--ws-text)"
                    }}
                  >
                    <option value="folder">Folder</option>
                    <option value="database">Database</option>
                    <option value="brain">Brain (AI)</option>
                    <option value="trending-up">Trending Up</option>
                    <option value="bar-chart">Bar Chart</option>
                  </select>
                </div>

                {/* Color Theme */}
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--ws-text-muted)", marginBottom: 6 }}>
                    Color Theme
                  </label>
                  <select
                    value={projTheme}
                    onChange={(e) => setProjTheme(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 12px",
                      background: "var(--ws-workspace)",
                      border: "1px solid var(--ws-border)",
                      borderRadius: 10,
                      color: "var(--ws-text)"
                    }}
                  >
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="cyan">Cyan</option>
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                  </select>
                </div>
              </div>

              {/* Template & Visibility */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Industry Template */}
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--ws-text-muted)", marginBottom: 6 }}>
                    Industry Template
                  </label>
                  <select
                    value={projTemplate}
                    onChange={(e) => setProjTemplate(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 12px",
                      background: "var(--ws-workspace)",
                      border: "1px solid var(--ws-border)",
                      borderRadius: 10,
                      color: "var(--ws-text)"
                    }}
                  >
                    <option value="Custom">Custom Template</option>
                    <option value="Retail">Retail Analytics</option>
                    <option value="Telecom">Telecom Churn</option>
                    <option value="Marketing">Marketing ROI</option>
                    <option value="Finance">Finance Forecasting</option>
                  </select>
                </div>

                {/* Visibility */}
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--ws-text-muted)", marginBottom: 6 }}>
                    Visibility
                  </label>
                  <select
                    value={projVisibility}
                    onChange={(e: any) => setProjVisibility(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 12px",
                      background: "var(--ws-workspace)",
                      border: "1px solid var(--ws-border)",
                      borderRadius: 10,
                      color: "var(--ws-text)"
                    }}
                  >
                    <option value="private">Private (Only Me)</option>
                    <option value="team">Team Shared</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--ws-text-muted)", marginBottom: 6 }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sales, Q2, Forecast"
                  value={projTags}
                  onChange={(e) => setProjTags(e.target.value)}
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    background: "var(--ws-workspace)",
                    border: "1px solid var(--ws-border)",
                    borderRadius: 10,
                    color: "var(--ws-text)",
                    outline: "none"
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="ws-btn ws-btn-secondary"
                  style={{ height: 40, padding: "0 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ws-btn ws-btn-primary"
                  style={{ height: 40, padding: "0 16px" }}
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Share / Team Members */}
      {shareProj && (
        <div
          style={{
            position: "fixed",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 10000
          }}
        >
          <div
            className="ws-card"
            style={{
              width: "100%",
              maxWidth: 480,
              background: "var(--ws-card)",
              border: "1px solid var(--ws-border)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: 20
            }}
          >
            <div className="ws-row-between">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ws-text)" }}>
                Share Project: {shareProj.name}
              </h3>
              <button
                type="button"
                onClick={() => setShareProj(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ws-text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Invite teammates */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--ws-text-muted)" }}>Invite Teammate via Email</span>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="email"
                  placeholder="teammate@koredata.ai"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{
                    flex: 1,
                    height: 40,
                    padding: "0 12px",
                    background: "var(--ws-workspace)",
                    border: "1px solid var(--ws-border)",
                    borderRadius: 10,
                    color: "var(--ws-text)",
                    outline: "none"
                  }}
                />
                <select
                  value={inviteRole}
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  style={{
                    height: 40,
                    padding: "0 8px",
                    background: "var(--ws-workspace)",
                    border: "1px solid var(--ws-border)",
                    borderRadius: 10,
                    color: "var(--ws-text)"
                  }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  onClick={handleShareInvite}
                  className="ws-btn ws-btn-primary"
                  style={{ height: 40, padding: "0 16px" }}
                >
                  Invite
                </button>
              </div>
            </div>

            {/* Current team members list */}
            <div>
              <span style={{ fontSize: 12, color: "var(--ws-text-muted)", display: "block", marginBottom: 8 }}>
                Current Team Members
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" }}>
                {(shareProj.teamMembers || []).map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="ws-row-between"
                    style={{
                      padding: "8px 12px",
                      background: "var(--ws-workspace)",
                      borderRadius: 8,
                      border: "1px solid var(--ws-border)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Users size={14} style={{ color: "var(--ws-ai)" }} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ws-text)" }}>{m.name}</span>
                        <span style={{ fontSize: 10, color: "var(--ws-text-muted)" }}>{m.email}</span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(139, 92, 246, 0.15)",
                        color: "#8B5CF6",
                        fontWeight: 700,
                        textTransform: "uppercase"
                      }}
                    >
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setShareProj(null)}
                className="ws-btn ws-btn-secondary"
                style={{ height: 40, padding: "0 16px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Project */}
      {editProj && (
        <div
          style={{
            position: "fixed",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 10000
          }}
        >
          <div
            className="ws-card"
            style={{
              width: "100%",
              maxWidth: 450,
              background: "var(--ws-card)",
              border: "1px solid var(--ws-border)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: 20
            }}
          >
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--ws-text)" }}>
              Edit Project: {editProj.name}
            </h3>
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--ws-text-muted)", marginBottom: 6 }}>
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    background: "var(--ws-workspace)",
                    border: "1px solid var(--ws-border)",
                    borderRadius: 10,
                    color: "var(--ws-text)",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--ws-text-muted)", marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "var(--ws-workspace)",
                    border: "1px solid var(--ws-border)",
                    borderRadius: 10,
                    color: "var(--ws-text)",
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setEditProj(null)}
                  className="ws-btn ws-btn-secondary"
                  style={{ height: 40, padding: "0 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ws-btn ws-btn-primary"
                  style={{ height: 40, padding: "0 16px" }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
