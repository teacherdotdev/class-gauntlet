import { describe, expect, test } from 'bun:test';
import { fromPlain } from './text';
import { hasTextMath, mathFromText, splitMath, textWithMath } from './text-math';

describe('math written as text', () => {
  test('reads $…$, $$…$$, \\(…\\) and \\[…\\]', () => {
    expect(splitMath('Half is $\\frac{1}{2}$.')).toEqual([{ text: 'Half is ' }, { math: '\\frac{1}{2}', display: false }, { text: '.' }]);
    expect(splitMath('$$x^2$$')).toEqual([{ math: 'x^2', display: true }]);
    expect(splitMath('so \\(a+b\\) and \\[c\\]')).toEqual([
      { text: 'so ' },
      { math: 'a+b', display: false },
      { text: ' and ' },
      { math: 'c', display: true },
    ]);
  });

  test('leaves money alone', () => {
    for (const money of ['$5 and $10', 'It costs $5.', 'between $ 3 and 4$', 'Pay \\$4 now'])
      expect(splitMath(money).every((piece) => 'text' in piece)).toBe(true);
    expect(splitMath('Pay \\$4 now')).toEqual([{ text: 'Pay $4 now' }]);
    expect(hasTextMath('$5 and $10')).toBe(false);
    expect(hasTextMath('$x$ costs $5')).toBe(true);
  });

  test('turns a cell into Rich Text with math', () => {
    expect(mathFromText(fromPlain('What is $\\frac{1}{2}$ of 8?'))).toEqual([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'What is ' },
          { type: 'inline-math', source: '\\frac{1}{2}' },
          { type: 'text', text: ' of 8?' },
        ],
      },
    ]);
    expect(mathFromText(fromPlain('$$x^2 + 1$$'))).toEqual([{ type: 'display-math', source: 'x^2 + 1' }]);
  });

  test('keeps a word’s formatting and reaches into tables', () => {
    const bold = mathFromText([{ type: 'paragraph', content: [{ type: 'text', text: 'Is $x$ odd', marks: [{ type: 'strong' }] }] }]);
    expect(bold[0].content?.[0]).toEqual({ type: 'text', text: 'Is ', marks: [{ type: 'strong' }] });
    const table = mathFromText([
      { type: 'table', content: [{ type: 'table-row', content: [{ type: 'table-cell', content: fromPlain('$y$') }] }] },
    ]);
    expect(table[0].content?.[0].content?.[0].content?.[0].content?.[0]).toEqual({ type: 'inline-math', source: 'y' });
  });

  test('writes math back so a spreadsheet round trip keeps it', () => {
    const rich = mathFromText(fromPlain('Solve $2x = 4$'));
    expect(textWithMath(rich)).toBe('Solve $2x = 4$');
    expect(textWithMath([{ type: 'display-math', source: 'x^2' }])).toBe('$$x^2$$');
    expect(mathFromText(fromPlain(textWithMath(rich)))).toEqual(rich);
  });
});
