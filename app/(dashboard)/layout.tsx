import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { DashboardInitializer } from '@/components/dashboard/initializer';
import { OnboardingGate } from '@/components/dashboard/onboarding-gate';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile and workspaces for initialization
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(*)')
    .eq('user_id', user.id);

  const workspaces = memberships?.map((m: any) => m.workspaces).filter(Boolean) || [];
  const needsOnboarding = workspaces.length === 0;

  // If user needs onboarding, show ONLY the onboarding modal — no sidebar/topbar
  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] theme-light">
        <DashboardInitializer profile={profile} workspaces={workspaces} />
        <OnboardingGate needsOnboarding={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] theme-light">
      <DashboardInitializer profile={profile} workspaces={workspaces} />
      <Sidebar />
      <div className="lg:ml-[240px] flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-3 sm:p-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
