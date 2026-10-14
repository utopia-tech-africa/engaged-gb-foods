"use client";

import {
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
  MapPin,
  Menu,
  Package,
  Route,
  ShieldAlert,
  Store,
  Truck,
  UserCheck,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [{ href: "/ops", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Network",
    items: [
      { href: "/ops/regions", label: "Regions", icon: MapPin },
      { href: "/ops/distributors", label: "Distributors", icon: Truck },
      { href: "/ops/depots", label: "Depots", icon: Store },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/ops/people", label: "People", icon: Users },
      { href: "/ops/assignments", label: "Assignments", icon: UsersRound },
    ],
  },
  {
    label: "Field work",
    items: [
      { href: "/ops/attendance", label: "Attendance", icon: CalendarCheck },
      { href: "/ops/stock", label: "Stock", icon: Package },
      { href: "/ops/recce", label: "Recce", icon: ClipboardList },
      { href: "/ops/assessment", label: "Assessment", icon: UserCheck },
    ],
  },
  {
    label: "Control",
    items: [
      { href: "/ops/dispatch", label: "Dispatch", icon: Route },
      { href: "/ops/daily-return", label: "Daily return", icon: ClipboardCheck },
      { href: "/ops/escalations", label: "Escalations", icon: ShieldAlert },
    ],
  },
];

const isActivePath = (pathname: string, href: string): boolean =>
  href === "/ops" ? pathname === "/ops" : pathname === href || pathname.startsWith(`${href}/`);

type SidebarContentProps = {
  pathname: string;
  onNavigate?: () => void;
};

const SidebarContent = ({ pathname, onNavigate }: SidebarContentProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5">
        <Link href="/ops" onClick={onNavigate} className="inline-flex">
          <Image
            src="/logo-ghana.png"
            alt="GBfoods"
            width={140}
            height={48}
            className="h-9 w-auto"
            priority
          />
        </Link>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          Operations
        </p>
      </div>

      <nav aria-label="Operations" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand text-white"
                          : "text-sidebar-foreground hover:bg-sidebar-accent",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user?.fullName ?? "Signed out"}</p>
          {user ? (
            <p className="truncate text-xs capitalize text-muted-foreground">
              {user.role.replaceAll("_", " ")}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            void signOut().then(() => router.replace("/"));
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
};

type OpsShellProps = {
  children: ReactNode;
};

/** Persistent ops chrome: fixed sidebar on desktop, slide-over menu on mobile. */
export const OpsShell = ({ children }: OpsShellProps) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border md:block">
        <SidebarContent pathname={pathname} />
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/ops" className="inline-flex">
          <Image
            src="/logo-ghana.png"
            alt="GBfoods"
            width={140}
            height={48}
            className="h-8 w-auto"
          />
        </Link>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="ops-mobile-menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu />
        </Button>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="ops-mobile-menu"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close menu"
              className="absolute top-3 right-3 z-10"
              onClick={() => setMenuOpen(false)}
            >
              <X />
            </Button>
            <SidebarContent pathname={pathname} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      <main className="md:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
};
