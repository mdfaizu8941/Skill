/**
 * sanitizer.js — PII redaction and prompt injection protection utilities.
 * Applied before sending any user-generated text to Groq LLM.
 */

// ── Patterns for PII detection ──────────────────────────────────────────────

const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const PHONE_PATTERN =
  /(\+?\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,5}/g;

// Matches "Name: John Doe", "Full Name: ...", or a standalone first line
// that looks like a person's name (2-4 words, only letters)
const NAME_LABEL_PATTERN = /^(name|full name|candidate|applicant)\s*:\s*.+$/gim;

// ── Patterns for prompt injection detection ──────────────────────────────────

const INJECTION_PATTERNS = [
  // Role-injection openers
  /^\s*(ignore|disregard|forget|override|bypass|discard)\b.*/gim,
  // Role/persona assignment
  /^\s*(you are|act as|pretend|roleplay|simulate|behave as|your role is)\b.*/gim,
  // Chat-style role prefixes that can confuse message boundaries
  /^\s*(system\s*:|assistant\s*:|user\s*:|human\s*:)/gim,
  // Jailbreak phrases
  /\b(jailbreak|DAN mode|developer mode|unrestricted mode)\b/gi,
  // Instruction fence markers that might confuse the LLM
  /^\s*#{1,6}\s*(instructions?|prompt|system|override)\b.*/gim,
];

// ── Exported Functions ────────────────────────────────────────────────────────

/**
 * Redact personal identifiable information from text before sending to LLM.
 * Replaces email, phone numbers, and labelled name fields with placeholders.
 *
 * @param {string} text
 * @returns {string}
 */
export function redactPII(text) {
  if (!text || typeof text !== 'string') return text;

  return text
    .replace(EMAIL_PATTERN, '[EMAIL]')
    .replace(PHONE_PATTERN, '[PHONE]')
    .replace(NAME_LABEL_PATTERN, (match) => {
      // Keep the label, redact only the value
      const colonIdx = match.indexOf(':');
      return match.slice(0, colonIdx + 1) + ' [NAME]';
    });
}

/**
 * Strip prompt-injection patterns from text before sending to LLM.
 * Lines matching injection patterns are replaced with a blank line.
 *
 * @param {string} text
 * @returns {string}
 */
export function sanitizeForLLM(text) {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;

  for (const pattern of INJECTION_PATTERNS) {
    // Reset lastIndex for global patterns reused across calls
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, '');
  }

  // Collapse 3+ consecutive blank lines into 2 (clean up after removal)
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n').trim();

  return sanitized;
}
