/**
 * Utility to clean and sanitize article HTML and excerpts,
 * especially when pasted from external word processors like Google Docs or Microsoft Word.
 */

export function cleanArticleHtml(html: string): string {
  if (!html) return '';

  let cleaned = html;

  // 1. Remove Google Docs internal wrapper spans: <b id="docs-internal-guid-..."> or <span id="docs-internal-guid-...">
  cleaned = cleaned.replace(/<(span|b)[^>]*id=["']docs-internal-guid-[^"']*["'][^>]*>/gi, '');

  // 2. Remove style attributes or specific style rules that break dark/light mode and website typography
  cleaned = cleaned.replace(/style=(["'])(.*?)\1/gi, (match, quote, styleContent) => {
    // Remove font-family, hardcoded text colors, background colors, and pt font-sizes
    const cleanedStyles = styleContent
      .split(';')
      .map((rule: string) => rule.trim())
      .filter((rule: string) => {
        if (!rule) return false;
        const lower = rule.toLowerCase();
        // Remove font-family
        if (lower.startsWith('font-family')) return false;
        // Remove color (black/white/greys) so theme adapts
        if (/^color\s*:\s*(#000000|#000|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|rgba\(\s*0\s*,\s*0\s*,\s*0|#111|#222|#333|black|inherit)/i.test(lower)) return false;
        // Remove background-color (transparent or white or black)
        if (lower.startsWith('background-color') || lower.startsWith('background')) {
          if (/transparent|#fff|#ffffff|rgb\(\s*255|#000|#000000|rgb\(\s*0/i.test(lower)) return false;
        }
        // Remove fixed pt font-size from docs
        if (/^font-size\s*:\s*\d+(\.\d+)?(pt|px)/i.test(lower)) return false;
        // Remove Google Docs line-height if it conflicts
        if (/^line-height\s*:\s*1\.\d+/i.test(lower)) return false;
        // Remove margin-top/bottom in pt
        if (/^margin-(top|bottom)\s*:\s*\d+pt/i.test(lower)) return false;
        return true;
      })
      .join('; ');

    return cleanedStyles ? `style=${quote}${cleanedStyles}${quote}` : '';
  });

  // 3. Remove empty span wrappers like <span>text</span> or <span class="...">
  // Only keep span if it has remaining meaningful style or class
  cleaned = cleaned.replace(/<span>(.*?)<\/span>/gi, '$1');
  cleaned = cleaned.replace(/<span style=["']\s*["']>(.*?)<\/span>/gi, '$1');

  // 5. Clean fixed dimensions and inline styling on img tags to ensure complete responsiveness
  cleaned = cleaned.replace(/<img([^>]*)>/gi, (match, attrs) => {
    const cleanedAttrs = attrs
      .replace(/\s+(width|height)=["']\d+["']/gi, '')
      .replace(/style=(["'])(.*?)\1/gi, (m: string, q: string, styleStr: string) => {
        const rules = styleStr
          .split(';')
          .map((r: string) => r.trim())
          .filter((r: string) => {
            const l = r.toLowerCase();
            return !l.startsWith('width') && !l.startsWith('height') && !l.startsWith('max-width');
          })
          .join('; ');
        return rules ? `style=${q}${rules}${q}` : '';
      });
    return `<img${cleanedAttrs} loading="lazy" class="reaksi-article-img" />`;
  });

  return cleaned.trim();
}

/**
 * Extracts a clean, plain-text excerpt from the first sentence (penggalan awal sampai titik pertama).
 * Rule: "ambil penggalan awal sampai dengan titik pertama (.) jangan asal potong, kalau tidak cukup gunakan (...)"
 */
export function extractCleanExcerpt(text?: string, fallbackContent?: string, maxLen = 180): string {
  // Prefer fallbackContent if it's longer/richer and text is missing or looks pre-truncated
  let raw = '';
  if (fallbackContent && fallbackContent.trim().length > 0 && (!text || text.endsWith('...') || text.endsWith('....') || text.length < 50)) {
    raw = fallbackContent;
  } else if (text && text.trim().length > 0) {
    raw = text;
  } else if (fallbackContent && fallbackContent.trim().length > 0) {
    raw = fallbackContent;
  }

  if (!raw) return '';

  // Extract first meaningful text paragraph from HTML or Markdown
  let source = raw;
  if (source.includes('<p') || source.includes('<div')) {
    const paragraphs = source.match(/<(p|div)[^>]*>([\s\S]*?)<\/\1>/gi);
    if (paragraphs && paragraphs.length > 0) {
      for (const p of paragraphs) {
        const cleanP = p.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').trim();
        if (cleanP.length > 15) {
          source = cleanP;
          break;
        }
      }
    }
  } else if (source.includes('\n')) {
    const chunks = source.split(/\n\s*\n/).map((c) => c.trim()).filter((c) => c.length > 15);
    if (chunks.length > 0) {
      source = chunks[0];
    }
  }

  // Strip all HTML tags, docs IDs, and entities
  const stripped = source
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/docs-internal-guid-[a-f0-9-]+/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/<[^>]*$/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!stripped) return '';

  // Clean trailing ellipsis if present from pre-cut input
  const cleanStripped = stripped.replace(/(\s*\.{3,}|\s*\(\.{3,}\))+$/, '').trim();

  // Find the first sentence ending with a period followed by space or end of string.
  // We check for at least 25 characters to ignore titles/abbreviations like "Dr.", "No. 1".
  const periodRegex = /([.!?])(?=\s|$)/g;
  let match: RegExpExecArray | null;
  let firstSentence = '';
  while ((match = periodRegex.exec(cleanStripped)) !== null) {
    const candidate = cleanStripped.slice(0, match.index + 1).trim();
    if (candidate.length >= 25) {
      firstSentence = candidate;
      break;
    }
  }

  // If a complete first sentence is found and fits within maxLen, return it
  if (firstSentence && firstSentence.length <= maxLen) {
    return firstSentence;
  }

  // If sentence exceeds maxLen or no ending period was found ("kalau tidak cukup gunakan (...)")
  let truncated = cleanStripped.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.5) {
    truncated = truncated.slice(0, lastSpace);
  }
  truncated = truncated.replace(/[,;:\-.\s]+$/, '');
  return `${truncated} (...)`;
}
