import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActiveWorkspace = {
  id: string;
  workspace_name: string;
  default_registration_track: "ECSA" | "SACPCMP";
  role: "owner" | "editor" | "viewer";
};

/**
 * Returns the first workspace the user belongs to, or null. The dashboard
 * uses this to decide between rendering the dashboard vs. redirecting to
 * onboarding.
 *
 * For V1 we surface a single active workspace per user. Multi-workspace
 * switching arrives in a future sub-phase.
 */
export async function getActiveWorkspace(): Promise<ActiveWorkspace | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, workspace_name, default_registration_track)")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data || !data.workspaces) return null;
  const w = data.workspaces as unknown as {
    id: string;
    workspace_name: string;
    default_registration_track: "ECSA" | "SACPCMP";
  };
  return {
    id: w.id,
    workspace_name: w.workspace_name,
    default_registration_track: w.default_registration_track,
    role: data.role as ActiveWorkspace["role"],
  };
}

/** Like getActiveWorkspace but redirects to /onboarding if none. */
export async function requireWorkspace(): Promise<ActiveWorkspace> {
  const ws = await getActiveWorkspace();
  if (!ws) redirect("/onboarding");
  return ws;
}
