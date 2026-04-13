'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { PRICING } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, ArrowUpRight, Check, X, Loader2 } from 'lucide-react';

const SME_PLANS = [
  { tier: 'STARTER', ...PRICING.SME.STARTER, features: ['50 transactions/mo', '1 user', 'Basic reports', 'Email support'] },
  { tier: 'GROWTH', ...PRICING.SME.GROWTH, popular: true, features: ['500 transactions/mo', '3 users', 'Full reports + PDF', 'AI assistant', 'Bank import'] },
  { tier: 'BUSINESS', ...PRICING.SME.BUSINESS, features: ['Unlimited transactions', '10 users', 'All features', 'Priority support', 'API access'] },
];

const ACCOUNTANT_PLANS = [
  { tier: 'PRO', ...PRICING.ACCOUNTANT.PRO, features: ['5 clients', '1 user', 'Client dashboard', 'PAYE & WHT reports'] },
  { tier: 'FIRM', ...PRICING.ACCOUNTANT.FIRM, popular: true, features: ['10 clients', '5 users', 'All features', 'Team management', 'Priority support'] },
  { tier: 'ENTERPRISE', ...PRICING.ACCOUNTANT.ENTERPRISE, features: ['Unlimited clients', 'Unlimited users', 'Custom integrations', 'Dedicated support', 'SLA'] },
];

export default function BillingPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const tier = workspace?.planTier || 'STARTER';
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>(workspace?.billingCycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY');
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const currency = workspace?.currency || 'NGN';

  const isSME = ['STARTER', 'GROWTH', 'BUSINESS'].includes(tier);
  const plans = isSME ? SME_PLANS : ACCOUNTANT_PLANS;

  const handleUpgrade = async (selectedTier: string) => {
    if (selectedTier === tier) return;
    setUpgrading(selectedTier);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace!.id,
          plan: selectedTier,
          billingCycle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || 'Plan updated successfully');
        setShowUpgrade(false);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpgrading(null);
    }
  };

  const currentPlan = [...SME_PLANS, ...ACCOUNTANT_PLANS].find(p => p.tier === tier);
  const currentPrice = currentPlan
    ? billingCycle === 'ANNUAL' ? currentPlan.annual / 12 : currentPlan.monthly
    : 0;

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">Billing</h1>

      <div className="flex gap-2 border-b border-[rgba(108,63,232,0.08)] pb-3">
        <a href="/settings" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">General</a>
        <span className="px-3 py-1.5 rounded-lg bg-brand-1/10 text-brand-1 text-sm font-medium">Billing</span>
        <a href="/settings/team" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">Team</a>
        <a href="/settings/notifications" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">Notifications</a>
      </div>

      {/* Current Plan */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-inter font-bold text-base">Current Plan</h2>
            <p className="text-sm text-text-muted">Your workspace is on the <strong className="text-brand-1">{tier}</strong> plan</p>
          </div>
          <span className="badge-info text-sm">{tier}</span>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-brand-1/5 border border-brand-1/10">
          <CreditCard size={20} className="text-brand-1" />
          <div className="flex-1">
            <p className="text-sm font-medium">{formatCurrency(currentPrice, currency)}/month</p>
            <p className="text-xs text-text-muted">{workspace?.billingCycle === 'ANNUAL' ? 'Billed annually' : 'Billed monthly'}</p>
          </div>
          <button onClick={() => setShowUpgrade(!showUpgrade)} className="btn-primary px-4 py-2 text-xs">
            <ArrowUpRight size={14} className="mr-1" /> {showUpgrade ? 'Hide Plans' : 'Upgrade Plan'}
          </button>
        </div>

        {workspace?.trialEndsAt && new Date(workspace.trialEndsAt) > new Date() && (
          <div className="mt-3 p-3 rounded-xl bg-warning/5 border border-warning/15 text-sm text-[#D97706]">
            Free trial ends on {new Date(workspace.trialEndsAt).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* Plan Selection */}
      {showUpgrade && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-inter font-bold text-base">Choose a Plan</h2>
            <div className="flex items-center gap-2 bg-brand-1/5 rounded-full p-1">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${billingCycle === 'MONTHLY' ? 'bg-brand-1 text-white' : 'text-text-secondary'}`}
              >Monthly</button>
              <button
                onClick={() => setBillingCycle('ANNUAL')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${billingCycle === 'ANNUAL' ? 'bg-brand-1 text-white' : 'text-text-secondary'}`}
              >Annual <span className="text-[10px] opacity-80">(Save 17%)</span></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const price = billingCycle === 'ANNUAL' ? plan.annual / 12 : plan.monthly;
              const isCurrentPlan = plan.tier === tier;
              const isEnterprise = plan.tier === 'ENTERPRISE';
              return (
                <div
                  key={plan.tier}
                  className={`glass-card p-5 relative ${'popular' in plan && plan.popular ? 'ring-2 ring-brand-1' : ''}`}
                >
                  {'popular' in plan && plan.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-gradient text-white text-[10px] font-semibold px-3 py-0.5 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="font-inter font-bold text-lg mb-1 text-[#111827]">{plan.label}</h3>
                  {isEnterprise ? (
                    <p className="text-2xl font-inter font-bold mb-4 text-[#111827]">Custom</p>
                  ) : (
                    <p className="text-2xl font-inter font-bold mb-4 text-[#111827]">
                      {formatCurrency(price, currency)}<span className="text-sm font-normal text-text-muted">/mo</span>
                    </p>
                  )}
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                        <Check size={14} className="text-brand-1 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrentPlan ? (
                    <button disabled className="w-full py-2.5 rounded-xl text-sm font-medium bg-brand-1/10 text-brand-1 cursor-default">
                      Current Plan
                    </button>
                  ) : isEnterprise ? (
                    <a href="mailto:sales@emidaybooks.com" className="block w-full py-2.5 rounded-xl text-sm font-medium text-center btn-secondary">
                      Contact Sales
                    </a>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.tier)}
                      disabled={!!upgrading}
                      className="btn-primary w-full py-2.5 text-sm disabled:opacity-60"
                    >
                      {upgrading === plan.tier ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                      {upgrading === plan.tier ? 'Processing...' : 'Upgrade'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invoice History */}
      <div className="glass-card p-6">
        <h3 className="font-inter font-bold text-base mb-4 text-[#111827]">Invoice History</h3>
        <div className="text-center py-8">
          <p className="text-sm text-text-muted">No invoices yet.</p>
        </div>
      </div>
    </div>
  );
}
