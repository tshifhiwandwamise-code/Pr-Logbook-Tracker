import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(
      "block w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text-primary",
      "placeholder:text-text-secondary",
      "focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/30",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "resize-y",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
