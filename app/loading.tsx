export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent-blue" />
        <p className="text-xs text-text-secondary">Loading…</p>
      </div>
    </div>
  );
}
