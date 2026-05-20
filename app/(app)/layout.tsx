import { requireUser } from "@/lib/auth";
import { requireWorkspace } from "@/lib/workspace";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const ws = await requireWorkspace();

  return (
    <div className="flex h-screen flex-col">
      <Topbar
        email={user.email ?? ""}
        workspaceName={ws.workspace_name}
        track={ws.default_registration_track}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto bg-background">{children}</div>
      </div>
    </div>
  );
}
