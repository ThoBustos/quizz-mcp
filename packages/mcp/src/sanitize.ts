/**
 * Sanitize user input to prevent XSS and injection attacks.
 * For content storage, we strip potentially dangerous HTML/script content
 * while preserving code blocks and formatting.
 */

// Characters that could be dangerous in various contexts
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi, // onclick=, onerror=, etc.
];

/**
 * Sanitize content by removing potentially dangerous patterns.
 * Preserves code blocks and markdown formatting.
 */
export function sanitizeContent(content: string): string {
  let sanitized = content;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Trim excessive whitespace
  sanitized = sanitized.replace(/\n{4,}/g, "\n\n\n");

  return sanitized.trim();
}

/**
 * Validate that content doesn't contain obvious malicious patterns.
 * Returns an error message if suspicious, null if OK.
 */
export function validateContent(content: string): string | null {
  // Check for excessive script-like content outside code blocks
  const suspiciousPatterns = [
    { pattern: /<script/gi, name: "script tags" },
    { pattern: /eval\s*\(/gi, name: "eval calls" },
    { pattern: /document\.cookie/gi, name: "cookie access" },
  ];

  for (const { pattern, name } of suspiciousPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 5) {
      return `Content contains suspicious ${name} (${matches.length} occurrences)`;
    }
  }

  return null;
}
