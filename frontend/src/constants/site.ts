export const navLinks = [
  ["Overview", "/"],
  ["Architecture", "/#architecture"],
  ["Client Management", "/#client-management"],
  ["Workflow", "/#workflow"],
  ["Run", "/#run"]
];

export const platformLayers = [
  {
    label: "Framework Layer",
    tone: "blue",
    items: ["Next.js App Router", "React Components", "Route Management", "Global State"]
  },
  {
    label: "Presentation Layer",
    tone: "cream",
    items: ["Shell Layout", "Dashboard Page", "Client Pages", "Details View", "Forms"]
  },
  {
    label: "Business Layer",
    tone: "blueStrong",
    items: ["Role Permissions", "Client Management", "Approval Flow", "Alerts", "Reports", "Notifications"]
  },
  {
    label: "Data Interaction",
    tone: "green",
    items: ["API Service Library", "Backend Requests", "Interceptors", "Local Cache", "WebSocket", "Mock Data"]
  },
  {
    label: "Support Layer",
    tone: "blue",
    items: ["TypeScript Rules", "Formatting", "Git Hooks", "CI/CD Config"]
  }
];

export const clientSteps = [
  "Create client profile",
  "Assign admin owner",
  "Register datasets",
  "Monitor analysis",
  "Review alerts",
  "Export reports"
];
