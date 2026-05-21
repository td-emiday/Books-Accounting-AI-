import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdminUser();
  if (!admin) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in?next=/admin");
    redirect("/");
  }

  return (
    <div className="adm-root">
      <header className="adm-head">
        <div className="adm-head-inner">
          <Link href="/admin" className="adm-head-brand">
            <span className="adm-mark">e</span>
            <span>Emiday · Ops</span>
          </Link>
          <nav className="adm-nav">
            <Link href="/admin">Overview</Link>
            <Link href="/admin/customers">Customers</Link>
            <Link href="/admin/users">Users</Link>
            <Link href="/admin/subscribers">Subscribers</Link>
            <Link href="/admin/admins">Admins</Link>
            <span className="sep" aria-hidden />
            <Link href="/admin/content">Content</Link>
            <Link href="/admin/facts">Facts</Link>
            <Link href="/admin/rules">Rules</Link>
            <Link href="/admin/archive">Archive</Link>
          </nav>
          <span className="adm-head-meta">{admin.email}</span>
        </div>
      </header>
      <main className="adm-main">{children}</main>
    </div>
  );
}
