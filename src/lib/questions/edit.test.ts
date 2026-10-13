import { expect, test } from 'bun:test';
import type { Question } from '../game/types';
import { cleanQuestion, moveQuestion, questionProblems } from './edit';

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

test('moving a question puts it where it was dropped', () => {
  const list = ['a', 'b', 'c', 'd'].map((id) => q({ id }));
  expect(moveQuestion(list, 0, 2).map((x) => x.id)).toEqual(['b', 'c', 'a', 'd']);
  expect(moveQuestion(list, 3, 0).map((x) => x.id)).toEqual(['d', 'a', 'b', 'c']);
  expect(moveQuestion(list, 1, 1)).toBe(list);
});
