/**
 * Shared config + Supabase client factory for handshake tests.
 * Loads env vars from .env, fails loudly if anything is missing.
 */
import { config as loadEnv } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

loadEnv();

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    throw new Error(`Missing required env var: ${name}. Copy .env.example to .env and fill in.`);
  }
  return v;
}

export const env = {
  SUPABASE_URL: required("SUPABASE_URL"),
  SUPABASE_ANON_KEY: required("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),
  HANDSHAKE_USER_A_EMAIL: required("HANDSHAKE_USER_A_EMAIL"),
  HANDSHAKE_USER_A_PASSWORD: required("HANDSHAKE_USER_A_PASSWORD"),
  HANDSHAKE_USER_B_EMAIL: required("HANDSHAKE_USER_B_EMAIL"),
  HANDSHAKE_USER_B_PASSWORD: required("HANDSHAKE_USER_B_PASSWORD"),
} as const;

/** Anonymous client — represents an unauthenticated browser. */
export function anonClient(): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Service-role client — bypasses RLS. Server-side only. */
export function serviceClient(): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Authenticated client for a given user. Signs in fresh each call. */
export async function userClient(email: string, password: string): Promise<SupabaseClient> {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  return client;
}
