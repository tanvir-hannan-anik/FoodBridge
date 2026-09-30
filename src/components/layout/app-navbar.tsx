import Link from "next/link";
import { logout } from "@/app/actions/auth";
import type { Role } from "@/db/schema";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/auth/roles";
import { Logo } from "./logo";
import { MenuDetails } from "./menu-details";
import { NavLink, TabLink } from "./nav-link";

type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

const NAV: Record<Role, NavItem[]> = {
  donor: [
    { href: "/donor", label: "Overview", icon: "home" },
    { href: "/donor/donations", label: "My donations", icon: "list" },
    { href: "/donor/map", label: "Map", icon: "map" },
    { href: "/donor/notifications", label: "Alerts", icon: "bell" },
  ],
  ngo: [
    { href: "/ngo", label: "Overview", icon: "home" },
    { href: "/ngo/requests", label: "Food requests", icon: "list" },
    { href: "/ngo/map", label: "Map", icon: "map" },
    { href: "/ngo/reports", label: "Report", icon: "list" },
    { href: "/ngo/notifications", label: "Alerts", icon: "bell" },
  ],
  volunteer: [
    { href: "/volunteer", label: "Overview", icon: "home" },
    { href: "/volunteer/tasks", label: "My tasks", icon: "list" },
    { href: "/volunteer/map", label: "Map", icon: "map" },
    { href: "/volunteer/notifications", label: "Alerts", icon: "bell" },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: "home" },
    { href: "/admin/users", label: "Users", icon: "list" },
    { href: "/admin/donations", label: "Donations", icon: "list" },
    { href: "/admin/requests", label: "Requests", icon: "list" },
    { href: "/admin/activity", label: "Activity", icon: "list" },
    { href: "/admin/reports", label: "Reports", icon: "list" },
    { href: "/admin/map", label: "Map", icon: "map" },
    { href: "/admin/notifications", label: "Alerts", icon: "list" },
  ],
};

/** Primary action + notifications for portals that have them. */
const PORTAL: Partial<
  Record<
    Role,
    {
      cta: { href: string; label: string; short: string; icon: keyof typeof ICONS };
      alerts: string;
      list: { href: string; label: string; icon?: keyof typeof ICONS };
      /** Hide the CTA from the desktop header when it duplicates a nav link. */
      ctaMobileOnly?: boolean;
    }
  >
> = {
  donor: {
    cta: { href: "/donor/donate", label: "Donate food", short: "Donate", icon: "plus" },
    alerts: "/donor/notifications",
    list: { href: "/donor/donations", label: "Donations" },
  },
  ngo: {
    cta: { href: "/ngo/donations", label: "Find food", short: "Find food", icon: "search" },
    alerts: "/ngo/notifications",
    list: { href: "/ngo/requests", label: "Requests" },
  },
  volunteer: {
    cta: { href: "/volunteer/tasks", label: "My tasks", short: "Tasks", icon: "truck" },
    alerts: "/volunteer/notifications",
    list: { href: "/profile", label: "Profile", icon: "user" },
    ctaMobileOnly: true,
  },
};

const ICONS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  bell: "M14.9 17.1a3 3 0 0 1-5.8 0M18 9.8C18 6.6 15.3 4 12 4S6 6.6 6 9.8c0 3.7-1.5 5.6-2 6.3h16c-.5-.7-2-2.6-2-6.3Z",
  plus: "M12 5v14M5 12h14",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.5-3.5",
  truck: "M5.5 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18.5 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 17v-4l-3-3 4-3 2 3h3",
  user: "M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14",
};

