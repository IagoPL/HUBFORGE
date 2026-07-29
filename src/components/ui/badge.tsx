import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Status reads as a stamp: quiet fill, mono word, no shouting. */
const tones = {
  neutral: "bg-[var(--hf-ground-3)] text-[var(--hf-ink-muted)]",
  brand: "bg-[var(--hf-accent-quiet)] text-[var(--hf-accent-hover)]",
  success: "bg-[var(--hf-ok-quiet)] text-[var(--hf-ok)]",
  warning: "bg-[var(--hf-caution-quiet)] text-[var(--hf-caution)]",
  danger: "bg-[var(--hf-error-quiet)] text-[var(--hf-error)]",
} as const;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof tones;
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "t-mono-sm inline-flex items-center rounded-[var(--radius-sm)] px-1.5",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
