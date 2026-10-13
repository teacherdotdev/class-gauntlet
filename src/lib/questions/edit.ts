import type { Question } from '../game/types';

/** What stops a question from being saved, as a teacher would fix it. */
export function questionProblems(q: Question): string[] {
  const problems: string[] = [];
  const choices = q.choices.map((c) => c.trim());
  if (!q.prompt.trim()) problems.push('Write the question.');
  if (choices.length < 2) problems.push('Give at least two answers.');
  else if (choices.some((c) => !c)) problems.push('Fill in every answer, or remove the empty one.');
  else if (new Set(choices.map((c) => c.toLowerCase())).size !== choices.length) problems.push('Two answers are the same.');
  if (choices.length >= 2 && !(q.correct >= 0 && q.correct < choices.length)) problems.push('Mark the right answer.');
  return problems;
}

/** A question as it's kept: trimmed, without an empty explanation or Topic list. */
export function cleanQuestion(q: Question): Question {
  const explanation = q.explanation?.trim();
  return {
    id: q.id,
    prompt: q.prompt.trim(),
    choices: q.choices.map((c) => c.trim()),
    correct: q.correct,
    ...(explanation ? { explanation } : {}),
    ...(q.topics?.length ? { topics: q.topics } : {}),
  };
}

/** The list with one question moved to where it was dropped. */
export function moveQuestion(list: Question[], from: number, to: number): Question[] {
  if (from === to) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
