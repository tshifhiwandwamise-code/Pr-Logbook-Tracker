import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "block w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text-primary",
        "placeholder:text-text-secondary",
        "focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
