import type { Question } from '../game/types';
import { hasContent, isPlain, plainOf, type RichText } from '../rich/text';

const filled = (plain: string, rich: RichText | undefined) => (rich ? hasContent(rich) : !!plain.trim());

/** What stops a question from being saved, as a teacher would fix it. */
export function questionProblems(q: Question): string[] {
  const problems: string[] = [];
  const choices = q.choices.map((c) => c.trim());
  if (!filled(q.prompt, q.rich?.prompt)) problems.push('Write the question.');
  if (choices.length < 2) problems.push('Give at least two answers.');
  else if (choices.some((c, i) => !filled(c, q.rich?.choices[i]))) problems.push('Fill in every answer, or remove the empty one.');
  else {
    // A choice with a picture or formatting is told apart by all of it, not just its words.
    const keys = choices.map((c, i) => {
      const rich = q.rich?.choices[i];
      return rich && !isPlain(rich) ? JSON.stringify(rich) : c.toLowerCase();
    });
    if (new Set(keys).size !== keys.length) problems.push('Two answers are the same.');
  }
  if (choices.length >= 2 && !(q.correct >= 0 && q.correct < choices.length)) problems.push('Mark the right answer.');
  return problems;
}

/**
 * A question as it's kept: trimmed, without an empty explanation or Topic
 * list. Its plain text follows its Rich Text, which it keeps only when that
 * says more than plain text could.
 */
export function cleanQuestion(q: Question): Question {
  const rich = q.rich;
  const prompt = rich ? plainOf(rich.prompt) : q.prompt.trim();
  const choices = rich ? rich.choices.map(plainOf) : q.choices.map((c) => c.trim());
  const explanation = rich ? (rich.explanation && hasContent(rich.explanation) ? plainOf(rich.explanation) : '') : q.explanation?.trim();
  const richer = rich && ![rich.prompt, ...rich.choices, ...(explanation ? [rich.explanation!] : [])].every(isPlain);
  return {
    id: q.id,
    prompt,
    choices,
    correct: q.correct,
    ...(explanation ? { explanation } : {}),
    ...(q.topics?.length ? { topics: q.topics } : {}),
    ...(richer
      ? { rich: { prompt: rich.prompt, choices: rich.choices, ...(explanation ? { explanation: rich.explanation } : {}) } }
      : {}),
  };
}
