/**
 * Escape HTML entities to prevent XSS in rendered content.
 * Uses AST-based rendering where possible; this is a fallback for edge cases.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize a filename for display (strip path components).
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/^.*[\\/]/, '').replace(/[<>:"/\\|?*]/g, '_');
}
