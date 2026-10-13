import type { QuestionBank } from '../game/types';

/**
 * The sample deck from the original open-source project (Apache 2.0),
 * so a teacher can try a game before writing their own questions.
 */
const rows: [string, string[], number, string][] = [
  ['−6 + 14 = ?', ['8', '−8', '20'], 0, '−6 + 14 = 8'],
  ['9 − 15 = ?', ['6', '−6', '−24'], 1, '9 − 15 = −6'],
  ['−4 × 7 = ?', ['28', '−28', '−11'], 1, '(−) × (+) = (−), so −4 × 7 = −28'],
  ['−36 ÷ (−6) = ?', ['−6', '6', '30'], 1, '(−) ÷ (−) = (+), so −36 ÷ (−6) = 6'],
  ['Which equals −3?', ['5 − 8', '8 − 5', '−5 − 8'], 0, '5 − 8 = −3'],
  ['2 batches : 3 cups of flour. 6 batches : ? cups', ['7', '9', '12'], 1, '6 ÷ 2 = 3, and 3 × 3 = 9'],
  ['180 mi in 3 h. Unit rate?', ['60 mi/h', '90 mi/h', '540 mi/h'], 0, '180 ÷ 3 = 60 mi/h'],
  ['4 : 6 = ?', ['2 : 3', '3 : 2', '8 : 10'], 0, '(4 ÷ 2) : (6 ÷ 2) = 2 : 3'],
  ['$20 − 25% = ?', ['$5', '$15', '$18'], 1, '25% × $20 = $5, and $20 − $5 = $15'],
  ['Map: 1 in = 8 mi. 3.5 in = ?', ['11.5 mi', '24 mi', '28 mi'], 2, '3.5 × 8 = 28 mi'],
];

export const sampleSetId = 'sample-grade7-math';

export function sampleSet(): QuestionBank {
  return {
    id: sampleSetId,
    title: 'Sample: Grade 7 Math Review',
    questions: rows.map(([prompt, choices, correct, explanation], i) => ({
      id: `sample-${i + 1}`,
      prompt,
      choices,
      correct,
      explanation,
    })),
    updatedAt: 0,
  };
}
