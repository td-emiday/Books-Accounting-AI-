import { NextResponse } from 'next/server';
import { callAI, getModel } from '@/lib/ai/client';
import { loadPrompt } from '@/lib/ai/prompts';
import { stripPII } from '@/lib/ai/sanitize';
import { TransactionExtractionSchema, validateAIResponse } from '@/lib/ai/schemas';
import { logPrediction } from '@/lib/ai/logger';

const PROMPT_VERSION = 'v1.0.0';

function getServiceClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function sendWhatsAppReply(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !from) {
    console.error('Twilio credentials not configured');
    return;
  }

  const twilio = require('twilio')(accountSid, authToken);
  await twilio.messages.create({
    from,
    to: `whatsapp:${to}`,
    body,
  });
}

async function fetchMediaAsBase64(mediaUrl: string): Promise<string | null> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) return null;

    const res = await fetch(mediaUrl, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch {
    return null;
  }
}

async function extractFromImage(base64: string, mimeType: string) {
  const systemPrompt = loadPrompt('whatsapp-receipt-extraction');

  const result = await callAI({
    feature: 'receipt_extraction',
    systemPrompt,
    userMessage: [
      {
        type: 'image_url' as const,
        image_url: { url: `data:${mimeType};base64,${base64}` },
      },
      {
        type: 'text' as const,
        text: 'Extract the transaction details from this invoice/receipt/payment proof.',
      },
    ] as any,
    maxTokens: 1024,
  });

  const validation = validateAIResponse(result.text, TransactionExtractionSchema);
  if (validation.success) {
    return { data: validation.data, tokens: { input: result.inputTokens, output: result.outputTokens } };
  }

  // Fallback: try raw parse
  try {
    const cleaned = result.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return { data: JSON.parse(cleaned), tokens: { input: result.inputTokens, output: result.outputTokens } };
  } catch {
    console.error('Failed to parse AI receipt extraction:', result.text);
    return null;
  }
}

async function extractFromText(text: string) {
  const systemPrompt = loadPrompt('whatsapp-text-extraction');
  const sanitized = stripPII(text);

  const result = await callAI({
    feature: 'text_extraction',
    systemPrompt,
    userMessage: sanitized,
    maxTokens: 512,
  });

  const validation = validateAIResponse(result.text, TransactionExtractionSchema);
  if (validation.success) {
    return { data: validation.data, tokens: { input: result.inputTokens, output: result.outputTokens } };
  }

  // Fallback
  try {
    const cleaned = result.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return { data: JSON.parse(cleaned), tokens: { input: result.inputTokens, output: result.outputTokens } };
  } catch {
    console.error('Failed to parse AI text extraction:', result.text);
    return null;
  }
}

