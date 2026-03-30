import { z } from 'zod';

/**
 * Zod schemas for validating AI responses.
 * Every AI JSON response must pass validation before being used.
 */

// Bank statement categorisation response
export const CategorisationSchema = z.object({
  categoryId: z.string().uuid(),
  categoryName: z.string().min(1),
  confidence: z.number().min(0).max(1),
  vatApplicable: z.boolean(),
  whtApplicable: z.boolean(),
  reasoning: z.string().optional(),
});

export type CategorisationResult = z.infer<typeof CategorisationSchema>;

// Bank statement extraction response
export const BankStatementExtractionSchema = z.object({
  currency: z.string().length(3).default('NGN'),
  transactions: z.array(z.object({
    date: z.string(),
    description: z.string(),
    credit: z.number().nullable(),
    debit: z.number().nullable(),
    balance: z.number().nullable().optional(),
    reference: z.string().nullable().optional(),
  })),
});

export type BankStatementExtraction = z.infer<typeof BankStatementExtractionSchema>;

// WhatsApp receipt/text extraction response
export const TransactionExtractionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive(),
  description: z.string().min(1),
  vendor_client: z.string().nullable().optional(),
  date: z.string(),
  reference: z.string().nullable().optional(),
  vat_applicable: z.boolean().default(false),
  vat_amount: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type TransactionExtraction = z.infer<typeof TransactionExtractionSchema>;

/**
 * Safely parse and validate AI JSON response against a Zod schema.
 * Returns { success: true, data } or { success: false, error }.
 */
export function validateAIResponse<T>(
  rawText: string,
  schema: z.ZodType<T>
): { success: true; data: T } | { success: false; error: string; raw: string } {
  try {
    // Strip markdown fences if present
    const cleaned = rawText.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();

    // Try to extract JSON object or array from response
    let jsonStr = cleaned;
    if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
      const match = cleaned.match(/[\[{][\s\S]*[\]}]/);
      if (match) jsonStr = match[0];
    }

    const parsed = JSON.parse(jsonStr);
    const result = schema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      error: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
      raw: rawText,
    };
  } catch (e: any) {
    return {
      success: false,
      error: `JSON parse failed: ${e.message}`,
      raw: rawText,
    };
  }
}
