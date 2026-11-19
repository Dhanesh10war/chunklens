/**
 * Zero-dependency inline Markdown and directive parser.
 * Handles:
 * - Bold: `**text**`
 * - Italic: `*text*`
 * - Inline code: `` `code` ``
 * - Links: `[label](url)`
 * - Glossary terms: `[[term-id|label]]` or `[[term-id]]`
 */

export interface TextToken {
  type: 'text';
  content: string;
}

export interface BoldToken {
  type: 'bold';
  content: string;
}

export interface ItalicToken {
  type: 'italic';
  content: string;
}

export interface CodeToken {
  type: 'code';
  content: string;
}

export interface LinkToken {
  type: 'link';
  text: string;
  url: string;
}

export interface GlossaryToken {
  type: 'glossary';
  termId: string;
  label: string;
}

export type InlineToken =
  | TextToken
  | BoldToken
  | ItalicToken
  | CodeToken
  | LinkToken
  | GlossaryToken;

export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let remaining = text;

  // Regex matching inline formatting tokens in priority order
  const tokenRegex = /(\[\[([^|\]]+)(?:\|([^\]]+))?\]\])|(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/;

  while (remaining.length > 0) {
    const match = tokenRegex.exec(remaining);
    if (!match) {
      tokens.push({ type: 'text', content: remaining });
      break;
    }

    const matchIndex = match.index;
    if (matchIndex > 0) {
      tokens.push({ type: 'text', content: remaining.slice(0, matchIndex) });
    }

    if (match[1]) {
      // Glossary [[term-id|label]] or [[term-id]]
      const termId = match[2].trim();
      const label = match[3] ? match[3].trim() : termId;
      tokens.push({ type: 'glossary', termId, label });
    } else if (match[4]) {
      // Link [text](url)
      const linkText = match[5];
      const url = match[6];
      tokens.push({ type: 'link', text: linkText, url });
    } else if (match[7]) {
      // Inline code `code`
      tokens.push({ type: 'code', content: match[8] });
    } else if (match[9]) {
      // Bold **text**
      tokens.push({ type: 'bold', content: match[10] });
    } else if (match[11]) {
      // Italic *text*
      tokens.push({ type: 'italic', content: match[12] });
    }

    remaining = remaining.slice(matchIndex + match[0].length);
  }

  return tokens;
}
