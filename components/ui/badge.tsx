import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-card text-text-secondary border-border",
  success: "bg-accent-green/10 text-accent-green border-accent-green/30",
  warning: "bg-accent-amber/10 text-accent-amber border-accent-amber/30",
  danger: "bg-accent-red/10 text-accent-red border-accent-red/30",
  info: "bg-accent-blue/10 text-accent-blue border-accent-blue/30",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
