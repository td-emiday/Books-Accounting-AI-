import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  req: Request,
  { params }: { params: { type: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reportType = params.type;

    if (!workspaceId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, categories(name, type)')
      .eq('workspace_id', workspaceId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    const txs = transactions || [];

    switch (reportType) {
      case 'pl': {
        const income = txs.filter((t: any) => t.type === 'INCOME');
        const expenses = txs.filter((t: any) => t.type === 'EXPENSE');
        const totalIncome = income.reduce((s: number, t: any) => s + Number(t.amount), 0);
        const totalExpenses = expenses.reduce((s: number, t: any) => s + Number(t.amount), 0);

        // Group by category
        const incomeByCategory: Record<string, number> = {};
        income.forEach((t: any) => {
          const cat = t.categories?.name || 'Other Income';
          incomeByCategory[cat] = (incomeByCategory[cat] || 0) + Number(t.amount);
        });

        const expensesByCategory: Record<string, number> = {};
        expenses.forEach((t: any) => {
          const cat = t.categories?.name || 'Other Expense';
          expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(t.amount);
        });

        return NextResponse.json({
          type: 'pl',
          period: { startDate, endDate },
          totalIncome,
          totalExpenses,
          netProfit: totalIncome - totalExpenses,
          incomeByCategory,
          expensesByCategory,
        });
      }

      case 'cashflow': {
        // Group by month
        const byMonth: Record<string, { income: number; expense: number }> = {};
        txs.forEach((t: any) => {
          const month = t.date.substring(0, 7);
          if (!byMonth[month]) byMonth[month] = { income: 0, expense: 0 };
          if (t.type === 'INCOME') byMonth[month].income += Number(t.amount);
          else byMonth[month].expense += Number(t.amount);
        });

        return NextResponse.json({
          type: 'cashflow',
          period: { startDate, endDate },
          monthly: Object.entries(byMonth).map(([month, data]) => ({
            month, ...data, net: data.income - data.expense,
          })),
        });
      }

      case 'expense-analysis': {
        const expenses = txs.filter((t: any) => t.type === 'EXPENSE');
        const total = expenses.reduce((s: number, t: any) => s + Number(t.amount), 0);
        const byCategory: Record<string, { amount: number; count: number }> = {};
        expenses.forEach((t: any) => {
          const cat = t.categories?.name || 'Other Expense';
          if (!byCategory[cat]) byCategory[cat] = { amount: 0, count: 0 };
          byCategory[cat].amount += Number(t.amount);
          byCategory[cat].count += 1;
        });

        return NextResponse.json({
          type: 'expense-analysis',
          period: { startDate, endDate },
          totalExpenses: total,
          categories: Object.entries(byCategory)
            .map(([name, data]) => ({ name, ...data, percentage: total > 0 ? (data.amount / total) * 100 : 0 }))
            .sort((a, b) => b.amount - a.amount),
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
