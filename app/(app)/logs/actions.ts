"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";

function trimOrNull(v: FormDataEntryValue | null): string | null {
  if (!v) return null;
  const s = v.toString().trim();
  return s.length === 0 ? null : s;
}

/** Find or create a registration_track for the given track_type. */
async function ensureRegistrationTrack(
  supabase: ReturnType<typeof createClient>,
  workspace_id: string,
  user_id: string,
  track_type: "ECSA" | "SACPCMP",
): Promise<string> {
  const { data: existing } = await supabase
    .from("registration_tracks")
    .select("id")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user_id)
    .eq("track_type", track_type)
    .maybeSingle();
  if (existing) return existing.id;

  const target_category = track_type === "ECSA" ? "PrEng" : "PrCM";
  const { data: created, error } = await supabase
    .from("registration_tracks")
    .insert({ workspace_id, user_id, track_type, target_category, status: "active" })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create registration track: ${error.message}`);
  return created.id;
}

export async function createMonthlyLogAction(formData: FormData) {
  const user = await requireUser();
  const ws = await getActiveWorkspace();
  if (!ws) redirect("/onboarding");

  const track = (formData.get("track") ?? "ECSA").toString() as "ECSA" | "SACPCMP";
  const project_id = trimOrNull(formData.get("project_id"));
  const monthRaw = trimOrNull(formData.get("month"));
  const yearRaw = trimOrNull(formData.get("year"));
  if (!project_id || !monthRaw || !yearRaw) throw new Error("Missing required fields");
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  if (month < 1 || month > 12) throw new Error("Invalid month");
  if (year < 2024 || year > 2100) throw new Error("Invalid year");

  const supabase = createClient();
  const registration_track_id = await ensureRegistrationTrack(supabase, ws.id, user.id, track);

  const { data: created, error } = await supabase
    .from("monthly_logs")
    .insert({
      workspace_id: ws.id,
      user_id: user.id,
      registration_track_id,
      project_id,
      month,
      year,
      status: "draft",
      executive_summary: trimOrNull(formData.get("executive_summary")),
      key_activities: trimOrNull(formData.get("key_activities")),
      key_responsibilities: trimOrNull(formData.get("key_responsibilities")),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/logs");
  revalidatePath("/dashboard");
  redirect(`/logs/${created.id}`);
}

export async function updateMonthlyLogAction(formData: FormData) {
  const ws = await getActiveWorkspace();
  if (!ws) redirect("/onboarding");

  const id = trimOrNull(formData.get("id"));
  if (!id) throw new Error("Missing log id");

  const responsibility_level = trimOrNull(formData.get("responsibility_level"));

  const supabase = createClient();
  const { error } = await supabase
    .from("monthly_logs")
    .update({
      executive_summary: trimOrNull(formData.get("executive_summary")),
      key_activities: trimOrNull(formData.get("key_activities")),
      key_responsibilities: trimOrNull(formData.get("key_responsibilities")),
      problems_encountered: trimOrNull(formData.get("problems_encountered")),
      decisions_made: trimOrNull(formData.get("decisions_made")),
      outcomes_achieved: trimOrNull(formData.get("outcomes_achieved")),
      lessons_learned: trimOrNull(formData.get("lessons_learned")),
      next_month_actions: trimOrNull(formData.get("next_month_actions")),
      responsibility_level: responsibility_level && responsibility_level.length === 1 ? responsibility_level : null,
    })
    .eq("id", id)
    .eq("workspace_id", ws.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/logs/${id}`);
}

export async function finalizeMonthlyLogAction(formData: FormData) {
  const ws = await getActiveWorkspace();
  if (!ws) redirect("/onboarding");
  const id = trimOrNull(formData.get("id"));
  if (!id) throw new Error("Missing log id");

  const supabase = createClient();
  const { error } = await supabase
    .from("monthly_logs")
    .update({ status: "final" })
    .eq("id", id)
    .eq("workspace_id", ws.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/logs/${id}`);
  revalidatePath("/logs");
  revalidatePath("/dashboard");
}
