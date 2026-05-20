"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Mode = "password" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleMagic(e: React.FormEvent) {
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

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6">
      <div className="w-full">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Pr Logbook Tracker is invite-only. Sign in with the email your workspace owner used to
          invite you.
        </p>
      </div>

      <div className="flex w-full rounded-md border border-border bg-card p-1 text-xs">
        <button
          type="button"
          onClick={() => {
            setMode("password");
            setStatus("idle");
            setMessage("");
          }}
          className={tabClass(mode === "password")}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("magic");
            setStatus("idle");
            setMessage("");
          }}
          className={tabClass(mode === "magic")}
        >
          Magic link
        </button>
      </div>

      <Card className="w-full">
        {mode === "password" ? (
          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-text-secondary">
                Don't have a password yet? Your workspace owner (or Supabase dashboard) sets one
                for you — see the README for the one-time setup.
              </p>
            </div>
            <Button type="submit" disabled={status === "sending"} className="w-full">
              {status === "sending" ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleMagic} className="space-y-4">
            <div>
              <Label htmlFor="magic-email">Email</Label>
              <Input
                id="magic-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button
              type="submit"
              disabled={status === "sending" || status === "sent"}
              className="w-full"
            >
              {status === "sending" && "Sending link…"}
              {status === "sent" && "Magic link sent ✓"}
              {(status === "idle" || status === "error") && "Send magic link"}
            </Button>
            <p className="text-xs text-text-secondary">
              Note: the default Supabase email service caps at ~4 emails/hour. For higher volume,
              configure Resend (see README → "Custom email").
            </p>
          </form>
        )}

        {message && (
          <p
            role={status === "error" ? "alert" : "status"}
            className={`mt-4 text-sm ${status === "error" ? "text-danger" : "text-text-secondary"}`}
          >
            {message}
          </p>
        )}
      </Card>

      <a href="/" className="text-xs text-text-secondary underline hover:text-text-primary">
        ← Back to landing
      </a>
    </div>
  );
}

function tabClass(active: boolean): string {
  return `flex-1 rounded-sm px-3 py-2 font-medium transition-colors ${
    active
      ? "bg-background text-text-primary"
      : "text-text-secondary hover:text-text-primary"
  }`;
}
