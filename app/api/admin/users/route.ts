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

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, role, phone, is_superadmin, created_at, updated_at', { count: 'exact' });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data: users, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get workspace counts for these users
  const userIds = (users || []).map((u) => u.id);
  let workspaceCounts: Record<string, number> = {};

  if (userIds.length > 0) {
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('user_id, workspace_id')
      .in('user_id', userIds);

    if (memberships) {
      for (const m of memberships) {
        workspaceCounts[m.user_id] = (workspaceCounts[m.user_id] || 0) + 1;
      }
    }
  }

  const usersWithCounts = (users || []).map((u) => ({
    ...u,
    workspace_count: workspaceCounts[u.id] || 0,
  }));

  return NextResponse.json({ data: usersWithCounts, count: count || 0 });
}
