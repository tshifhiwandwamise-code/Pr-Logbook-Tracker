"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Magic-link sign-in. Full auth flow (password, OAuth, signup-by-invite) lands
 * in Phase 6 / sub-phase 3. For now this proves the wiring works on Vercel.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
    setMessage("Check your email for a sign-in link.");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6">
      <div className="w-full">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Pr Logbook Tracker is invite-only. Enter the email your workspace owner used to invite
          you; we'll send a magic link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending" || status === "sent"}
          className="inline-flex h-tap w-full items-center justify-center rounded-md bg-accent-blue px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" && "Sending link..."}
          {status === "sent" && "Magic link sent ✓"}
          {(status === "idle" || status === "error") && "Send magic link"}
        </button>

        {message && (
          <p
            role="status"
            className={
              status === "error"
                ? "text-sm text-danger"
                : "text-sm text-text-secondary"
            }
          >
            {message}
          </p>
        )}
      </form>

      <a href="/" className="text-xs text-text-secondary underline hover:text-text-primary">
        ← Back to landing
      </a>
    </div>
  );
}
