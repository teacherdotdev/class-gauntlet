import { expect, test } from 'bun:test';
import type { Question } from '../game/types';
import { fromPlain, type RichText } from '../rich/text';
import { cleanQuestion, questionProblems } from './edit';

const q = (over: Partial<Question> = {}): Question => ({ id: 'q', prompt: 'What is 7 × 8?', choices: ['54', '56'], correct: 1, ...over });

test('a question needs its text, two to four filled-in answers that differ, and one marked right', () => {
  expect(questionProblems(q())).toEqual([]);
  expect(questionProblems(q({ prompt: '  ' }))).toEqual(['Write the question.']);
  expect(questionProblems(q({ choices: ['54', ' '] }))).toEqual(['Fill in every answer, or remove the empty one.']);
  expect(questionProblems(q({ choices: ['56', '56 '] }))).toEqual(['Two answers are the same.']);
  expect(questionProblems(q({ choices: ['56'], correct: 0 }))).toEqual(['Give at least two answers.']);
  expect(questionProblems(q({ correct: 5 }))).toEqual(['Mark the right answer.']);
});

test('a saved question is trimmed, with empty extras left off', () => {
  expect(cleanQuestion(q({ prompt: ' Hi ', choices: [' a', 'b '], explanation: ' ', topics: [] }))).toEqual({
    id: 'q',
    prompt: 'Hi',
    choices: ['a', 'b'],
    correct: 1,
  });
});

const picture = (asset: string): RichText => [{ type: 'block-image', asset }];
const math = (source: string): RichText => [{ type: 'paragraph', content: [{ type: 'inline-math', source }] }];

test('an answer that is only a picture is filled in, and two different pictures differ', () => {
  const rich = { prompt: fromPlain('Which is a triangle?'), choices: [picture('a'), picture('b')] };
  expect(questionProblems(cleanQuestion(q({ rich })))).toEqual([]);
  expect(questionProblems(cleanQuestion(q({ rich: { ...rich, choices: [picture('a'), picture('a')] } })))).toEqual(['Two answers are the same.']);
  expect(questionProblems(cleanQuestion(q({ rich: { ...rich, prompt: fromPlain(' ') } })))).toEqual(['Write the question.']);
});

test('a saved question’s plain text follows its rich text, which is kept only when it says more', () => {
  const kept = cleanQuestion(q({ rich: { prompt: math('x^2'), choices: [fromPlain('4'), fromPlain('9')], explanation: fromPlain('') } }));
  expect(kept).toEqual({ id: 'q', prompt: 'x^2', choices: ['4', '9'], correct: 1, rich: { prompt: math('x^2'), choices: [fromPlain('4'), fromPlain('9')] } });
  const plain = cleanQuestion(q({ rich: { prompt: fromPlain('Plain?'), choices: [fromPlain('a'), fromPlain('b')] } }));
  expect(plain).toEqual({ id: 'q', prompt: 'Plain?', choices: ['a', 'b'], correct: 1 });
});
