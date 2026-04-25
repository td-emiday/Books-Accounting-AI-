import { redirect } from 'next/navigation';
import { verifyAdminAccess } from '@/lib/admin';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { ThemeWrapper } from '@/components/dashboard/theme-wrapper';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await verifyAdminAccess();

  if (!admin) {
    redirect('/dashboard');
  }

  return (
    <ThemeWrapper>
      <AdminSidebar profile={admin.profile} />
      <div className="lg:ml-[240px] flex flex-col min-h-screen">
        <header className="h-16 border-b border-[#E5E7EB] flex items-center px-6">
          <h1 className="text-lg font-semibold text-[#111827]">Admin Dashboard</h1>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </ThemeWrapper>
  );
}
