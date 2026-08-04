import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DemoBanner({
  banner,
  connectLabel,
}: {
  banner: string;
  connectLabel: string;
}) {
  return (
    <div
      role="status"
      className="border-b border-[var(--hf-rule-strong)] bg-[var(--hf-caution-quiet)] px-4 py-2 sm:px-6"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="t-body-sm text-[var(--hf-caution)]">{banner}</p>
        <Link
          href="/login?next=/app/github"
          className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
        >
          {connectLabel}
        </Link>
      </div>
    </div>
  );
}
