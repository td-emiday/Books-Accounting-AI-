import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ingestDocument } from '@/lib/ai/rag';

/**
 * POST /api/ai/knowledge — Ingest a document into the RAG knowledge base.
 * Admin-only endpoint. Chunks text, generates embeddings, stores in pgvector.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Required for embeddings.' },
        { status: 500 }
      );
    }

    const { title, content, sourceDocument, sourceUrl, jurisdiction, category, subCategory } = await req.json();

    if (!title || !content || !sourceDocument || !jurisdiction || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, sourceDocument, jurisdiction, category' },
        { status: 400 }
      );
    }

    const result = await ingestDocument(title, content, {
      sourceDocument,
      sourceUrl,
      jurisdiction,
      category,
      subCategory,
    });

    return NextResponse.json({
      success: true,
      chunksStored: result.chunksStored,
      errors: result.errors,
      message: `Ingested "${title}": ${result.chunksStored} chunks stored, ${result.errors} errors`,
    });
  } catch (error: any) {
    console.error('Knowledge ingestion error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET /api/ai/knowledge — List knowledge base stats.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { count: totalChunks } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { data: categories } = await supabase
      .from('knowledge_base')
      .select('category, jurisdiction, source_document')
      .eq('is_active', true);

    // Group by source document
    const sources: Record<string, { category: string; jurisdiction: string; chunks: number }> = {};
    (categories || []).forEach((row: any) => {
      if (!sources[row.source_document]) {
        sources[row.source_document] = { category: row.category, jurisdiction: row.jurisdiction, chunks: 0 };
      }
      sources[row.source_document].chunks++;
    });

    return NextResponse.json({
      totalChunks: totalChunks || 0,
      sources: Object.entries(sources).map(([doc, info]) => ({ document: doc, ...info })),
    });
  } catch (error: any) {
    console.error('Knowledge stats error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
