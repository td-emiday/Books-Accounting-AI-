/**
 * PII stripping utilities.
 * Strip sensitive financial data before sending to AI providers.
 */

// Nigerian account numbers: 10 digits (NUBAN)
const ACCOUNT_NUMBER_REGEX = /\b\d{10}\b/g;

// BVN: 11 digits
const BVN_REGEX = /\b\d{11}\b/g;

// Card numbers: 13-19 digits (possibly with spaces/dashes)
const CARD_NUMBER_REGEX = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,7}\b/g;

// Long digit sequences (16+ digits) — catch-all for account/card numbers
const LONG_DIGITS_REGEX = /\b\d{16,}\b/g;

// Email addresses
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/**
 * Strip PII from text before sending to AI.
 * Replaces sensitive patterns with safe placeholders.
 */
export function stripPII(text: string): string {
  return text
    .replace(CARD_NUMBER_REGEX, '[CARD]')
    .replace(LONG_DIGITS_REGEX, '[ACCOUNT]')
    .replace(BVN_REGEX, '[BVN]')
    .replace(ACCOUNT_NUMBER_REGEX, '[ACCT]')
    .replace(EMAIL_REGEX, '[EMAIL]');
}

/**
 * Strip PII from transaction descriptions specifically.
 * More targeted — only strips account/card numbers, preserves amounts.
 */
export function stripTransactionPII(description: string): string {
  return description
    .replace(CARD_NUMBER_REGEX, '[CARD]')
    .replace(LONG_DIGITS_REGEX, '[REF]')
    // Strip account numbers that appear after common prefixes
    .replace(/(?:acct?\.?|account|a\/c)\s*:?\s*\d{6,}/gi, '[ACCT_REF]');
}
