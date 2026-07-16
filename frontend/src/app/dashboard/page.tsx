import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export const metadata = {
  title: "Dashboard | KoreData",
  description: "Protected KoreData dashboard connected to the existing Python backend."
};

export default function DashboardPage() {
  return <WorkspaceShell />;
}
