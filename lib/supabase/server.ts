import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server-side Supabase client for use in RSCs, Route Handlers, and Server
 * Actions. Reads + writes the auth cookie via Next.js `cookies()`.
 *
 * Uses the anon key + the user's session cookie — RLS is enforced. Server
 * actions that need to bypass RLS must explicitly use the service-role client
 * (separate factory below) and audit-log the reason.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Calling `set` from a Server Component is a no-op — that's fine
            // because the middleware refreshes the session on every request.
          }
        },
      },
    },
  );
}

/**
 * Service-role client. **NEVER call from RSC, page, or browser.** Allowed only
 * in Route Handlers and Server Actions that explicitly need to bypass RLS
 * (e.g. creating storage signed URLs, hashing invite tokens, audit jobs).
 */
import { createClient as createServiceClient } from "@supabase/supabase-js";

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not set — refusing to create admin client");
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
