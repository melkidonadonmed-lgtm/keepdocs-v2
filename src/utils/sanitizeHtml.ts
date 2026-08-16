import DOMPurify from "dompurify";

/**
 * Sanitiza HTML antes de injetá-lo no DOM (innerHTML / dangerouslySetInnerHTML),
 * prevenindo XSS armazenado. Preserva as tags comuns de editor rico
 * (b, i, ul, table, img com src data:/blob: etc.) — configuração padrão do DOMPurify.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|data|blob):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });
}
