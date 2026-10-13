import { expect, test } from 'bun:test';
import type { Question, QuestionBank } from '../game/types';
import { browse, libraryTopics } from './browse';

const q = (id: string, prompt: string, topics?: string[]): Question => ({
  id,
  prompt,
  choices: ['a', 'b'],
  correct: 0,
  ...(topics ? { topics } : {}),
});
const bank = (id: string, title: string, questions: Question[]): QuestionBank => ({ id, title, questions, updatedAt: 0 });

const library = [
  bank('frac', 'Fractions', [q('f1', 'What is 1/2 + 1/4?', ['adding', 'halves']), q('f2', 'Which is larger, 2/3 or 3/5?')]),
  bank('dec', 'Decimals', [q('d1', 'Write one half as a decimal', ['Halves']), q('d2', 'Round 2.45 to one place')]),
];
const ids = (rows: { question: Question }[]) => rows.map((row) => row.question.id);

test('every question in the library, each with its bank, when nothing filters', () => {
  const rows = browse(library, { search: '', filters: [] });
  expect(rows.map((row) => [row.question.id, row.bank.title])).toEqual([
    ['f1', 'Fractions'],
    ['f2', 'Fractions'],
    ['d1', 'Decimals'],
    ['d2', 'Decimals'],
  ]);
});

test('search matches question and answer text, ignoring case', () => {
  expect(ids(browse(library, { search: 'HALF', filters: [] }))).toEqual(['d1']);
  expect(ids(browse(library, { search: '2/3', filters: [] }))).toEqual(['f2']);
});

test('a filter keeps questions matching any of its values; several filters must all match', () => {
  expect(ids(browse(library, { search: '', filters: [{ property: 'topic', values: ['halves'] }] }))).toEqual(['f1', 'd1']);
  expect(ids(browse(library, { search: '', filters: [{ property: 'bank', values: ['frac', 'dec'] }] }))).toHaveLength(4);
  expect(
    ids(
      browse(library, {
        search: '',
        filters: [
          { property: 'topic', values: ['halves'] },
          { property: 'bank', values: ['dec'] },
        ],
      }),
    ),
  ).toEqual(['d1']);
  // A filter with nothing chosen yet doesn't narrow anything.
  expect(ids(browse(library, { search: '', filters: [{ property: 'topic', values: [] }] }))).toHaveLength(4);
});

test('the library’s Topics, each once whatever its case, in the order first seen', () => {
  expect(libraryTopics(library)).toEqual(['adding', 'halves']);
});

test('clicking selects one question; Cmd/Ctrl-click toggles one; Shift-click selects the run from the last click', async () => {
  const { select } = await import('./browse');
  const order = ['a', 'b', 'c', 'd', 'e'];
  let s = select({ ids: [], anchor: null }, 'b', {}, order);
  expect(s).toEqual({ ids: ['b'], anchor: 'b' });
  s = select(s, 'd', { toggle: true }, order);
  expect(s.ids).toEqual(['b', 'd']);
  s = select(s, 'b', { toggle: true }, order);
  expect(s).toEqual({ ids: ['d'], anchor: 'b' });
  s = select({ ids: ['b'], anchor: 'b' }, 'e', { range: true }, order);
  expect(s.ids).toEqual(['b', 'c', 'd', 'e']);
  // Shift-click adds the run to a Cmd-click selection, keeping the anchor.
  s = select({ ids: ['a', 'e'], anchor: 'e' }, 'c', { range: true }, order);
  expect(s).toEqual({ ids: ['a', 'e', 'c', 'd'], anchor: 'e' });
  // A plain click on the only selected question clears it.
  expect(select({ ids: ['c'], anchor: 'c' }, 'c', {}, order).ids).toEqual([]);
});
