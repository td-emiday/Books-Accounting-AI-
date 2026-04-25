import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function verifyAdminAccess() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Use the authenticated client — user can read their own profile via RLS
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, is_superadmin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_superadmin) return null;
  return { user, profile };
}

export async function logAdminAction(params: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  const serviceClient = await createServiceRoleClient();
  await serviceClient.from('admin_audit_logs').insert({
    admin_id: params.adminId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    metadata: params.metadata,
    ip_address: params.ipAddress,
  });
}
