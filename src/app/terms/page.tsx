import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "Terms of Service",
};

export default async function TermsPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="t-label text-[var(--hf-ink-faint)]">
        <Link href="/" className="underline-offset-2 hover:underline">
          {t.common.brand}
        </Link>
      </p>
      <h1 className="t-display mt-3 text-[var(--hf-ink)]">{t.legal.termsTitle}</h1>
      <div className="t-body mt-6 space-y-4 text-[var(--hf-ink-muted)]">
        {t.legal.termsBody.split("\n\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </main>
  );
}
