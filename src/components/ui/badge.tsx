import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-[var(--hf-surface-2)] text-[var(--hf-fg-muted)]",
  brand: "bg-[var(--hf-brand-soft)] text-[var(--hf-brand-strong)]",
  success: "bg-[var(--hf-success-soft)] text-[var(--hf-success)]",
  warning: "bg-[var(--hf-warning-soft)] text-[var(--hf-warning)]",
  danger: "bg-[var(--hf-danger-soft)] text-[var(--hf-danger)]",
} as const;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof tones;
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
