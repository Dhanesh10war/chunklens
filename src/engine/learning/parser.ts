/**
 * Zero-dependency Markdown + Directive Parser for ChunkLens Learn Track
 * 
 * Supports:
 * - Deterministic heading slugs
 * - Block directives: :::widget[id]{props}, :::callout[type]{title}, :::quiz{id}, :::tryit[id]{...}, :::compare{...}
 * - Inline glossary terms: [[term-id|Text]] or [[term-id]]
 * - Strips `<!-- claim: [...] -->` annotations
 * - Headings, paragraphs, unordered & ordered lists, blockquotes, code blocks, tables
 */

export interface BaseNode {
  type: string;
}

export interface HeadingNode extends BaseNode {
  type: 'heading';
  level: number;
  text: string;
  id: string;
}

export interface ParagraphNode extends BaseNode {
  type: 'paragraph';
  text: string;
}

export interface ListNode extends BaseNode {
  type: 'list';
  ordered: boolean;
  items: string[];
}

export interface CodeNode extends BaseNode {
  type: 'code';
  language: string;
  code: string;
}

export interface BlockquoteNode extends BaseNode {
  type: 'blockquote';
  text: string;
}

export interface TableNode extends BaseNode {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface WidgetNode extends BaseNode {
  type: 'widget';
  widgetId: string;
  props: Record<string, string>;
}

export interface CalloutNode extends BaseNode {
  type: 'callout';
  calloutType: 'note' | 'tip' | 'warning' | 'info';
  title: string;
  content: string;
}

export interface QuizNode extends BaseNode {
  type: 'quiz';
  quizId: string;
}

export interface TryItNode extends BaseNode {
  type: 'tryit';
  presetId: string;
  props: Record<string, string>;
}

export interface CompareNode extends BaseNode {
  type: 'compare';
  leftTitle: string;
  leftContent: string;
  rightTitle: string;
  rightContent: string;
}

export type ContentBlock =
  | HeadingNode
  | ParagraphNode
  | ListNode
  | CodeNode
  | BlockquoteNode
  | TableNode
  | WidgetNode
  | CalloutNode
  | QuizNode
  | TryItNode
  | CompareNode;

export interface ParsedDocument {
  title: string;
  blocks: ContentBlock[];
  headings: Array<{ level: number; text: string; id: string }>;
}

/**
 * Generates deterministic URL-safe heading IDs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Strips HTML comments such as `<!-- claim: [...] -->` from raw markdown
 */
export function stripClaimAnnotations(markdown: string): string {
  return markdown.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Parses directive attribute string like `{size="400" unit="characters"}` or `{left="A" right="B"}`
 */
function parseDirectiveProps(propsStr?: string): Record<string, string> {
  if (!propsStr) return {};
  const props: Record<string, string> = {};
  const trimmed = propsStr.trim().replace(/^\{|\}$/g, '');
  const regex = /([\w-]+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(trimmed)) !== null) {
    const key = match[1];
    const val = match[2] ?? match[3] ?? match[4] ?? '';
    props[key] = val;
  }
  return props;
}

/**
 * Parses markdown source into structured ContentBlocks
 */
export function parseLearnMarkdown(rawMarkdown: string): ParsedDocument {
  const cleanMarkdown = stripClaimAnnotations(rawMarkdown);
  const lines = cleanMarkdown.split(/\r?\n/);
  const blocks: ContentBlock[] = [];
  const headings: Array<{ level: number; text: string; id: string }> = [];
  let title = '';

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // 1. Fenced Code Block
    if (line.trim().startsWith('```')) {
      const match = line.trim().match(/^```(\w+)?/);
      const language = match ? match[1] || 'text' : 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({
        type: 'code',
        language,
        code: codeLines.join('\n'),
      });
      continue;
    }

    // 2. Block Directives (:::directive[id]{props})
    if (line.trim().startsWith(':::')) {
      const dirMatch = line.trim().match(/^:::(\w+)(?:\[([^\]]+)\])?(?:\{([^}]*)\})?/);
      if (dirMatch) {
        const dirType = dirMatch[1].toLowerCase();
        const dirId = dirMatch[2] || '';
        const rawProps = dirMatch[3] || '';
        const props = parseDirectiveProps(rawProps);

        // Collect body inside ::: ... :::
        const bodyLines: string[] = [];
        i++;
        while (i < lines.length && lines[i].trim() !== ':::') {
          bodyLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++; // skip closing :::

        const bodyContent = bodyLines.join('\n').trim();

        if (dirType === 'widget') {
          blocks.push({
            type: 'widget',
            widgetId: dirId,
            props: { ...props, body: bodyContent },
          });
        } else if (dirType === 'callout') {
          const calloutType = (['note', 'tip', 'warning', 'info'].includes(dirId)
            ? dirId
            : 'note') as CalloutNode['calloutType'];
          blocks.push({
            type: 'callout',
            calloutType,
            title: props.title || (calloutType.toUpperCase()),
            content: bodyContent,
          });
        } else if (dirType === 'quiz') {
          blocks.push({
            type: 'quiz',
            quizId: dirId || props.id || 'default-quiz',
          });
        } else if (dirType === 'tryit') {
          blocks.push({
            type: 'tryit',
            presetId: dirId || props.presetId || 'api-reference',
            props: { ...props, content: bodyContent },
          });
        } else if (dirType === 'compare') {
          const leftTitle = props.left || 'Approach A';
          const rightTitle = props.right || 'Approach B';
          const parts = bodyContent.split(/\n===+\n/);
          blocks.push({
            type: 'compare',
            leftTitle,
            leftContent: parts[0]?.trim() || '',
            rightTitle,
            rightContent: parts[1]?.trim() || '',
          });
        }
        continue;
      }
    }

    // 3. Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = slugify(text);
      if (level === 1 && !title) {
        title = text;
      }
      headings.push({ level, text, id });
      blocks.push({
        type: 'heading',
        level,
        text,
        id,
      });
      i++;
      continue;
    }

    // 4. Blockquotes
    if (line.trim().startsWith('>')) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        bqLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'blockquote',
        text: bqLines.join('\n'),
      });
      continue;
    }

    // 5. Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (r: string) =>
          r
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
        const headers = parseRow(tableLines[0]);
        // line 1 is separator |---|---|
        const rows = tableLines.slice(2).map(parseRow);
        blocks.push({
          type: 'table',
          headers,
          rows,
        });
        continue;
      }
    }

    // 6. Lists (Unordered or Ordered)
    const isBullet = /^(\*|-)\s+/.test(line.trim());
    const isNumber = /^\d+\.\s+/.test(line.trim());
    if (isBullet || isNumber) {
      const ordered = isNumber;
      const items: string[] = [];
      while (i < lines.length) {
        const itemLine = lines[i].trim();
        const matchesCurrent = ordered ? /^\d+\.\s+(.+)$/.exec(itemLine) : /^(\*|-)\s+(.+)$/.exec(itemLine);
        if (matchesCurrent) {
          items.push(matchesCurrent[ordered ? 1 : 2]);
          i++;
        } else if (itemLine.startsWith('  ') && items.length > 0) {
          // Multiline list item continuation
          items[items.length - 1] += ' ' + itemLine.trim();
          i++;
        } else {
          break;
        }
      }
      blocks.push({
        type: 'list',
        ordered,
        items,
      });
      continue;
    }

    // 7. Regular Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith(':::') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('|') &&
      !/^(\*|-|\d+\.)\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: paraLines.join(' '),
      });
    }
  }

  return {
    title: title || 'Lesson',
    blocks,
    headings,
  };
}
