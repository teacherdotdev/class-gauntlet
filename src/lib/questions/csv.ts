import type { QuestionSet } from '../game/types';

/**
 * Question sets as spreadsheets: what Export writes, the template, and the
 * instructions for an AI chat. Reading files (these and every other format)
 * is in import.ts.
 */

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * One or more sets as a spreadsheet. The set title, subject and grade ride
 * along on every row, so importing the file gives back the same sets.
 */
export function exportCsv(sets: QuestionSet | QuestionSet[]): string {
  const header = ['set title', 'subject', 'grade', 'question', 'A', 'B', 'C', 'D', 'answer', 'explanation'];
  const lines = [sets].flat().flatMap((set) =>
    set.questions.map((q) =>
      [
        set.title,
        set.subject ?? '',
        set.grade ?? '',
        q.prompt,
        q.choices[0] ?? '',
        q.choices[1] ?? '',
        q.choices[2] ?? '',
        q.choices[3] ?? '',
        String.fromCharCode(65 + q.correct),
        q.explanation ?? '',
      ]
        .map(csvCell)
        .join(','),
    ),
  );
  return [header.join(','), ...lines].join('\n') + '\n';
}

export function csvFileName(title: string): string {
  return `${title.replace(/[^\w -]+/g, '').trim() || 'questions'}.csv`;
}

/** Saves text as a CSV file. The byte-order mark makes Excel read accents and symbols correctly. */
export function downloadCsv(name: string, text: string) {
  const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export const templateCsv = [
  'question,A,B,C,D,answer,explanation',
  'What is 7 × 8?,54,56,64,,B,Seven eights are fifty-six.',
  'Which planet is closest to the Sun?,Venus,Earth,Mercury,Mars,C,Mercury orbits closest to the Sun.',
  'A synonym for “happy” is…,joyful,angry,tired,,A,',
].join('\n') + '\n';

/** For a teacher to paste into an AI chat with a worksheet or PDF, so the reply pastes straight into the importer. */
export const aiInstructions = `Turn the attached material into a multiple-choice question set for Class Gauntlet, a classroom review game.

Reply with only a CSV inside one code block, with this exact header row:
question,A,B,C,D,answer,explanation

Rules:
- One question per row. Keep each question short enough to read aloud.
- Give 2 to 4 answer choices in columns A–D. Leave D (or C and D) empty if there are fewer choices. No two choices in a row may be the same.
- "answer" is the letter (A, B, C or D) of the one correct choice. Exactly one choice must be correct.
- "explanation" is optional: one short sentence on why the answer is right.
- Wrap any cell that contains a comma or a quotation mark in double quotes, and double any quotation marks inside it ("like ""this"""). Don't put line breaks inside cells.
- Write math with plain characters such as − × ÷ ² √ π ≤ ≥, not LaTeX.
- Only include questions that are already multiple choice, with their answer choices as written. True/false questions count: use True and False as choices A and B. Skip every other kind of question (short answer, fill in the blank, essay, matching) instead of converting it.
- Don't number the questions and don't add any other columns or text.

Example:
question,A,B,C,D,answer,explanation
What is 7 × 8?,54,56,64,,B,Seven eights are fifty-six.
"Which is a mammal: shark, whale, or trout?",Shark,Whale,Trout,,B,Whales breathe air and feed their young milk.
`;
