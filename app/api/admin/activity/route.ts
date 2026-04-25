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
  const action = searchParams.get('action') || '';

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('admin_audit_logs')
    .select(
      'id, admin_id, action, target_type, target_id, metadata, ip_address, created_at, profiles!admin_audit_logs_admin_id_fkey(id, full_name, email, avatar_url)',
      { count: 'exact' }
    );

  if (action) {
    query = query.eq('action', action);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data: logs, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const logsWithAdmin = (logs || []).map((log) => ({
    ...log,
    admin: log.profiles,
    profiles: undefined,
  }));

  return NextResponse.json({ data: logsWithAdmin, count: count || 0 });
}
