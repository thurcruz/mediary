import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
