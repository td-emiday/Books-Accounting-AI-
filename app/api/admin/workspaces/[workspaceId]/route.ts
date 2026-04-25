import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, logAdminAction } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const admin = await verifyAdminAccess();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { workspaceId } = await params;
  const supabase = await createServiceRoleClient();

  const [workspaceRes, membersRes, subscriptionRes, transactionsRes] = await Promise.all([
    supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single(),
    supabase
      .from('workspace_members')
      .select('id, user_id, role, created_at, profiles(id, full_name, email, avatar_url)')
      .eq('workspace_id', workspaceId),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('transactions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (workspaceRes.error) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const members = (membersRes.data || []).map((m) => ({
    membership_id: m.id,
    role: m.role,
    joined_at: m.created_at,
    ...(m.profiles as unknown as Record<string, unknown>),
  }));

  return NextResponse.json({
    ...workspaceRes.data,
    members,
    subscription: subscriptionRes.data || null,
    recent_transactions: transactionsRes.data || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const admin = await verifyAdminAccess();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { workspaceId } = await params;
  const supabase = await createServiceRoleClient();
  const body = await request.json();

  const allowedFields = ['plan_tier', 'billing_cycle', 'suspended_at', 'suspended_reason'];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: admin.profile.id,
    action: 'update_workspace',
    targetType: 'workspace',
    targetId: workspaceId,
    metadata: { updates },
  });

  return NextResponse.json(data);
}
