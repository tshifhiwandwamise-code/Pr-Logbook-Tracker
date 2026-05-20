import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="font-mono text-xs uppercase tracking-widest text-text-secondary">404</div>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-text-secondary">
        That page doesn't exist, isn't accessible from your workspace, or was deleted.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md border border-border bg-card px-4 py-2 text-sm text-text-primary hover:bg-surface"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