const TWIML_EMPTY = '<Response></Response>';
const TWIML_HEADERS = { 'Content-Type': 'text/xml' };

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const from = (formData.get('From') as string || '').replace('whatsapp:', '');
    const body = (formData.get('Body') as string || '').trim();
    const numMedia = parseInt(formData.get('NumMedia') as string || '0', 10);
    const messageSid = formData.get('MessageSid') as string || '';

    if (!from) {
      return new Response(TWIML_EMPTY, { headers: TWIML_HEADERS });
    }

    const supabase = getServiceClient();

    // Look up the phone number to find linked workspace
    const { data: link } = await supabase
      .from('whatsapp_links')
      .select('*')
      .eq('phone_number', from)
      .eq('verified', true)
      .single();

    // Handle verification flow
    if (!link) {
      const { data: pendingLink } = await supabase
        .from('whatsapp_links')
        .select('*')
        .eq('phone_number', from)
        .eq('verified', false)
        .single();

      if (pendingLink && body === pendingLink.verification_code) {
        await supabase
          .from('whatsapp_links')
          .update({ verified: true, verification_code: null })
          .eq('id', pendingLink.id);

        await sendWhatsAppReply(from,
          `✅ Your WhatsApp is now linked to Emiday!\n\nYou can now:\n📸 Send photos of invoices or receipts\n📄 Send PDF documents\n💬 Type transactions like "paid 50k for diesel"\n\nWe'll automatically add them to your books.`
        );

        return new Response(TWIML_EMPTY, { headers: TWIML_HEADERS });
      }

      await sendWhatsAppReply(from,
        `👋 Hi! This number isn't linked to an Emiday account yet.\n\nTo get started:\n1. Log into your Emiday dashboard\n2. Go to Settings → WhatsApp\n3. Link your phone number\n\nVisit emiday.africa to sign up.`
      );

      return new Response(TWIML_EMPTY, { headers: TWIML_HEADERS });
    }

    const workspaceId = link.workspace_id;

    // Log inbound message
    const messageType = numMedia > 0
      ? ((formData.get('MediaContentType0') as string || '').startsWith('image/') ? 'image' : 'document')
      : 'text';

    const { data: msgLog } = await supabase
      .from('whatsapp_messages')
      .insert({
        workspace_id: workspaceId,
        phone_number: from,
        direction: 'inbound',
        message_type: messageType,
        body: body || null,
        media_url: numMedia > 0 ? (formData.get('MediaUrl0') as string) : null,
        status: 'processing',
        twilio_sid: messageSid,
      })
      .select()
      .single();

    let extracted: any = null;
    let tokenUsage = { input: 0, output: 0 };

    // Handle commands
    if (body.toLowerCase() === 'help') {
      await sendWhatsAppReply(from,
        `📚 *Emiday — WhatsApp Bot*\n\nHere's what I can do:\n\n📸 *Send a photo* of an invoice or receipt — I'll extract and book it\n📄 *Send a PDF* document — I'll parse and book it\n💬 *Type a transaction* — e.g. "paid 50k for office supplies"\n\n📊 Type *summary* for a quick financial summary\n🤖 Type *ai* to ask the AI assistant a question\n❓ Type *help* for this menu\n\nDashboard: https://emiday.africa/dashboard`
      );

      if (msgLog) await supabase.from('whatsapp_messages').update({ status: 'completed' }).eq('id', msgLog.id);
      return new Response(TWIML_EMPTY, { headers: TWIML_HEADERS });
    }

    if (body.toLowerCase() === 'ai' || body.toLowerCase().startsWith('ask ')) {
      const question = body.toLowerCase().startsWith('ask ') ? body.slice(4).trim() : '';
      await sendWhatsAppReply(from,
        `🤖 *Ask the AI Assistant*\n\nOpen the AI chat in your dashboard:\n👉 https://emiday.africa/ai-chat${question ? `\n\nYou were about to ask: "${question}"` : ''}`
      );

      if (msgLog) await supabase.from('whatsapp_messages').update({ status: 'completed' }).eq('id', msgLog.id);
      return new Response(TWIML_EMPTY, { headers: TWIML_HEADERS });
    }

    if (body.toLowerCase() === 'summary') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const { data: txns } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('workspace_id', workspaceId)
        .gte('date', startOfMonth);

      const income = (txns || []).filter((t: any) => t.type === 'INCOME').reduce((s: number, t: any) => s + Number(t.amount), 0);
      const expense = (txns || []).filter((t: any) => t.type === 'EXPENSE').reduce((s: number, t: any) => s + Number(t.amount), 0);

      await sendWhatsAppReply(from,
        `📊 *${now.toLocaleDateString('en', { month: 'long', year: 'numeric' })} Summary*\n\n💰 Income: ₦${income.toLocaleString()}\n💸 Expenses: ₦${expense.toLocaleString()}\n📈 Net: ₦${(income - expense).toLocaleString()}\n\n🔍 View full reports: https://emiday.africa/reports\n🤖 Ask AI: https://emiday.africa/ai-chat`
      );

      if (msgLog) await supabase.from('whatsapp_messages').update({ status: 'completed' }).eq('id', msgLog.id);
      return new Response(TWIML_EMPTY, { headers: TWIML_HEADERS });
    }

    // Process media (images/documents)
    if (numMedia > 0) {
      const mediaUrl = formData.get('MediaUrl0') as string;
      const mediaType = formData.get('MediaContentType0') as string || '';

      if (mediaType.startsWith('image/')) {
        const base64 = await fetchMediaAsBase64(mediaUrl);
        if (base64) {
          const result = await extractFromImage(base64, mediaType);
          if (result) {
            extracted = result.data;
            tokenUsage = result.tokens;
          }
        }
      } else if (mediaType === 'application/pdf') {
        await sendWhatsAppReply(from,
          `📄 Got your PDF! For best results, please send a screenshot or photo of the invoice/receipt instead. PDF parsing via WhatsApp is coming soon.`
        );

        if (msgLog) await supabase.from('whatsapp_messages').update({ status: 'completed', error_message: 'PDF not yet supported via WhatsApp' }).eq('id', msgLog.id);
        return new Response(TWIML_EMPTY, { headers: TWIML_HEADERS });
      }
    } else if (body) {
      const result = await extractFromText(body);
      if (result) {
        extracted = result.data;
        tokenUsage = result.tokens;
      }
    }

    if (!extracted) {
      await sendWhatsAppReply(from,
        `🤔 I couldn't extract transaction details from that. Please try:\n\n📸 A clearer photo of the invoice/receipt\n💬 Or describe it: "paid 50k for diesel"`
      );

      if (msgLog) await supabase.from('whatsapp_messages').update({ status: 'failed', error_message: 'Could not extract transaction data' }).eq('id', msgLog.id);
      return new Response(TWIML_EMPTY, { headers: TWIML_HEADERS });
    }

    // Log prediction (non-blocking)
    logPrediction({
      userId: link.user_id,
      feature: messageType === 'text' ? 'text_extraction' : 'receipt_extraction',
      inputData: { messageType, body: stripPII(body || ''), hasMedia: numMedia > 0 },
      prediction: extracted,
      confidence: extracted.confidence,
      model: getModel(messageType === 'text' ? 'text_extraction' : 'receipt_extraction'),
      promptVersion: PROMPT_VERSION,
      needsReview: (extracted.confidence && extracted.confidence < 0.8) || extracted.amount > 500000,
      inputTokens: tokenUsage.input,
      outputTokens: tokenUsage.output,
    }).catch(() => {});

    // Create the transaction
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        workspace_id: workspaceId,
        type: extracted.type,
        amount: extracted.amount,
        currency: 'NGN',
        date: extracted.date || new Date().toISOString().split('T')[0],
        description: extracted.description,
        vendor_client: extracted.vendor_client || null,
        source: 'WHATSAPP',
        reference: extracted.reference || null,
        vat_applicable: extracted.vat_applicable || false,
        vat_amount: extracted.vat_amount || null,
        notes: extracted.notes || `Via WhatsApp from ${from}`,
        category_confirmed: false,
      })
      .select()
      .single();

    if (txError) {
      console.error('Failed to create transaction:', txError);
      await sendWhatsAppReply(from, `❌ Sorry, I couldn't save that transaction. Please try again or add it manually at emiday.africa`);
      if (msgLog) await supabase.from('whatsapp_messages').update({ status: 'failed', error_message: txError.message, ai_extraction: extracted }).eq('id', msgLog.id);
      return new Response(TWIML_EMPTY, { headers: TWIML_HEADERS });
    }

    // Update message log with success
    if (msgLog) {
      await supabase.from('whatsapp_messages').update({ status: 'completed', ai_extraction: extracted, transaction_id: tx.id }).eq('id', msgLog.id);
    }

    // Send confirmation
    const emoji = extracted.type === 'INCOME' ? '💰' : '💸';
    const sign = extracted.type === 'INCOME' ? '+' : '-';
    await sendWhatsAppReply(from,
      `${emoji} *Transaction recorded!*\n\n${extracted.type === 'INCOME' ? '📥 Income' : '📤 Expense'}: ${sign}₦${extracted.amount.toLocaleString()}\n📝 ${extracted.description}${extracted.vendor_client ? `\n🏢 ${extracted.vendor_client}` : ''}${extracted.reference ? `\n🔖 Ref: ${extracted.reference}` : ''}\n📅 ${extracted.date}\n${extracted.vat_applicable ? `🏛️ VAT: ₦${(extracted.vat_amount || extracted.amount * 0.075).toLocaleString()}\n` : ''}\n✏️ Edit: https://emiday.africa/transactions\n🤖 Ask AI: https://emiday.africa/ai-chat`
    );

    return new Response(TWIML_EMPTY, { headers: TWIML_HEADERS });
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error);
    return new Response(TWIML_EMPTY, { headers: TWIML_HEADERS });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'WhatsApp webhook is active' });
}
