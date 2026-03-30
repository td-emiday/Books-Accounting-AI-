import OpenAI from 'openai';

/**
 * AI client factory.
 * Currently uses X.ai Grok. When switching to Anthropic Claude,
 * update the provider config here — all routes use this single entry point.
 */

export type AIProvider = 'xai' | 'anthropic';

// Feature → model routing (spec Section 8)
// When switching to Claude: bank_categorisation → claude-haiku, chat → claude-sonnet, etc.
const MODEL_ROUTING = {
  bank_categorisation: 'grok-3-mini',
  bank_extraction: 'grok-3-mini',
  receipt_extraction: 'grok-3-mini',
  text_extraction: 'grok-3-mini',
  chat: 'grok-3-mini',
  report_narrative: 'grok-3-mini',
} as const;

export type AIFeature = keyof typeof MODEL_ROUTING;

export function getModel(feature: AIFeature): string {
  return MODEL_ROUTING[feature];
}

export function getAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
  });
}

export interface AICallOptions {
  feature: AIFeature;
  systemPrompt?: string;
  userMessage: string | OpenAI.Chat.ChatCompletionMessageParam['content'];
  maxTokens?: number;
  temperature?: number;
  stream?: false;
}

export interface AIStreamOptions {
  feature: AIFeature;
  systemPrompt: string;
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  maxTokens?: number;
}

export interface AICallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Standard wrapper for all non-streaming AI calls.
 * Handles error catching, token counting, and response extraction.
 */
export async function callAI(options: AICallOptions): Promise<AICallResult> {
  const {
    feature,
    systemPrompt,
    userMessage,
    maxTokens = 1500,
    temperature = 0,
  } = options;

  const client = getAIClient();
  const model = getModel(feature);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({
    role: 'user',
    content: userMessage as any,
  });

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages,
  });

  const text = response.choices[0]?.message?.content || '';
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;

  return { text, inputTokens, outputTokens };
}

/**
 * Streaming AI call for chat. Returns the raw OpenAI stream.
 */
export async function callAIStream(options: AIStreamOptions) {
  const { feature, systemPrompt, messages, maxTokens = 2048 } = options;
  const client = getAIClient();
  const model = getModel(feature);

  return client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  });
}
