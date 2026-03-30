import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { calculateVAT, calculateWHT } from '@/lib/compliance/nigeria';

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const type = searchParams.get('type'); // 'vat' | 'wht'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!workspaceId || !type || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('date', startDate)
      .lte('date', endDate);

    const txs = (transactions || []).map((t: any) => ({
      ...t,
      vatApplicable: t.vat_applicable,
      whtApplicable: t.wht_applicable,
      whtRate: t.wht_rate,
      vendorClient: t.vendor_client,
      categoryId: t.category_id,
      categoryConfirmed: t.category_confirmed,
      bankImportId: t.bank_import_id,
      isDuplicate: t.is_duplicate,
      duplicateOf: t.duplicate_of,
      receiptUrl: t.receipt_url,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    if (type === 'vat') {
      const result = calculateVAT(txs, new Date(startDate), new Date(endDate));
      return NextResponse.json(result);
    }

    if (type === 'wht') {
      const result = calculateWHT(txs, new Date(startDate), new Date(endDate));
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
