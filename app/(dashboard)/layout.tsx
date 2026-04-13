import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { DashboardInitializer } from '@/components/dashboard/initializer';
import { OnboardingGate } from '@/components/dashboard/onboarding-gate';
import { ThemeWrapper } from '@/components/dashboard/theme-wrapper';

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

  if (needsOnboarding) {
    return (
      <ThemeWrapper>
        <DashboardInitializer profile={profile} workspaces={workspaces} />
        <OnboardingGate needsOnboarding={true} />
      </ThemeWrapper>
    );
  }

  return (
    <ThemeWrapper>
      <DashboardInitializer profile={profile} workspaces={workspaces} />
      <Sidebar />
      <div className="lg:ml-[260px] flex flex-col min-h-screen bg-[#F8FAFC]">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </ThemeWrapper>
  );
}
