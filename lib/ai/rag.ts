import OpenAI from 'openai';

// Use OpenAI for embeddings (text-embedding-3-small: $0.02/1M tokens)
// This is separate from the Grok LLM — embeddings require OpenAI
function getEmbeddingClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function getServiceClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Generate embedding for a text chunk using OpenAI text-embedding-3-small.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getEmbeddingClient();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

/**
 * Retrieve relevant knowledge chunks from pgvector using cosine similarity.
 * Returns formatted context string ready to inject into prompts.
 */
export async function retrieveRelevantChunks(
  query: string,
  jurisdiction?: string,
  category?: string,
  topK = 5
): Promise<string> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const supabase = getServiceClient();

    const { data: chunks, error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.70,
      match_count: topK,
      filter_jurisdiction: jurisdiction || null,
      filter_category: category || null,
    });

    if (error) {
      console.error('RAG retrieval error:', error);
      return ''; // Fail gracefully
    }

    if (!chunks || chunks.length === 0) {
      return '';
    }

    // Format chunks for prompt injection (max 2000 chars total)
    let totalChars = 0;
    const formattedChunks: string[] = [];

    for (const chunk of chunks) {
      const formatted = `[${chunk.source_document} | ${chunk.category}] ${chunk.content}`;
      if (totalChars + formatted.length > 2000) break;
      formattedChunks.push(formatted);
      totalChars += formatted.length;
    }

    return formattedChunks.join('\n\n');
  } catch (error) {
    console.error('RAG retrieval failed:', error);
    return ''; // Never crash the main flow
  }
}

/**
 * Split text into chunks for embedding.
 * Tries to split on paragraph boundaries first, then sentence boundaries.
 */
export function chunkText(text: string, maxChunkSize = 800, overlap = 100): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      // Keep overlap from end of previous chunk
      const words = current.split(' ');
      const overlapWords = words.slice(-Math.ceil(overlap / 5));
      current = overlapWords.join(' ') + '\n\n' + para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

interface IngestMetadata {
  sourceDocument: string;
  sourceUrl?: string;
  jurisdiction: string; // 'NG', 'GH', 'ZA', 'ALL'
  category: string; // 'tax_law', 'compliance', 'accounting_standards', 'firs_guidelines'
  subCategory?: string;
}

/**
 * Ingest a document into the knowledge base.
 * Chunks the text, generates embeddings, and stores in Supabase.
 */
export async function ingestDocument(
  title: string,
  fullText: string,
  metadata: IngestMetadata
): Promise<{ chunksStored: number; errors: number }> {
  const supabase = getServiceClient();
  const chunks = chunkText(fullText);
  let stored = 0;
  let errors = 0;

  for (let i = 0; i < chunks.length; i++) {
    try {
      const chunkTitle = chunks.length > 1 ? `${title} — Part ${i + 1}` : title;
      const embedding = await generateEmbedding(chunks[i]);

      const { error } = await supabase.from('knowledge_base').insert({
        title: chunkTitle,
        content: chunks[i],
        content_tokens: Math.ceil(chunks[i].length / 4),
        embedding,
        source_document: metadata.sourceDocument,
        source_url: metadata.sourceUrl,
        jurisdiction: metadata.jurisdiction,
        category: metadata.category,
        sub_category: metadata.subCategory,
        is_active: true,
      });

      if (error) {
        console.error(`Error storing chunk ${i + 1}:`, error);
        errors++;
      } else {
        stored++;
      }

      // Rate limit: small delay every 50 chunks
      if (i % 50 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      console.error(`Failed to process chunk ${i + 1}:`, err);
      errors++;
    }
  }

  return { chunksStored: stored, errors };
}
