import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

function getAIClient() {
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
  });
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const NEWS_TOPICS = [
  'FIRS Nigeria tax regulation changes 2025 2026',
  'Nigeria Finance Act tax policy update',
  'Nigeria VAT WHT PAYE compliance news',
  'FIRS TaxProMax update Nigeria',
  'Nigeria business tax deadline penalty',
  'Nigerian stock exchange capital gains tax update',
  'CBN monetary policy rate Nigeria',
  'Nigeria digital economy tax',
];

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ai = getAIClient();
    const supabase = getSupabaseAdmin();

    // Pick 3 random topics to search each day (to vary coverage)
    const shuffled = NEWS_TOPICS.sort(() => Math.random() - 0.5);
    const todayTopics = shuffled.slice(0, 3);

    const prompt = `You are a Nigerian tax and finance news researcher. Search your knowledge for the LATEST news, regulatory changes, and updates related to these topics:

${todayTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

For each piece of news you find (up to 5 items total), return a JSON array with objects containing:
{
  "title": "Short headline",
  "summary": "2-3 sentence summary explaining the update and its impact on Nigerian businesses",
  "source": "Publication or authority name (e.g. FIRS, PwC Nigeria, Nairametrics, ThisDay)",
  "category": "one of: vat, wht, paye, cit, compliance, policy, economy, regulation",
  "relevance_score": 0.0 to 1.0 (how relevant is this to a Nigerian SME owner),
  "published_at": "YYYY-MM-DD or null if unknown"
}

Focus on:
- Changes to tax rates or rules
- New FIRS circulars or directives
- Filing deadline reminders
- Penalties or enforcement actions
- Policy changes from Finance Acts
- CBN monetary policy changes affecting businesses

Return ONLY a valid JSON array. No explanation.`;

    const response = await ai.chat.completions.create({
      model: 'grok-3-mini',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return NextResponse.json({ message: 'No news extracted', raw: responseText.substring(0, 200) });
    }

    let newsItems: any[];
    try {
      newsItems = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'Failed to parse news JSON' }, { status: 500 });
    }

    // Deduplicate against existing items (check by title similarity)
    const { data: existingTitles } = await supabase
      .from('knowledge_updates')
      .select('title')
      .gte('fetched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(100);

    const existingSet = new Set((existingTitles || []).map((e: any) => e.title.toLowerCase()));

    const newItems = newsItems.filter(
      (item: any) => !existingSet.has(item.title?.toLowerCase())
    );

    if (newItems.length === 0) {
      return NextResponse.json({ message: 'No new items to insert', checked: newsItems.length });
    }

    // Insert new items
    const inserts = newItems.map((item: any) => ({
      source: item.source || 'Unknown',
      title: item.title,
      summary: item.summary,
      category: item.category || 'general',
      relevance_score: item.relevance_score || 0.5,
      published_at: item.published_at || null,
    }));

    const { error } = await supabase.from('knowledge_updates').insert(inserts);
    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `Inserted ${inserts.length} new tax/finance updates`,
      items: inserts.map((i) => i.title),
    });
  } catch (error: any) {
    console.error('Tax news cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
