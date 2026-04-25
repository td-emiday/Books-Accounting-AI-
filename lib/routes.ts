import type { IconName } from "@/components/icon";

export type RouteDef = {
  href: string;
  title: string;
  icon: IconName;
  badge?: string;
};

export const WORKSPACE_ROUTES: RouteDef[] = [
  { href: "/app", title: "Overview", icon: "home" },
  { href: "/app/bank", title: "Bank & Cash", icon: "bank", badge: "12" },
  { href: "/app/tax", title: "Tax & Compliance", icon: "shield", badge: "3" },
  { href: "/app/reports", title: "Reports", icon: "chart" },
  { href: "/app/invoices", title: "Invoices", icon: "receipt" },
  { href: "/app/documents", title: "Documents", icon: "file" },
];

export const TEAM_ROUTES: RouteDef[] = [
  { href: "/app/clients", title: "Clients", icon: "users" },
  { href: "/app/settings", title: "Settings", icon: "settings" },
];

export const ALL_ROUTES: RouteDef[] = [...WORKSPACE_ROUTES, ...TEAM_ROUTES];

export function titleFor(pathname: string): string {
  // Find the longest matching route prefix so /app/bank wins over /app.
  const match = [...ALL_ROUTES]
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (r) => r.href === pathname || pathname.startsWith(r.href + "/"),
    );
  return match?.title ?? "Overview";
}

export function isActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(href + "/");
}
