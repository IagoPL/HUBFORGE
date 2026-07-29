import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Focus is the document-wide accent outline, not a second ring idiom.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-medium transition-[color,background-color,transform,opacity] duration-[var(--motion-feedback)] disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--hf-accent)] text-[var(--hf-accent-ink)] hover:bg-[var(--hf-accent-hover)]",
        secondary:
          "bg-[var(--hf-ground-3)] text-[var(--hf-ink)] hover:bg-[var(--hf-rule)]",
        ghost:
          "bg-transparent text-[var(--hf-ink-muted)] hover:bg-[var(--hf-ground-3)] hover:text-[var(--hf-ink)]",
        outline:
          "border border-[var(--hf-rule)] bg-transparent text-[var(--hf-ink)] hover:bg-[var(--hf-ground-3)]",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
