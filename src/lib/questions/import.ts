import {
  plainText,
  QUESTION_FILE_EXTENSIONS,
  QuestionFileError,
  readQuestionFile,
  type Picture,
  type Question as BankQuestion,
  type QuestionType,
} from '@teacherdotdev/question-commons';
import type { Question, QuestionBank } from '../game/types';
import { randomId } from '../game/engine';
import { hasContent, isPlain, picturesIn, renamePictures, type RichText } from '../rich/text';
import { cleanQuestion } from './edit';

/**
 * Question files are read by Question Commons, which knows the files
 * teachers' tools write: spreadsheets (ours, Kahoot's, Blooket's), Moodle,
 * Canvas, Blackboard, Respondus and more, as CSV, Excel, Word or text. Each Question Bank it reads becomes a
 * set. The game plays only multiple choice with one right answer and two to
 * four choices, so every other question is left out and the teacher is told
 * which and why. Formatting, math and pictures come along.
 */

/** For the file picker: every file type a Format arrives as. */
export const questionFileTypes = QUESTION_FILE_EXTENSIONS.join(',');

/**
 * `errors` are the questions (or the file) that were left out. `pictures`
 * are the ones the sets show, under the file's own names for them, until
 * `keepPictures` stores them.
 */
export type ImportResult = { sets: QuestionBank[]; errors: string[]; formatLabel?: string; pictures: Record<string, Picture> };

const typeNames: Record<Exclude<QuestionType, 'multiple-choice' | 'multiple-answer'>, string> = {
  'true-false': 'true/false',
  matching: 'matching',
  'fill-in-the-blank': 'fill in the blank',
  'short-answer': 'short answer',
  numeric: 'numeric',
  ordering: 'ordering',
};

/** Why a question can't be played, or null when it can. */
function unplayable(q: BankQuestion): string | null {
  if (q.type === 'multiple-answer') return 'it has more than one right answer, and Class Gauntlet plays only multiple choice with one.';
  if (q.type !== 'multiple-choice') return `it is ${typeNames[q.type]}, and Class Gauntlet plays only multiple choice with one right answer.`;
  if (q.choices.length < 2 || q.choices.length > 4) return `it has ${q.choices.length} answer choices, and Class Gauntlet plays 2 to 4.`;
  if (q.choices.some((c) => !hasContent(c.content))) return 'an answer choice is blank.';
  const keys = q.choices.map((c) => (isPlain(c.content) ? plainText(c.content).trim().toLowerCase() : JSON.stringify(c.content)));
  if (new Set(keys).size !== keys.length) return 'two answer choices are the same.';
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
    return { sets: [], errors: [message], pictures: {} };
  }
  const errors = reading.issues.map((issue) => issue.message);
  const sets: QuestionBank[] = [];
  for (const bank of reading.banks) {
    const questions: Question[] = [];
    for (const q of bank.questions) {
      const why = unplayable(q);
      if (why || q.type !== 'multiple-choice') {
        const { number, line } = q.provenance;
        errors.push(`Question ${number}${line ? ` (line ${line})` : ''}: ${why}`);
        continue;
      }
      questions.push(
        cleanQuestion({
          id: randomId(),
          prompt: '',
          choices: [],
          correct: q.choices.findIndex((c) => c.correct),
          ...(q.topics?.length ? { topics: q.topics } : {}),
          rich: { prompt: q.stem, choices: q.choices.map((c) => c.content), ...(q.explanation ? { explanation: q.explanation } : {}) },
        }),
      );
    }
    if (!questions.length) continue;
    sets.push({
      id: randomId(),
      title: bank.name,
      questions,
      updatedAt: Date.now(),
    });
  }
  const shown = picturesIn(sets);
  const pictures = Object.fromEntries(Object.entries(reading.pictures).filter(([key]) => shown.has(key)));
  return { sets, errors, formatLabel: reading.banks[0]?.provenance.formatLabel, pictures };
}

/** Stores the pictures the sets show (`save` resolves to where each was kept) and points the sets at them. */
export async function keepPictures(
  sets: QuestionBank[],
  pictures: Record<string, Picture>,
  save: (picture: Blob) => Promise<string>,
): Promise<QuestionBank[]> {
  const kept = new Map<string, string>();
  for (const [key, picture] of Object.entries(pictures))
    kept.set(key, await save(new Blob([picture.bytes as Uint8Array<ArrayBuffer>], { type: picture.mimeType })));
  if (!kept.size) return sets;
  const rename = (rich: RichText) => renamePictures(rich, (asset) => kept.get(asset));
  return sets.map((set) => ({
    ...set,
    questions: set.questions.map((q) =>
      q.rich
        ? { ...q, rich: { prompt: rename(q.rich.prompt), choices: q.rich.choices.map(rename), ...(q.rich.explanation ? { explanation: rename(q.rich.explanation) } : {}) } }
        : q,
    ),
  }));
}

/** Cells pasted from a spreadsheet, or an AI chat's reply, read as a file of their own. */
export function importPasted(text: string): Promise<ImportResult> {
  return importQuestionFile({ name: 'Pasted questions.txt', bytes: new TextEncoder().encode(text) });
}
