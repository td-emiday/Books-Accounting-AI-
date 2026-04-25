import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const admin = await verifyAdminAccess();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServiceRoleClient();

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.max(1, Math.min(100, parseInt(searchParams.get('perPage') || '25', 10)));
  const planTier = searchParams.get('planTier') || '';

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('workspaces')
    .select(
      'id, name, owner_id, business_type, jurisdiction, industry, plan_tier, billing_cycle, currency, vat_number, tin, rc_number, suspended_at, suspended_reason, created_at, profiles!workspaces_owner_id_fkey(id, full_name, email, avatar_url)',
      { count: 'exact' }
    );

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (planTier) {
    query = query.eq('plan_tier', planTier);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data: workspaces, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get member counts and transaction counts for these workspaces
  const workspaceIds = (workspaces || []).map((w) => w.id);
  let memberCounts: Record<string, number> = {};
  let transactionCounts: Record<string, number> = {};

  if (workspaceIds.length > 0) {
    const [membersRes, transactionsRes] = await Promise.all([
      supabase
        .from('workspace_members')
        .select('workspace_id')
        .in('workspace_id', workspaceIds),
      supabase
        .from('transactions')
        .select('workspace_id')
        .in('workspace_id', workspaceIds),
    ]);

    if (membersRes.data) {
      for (const m of membersRes.data) {
        memberCounts[m.workspace_id] = (memberCounts[m.workspace_id] || 0) + 1;
      }
    }

    if (transactionsRes.data) {
      for (const t of transactionsRes.data) {
        transactionCounts[t.workspace_id] = (transactionCounts[t.workspace_id] || 0) + 1;
      }
    }
  }

  const workspacesWithCounts = (workspaces || []).map((w) => ({
    ...w,
    owner: w.profiles,
    profiles: undefined,
    member_count: memberCounts[w.id] || 0,
    transaction_count: transactionCounts[w.id] || 0,
  }));

  return NextResponse.json({ data: workspacesWithCounts, count: count || 0 });
}
