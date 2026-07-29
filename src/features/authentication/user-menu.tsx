import { signOut } from "@/features/authentication/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthUserSummary } from "@/features/authentication/get-current-user";

export function UserMenu({
  user,
  signOutLabel = "Sign out",
}: {
  user: AuthUserSummary;
  signOutLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right sm:block">
        <p className="text-xs font-medium text-[var(--hf-fg)]">
          {user.fullName ?? user.email ?? "Signed in"}
        </p>
        {user.email ? (
          <p className="text-[10px] text-[var(--hf-fg-muted)]">{user.email}</p>
        ) : null}
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          {signOutLabel}
        </button>
      </form>
    </div>
  );
}
