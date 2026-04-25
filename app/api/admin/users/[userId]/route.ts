import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, logAdminAction } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await verifyAdminAccess();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await params;
  const supabase = await createServiceRoleClient();

  const [profileRes, membershipsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    supabase
      .from('workspace_members')
      .select('id, workspace_id, role, created_at, workspaces(id, name, plan_tier, business_type, created_at)')
      .eq('user_id', userId),
  ]);

  if (profileRes.error) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...profileRes.data,
    workspaces: (membershipsRes.data || []).map((m) => ({
      membership_id: m.id,
      membership_role: m.role,
      joined_at: m.created_at,
      ...(m.workspaces as unknown as Record<string, unknown>),
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await verifyAdminAccess();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await params;
  const supabase = await createServiceRoleClient();
  const body = await request.json();

  const allowedFields = ['full_name', 'role', 'is_superadmin'];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: admin.profile.id,
    action: 'update_user',
    targetType: 'user',
    targetId: userId,
    metadata: { updates },
  });

  return NextResponse.json(data);
}
