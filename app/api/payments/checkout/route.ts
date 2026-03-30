import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { initializeTransaction } from '@/lib/paystack/client';
import { PRICING } from '@/lib/constants';

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  STARTER: PRICING.SME.STARTER,
  GROWTH: PRICING.SME.GROWTH,
  BUSINESS: PRICING.SME.BUSINESS,
  PRO: PRICING.ACCOUNTANT.PRO,
  FIRM: PRICING.ACCOUNTANT.FIRM,
};

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, plan, billingCycle } = await req.json();

    if (!workspaceId || !plan || !billingCycle) {
      return NextResponse.json({ error: 'Missing workspaceId, plan, or billingCycle' }, { status: 400 });
    }

    const priceInfo = PLAN_PRICES[plan];
    if (!priceInfo) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Verify ownership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only workspace owners can change plans' }, { status: 403 });
    }

    const amount = billingCycle === 'ANNUAL' ? priceInfo.annual : priceInfo.monthly;
    const amountInKobo = amount * 100;

    // Check if Paystack is configured
    if (!process.env.PAYSTACK_SECRET_KEY) {
      // No Paystack key — just update the plan directly (for testing)
      const { error: updateError } = await supabase
        .from('workspaces')
        .update({ plan_tier: plan, billing_cycle: billingCycle, updated_at: new Date().toISOString() })
        .eq('id', workspaceId);

      if (updateError) throw updateError;

      return NextResponse.json({
        status: 'updated',
        message: `Plan upgraded to ${plan}. Payment integration pending — configure PAYSTACK_SECRET_KEY for live billing.`,
      });
    }

    // Initialize Paystack transaction
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/billing?checkout=success`;

    const result = await initializeTransaction({
      email: user.email!,
      amount: amountInKobo,
      metadata: {
        workspace_id: workspaceId,
        plan,
        billing_cycle: billingCycle,
        user_id: user.id,
      },
      callback_url: callbackUrl,
    });

    if (!result.status) {
      return NextResponse.json({ error: result.message || 'Paystack initialization failed' }, { status: 502 });
    }

    return NextResponse.json({
      status: 'checkout',
      url: result.data.authorization_url,
      reference: result.data.reference,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
