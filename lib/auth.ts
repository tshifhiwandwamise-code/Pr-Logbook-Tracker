import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Require an authenticated user; redirect to /login if missing.
 * Use at the top of any server component that requires auth.
 */
export async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}
