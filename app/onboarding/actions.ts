"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createWorkspaceAction(formData: FormData) {
  const name = (formData.get("name") ?? "").toString().trim();
  const track = (formData.get("track") ?? "ECSA").toString();
  if (name.length < 2) throw new Error("Workspace name too short");
  if (!["ECSA", "SACPCMP"].includes(track)) throw new Error("Invalid track");

  const supabase = createClient();
  const { error } = await supabase.rpc("create_workspace_for_user", {
    p_name: name,
    p_default_track: track,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
