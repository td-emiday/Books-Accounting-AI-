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
    // Differentiate: not signed in → sign-in; signed in but not allowed → home.
    // isAdminUser returns null in both cases, so check raw auth state.
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in?next=/admin");
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#F0EDE8]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold">
              Emiday · Ops
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
              <Link href="/admin">Overview</Link>
              <Link href="/admin/content">Content</Link>
              <Link href="/admin/facts">Facts</Link>
              <Link href="/admin/rules">Rules</Link>
              <Link href="/admin/archive">Archive</Link>
              <span className="text-neutral-300">·</span>
              <Link href="/admin/customers">Customers</Link>
              <Link href="/admin/subscribers">Subscribers</Link>
              <Link href="/admin/admins">Admins</Link>
            </nav>
          </div>
          <span className="text-sm text-neutral-500">{admin.email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
