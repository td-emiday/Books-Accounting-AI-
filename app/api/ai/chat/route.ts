import { createServerSupabaseClient } from '@/lib/supabase/server';
import { buildFinancialContext } from '@/lib/anthropic/context';
import { getRelevantKnowledge } from '@/lib/knowledge/nigeria-tax';
import { callAIStream } from '@/lib/ai/client';
import { loadPrompt } from '@/lib/ai/prompts';
import { stripPII } from '@/lib/ai/sanitize';
import { logPrediction, type PredictionLog } from '@/lib/ai/logger';
import { getModel } from '@/lib/ai/client';
import { retrieveRelevantChunks } from '@/lib/ai/rag';

const PROMPT_VERSION = 'v1.0.0';

export async function POST(req: Request) {
  try {
    const { message, sessionId, workspaceId } = await req.json();

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    // Fetch conversation history
    let conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];
    if (sessionId) {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(20);

      conversationHistory = (messages || []).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    }

    // Build financial context
    const context = await buildFinancialContext(workspaceId);

    // Save user message
    if (sessionId) {
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'user',
        content: message,
      });
    }

    // Get relevant tax knowledge based on user's question
    const taxKnowledge = getRelevantKnowledge(message);

    // RAG: Retrieve relevant knowledge chunks from pgvector (graceful fallback if OpenAI key missing)
    let ragContext = '';
    try {
      if (process.env.OPENAI_API_KEY) {
        ragContext = await retrieveRelevantChunks(message, context.workspace?.jurisdiction, undefined, 5);
      }
    } catch (err) {
      console.warn('RAG retrieval skipped:', err);
    }

    // Fetch recent tax news updates (last 14 days)
    const { data: recentNews } = await supabase
      .from('knowledge_updates')
      .select('title, summary, source, category, published_at')
      .gte('fetched_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order('fetched_at', { ascending: false })
      .limit(10);

    const newsContext = recentNews && recentNews.length > 0
      ? `\n\n## LATEST NIGERIAN TAX & FINANCE NEWS (Last 14 Days)\n${recentNews.map((n: any) => `- **${n.title}** (${n.source}, ${n.category}): ${n.summary}`).join('\n')}`
      : '';

    // Load system prompt from file
    const ragSection = ragContext ? `\n\n## RETRIEVED KNOWLEDGE BASE CONTEXT\n${ragContext}` : '';
    const systemContent = loadPrompt('cfo-chat-assistant', {
      TAX_KNOWLEDGE: taxKnowledge + newsContext + ragSection,
      FINANCIAL_DATA_JSON: JSON.stringify(context),
    });

    // Sanitize user message
    const sanitizedMessage = stripPII(message);

    // Stream response
    const stream = await callAIStream({
      feature: 'chat',
      systemPrompt: systemContent,
      messages: [
        ...conversationHistory,
        { role: 'user', content: sanitizedMessage },
      ],
      maxTokens: 2048,
    });

    // Collect full response for saving + logging
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              fullResponse += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          // Save assistant message
          if (sessionId) {
            await supabase.from('chat_messages').insert({
              session_id: sessionId,
              role: 'assistant',
              content: fullResponse,
            });
          }

          // Log prediction (non-blocking)
          logPrediction({
            userId: user.id,
            feature: 'chat',
            inputData: { message: sanitizedMessage },
            prediction: { response: fullResponse.substring(0, 500) },
            model: getModel('chat'),
            promptVersion: PROMPT_VERSION,
          }).catch(() => {});

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
