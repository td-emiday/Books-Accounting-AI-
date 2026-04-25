import { NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  const admin = await verifyAdminAccess();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServiceRoleClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalUsersRes,
    totalWorkspacesRes,
    activeSubscriptionsRes,
    allSubscriptionsRes,
    cancelledSubscriptionsRes,
    totalSubscriptionsRes,
    signupsThisWeekRes,
    planDistributionRes,
    recentSignupsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('workspaces').select('*', { count: 'exact', head: true }).is('suspended_at', null),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('subscriptions').select('amount, billing_cycle').eq('status', 'ACTIVE'),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .not('cancelled_at', 'is', null)
      .gte('cancelled_at', thirtyDaysAgo),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo),
    supabase.from('workspaces').select('plan_tier'),
    supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  // Calculate MRR from active subscriptions
  let mrr = 0;
  if (allSubscriptionsRes.data) {
    for (const sub of allSubscriptionsRes.data) {
      const amount = sub.amount || 0;
      if (sub.billing_cycle === 'annual' || sub.billing_cycle === 'yearly') {
        mrr += amount / 12;
      } else {
        mrr += amount;
      }
    }
  }

  // Calculate plan distribution
  const planDistribution: Record<string, number> = {};
  if (planDistributionRes.data) {
    for (const ws of planDistributionRes.data) {
      const tier = ws.plan_tier || 'free';
      planDistribution[tier] = (planDistribution[tier] || 0) + 1;
    }
  }

  // Churn rate
  const cancelledCount = cancelledSubscriptionsRes.count || 0;
  const totalSubCount = totalSubscriptionsRes.count || 0;
  const churnRate = totalSubCount > 0 ? (cancelledCount / totalSubCount) * 100 : 0;

  return NextResponse.json({
    totalUsers: totalUsersRes.count || 0,
    totalWorkspaces: totalWorkspacesRes.count || 0,
    activeSubscriptions: activeSubscriptionsRes.count || 0,
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(mrr * 12 * 100) / 100,
    signupsThisWeek: signupsThisWeekRes.count || 0,
    churnRate: Math.round(churnRate * 100) / 100,
    planDistribution,
    recentSignups: recentSignupsRes.data || [],
  });
}
