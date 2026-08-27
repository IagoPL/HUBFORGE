"use client";

import { useFormStatus } from "react-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GitHubSignInControl({
  idleLabel,
  pendingLabel,
  disabled = false,
  pending = false,
}: {
  idleLabel: string;
  pendingLabel: string;
  disabled?: boolean;
  pending?: boolean;
}) {
  const isDisabled = disabled || pending;
  const showPending = pending && !disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={showPending || undefined}
      className={cn(buttonVariants({ size: "lg" }), "w-full")}
    >
      <span className="inline-flex min-h-[1.25rem] items-center justify-center">
        {showPending ? pendingLabel : idleLabel}
      </span>
    </button>
  );
}

export function GitHubSignInButton({
  idleLabel,
  pendingLabel,
  disabled = false,
}: {
  idleLabel: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <GitHubSignInControl
      idleLabel={idleLabel}
      pendingLabel={pendingLabel}
      disabled={disabled}
      pending={pending}
    />
  );
}
