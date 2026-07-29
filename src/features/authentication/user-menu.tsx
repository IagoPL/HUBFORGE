import Link from "next/link";
import { signOut } from "@/features/authentication/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthUserSummary } from "@/features/authentication/get-current-user";

export function UserMenu({
  user,
  signInLabel = "Sign in",
  signOutLabel = "Sign out",
}: {
  user: AuthUserSummary | null;
  signInLabel?: string;
  signOutLabel?: string;
}) {
  // The shell already states which workspace you are looking at, so this slot
  // offers the way out of the demo rather than repeating the label.
  if (!user) {
    return (
      <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
        {signInLabel}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden min-w-0 text-right sm:block">
        <p className="t-body-sm truncate font-medium text-[var(--hf-ink)]">
          {user.fullName ?? user.email}
        </p>
        {user.fullName && user.email ? (
          <p className="t-body-sm truncate text-[var(--hf-ink-faint)]">{user.email}</p>
        ) : null}
      </div>
      <form action={signOut}>
        <button type="submit" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          {signOutLabel}
        </button>
      </form>
    </div>
  );
}
