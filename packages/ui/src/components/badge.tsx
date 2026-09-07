import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 font-mono-signature text-[11px] uppercase tracking-wide",
  {
    variants: {
      tone: {
        neutral: "border-border bg-surface text-muted",
        pending: "border-pending/40 bg-pending/10 text-pending",
        success: "border-success/40 bg-success/10 text-success",
        danger: "border-danger/40 bg-danger/10 text-danger",
        accent: "border-accent/40 bg-accent/10 text-accent"
      }
    },
    defaultVariants: { tone: "neutral" }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />;
}
