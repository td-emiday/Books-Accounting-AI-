import { createServerSupabaseClient } from '@/lib/supabase/server';
import { format, subMonths, startOfMonth } from 'date-fns';

export async function buildFinancialContext(workspaceId: string) {
  const supabase = await createServerSupabaseClient();

  // Fetch workspace info
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, jurisdiction, currency, business_type, vat_registered')
    .eq('id', workspaceId)
    .single();

  // Fetch last 12 months of transactions
  const twelveMonthsAgo = subMonths(new Date(), 12).toISOString();
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, categories(name, type, tax_treatment)')
    .eq('workspace_id', workspaceId)
    .gte('date', twelveMonthsAgo)
    .order('date', { ascending: false });

  const txs = transactions || [];

  // Monthly aggregation
  const monthly: Record<string, typeof txs> = {};
  txs.forEach(t => {
    const month = (t.date as string).substring(0, 7);
    if (!monthly[month]) monthly[month] = [];
    monthly[month].push(t);
  });

  const monthlySummary = Object.entries(monthly).map(([month, items]) => ({
    month,
    totalIncome: items.filter((t: any) => t.type === 'INCOME').reduce((s, t: any) => s + Number(t.amount), 0),
    totalExpense: items.filter((t: any) => t.type === 'EXPENSE').reduce((s, t: any) => s + Number(t.amount), 0),
    netProfit: items.filter((t: any) => t.type === 'INCOME').reduce((s, t: any) => s + Number(t.amount), 0)
             - items.filter((t: any) => t.type === 'EXPENSE').reduce((s, t: any) => s + Number(t.amount), 0),
  })).sort((a, b) => a.month.localeCompare(b.month));

  // Category breakdown
  const byCategory: Record<string, { totalAmount: number; count: number; type: string }> = {};
  txs.forEach((t: any) => {
    const cat = t.categories?.name || 'Uncategorised';
    if (!byCategory[cat]) byCategory[cat] = { totalAmount: 0, count: 0, type: t.type };
    byCategory[cat].totalAmount += Number(t.amount);
    byCategory[cat].count += 1;
  });

  const categoryBreakdown = Object.entries(byCategory).map(([category, data]) => ({
    category,
    ...data,
  }));

  // Tax summary (current month)
  const currentMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const currentMonthTx = txs.filter((t: any) => t.date >= currentMonthStart);

  const vatLiability = currentMonthTx
    .filter((t: any) => t.type === 'INCOME' && t.vat_applicable)
    .reduce((s, t: any) => s + Number(t.amount) * 0.075, 0);
  const vatCredit = currentMonthTx
    .filter((t: any) => t.type === 'EXPENSE' && t.vat_applicable)
    .reduce((s, t: any) => s + Number(t.amount) * 0.075, 0);

  return {
    workspace: {
      id: workspaceId,
      name: workspace?.name || 'Unknown',
      jurisdiction: workspace?.jurisdiction || 'NG',
      currency: workspace?.currency || 'NGN',
      businessType: workspace?.business_type,
      vatRegistered: workspace?.vat_registered,
    },
    monthlySummary,
    categoryBreakdown,
    tax: {
      currentMonth: {
        vatLiability: Math.round(vatLiability * 100) / 100,
        vatCredit: Math.round(vatCredit * 100) / 100,
        netVAT: Math.round((vatLiability - vatCredit) * 100) / 100,
      },
    },
    recentTransactions: txs.slice(0, 30).map((t: any) => ({
      date: t.date,
      type: t.type,
      amount: Number(t.amount),
      description: t.description,
      category: t.categories?.name,
      vat: t.vat_applicable,
      source: t.source || 'MANUAL',
    })),
    whatsappActivity: {
      totalBooked: txs.filter((t: any) => t.source === 'WHATSAPP').length,
      thisMonth: currentMonthTx.filter((t: any) => t.source === 'WHATSAPP').length,
      recentWhatsApp: txs.filter((t: any) => t.source === 'WHATSAPP').slice(0, 5).map((t: any) => ({
        date: t.date,
        type: t.type,
        amount: Number(t.amount),
        description: t.description,
      })),
    },
  };
}
