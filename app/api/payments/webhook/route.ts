import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;

    if (!secret || !signature) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const event = JSON.parse(body);
    const supabase = await createServiceRoleClient();

    switch (event.event) {
      case 'subscription.create': {
        const data = event.data;
        await supabase.from('subscriptions').upsert({
          paystack_subscription_code: data.subscription_code,
          paystack_customer_code: data.customer.customer_code,
          paystack_plan_code: data.plan.plan_code,
          status: 'ACTIVE',
          amount: data.amount / 100,
          currency: data.plan.currency || 'NGN',
          current_period_start: new Date().toISOString(),
          current_period_end: data.next_payment_date,
        }, {
          onConflict: 'paystack_subscription_code',
        });
        break;
      }

      case 'subscription.disable': {
        const data = event.data;
        await supabase
          .from('subscriptions')
          .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
          .eq('paystack_subscription_code', data.subscription_code);
        break;
      }

      case 'invoice.payment_failed': {
        const data = event.data;
        await supabase
          .from('subscriptions')
          .update({ status: 'PAST_DUE' })
          .eq('paystack_subscription_code', data.subscription.subscription_code);
        break;
      }

      case 'charge.success': {
        // Log payment, could extend current_period_end
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
