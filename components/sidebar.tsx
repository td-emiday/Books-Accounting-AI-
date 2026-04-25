"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";
import {
  TEAM_ROUTES,
  WORKSPACE_ROUTES,
  isActive,
  type RouteDef,
} from "@/lib/routes";
import { ACTIVE_USER, WORKSPACE } from "@/lib/data/workspace";

function NavLink({ route, pathname }: { route: RouteDef; pathname: string }) {
  const active = isActive(pathname, route.href);
  return (
    <Link
      href={route.href}
      className={`nav-item ${active ? "active" : ""}`}
      prefetch
    >
      <span className="ic">
        <Icon name={route.icon} size={16} />
      </span>
      <span>{route.title}</span>
      {route.badge && <span className="badge">{route.badge}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <Image
          src="/assets/emiday-logo.png"
          alt="Emiday"
          width={112}
          height={28}
          priority
        />
      </div>
      <button type="button" className="workspace" title="Switch workspace (coming soon)">
        <div className="avatar">{WORKSPACE.avatarInitial}</div>
        <div className="meta">
          <span className="name">{WORKSPACE.name}</span>
          <span className="sub">{WORKSPACE.location}</span>
        </div>
        <Icon name="chev" size={14} className="chev" />
      </button>

      <div className="nav-group">
        <div className="nav-label">Workspace</div>
        {WORKSPACE_ROUTES.map((r) => (
          <NavLink key={r.href} route={r} pathname={pathname} />
        ))}
      </div>

      <div className="nav-group">
        <div className="nav-label">Team</div>
        {TEAM_ROUTES.map((r) => (
          <NavLink key={r.href} route={r} pathname={pathname} />
        ))}
      </div>

      <div className="nav-foot">
        <Link href="/app/settings" className="user-chip" prefetch>
          <div className="av">{ACTIVE_USER.avatarInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="u">{ACTIVE_USER.name}</div>
            <div className="e">{ACTIVE_USER.role}</div>
          </div>
          <Icon name="dots" size={14} className="chev" />
        </Link>
      </div>
    </aside>
  );
}
