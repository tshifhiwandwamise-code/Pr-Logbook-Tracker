import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "block w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text-primary",
      "focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/30",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
