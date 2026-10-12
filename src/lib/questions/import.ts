import {
  plainText,
  QUESTION_FILE_EXTENSIONS,
  QuestionFileError,
  readQuestionFile,
  type Question as BankQuestion,
  type QuestionType,
  type RichText,
} from '@teacherdotdev/question-commons';
import type { Question, QuestionSet } from '../game/types';
import { randomId } from '../game/engine';

/**
 * Question files are read by Question Commons, which knows the files
 * teachers' tools write: spreadsheets (ours, Kahoot's, Blooket's), Moodle,
 * Canvas, Blackboard, Respondus and more, as CSV, Excel, Word or text. Each Question Bank it reads becomes a
 * set. The game plays only multiple choice with one right answer, two to four
 * text choices and no pictures, so every other question is left out and the
 * teacher is told which and why.
 */

/** For the file picker: every file type a Format arrives as. */
export const questionFileTypes = QUESTION_FILE_EXTENSIONS.join(',');

/** `errors` are the questions (or the file) that were left out. */
export type ImportResult = { sets: QuestionSet[]; errors: string[]; formatLabel?: string };

const typeNames: Record<Exclude<QuestionType, 'multiple-choice' | 'multiple-answer'>, string> = {
  'true-false': 'true/false',
  matching: 'matching',
  'fill-in-the-blank': 'fill in the blank',
  'short-answer': 'short answer',
  numeric: 'numeric',
  ordering: 'ordering',
};

const has = (text: RichText | undefined, type: string): boolean =>
  !!text?.some((node) => node.type === type || has(node.content, type));

/** Why a question can't be played, or null when it can. */
function unplayable(q: BankQuestion): string | null {
  if (q.type === 'multiple-answer') return 'it has more than one right answer, and Class Gauntlet plays only multiple choice with one.';
  if (q.type !== 'multiple-choice') return `it is ${typeNames[q.type]}, and Class Gauntlet plays only multiple choice with one right answer.`;
  const texts = [q.stem, q.explanation, ...q.choices.map((c) => c.content)];
  if (texts.some((text) => has(text, 'block-image'))) return 'it has a picture, and Class Gauntlet shows only text.';
  if (texts.some((text) => has(text, 'inline-math'))) return 'it has math written as LaTeX, and Class Gauntlet shows only plain text.';
  if (q.choices.length < 2 || q.choices.length > 4) return `it has ${q.choices.length} answer choices, and Class Gauntlet plays 2 to 4.`;
  const choices = q.choices.map((c) => plainText(c.content).trim());
  if (choices.some((c) => c === '')) return 'an answer choice is blank.';
  if (new Set(choices.map((c) => c.toLowerCase())).size !== choices.length) return 'two answer choices are the same.';
  return null;
}

export async function importQuestionFile(file: { name: string; bytes: Uint8Array }): Promise<ImportResult> {
  let reading;
  try {
    reading = await readQuestionFile(file);
  } catch (reason) {
    if (!(reason instanceof QuestionFileError)) throw reason;
    const message =
      reason.code === 'not-recognized' ? `No questions were found in “${file.name}” in a format Class Gauntlet reads.` : reason.message;
    return { sets: [], errors: [message] };
  }
  const errors = reading.issues.map((issue) => issue.message);
  const sets: QuestionSet[] = [];
  for (const bank of reading.banks) {
    const questions: Question[] = [];
    for (const q of bank.questions) {
      const why = unplayable(q);
      if (why || q.type !== 'multiple-choice') {
        const { number, line } = q.provenance;
        errors.push(`Question ${number}${line ? ` (line ${line})` : ''}: ${why}`);
        continue;
      }
      questions.push({
        id: randomId(),
        prompt: plainText(q.stem).trim(),
        choices: q.choices.map((c) => plainText(c.content).trim()),
        correct: q.choices.findIndex((c) => c.correct),
        explanation: (q.explanation && plainText(q.explanation).trim()) || undefined,
      });
    }
    if (!questions.length) continue;
    sets.push({
      id: randomId(),
      title: bank.name,
      subject: bank.extras?.subject || undefined,
      grade: bank.extras?.grade || undefined,
      questions,
      updatedAt: Date.now(),
    });
  }
  return { sets, errors, formatLabel: reading.banks[0]?.provenance.formatLabel };
}

/** Cells pasted from a spreadsheet, or an AI chat's reply, read as a file of their own. */
export function importPasted(text: string): Promise<ImportResult> {
  return importQuestionFile({ name: 'Pasted questions.txt', bytes: new TextEncoder().encode(text) });
}
