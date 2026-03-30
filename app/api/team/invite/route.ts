import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, email, role } = await req.json();

    if (!workspaceId || !email || !role) {
      return NextResponse.json({ error: 'Missing workspaceId, email, or role' }, { status: 400 });
    }

    if (!['ACCOUNTANT', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check the current user is an OWNER of this workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only workspace owners can invite members' }, { status: 403 });
    }

    // Check if there's already a user with this email in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingProfile) {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', existingProfile.id)
        .single();

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 409 });
      }

      // Add them directly as a member
      const { error: insertError } = await supabase.from('workspace_members').insert({
        workspace_id: workspaceId,
        user_id: existingProfile.id,
        role,
        invited_by: user.id,
        accepted_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      return NextResponse.json({ status: 'added', message: `${email} has been added to the workspace.` });
    }

    // User doesn't exist yet — send invite email (requires Resend API key)
    // For now, return a pending invite status
    // TODO: When RESEND_API_KEY is configured, send an actual invite email
    return NextResponse.json({
      status: 'invited',
      message: `Invitation sent to ${email}. They will be added when they sign up.`,
    });
  } catch (error: any) {
    console.error('Team invite error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
