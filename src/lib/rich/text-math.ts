import { plainOf, type RichNode, type RichText } from './text';

/**
 * Math written as text: `$…$`, `$$…$$`, `\(…\)` and `\[…\]`, the way a
 * spreadsheet or an AI chat writes it. Reading it turns those into math;
 * writing a spreadsheet puts math back that way, so it comes back as math.
 *
 * A lone `$` is money far more often than math, so `$…$` follows Pandoc's
 * rule: the opening `$` has no space after it, the closing one has no space
 * before it and no digit after it. "$5 and $10" stays words; `\$` is a
 * dollar sign.
 */

type Piece = { text: string } | { math: string; display: boolean };

const DIGIT = /[0-9]/;
const SPACE = /\s/;

/** Text cut into words and math. */
export function splitMath(text: string): Piece[] {
  const pieces: Piece[] = [];
  let words = '';
  const flush = () => {
    if (words) pieces.push({ text: words });
    words = '';
  };
  const math = (source: string, display: boolean) => {
    flush();
    pieces.push({ math: source.trim(), display });
  };
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    if (rest.startsWith('\\$')) {
      words += '$';
      i += 2;
      continue;
    }
    const bracket = rest.startsWith('\\(') ? '\\)' : rest.startsWith('\\[') ? '\\]' : null;
    if (bracket) {
      const end = text.indexOf(bracket, i + 2);
      if (end > i + 2) {
        math(text.slice(i + 2, end), bracket === '\\]');
        i = end + 2;
        continue;
      }
    }
    if (rest.startsWith('$$')) {
      const end = text.indexOf('$$', i + 2);
      if (end > i + 2 && text.slice(i + 2, end).trim()) {
        math(text.slice(i + 2, end), true);
        i = end + 2;
        continue;
      }
    }
    if (text[i] === '$' && text[i + 1] && !SPACE.test(text[i + 1]) && text[i + 1] !== '$') {
      let end = -1;
      for (let j = i + 2; j < text.length; j++) {
        if (text[j] !== '$' || text[j - 1] === '\\') continue;
        if (SPACE.test(text[j - 1]) || DIGIT.test(text[j + 1] ?? '')) continue;
        end = j;
        break;
      }
      if (end > 0) {
        math(text.slice(i + 1, end), false);
        i = end + 1;
        continue;
      }
    }
    words += text[i];
    i++;
  }
  flush();
  return pieces;
}

/** Whether text has math written as text in it. */
export function hasTextMath(text: string): boolean {
  return splitMath(text).some((piece) => 'math' in piece);
}

/** Rich Text with math written as text turned into math. Anything else is left as it was. */
export function mathFromText(rich: RichText): RichText {
  type Found = RichNode & { display?: boolean };
  const inline = (nodes: RichNode[]): Found[] =>
    nodes.flatMap((node): Found[] => {
      if (node.type !== 'text' || !node.text) return [node];
      const pieces = splitMath(node.text);
      if (!pieces.some((piece) => 'math' in piece)) return [node];
      return pieces.map((piece) => ('math' in piece ? { type: 'inline-math', source: piece.math, display: piece.display } : { ...node, text: piece.text }));
    });
  const plain = (nodes: Found[]): RichNode[] => nodes.map(({ display: _, ...node }) => node);
  const blocks = (nodes: RichNode[]): RichNode[] =>
    nodes.flatMap((node): RichNode[] => {
      if (!node.content) return [node];
      if (!node.content.some((n) => n.type === 'text')) return [{ ...node, content: blocks(node.content) }];
      const content = inline(node.content);
      // A paragraph that is nothing but one `$$…$$` is a block of math.
      const filled = content.filter((n) => !(n.type === 'text' && !n.text?.trim()));
      if (node.type === 'paragraph' && filled.length === 1 && filled[0].display) return [{ type: 'display-math', source: filled[0].source }];
      return [{ ...node, content: plain(content) }];
    });
  return blocks(rich);
}

/** Plain text with math written back as `$…$` and `$$…$$`, for a spreadsheet. */
export function textWithMath(rich: RichText | undefined): string {
  const write = (nodes: RichNode[]): RichNode[] =>
    nodes.map((node) => {
      if (node.type === 'inline-math') return { type: 'text', text: `$${node.source ?? ''}$` };
      if (node.type === 'display-math') return { type: 'paragraph', content: [{ type: 'text', text: `$$${node.source ?? ''}$$` }] };
      return node.content ? { ...node, content: write(node.content) } : node;
    });
  return plainOf(write(rich ?? []));
}
