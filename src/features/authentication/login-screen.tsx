import { GitHubSignInButton } from "@/features/authentication/github-sign-in-button";

export type LoginCopy = {
  title: string;
  body: string;
  continueGithub: string;
  connectingGithub: string;
  unavailable: string;
  error: string;
};

export function LoginScreen({
  copy,
  configured,
  showError,
  next,
  action,
}: {
  copy: LoginCopy;
  configured: boolean;
  showError: boolean;
  next: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const statusId = configured ? undefined : "login-unavailable";
  const errorId = showError ? "login-error" : undefined;
  const describedBy = [errorId, statusId].filter(Boolean).join(" ") || undefined;

  return (
    <section className="panel grid gap-4 p-5">
      <div className="grid gap-1">
        <h1 className="t-display text-pretty text-[var(--hf-ink)]">{copy.title}</h1>
        {configured ? (
          <p className="t-body text-[var(--hf-ink-muted)]">{copy.body}</p>
        ) : (
          <p
            id="login-unavailable"
            role="status"
            className="t-body text-[var(--hf-ink-muted)]"
          >
            {copy.unavailable}
          </p>
        )}
      </div>

      {showError ? (
        <p
          id="login-error"
          role="alert"
          className="t-body-sm rounded-[var(--radius-md)] bg-[var(--hf-error-quiet)] px-3 py-2 text-[var(--hf-error)]"
        >
          {copy.error}
        </p>
      ) : null}

      <form action={action} className="grid gap-3" aria-describedby={describedBy}>
        <input type="hidden" name="next" value={next} />
        <GitHubSignInButton
          idleLabel={copy.continueGithub}
          pendingLabel={copy.connectingGithub}
          disabled={!configured}
        />
      </form>
    </section>
  );
}
