import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export interface PredictionLog {
  userId: string;
  feature: 'bank_categorisation' | 'bank_extraction' | 'receipt_extraction' | 'text_extraction' | 'chat' | 'report_narrative';
  inputData: object;
  prediction: object;
  confidence?: number;
  model: string;
  promptVersion: string;
  needsReview?: boolean;
  jurisdiction?: string;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * Log every AI prediction to ai_predictions table.
 * This builds the training dataset for future fine-tuning.
 */
export async function logPrediction(log: PredictionLog): Promise<string> {
  try {
    const supabase = getServiceClient();
    const inputHash = crypto
      .createHash('md5')
      .update(JSON.stringify(log.inputData))
      .digest('hex');

    const { data, error } = await supabase
      .from('ai_predictions')
      .insert({
        user_id: log.userId,
        feature: log.feature,
        input_hash: inputHash,
        input_data: log.inputData,
        prediction: log.prediction,
        confidence: log.confidence,
        model: log.model,
        prompt_version: log.promptVersion,
        needs_review: log.needsReview ?? false,
        jurisdiction: log.jurisdiction,
        input_tokens: log.inputTokens,
        output_tokens: log.outputTokens,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log AI prediction:', error.message);
      return '';
    }

    return data?.id ?? '';
  } catch (e: any) {
    // Never let logging failures crash the main flow
    console.error('AI logger error:', e.message);
    return '';
  }
}

/**
 * Log when a user corrects an AI prediction.
 * These corrections become training data for fine-tuning.
 */
export async function logCorrection(
  predictionId: string,
  correctedData: object,
  correctionType: string
): Promise<void> {
  try {
    const supabase = getServiceClient();
    await supabase
      .from('ai_predictions')
      .update({
        was_corrected: true,
        corrected_data: correctedData,
        correction_timestamp: new Date().toISOString(),
        correction_type: correctionType,
      })
      .eq('id', predictionId);
  } catch (e: any) {
    console.error('AI correction log error:', e.message);
  }
}
