import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-between px-6 py-10 md:px-10">
      <header className="flex items-center justify-between gap-4">
        <Image
          src="/logo-ghana.png"
          alt="GBfoods"
          width={155}
          height={54}
          priority
          className="h-12 w-auto"
        />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink">
          Stock Control
        </p>
      </header>

      <section className="mt-16 grid gap-10 md:mt-24 md:grid-cols-[1.2fr_0.8fr] md:items-end">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            GBfoods Ghana
          </p>
          <h1 className="font-display max-w-xl text-4xl font-semibold leading-tight text-foreground md:text-5xl">
            Every distributor covered. Every stock decision recorded.
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-brand-ink md:text-lg">
            Field crews capture attendance, counts, and evidence at the depot. Supervisors verify.
            GBfoods decides what is released.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth/field"
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              Field sign in
            </Link>
            <Link
              href="/auth/ops"
              className="rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-brand-ink hover:border-brand hover:text-brand"
            >
              Ops / client sign in
            </Link>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-surface/90 p-6 shadow-[0_20px_60px_rgba(28,25,23,0.06)]">
          <p className="text-sm font-medium text-brand-ink">Pilot seed accounts</p>
          <ul className="mt-4 space-y-3 text-sm text-foreground">
            <li>
              Field QC: <span className="font-medium">BTL-0031</span> / PIN{" "}
              <span className="font-medium">2468</span>
            </li>
            <li>
              Admin: <span className="font-medium">admin@gbfoods.local</span>
            </li>
            <li>
              GBfoods: <span className="font-medium">reviewer@gbfoods.local</span>
            </li>
            <li>Default ops password: ChangeMe123!</li>
          </ul>
        </div>
      </section>

      <footer className="mt-16 border-t border-border pt-6 text-sm text-brand-ink">
        BTL Africa · GBfoods Stock Control
      </footer>
    </main>
  );
}
