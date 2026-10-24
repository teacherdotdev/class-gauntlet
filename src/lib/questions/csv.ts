import type { Question, QuestionBank } from '../game/types';
import { textWithMath } from '../rich/text-math';

/**
 * Question sets as spreadsheets: what Export writes, the template, and the
 * instructions for an AI chat. Reading files (these and every other format)
 * is in import.ts.
 */

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** A question's words for cells, its math written as `$…$` so it comes back as math. Pictures become Picture Notes. */
const cells = (q: Question) => ({
  prompt: q.rich ? textWithMath(q.rich.prompt) : q.prompt,
  choices: q.choices.map((plain, i) => (q.rich?.choices[i] ? textWithMath(q.rich.choices[i]) : plain)),
  explanation: q.rich?.explanation ? textWithMath(q.rich.explanation) : (q.explanation ?? ''),
});

/**
 * One or more banks as a spreadsheet. Each bank's title rides along on every
 * row, so importing the file gives back the same banks.
 */
export function exportCsv(sets: QuestionBank | QuestionBank[]): string {
  const header = ['bank title', 'question', 'A', 'B', 'C', 'D', 'answer', 'explanation', 'topics'];
  const lines = [sets].flat().flatMap((set) =>
    set.questions.map((q) => {
      const { prompt, choices, explanation } = cells(q);
      return [
        set.title,
        prompt,
        choices[0] ?? '',
        choices[1] ?? '',
        choices[2] ?? '',
        choices[3] ?? '',
        String.fromCharCode(65 + q.correct),
        explanation,
        (q.topics ?? []).join(', '),
      ]
        .map(csvCell)
        .join(',');
    }),
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
  'question,A,B,C,D,answer,explanation,topics',
  'What is 7 × 8?,54,56,64,,B,Seven eights are fifty-six.,multiplication',
  'Which planet is closest to the Sun?,Venus,Earth,Mercury,Mars,C,Mercury orbits closest to the Sun.,"planets, solar system"',
  'A synonym for “happy” is…,joyful,angry,tired,,A,,',
].join('\n') + '\n';

/** For a teacher to paste into an AI chat with a worksheet or PDF, so the reply pastes straight into the importer. */
export const aiInstructions = `Turn the attached material into a multiple-choice question set for Class Gauntlet, a classroom review game.

Reply with only a CSV inside one code block, with this exact header row:
question,A,B,C,D,answer,explanation,topics

Rules:
- One question per row. Keep each question short enough to read aloud.
- Give 2 to 4 answer choices in columns A–D. Leave D (or C and D) empty if there are fewer choices. No two choices in a row may be the same.
- "answer" is the letter (A, B, C or D) of the one correct choice. Exactly one choice must be correct.
- "explanation" is optional: one short sentence on why the answer is right.
- "topics" names the concepts a question covers, separated by commas (such as "fractions, word problems"). Reuse the same few topics across questions on the same concept.
- Wrap any cell that contains a comma or a quotation mark in double quotes, and double any quotation marks inside it ("like ""this"""). Don't put line breaks inside cells.
- Write math as LaTeX between dollar signs, such as $\\frac{1}{2}$, $x^2$ or $\\sqrt{3}$, in questions and answer choices alike. Write money with the number right after the dollar sign ($5), never as LaTeX.
- If a question or an answer choice needs a picture (a graph, diagram, figure, map or photo), keep it and write a picture note where the picture goes: [picture: what it shows], such as [picture: parabola opening down with vertex at (2, 3)]. Don't skip the question and don't replace the picture with a description of the answer.
- Only include questions that are already multiple choice, with their answer choices as written. True/false questions count: use True and False as choices A and B. Skip every other kind of question (short answer, fill in the blank, essay, matching) instead of converting it.
- Don't number the questions and don't add any other columns or text.

Example:
question,A,B,C,D,answer,explanation,topics
What is 7 × 8?,54,56,64,,B,Seven eights are fifty-six.,multiplication
"Which is a mammal: shark, whale, or trout?",Shark,Whale,Trout,,B,Whales breathe air and feed their young milk.,"animals, mammals"
`;
