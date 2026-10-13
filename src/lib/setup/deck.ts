import type { Question, QuestionBank } from '../game/types';
import { plural } from '../words';

/** The chosen questions (by id) that are still in the library, in order. */
export function questionsFor(library: QuestionBank[], ids: string[]): Question[] {
  const byId = new Map(library.flatMap((bank) => bank.questions.map((q) => [q.id, q] as const)));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

/** A name for a game: its bank's title, or how many banks it draws on. */
export function titleFor(library: QuestionBank[], questions: Question[]): string {
  const ids = new Set(questions.map((q) => q.id));
  const banks = library.filter((bank) => bank.questions.some((q) => ids.has(q.id))).map((bank) => bank.title);
  return banks.length === 1 ? banks[0] : `${plural(questions.length, 'question')} from ${plural(banks.length, 'bank')}`;
}
