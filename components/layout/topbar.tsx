import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function Topbar({
  email,
  workspaceName,
  track,
}: {
  email: string;
  workspaceName: string;
  track: "ECSA" | "SACPCMP";
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-text-primary">{workspaceName}</span>
        <Badge tone="info">{track}</Badge>
      </div>
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="hidden sm:inline-block font-mono">{email}</span>
        <Link
          href="/auth/logout"
          className="rounded-md border border-border bg-card px-3 py-1 text-text-primary hover:bg-background"
        >
          Sign out
        </Link>
      </div>
    </header>
  );
}
