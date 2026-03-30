import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  sendTaxDeadlineAlert,
  sendWelcomeEmail,
  sendAccountantInvite,
  sendWeeklySummary,
} from '@/lib/resend/client';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, payload } = await req.json();

    switch (type) {
      case 'welcome':
        await sendWelcomeEmail({ to: payload.email, firstName: payload.name });
        break;
      case 'tax-deadline':
        await sendTaxDeadlineAlert({
          to: payload.email,
          businessName: payload.businessName,
          taxType: payload.taxType,
          daysUntil: payload.daysUntil,
          dueDate: payload.dueDate,
        });
        break;
      case 'accountant-invite':
        await sendAccountantInvite({
          to: payload.email,
          senderName: payload.inviterName,
          businessName: payload.workspaceName,
          inviteUrl: payload.inviteUrl,
        });
        break;
      case 'weekly-summary':
        await sendWeeklySummary({
          to: payload.email,
          businessName: payload.businessName,
          income: payload.income,
          expenses: payload.expenses,
          net: payload.net,
          topCategory: payload.topCategory || 'N/A',
          nextDeadline: payload.nextDeadline,
        });
        break;
      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 });
    }

    return NextResponse.json({ sent: true });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
