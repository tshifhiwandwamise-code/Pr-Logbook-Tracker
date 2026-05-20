"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";

function trimOrNull(v: FormDataEntryValue | null): string | null {
  if (!v) return null;
  const s = v.toString().trim();
  return s.length === 0 ? null : s;
}

export async function createProjectAction(formData: FormData) {
  const ws = await getActiveWorkspace();
  if (!ws) redirect("/onboarding");

  const project_name = trimOrNull(formData.get("project_name"));
  if (!project_name) throw new Error("Project name required");

  const value = trimOrNull(formData.get("project_value_zar"));
  const supabase = createClient();
  const { error } = await supabase.from("projects").insert({
    workspace_id: ws.id,
    project_name,
    client: trimOrNull(formData.get("client")),
    employer: trimOrNull(formData.get("employer")),
    location: trimOrNull(formData.get("location")),
    contract_type: trimOrNull(formData.get("contract_type")),
    start_date: trimOrNull(formData.get("start_date")),
    end_date: trimOrNull(formData.get("end_date")),
    user_role: trimOrNull(formData.get("user_role")),
    description: trimOrNull(formData.get("description")),
    project_value_zar: value ? Number(value) : null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/projects");
}