function Icon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Signed-in header: role navigation, primary CTA, notifications, account menu (+ mobile tab bar per portal). */
export function AppNavbar({ name, role, unread }: { name: string; role: Role; unread: number }) {
  const links = NAV[role];
  const portal = PORTAL[role];
  const desktopLinks = links.filter((l) => l.icon !== "bell");
  // A long nav (admin) only fits in the header from xl; below that it lives in the account menu.
  const wide = desktopLinks.length > 6;
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-brand-900/8 bg-cream-100/90 backdrop-blur-md">
        <div className="mx-auto flex h-17 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Logo href={ROLE_HOME[role]} />

          <nav
            aria-label="Portal"
            className={`hidden items-center gap-1 rounded-full border border-brand-900/10 bg-white/70 p-1 ${wide ? "xl:flex" : "md:flex"}`}
          >
            {desktopLinks.map((l) => (
              <NavLink key={l.href} href={l.href} exact={l.href === ROLE_HOME[role]}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {portal && (
              <>
                {!portal.ctaMobileOnly && (
                  <Link
                    href={portal.cta.href}
                    className="hidden h-10 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white shadow-glow hover:bg-brand-700 md:inline-flex"
                  >
                    <Icon name={portal.cta.icon} className="size-4" />
                    {portal.cta.label}
                  </Link>
                )}
                <Link
                  href={portal.alerts}
                  aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
                  className="relative hidden size-10 place-items-center rounded-full border border-brand-900/10 bg-white/70 text-brand-900 hover:bg-white md:grid"
                >
                  <Icon name="bell" className="size-5" />
                  {unread > 0 && <UnreadDot count={unread} className="-top-1 -right-1" />}
                </Link>
              </>
            )}

            <MenuDetails className="relative">
              <summary
                aria-label="Account menu"
                className="flex cursor-pointer items-center gap-2.5 rounded-full border border-brand-900/10 bg-white/70 py-1 pr-3 pl-1 hover:bg-white"
              >
                <span className="grid size-8 place-items-center rounded-full bg-brand-950 text-xs font-bold text-accent-300">
                  {initials}
                </span>
                <span className="hidden max-w-32 truncate text-sm font-semibold text-brand-950 sm:block">{name}</span>
                <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-4 text-ink-500">
                  <path d="M5.2 7.2a.75.75 0 0 1 1.06 0L10 10.94l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.26a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </summary>
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-cream-200 bg-white p-2 shadow-raised">
                <div className="rounded-xl bg-cream-100 px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-brand-950">{name}</p>
                  <p className="text-xs text-ink-500">{ROLE_LABEL[role]} account</p>
                </div>
                <div className={`mt-1 py-1 ${wide ? "xl:hidden" : "md:hidden"}`}>
                  {links.map((l) => (
                    <Link key={l.href} href={l.href} className="block rounded-xl px-3 py-2.5 text-sm hover:bg-cream-100">
                      {l.label}
                    </Link>
                  ))}
                </div>
                <div className={`border-t border-cream-200 pt-1 ${wide ? "xl:mt-1" : "md:mt-1"}`}>
                  <Link href="/profile" className="block rounded-xl px-3 py-2.5 text-sm hover:bg-cream-100">
                    Profile &amp; settings
                  </Link>
                  <Link href="/assistant" className="block rounded-xl px-3 py-2.5 text-sm hover:bg-cream-100">
                    Ask FoodBridge (assistant)
                  </Link>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Log out
                    </button>
                  </form>
                </div>
              </div>
            </MenuDetails>
          </div>
        </div>
      </header>

      {/* Mobile tab bar: the portal's core actions always one tap away. */}
      {portal && (
        <nav
          aria-label="Quick navigation"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-900/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        >
          <ul className="grid grid-cols-5 items-end">
            <li>
              <TabLink href={ROLE_HOME[role]} exact label="Home">
                <Icon name="home" className="size-6" />
              </TabLink>
            </li>
            <li className="flex justify-center">
              <Link
                href={portal.cta.href}
                className="-mt-5 flex flex-col items-center gap-1 pb-2 text-[11px] font-semibold text-brand-800"
              >
                <span className="grid size-13 place-items-center rounded-full bg-brand-600 text-white shadow-glow ring-4 ring-white">
                  <Icon name={portal.cta.icon} className="size-6" />
                </span>
                {portal.cta.short}
              </Link>
            </li>
            <li>
              <TabLink href={portal.list.href} label={portal.list.label}>
                <Icon name={portal.list.icon ?? "list"} className="size-6" />
              </TabLink>
            </li>
            <li>
              <TabLink href={`${ROLE_HOME[role]}/map`} label="Map">
                <Icon name="map" className="size-6" />
              </TabLink>
            </li>
            <li>
              <TabLink href={portal.alerts} label="Alerts">
                <span className="relative">
                  <Icon name="bell" className="size-6" />
                  {unread > 0 && <UnreadDot count={unread} className="-top-1.5 -right-2.5" />}
                </span>
              </TabLink>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}

function UnreadDot({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={`absolute grid h-5 min-w-5 place-items-center rounded-full bg-accent-400 px-1 text-[11px] font-bold text-brand-950 ring-2 ring-cream-100 ${className}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
