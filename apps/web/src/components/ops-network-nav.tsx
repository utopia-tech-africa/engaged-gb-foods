import Link from "next/link";

const links = [
  { href: "/ops", label: "Ops home" },
  { href: "/ops/regions", label: "Regions" },
  { href: "/ops/distributors", label: "Distributors" },
  { href: "/ops/depots", label: "Depots" },
  { href: "/ops/attendance", label: "Attendance" },
  { href: "/ops/stock", label: "Stock" },
  { href: "/ops/recce", label: "Recce" },
  { href: "/ops/assessment", label: "Assessment" },
  { href: "/ops/daily-return", label: "Daily return" },
] as const;

export const OpsNetworkNav = () => (
  <nav className="flex flex-wrap gap-2">
    {links.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-brand-ink transition hover:border-brand hover:text-brand"
      >
        {link.label}
      </Link>
    ))}
  </nav>
);
