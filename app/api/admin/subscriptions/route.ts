import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const admin = await verifyAdminAccess();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServiceRoleClient();

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.max(1, Math.min(100, parseInt(searchParams.get('perPage') || '25', 10)));

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Fetch paginated subscriptions with workspace name
  const { data: subscriptions, count, error } = await supabase
    .from('subscriptions')
    .select(
      'id, workspace_id, plan_tier, billing_cycle, status, amount, currency, current_period_start, current_period_end, cancelled_at, created_at, workspaces(id, name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch summary stats for all active subscriptions
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('amount, billing_cycle, plan_tier, status')
    .eq('status', 'ACTIVE');

  let totalActive = 0;
  let totalMrr = 0;
  const planBreakdown: Record<string, number> = {};

  if (activeSubs) {
    totalActive = activeSubs.length;
    for (const sub of activeSubs) {
      const amount = sub.amount || 0;
      if (sub.billing_cycle === 'annual' || sub.billing_cycle === 'yearly') {
        totalMrr += amount / 12;
      } else {
        totalMrr += amount;
      }
      const tier = sub.plan_tier || 'free';
      planBreakdown[tier] = (planBreakdown[tier] || 0) + 1;
    }
  }

  const subsWithWorkspace = (subscriptions || []).map((s) => ({
    ...s,
    workspace: s.workspaces,
    workspaces: undefined,
  }));

  return NextResponse.json({
    data: subsWithWorkspace,
    count: count || 0,
    summary: {
      totalActive,
      totalMrr: Math.round(totalMrr * 100) / 100,
      totalArr: Math.round(totalMrr * 12 * 100) / 100,
      planBreakdown,
    },
  });
}
