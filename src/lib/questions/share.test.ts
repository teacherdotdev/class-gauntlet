import { expect, test } from 'bun:test';
import type { QuestionBank } from '../game/types';
import { fromPlain } from '../rich/text';
import { readShared, shareLink } from './share';

test('a shared bank keeps its formatting and math, and notes where a picture was', async () => {
  const bank: QuestionBank = {
    id: 'b',
    title: 'Shapes',
    updatedAt: 0,
    questions: [
      { id: 'p', prompt: 'Plain?', choices: ['a', 'b'], correct: 0 },
      {
        id: 'r',
        prompt: 'x^2\n[picture]',
        choices: ['4', '9'],
        correct: 1,
        rich: {
          prompt: [{ type: 'paragraph', content: [{ type: 'inline-math', source: 'x^2' }] }, { type: 'block-image', asset: 'abc' }],
          choices: [fromPlain('4'), fromPlain('9')],
        },
      },
    ],
  };
  const link = await shareLink('https://example.test', bank);
  const shared = await readShared(new URL(link).hash);
  expect(shared?.questions.map(({ id: _, ...q }) => q)).toEqual([
    { prompt: 'Plain?', choices: ['a', 'b'], correct: 0, explanation: undefined },
    {
      prompt: 'x^2\n[picture]',
      choices: ['4', '9'],
      correct: 1,
      explanation: undefined,
      rich: {
        prompt: [{ type: 'paragraph', content: [{ type: 'inline-math', source: 'x^2' }] }, { type: 'text', text: '[picture]' }],
        choices: [fromPlain('4'), fromPlain('9')],
      },
    },
  ]);
});
