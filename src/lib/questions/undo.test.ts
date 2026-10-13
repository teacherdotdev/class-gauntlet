import { expect, test } from 'bun:test';
import { UndoStack } from './undo';

test('undo steps back through changes, redo steps forward, and a new change drops the redo trail', () => {
  const stack = new UndoStack<string>();
  expect(stack.undo('a')).toBeNull();
  stack.record('a'); // before a → b
  stack.record('b'); // before b → c
  expect(stack.undo('c')).toBe('b');
  expect(stack.undo('b')).toBe('a');
  expect(stack.undo('a')).toBeNull();
  expect(stack.redo('a')).toBe('b');
  stack.record('b'); // a new change from b
  expect(stack.redo('x')).toBeNull();
  expect(stack.undo('x')).toBe('b');
});

test('typing in one field counts as one step, until something else changes', () => {
  const stack = new UndoStack<string>();
  stack.record('T', 'title');
  stack.record('Ti', 'title');
  stack.record('Tit', 'title');
  expect(stack.undo('Titl')).toBe('T');
  expect(stack.undo('T')).toBeNull();
});
