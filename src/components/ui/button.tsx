import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-[color,background-color,box-shadow,transform,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)] disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--hf-brand)] text-[var(--hf-brand-fg)] shadow-sm hover:bg-[var(--hf-brand-strong)]",
        secondary:
          "bg-[var(--hf-surface-2)] text-[var(--hf-fg)] hover:bg-[var(--hf-surface-3)]",
        ghost: "bg-transparent text-[var(--hf-fg)] hover:bg-[var(--hf-surface-2)]",
        outline:
          "border border-[var(--hf-border)] bg-transparent text-[var(--hf-fg)] hover:bg-[var(--hf-surface-2)]",
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
