import Image from "next/image";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

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
        </div>

        <div className="rounded-[1.5rem] border border-border bg-surface/90 p-6 shadow-[0_20px_60px_rgba(28,25,23,0.06)]">
          <p className="text-sm font-medium text-brand-ink">Local development</p>
          <ul className="mt-4 space-y-3 text-sm text-foreground">
            <li>
              Web:{" "}
              <a
                className="font-medium text-brand hover:text-brand-hover"
                href="http://localhost:3000"
              >
                http://localhost:3000
              </a>
            </li>
            <li>
              API docs:{" "}
              <a
                className="font-medium text-brand hover:text-brand-hover"
                href={`${apiBaseUrl}/docs`}
              >
                {apiBaseUrl}/docs
              </a>
            </li>
            <li>Auth, network, and field capture land in the next feature PRs.</li>
          </ul>
        </div>
      </section>

      <footer className="mt-16 border-t border-border pt-6 text-sm text-brand-ink">
        BTL Africa · GBfoods Stock Control · scaffold
      </footer>
    </main>
  );
}
