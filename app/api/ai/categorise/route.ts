import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { callAI, getModel } from '@/lib/ai/client';
import { loadPrompt } from '@/lib/ai/prompts';
import { stripTransactionPII } from '@/lib/ai/sanitize';
import { CategorisationSchema, validateAIResponse } from '@/lib/ai/schemas';
import { logPrediction } from '@/lib/ai/logger';
import { retrieveRelevantChunks } from '@/lib/ai/rag';

const PROMPT_VERSION = 'v1.0.0';

export async function POST(req: Request) {
  try {
    const { description, type, workspaceId, vendorName, amount } = await req.json();

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch categories
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, type, tax_treatment')
      .or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`)
      .eq('type', type);

    // Fetch recent transactions for context
    const { data: recentTx } = await supabase
      .from('transactions')
      .select('description, category_id, categories(name)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(30);

    const categoryList = categories?.map(c => `${c.id}|${c.name}|${c.tax_treatment}`).join('\n') || '';
    const recentContext = recentTx?.map((t: any) =>
      `"${stripTransactionPII(t.description)}" → ${t.categories?.name || 'uncategorised'}`
    ).join('\n') || '';

    // RAG: Retrieve relevant tax rules for categorisation (graceful fallback)
    let ragContext = '';
    try {
      if (process.env.OPENAI_API_KEY) {
        ragContext = await retrieveRelevantChunks(
          `${description} ${vendorName || ''} categorisation tax treatment`,
          undefined, // jurisdiction from workspace would be better
          'tax_law',
          3
        );
      }
    } catch (err) {
      console.warn('RAG retrieval skipped for categorisation:', err);
    }

    // Load prompt from file and inject variables
    const userMessage = loadPrompt('bank-statement-categorisation', {
      TRANSACTION_TYPE: type.toLowerCase(),
      DESCRIPTION: stripTransactionPII(description),
      VENDOR_LINE: vendorName ? `Vendor/Client: "${vendorName}"` : '',
      AMOUNT_LINE: amount ? `Amount: ₦${amount}` : '',
      CATEGORY_LIST: categoryList,
      RECENT_CONTEXT: recentContext,
      RAG_CONTEXT: ragContext || 'No additional tax rules retrieved.',
    });

    const result = await callAI({
      feature: 'bank_categorisation',
      userMessage,
      maxTokens: 256,
    });

    // Validate with Zod schema
    const validation = validateAIResponse(result.text, CategorisationSchema);

    if (!validation.success) {
      console.error('AI categorisation validation failed:', validation.error);
      return NextResponse.json({ error: 'AI returned invalid data', details: validation.error }, { status: 500 });
    }

    // Log prediction for training data
    logPrediction({
      userId: user.id,
      feature: 'bank_categorisation',
      inputData: { description: stripTransactionPII(description), type, vendorName, amount },
      prediction: validation.data,
      confidence: validation.data.confidence,
      model: getModel('bank_categorisation'),
      promptVersion: PROMPT_VERSION,
      needsReview: validation.data.confidence < 0.8 || (amount && amount > 500000),
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    }).catch(() => {}); // Non-blocking

    return NextResponse.json(validation.data);
  } catch (error: any) {
    console.error('AI categorise error:', error);
    return NextResponse.json({ error: 'Failed to categorise' }, { status: 500 });
  }
}
