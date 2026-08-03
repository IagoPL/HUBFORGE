import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { acceptInvitationAction } from "@/features/collaboration/actions";
import { getCurrentUser } from "@/features/authentication/get-current-user";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Accept invitation",
};

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const { token } = await searchParams;
  const user = await getCurrentUser();

  if (!token?.trim()) {
    return (
      <InviteShell
        title={t.invite.invalidTitle}
        body={t.invite.invalidBody}
        actionHref="/login"
        actionLabel={t.common.signIn}
      />
    );
  }

  if (!user) {
    const next = `/invite?token=${encodeURIComponent(token)}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const result = await acceptInvitationAction(token);

  if (!result.ok) {
    return (
      <InviteShell
        title={t.invite.failedTitle}
        body={result.error}
        actionHref="/app"
        actionLabel={t.invite.goToApp}
      />
    );
  }

  redirect("/app");
}

function InviteShell({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6 py-16">
      <h1 className="t-display text-[var(--hf-ink)]">{title}</h1>
      <p className="t-body text-[var(--hf-ink-muted)]">{body}</p>
      <Link href={actionHref} className={cn(buttonVariants(), "w-fit")}>
        {actionLabel}
      </Link>
    </main>
  );
}
