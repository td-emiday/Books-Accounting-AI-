import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ProfitLossReport, CashFlowReport, VATReport, WHTReport, PAYEScheduleReport } from '@/lib/reports/pdf-templates';
import { NIGERIA_VAT_RATE, calculatePAYE } from '@/lib/compliance/nigeria';
import React, { type ReactElement } from 'react';

// Helper to render component to PDF buffer with correct typing
async function renderPdf(element: ReactElement): Promise<Buffer> {
  return renderToBuffer(element as any);
}

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reportType = searchParams.get('type');

    if (!workspaceId || !startDate || !endDate || !reportType) {
      return NextResponse.json({ error: 'Missing parameters: workspaceId, startDate, endDate, type' }, { status: 400 });
    }

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name, vat_number')
      .eq('id', workspaceId)
      .single();

    const companyName = workspace?.name || 'Unknown Company';

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, categories(name, type)')
      .eq('workspace_id', workspaceId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    const txs = transactions || [];
    let pdfBuffer: Buffer;
    let filename: string;

    switch (reportType) {
      case 'pl': {
        const income = txs.filter((t: any) => t.type === 'INCOME');
        const expenses = txs.filter((t: any) => t.type === 'EXPENSE');
        const totalIncome = income.reduce((s: number, t: any) => s + Number(t.amount), 0);
        const totalExpenses = expenses.reduce((s: number, t: any) => s + Number(t.amount), 0);

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

        pdfBuffer = await renderPdf(
          React.createElement(ProfitLossReport, {
            data: {
              companyName,
              startDate,
              endDate,
              incomeCategories: Object.entries(incomeByCategory).map(([name, amount]) => ({ name, amount })),
              expenseCategories: Object.entries(expensesByCategory).map(([name, amount]) => ({ name, amount })),
              totalIncome,
              totalExpenses,
              netProfit: totalIncome - totalExpenses,
            },
          })
        );
        filename = `profit-loss-${startDate}-to-${endDate}.pdf`;
        break;
      }

      case 'cashflow': {
        const byMonth: Record<string, { income: number; expense: number }> = {};
        txs.forEach((t: any) => {
          const month = t.date.substring(0, 7);
          if (!byMonth[month]) byMonth[month] = { income: 0, expense: 0 };
          if (t.type === 'INCOME') byMonth[month].income += Number(t.amount);
          else byMonth[month].expense += Number(t.amount);
        });

        const months = Object.entries(byMonth).map(([month, data]) => ({
          month,
          inflow: data.income,
          outflow: data.expense,
          net: data.income - data.expense,
        }));

        const totalInflow = months.reduce((s, m) => s + m.inflow, 0);
        const totalOutflow = months.reduce((s, m) => s + m.outflow, 0);

        pdfBuffer = await renderPdf(
          React.createElement(CashFlowReport, {
            data: {
              companyName,
              startDate,
              endDate,
              months,
              totalInflow,
              totalOutflow,
              netCashFlow: totalInflow - totalOutflow,
            },
          })
        );
        filename = `cash-flow-${startDate}-to-${endDate}.pdf`;
        break;
      }

      case 'vat': {
        const vatTxs = txs.filter((t: any) => t.vat_applicable);
        const incomeTxs = vatTxs.filter((t: any) => t.type === 'INCOME');
        const expenseTxs = vatTxs.filter((t: any) => t.type === 'EXPENSE');

        const outputVAT = incomeTxs.reduce((s: number, t: any) => s + (Number(t.amount) * NIGERIA_VAT_RATE), 0);
        const inputVAT = expenseTxs.reduce((s: number, t: any) => s + (Number(t.amount) * NIGERIA_VAT_RATE), 0);

        pdfBuffer = await renderPdf(
          React.createElement(VATReport, {
            data: {
              companyName,
              vatNumber: workspace?.vat_number || 'N/A',
              period: `${startDate} to ${endDate}`,
              outputVAT: Math.round(outputVAT * 100) / 100,
              inputVAT: Math.round(inputVAT * 100) / 100,
              netPayable: Math.round(Math.max(0, outputVAT - inputVAT) * 100) / 100,
              transactions: vatTxs.map((t: any) => ({
                date: t.date,
                description: t.description || '',
                amount: Number(t.amount),
                vat: Math.round(Number(t.amount) * NIGERIA_VAT_RATE * 100) / 100,
                type: t.type,
              })),
            },
          })
        );
        filename = `vat-return-${startDate}-to-${endDate}.pdf`;
        break;
      }

      case 'paye': {
        const { data: employees } = await supabase
          .from('employees')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('is_active', true)
          .order('full_name');

        const emps = (employees || []).map((emp: any) => {
          const paye = calculatePAYE(Number(emp.gross_monthly_salary));
          return {
            name: emp.full_name,
            department: emp.department || '',
            grossMonthly: Number(emp.gross_monthly_salary),
            annualGross: Number(emp.gross_monthly_salary) * 12,
            monthlyPAYE: paye.monthlyPAYE,
            annualPAYE: paye.annualPAYE,
            effectiveRate: paye.effectiveRate,
          };
        });

        const totalMonthly = emps.reduce((s: number, e: any) => s + e.monthlyPAYE, 0);

        pdfBuffer = await renderPdf(
          React.createElement(PAYEScheduleReport, {
            data: {
              companyName,
              period: `${startDate} to ${endDate}`,
              employees: emps,
              totalMonthlyPAYE: totalMonthly,
              totalAnnualPAYE: totalMonthly * 12,
            },
          })
        );
        filename = `paye-schedule-${startDate}-to-${endDate}.pdf`;
        break;
      }

      case 'wht': {
        const whtTxs = txs.filter((t: any) => t.type === 'EXPENSE' && t.wht_applicable && Number(t.amount) >= 10000);
        const whtTransactions = whtTxs.map((t: any) => {
          const rate = t.wht_rate ?? 0.10;
          return {
            date: t.date,
            vendor: t.vendor_client || '',
            description: t.description || '',
            amount: Number(t.amount),
            whtRate: rate,
            whtAmount: Math.round(Number(t.amount) * rate * 100) / 100,
          };
        });
        const totalWHT = whtTransactions.reduce((s: number, t: any) => s + t.whtAmount, 0);

        const sd = new Date(startDate);
        const quarter = `Q${Math.floor(sd.getMonth() / 3) + 1}`;

        pdfBuffer = await renderPdf(
          React.createElement(WHTReport, {
            data: {
              companyName,
              quarter,
              year: sd.getFullYear(),
              transactions: whtTransactions,
              totalWHTDeducted: Math.round(totalWHT * 100) / 100,
            },
          })
        );
        filename = `wht-summary-${quarter}-${sd.getFullYear()}.pdf`;
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid report type. Use: pl, cashflow, vat, wht' }, { status: 400 });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
