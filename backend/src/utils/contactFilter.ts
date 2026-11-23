/**
 * Utility to detect contact information (phone numbers and email addresses)
 * in listing descriptions to prevent bypassing in-app chats.
 */

export interface ContactValidationResult {
  hasContact: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  message?: string;
}

/**
 * Extracts human-readable plain text from Quill HTML.
 * Preserves spaces between tags so words/numbers across elements don't merge.
 */
export function extractPlainTextFromHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a string contains phone numbers (Indian & International formats,
 * spaced, dotted, dashed, keyword-prefixed, or spelled out).
 * Avoids false positives on prices, dates, sqft, pincodes, and room counts.
 */
export function isPhoneDetected(text: string): boolean {
  if (!text) return false;

  // 1. Indian 10-digit mobile numbers starting with 6-9 (optional +91, 91, or 0 prefix)
  const indianMobileRegex = /(?:(?:\+|00)?91[\s.-]*)?(?:0[\s.-]*)?[6-9](?:[\s.-]*\d){9}\b/;
  if (indianMobileRegex.test(text)) return true;

  // 2. Explicit international phone number starting with + and country code
  const intlPhoneRegex = /\+\d{1,3}[\s.-]?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4}\b/;
  if (intlPhoneRegex.test(text)) return true;

  // 3. Keyword-prefixed numbers (e.g. 'call: 0802345678', 'whatsapp 9876543210')
  const keywordPhoneRegex = /(?:call|ph(?:one)?|mob(?:ile)?|whatsapp|contact|reach me|ping me|tel)[\s:.-]+(?:\+?\d[\d\s.-]{6,}\d)/i;
  if (keywordPhoneRegex.test(text)) return true;

  // 4. Consecutive number words (seven or more in a row, e.g. 'nine eight seven six five four three...')
  const wordDigitsRegex = /(?:\b(?:zero|one|two|three|four|five|six|seven|eight|nine)\b[\s,-]*){7,}/i;
  if (wordDigitsRegex.test(text)) return true;

  return false;
}

/**
 * Checks if a string contains email addresses (standard or obfuscated).
 */
export function isEmailDetected(text: string): boolean {
  if (!text) return false;

  // 1. Standard email address (e.g. user@gmail.com, test+tag@domain.co.in)
  const standardEmailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i;
  if (standardEmailRegex.test(text)) return true;

  // 2. Obfuscated email (e.g. user [at] gmail [dot] com, user(at)gmail(dot)com, user at gmail dot com)
  const obfuscatedEmailRegex = /\b[A-Za-z0-9._%+-]+(?:\s*@\s*|\s*\[at\]\s*|\s*\(at\)\s*|\s+at\s+)[A-Za-z0-9.-]+(?:\s*\.\s*|\s*\[dot\]\s*|\s*\(dot\)\s*|\s+dot\s+)[A-Za-z]{2,}\b/i;
  if (obfuscatedEmailRegex.test(text)) return true;

  return false;
}

/**
 * Validates whether HTML or plain text description contains restricted contact details.
 */
export function validateDescriptionContact(htmlOrText: string): ContactValidationResult {
  if (!htmlOrText) {
    return { hasContact: false, hasPhone: false, hasEmail: false };
  }

  const plainText = extractPlainTextFromHtml(htmlOrText);
  if (!plainText) {
    return { hasContact: false, hasPhone: false, hasEmail: false };
  }

  const hasPhone = isPhoneDetected(plainText);
  const hasEmail = isEmailDetected(plainText);
  const hasContact = hasPhone || hasEmail;

  let message: string | undefined = undefined;
  if (hasPhone && hasEmail) {
    message = 'Phone numbers and email addresses are not allowed in the listing description. Please use the in-app chat.';
  } else if (hasPhone) {
    message = 'Phone numbers are not allowed in the listing description. Please use the in-app chat.';
  } else if (hasEmail) {
    message = 'Email addresses are not allowed in the listing description. Please use the in-app chat.';
  }

  return {
    hasContact,
    hasPhone,
    hasEmail,
    message,
  };
}
