import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, logAdminAction } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await verifyAdminAccess();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await params;
  const supabase = await createServiceRoleClient();

  // Get the target user's email
  const { data: targetProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', userId)
    .single();

  if (profileError || !targetProfile?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Generate a magic link for the target user
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: targetProfile.email,
  });

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: admin.profile.id,
    action: 'impersonate_user',
    targetType: 'user',
    targetId: userId,
    metadata: {
      target_email: targetProfile.email,
      target_name: targetProfile.full_name,
    },
  });

  return NextResponse.json({
    link: linkData.properties?.action_link,
  });
}
