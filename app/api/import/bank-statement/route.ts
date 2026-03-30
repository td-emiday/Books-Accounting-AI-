import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { callAI, getModel } from '@/lib/ai/client';
import { loadPrompt } from '@/lib/ai/prompts';
import { stripPII } from '@/lib/ai/sanitize';
import { BankStatementExtractionSchema, validateAIResponse } from '@/lib/ai/schemas';
import { logPrediction } from '@/lib/ai/logger';

const PROMPT_VERSION = 'v1.0.0';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;

    if (!file || !workspaceId) {
      return NextResponse.json({ error: 'Missing file or workspaceId' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${workspaceId}/${crypto.randomUUID()}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bank-statements')
      .upload(filename, buffer, { contentType: 'application/pdf' });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const fileUrl = uploadData?.path || filename;

    // Create bank_imports record
    const { data: importRecord, error: importError } = await supabase
      .from('bank_imports')
      .insert({
        workspace_id: workspaceId,
        filename: file.name,
        file_url: fileUrl,
        status: 'PROCESSING',
        created_by: user.id,
      })
      .select()
      .single();

    if (importError) {
      console.error('bank_imports insert error:', importError);
      return NextResponse.json({ error: `Database error: ${importError.message}` }, { status: 500 });
    }

    // Parse PDF text
    let rawText = '';
    try {
      const { extractText } = await import('unpdf');
      const uint8Array = new Uint8Array(buffer);
      const result = await extractText(uint8Array);
      rawText = Array.isArray(result.text) ? result.text.join('\n') : String(result.text);
    } catch (e: any) {
      console.error('PDF parse error:', e);
      await supabase.from('bank_imports').update({ status: 'FAILED', error_message: `PDF parse failed: ${e.message}` }).eq('id', importRecord.id);
      return NextResponse.json({ error: `Failed to parse PDF: ${e.message}` }, { status: 400 });
    }

    if (!rawText || rawText.trim().length < 20) {
      await supabase.from('bank_imports').update({ status: 'FAILED', error_message: 'PDF contained no readable text' }).eq('id', importRecord.id);
      return NextResponse.json({ error: 'PDF contained no readable text. Please ensure this is a text-based bank statement (not a scanned image).' }, { status: 400 });
    }

    // Strip PII from statement text before sending to AI
    const sanitizedText = stripPII(rawText.substring(0, 15000));

    // Load prompt from file and inject the statement
    const userMessage = loadPrompt('bank-statement-extraction', {
      STATEMENT_TEXT: sanitizedText,
    });

    const result = await callAI({
      feature: 'bank_extraction',
      userMessage,
      maxTokens: 4096,
    });

    // Validate with Zod
    const validation = validateAIResponse(result.text, BankStatementExtractionSchema);

    let transactions: any[];
    let detectedCurrency = 'NGN';

    if (validation.success) {
      detectedCurrency = validation.data.currency;
      transactions = validation.data.transactions;
    } else {
      // Fallback: try to parse raw response manually
      console.warn('Zod validation failed, falling back to manual parse:', validation.error);
      try {
        const cleaned = result.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          detectedCurrency = parsed.currency || 'NGN';
          transactions = parsed.transactions || [];
        } else if (Array.isArray(parsed)) {
          transactions = parsed;
        } else {
          throw new Error('Unexpected format');
        }
      } catch {
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          await supabase.from('bank_imports').update({ status: 'FAILED', error_message: 'Could not extract transactions' }).eq('id', importRecord.id);
          return NextResponse.json({ error: 'Could not extract transactions from statement' }, { status: 400 });
        }
        try {
          transactions = JSON.parse(jsonMatch[0]);
        } catch {
          await supabase.from('bank_imports').update({ status: 'FAILED', error_message: 'Invalid JSON from extraction' }).eq('id', importRecord.id);
          return NextResponse.json({ error: 'Failed to parse extracted data' }, { status: 400 });
        }
      }
    }

    if (!transactions || transactions.length === 0) {
      await supabase.from('bank_imports').update({ status: 'FAILED', error_message: 'No transactions found in statement' }).eq('id', importRecord.id);
      return NextResponse.json({ error: 'No transactions found in the statement' }, { status: 400 });
    }

    // Log prediction (non-blocking)
    logPrediction({
      userId: user.id,
      feature: 'bank_extraction',
      inputData: { filename: file.name, textLength: rawText.length },
      prediction: { currency: detectedCurrency, transactionCount: transactions.length },
      confidence: validation.success ? 0.9 : 0.6,
      model: getModel('bank_extraction'),
      promptVersion: PROMPT_VERSION,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    }).catch(() => {});

    // Check for duplicates
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('date, amount')
      .eq('workspace_id', workspaceId)
      .order('date', { ascending: false })
      .limit(500);

    const existingSet = new Set(
      (existingTx || []).map((t: any) => `${t.date}_${Math.round(Number(t.amount) * 100)}`)
    );

    const enrichedTransactions = transactions.map(tx => {
      const amount = tx.credit || tx.debit || 0;
      const key = `${tx.date}_${Math.round(amount * 100)}`;
      return { ...tx, isDuplicate: existingSet.has(key) };
    });

    // Update import record
    await supabase.from('bank_imports').update({
      status: 'COMPLETED',
      transaction_count: transactions.length,
      matched_count: enrichedTransactions.filter(t => t.isDuplicate).length,
      parsed_at: new Date().toISOString(),
    }).eq('id', importRecord.id);

    return NextResponse.json({
      importId: importRecord.id,
      transactions: enrichedTransactions,
      transactionCount: transactions.length,
      duplicatesFound: enrichedTransactions.filter(t => t.isDuplicate).length,
      currency: detectedCurrency,
    });
  } catch (error: any) {
    console.error('Bank import error:', error);
    const message = error?.message || error?.error_description || 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT - Confirm and save imported transactions
export async function PUT(req: Request) {
  try {
    const { workspaceId, transactions, currency: importCurrency } = await req.json();

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const txCurrency = importCurrency || 'NGN';

    const inserts = transactions.map((tx: any) => ({
      workspace_id: workspaceId,
      type: tx.credit ? 'INCOME' : 'EXPENSE',
      amount: tx.credit || tx.debit || 0,
      currency: txCurrency,
      date: tx.date,
      description: tx.description,
      source: 'BANK_IMPORT',
      reference: tx.reference,
      category_confirmed: false,
      vat_applicable: false,
      wht_applicable: false,
      reconciled: false,
      is_duplicate: false,
    }));

    const { data, error } = await supabase.from('transactions').insert(inserts).select();
    if (error) throw error;

    return NextResponse.json({ imported: data?.length || 0 });
  } catch (error: any) {
    console.error('Import confirm error:', error);
    return NextResponse.json({ error: 'Failed to save transactions' }, { status: 500 });
  }
}
