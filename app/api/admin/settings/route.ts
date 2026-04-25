import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, logAdminAction } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  const admin = await verifyAdminAccess();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value, updated_by, updated_at');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdminAccess();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServiceRoleClient();
  const body = await request.json();

  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('system_settings')
    .upsert(
      {
        key,
        value,
        updated_by: admin.profile.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: admin.profile.id,
    action: 'update_setting',
    targetType: 'system_setting',
    targetId: key,
    metadata: { key, value },
  });

  return NextResponse.json(data);
}
