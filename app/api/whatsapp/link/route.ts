import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Generate a 6-digit verification code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationCode(phone: string, code: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error('Twilio not configured');
  }

  const twilio = require('twilio')(accountSid, authToken);
  await twilio.messages.create({
    from,
    to: `whatsapp:${phone}`,
    body: `🔐 Your Emiday verification code is: *${code}*\n\nReply with this code to link your WhatsApp.`,
  });
}

// POST: Link a phone number (sends verification code)
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { phoneNumber, workspaceId } = await req.json();

    if (!phoneNumber || !workspaceId) {
      return NextResponse.json({ error: 'Phone number and workspace ID required' }, { status: 400 });
    }

    // Normalize phone number (ensure it starts with +)
    const normalized = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Check if already linked
    const { data: existing } = await supabase
      .from('whatsapp_links')
      .select('id, verified')
      .eq('phone_number', normalized)
      .single();

    if (existing?.verified) {
      return NextResponse.json({ error: 'This phone number is already linked to an account' }, { status: 409 });
    }

    const code = generateCode();

    if (existing) {
      // Update existing unverified link
      await supabase
        .from('whatsapp_links')
        .update({ verification_code: code, workspace_id: workspaceId, user_id: user.id })
        .eq('id', existing.id);
    } else {
      // Create new link
      await supabase.from('whatsapp_links').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        phone_number: normalized,
        verification_code: code,
        verified: false,
      });
    }

    // Send verification code via WhatsApp
    await sendVerificationCode(normalized, code);

    return NextResponse.json({ message: 'Verification code sent via WhatsApp' });
  } catch (error: any) {
    console.error('WhatsApp link error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Check link status
export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: links } = await supabase
      .from('whatsapp_links')
      .select('*')
      .eq('user_id', user.id);

    return NextResponse.json({ links: links || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Verify code from dashboard
export async function PUT(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { phoneNumber, code } = await req.json();

    if (!phoneNumber || !code) {
      return NextResponse.json({ error: 'Phone number and code are required' }, { status: 400 });
    }

    // Find the pending link
    const { data: link } = await supabase
      .from('whatsapp_links')
      .select('*')
      .eq('user_id', user.id)
      .eq('phone_number', phoneNumber)
      .eq('verified', false)
      .single();

    if (!link) {
      return NextResponse.json({ error: 'No pending verification found for this number' }, { status: 404 });
    }

    if (link.verification_code !== code) {
      return NextResponse.json({ error: 'Incorrect verification code. Please try again.' }, { status: 400 });
    }

    // Mark as verified
    await supabase
      .from('whatsapp_links')
      .update({ verified: true, verification_code: null })
      .eq('id', link.id);

    return NextResponse.json({ message: 'Phone number verified successfully!' });
  } catch (error: any) {
    console.error('WhatsApp verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Unlink a phone number
export async function DELETE(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { phoneNumber } = await req.json();

    await supabase
      .from('whatsapp_links')
      .delete()
      .eq('user_id', user.id)
      .eq('phone_number', phoneNumber);

    return NextResponse.json({ message: 'Phone number unlinked' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
