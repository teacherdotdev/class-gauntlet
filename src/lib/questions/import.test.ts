import { expect, test } from 'bun:test';
import { aiInstructions, exportCsv, templateCsv } from './csv';
import { importPasted, importQuestionFile } from './import';

const file = (name: string, text: string) => ({ name, bytes: new TextEncoder().encode(text) });

test('imports the simple template, named after the file, and round-trips through export', async () => {
  const { sets, errors, formatLabel } = await importQuestionFile(file('Mine.csv', templateCsv));
  expect(errors).toEqual([]);
  expect(formatLabel).toBe('Class Gauntlet spreadsheet');
  expect(sets.map((s) => s.title)).toEqual(['Mine']);
  expect(sets[0].questions.map((q) => [q.choices.length, q.correct])).toEqual([[3, 1], [4, 2], [3, 0]]);
  expect(sets[0].questions[0].explanation).toBe('Seven eights are fifty-six.');
  const again = await importQuestionFile(file('Mine.csv', exportCsv(sets[0])));
  expect(again.sets[0].questions.map((q) => q.prompt)).toEqual(sets[0].questions.map((q) => q.prompt));
});

test('imports the original format, one bank per set title (its subject and grade are left behind)', async () => {
  const csv = [
    'set title,subject,grade,question,choices,correct,explanation',
    'Integers,Math,7,What is 9 minus 15?,"[""6"",""-6"",""-24""]",1,Because.',
    'Ratios,Math,7,Which ratio is equivalent to 4 to 6?,"[""2 to 3"",""3 to 2"",""8 to 10""]",0,',
  ].join('\n');
  const { sets, errors } = await importQuestionFile(file('old.csv', csv));
  expect(errors).toEqual([]);
  expect(sets.map((s) => s.title)).toEqual(['Integers', 'Ratios']);
  expect(sets[0]).not.toHaveProperty('subject');
  expect(sets[0].questions[0].correct).toBe(1);
});

test('a tab-separated paste, with the answer given as text, skips a row whose choices repeat', async () => {
  const tsv = 'Question\tA\tB\tC\tAnswer\nCapital of France?\tParis\tRome\tOslo\tparis\nBad row\tx\tx\t\tA\n';
  const { sets, errors } = await importPasted(tsv);
  expect(sets.map((s) => s.title)).toEqual(['Pasted questions']);
  expect(sets[0].questions.map((q) => [q.prompt, q.correct])).toEqual([['Capital of France?', 0]]);
  expect(errors).toEqual(['Question 2 (line 3): two answer choices are the same.']);
});

test('exporting several banks keeps each bank’s title on re-import, under a bank title column', async () => {
  const [first] = (await importQuestionFile(file('Facts.csv', templateCsv))).sets;
  const second = { ...first, id: 'b', title: 'Second, with comma' };
  const csv = exportCsv([first, second]);
  expect(csv.split('\n')[0]).toBe('bank title,question,A,B,C,D,answer,explanation,topics');
  const { sets, errors } = await importQuestionFile(file('backup.csv', csv));
  expect(errors).toEqual([]);
  expect(sets.map((s) => [s.title, s.questions.length])).toEqual([
    ['Facts', 3],
    ['Second, with comma', 3],
  ]);
  expect(sets[1].questions.map((q) => [q.choices, q.correct, q.explanation])).toEqual(
    first.questions.map((q) => [q.choices, q.correct, q.explanation]),
  );
});

test('imports Blooket’s spreadsheet template, leaving out a question with two right answers', async () => {
  const csv = [
    '"Blooket\nImport Template",,,,,,,',
    'Question #,Question Text,Answer 1,Answer 2,"Answer 3\n(Optional)","Answer 4\n(Optional)","Time Limit (sec)\n(Max: 300 seconds)","Correct Answer(s)\n(Only include Answer #)"',
    '1,What is 2 + 2?,3,4,5,,20,2',
    '2,Pick a prime,4,6,7,9,20,"3,4"',
    '3,,,,,,20,',
  ].join('\n');
  const { sets, errors, formatLabel } = await importQuestionFile(file('Blooket set.csv', csv));
  expect(formatLabel).toBe('Blooket spreadsheet');
  expect(sets[0].title).toBe('Blooket set');
  expect(sets[0].questions.map((q) => [q.prompt, q.choices, q.correct])).toEqual([['What is 2 + 2?', ['3', '4', '5'], 1]]);
  expect(errors).toEqual(['Question 2 (line 9): it has more than one right answer, and Class Gauntlet plays only multiple choice with one.']);
});

test('reads other formats, keeping only the multiple-choice questions and saying what was left out', async () => {
  const gift = '::Q1:: Is the sky blue? {T}\n\n::Q2:: 2+2? {=4 ~3 ~5}\n\n::Q3:: Name a color {=red =blue}\n';
  const { sets, errors, formatLabel } = await importQuestionFile(file('quiz.gift', gift));
  expect(formatLabel).toBe('Moodle GIFT');
  expect(sets.map((s) => [s.title, s.questions.map((q) => [q.prompt, q.choices, q.correct])])).toEqual([
    ['quiz', [['2+2?', ['4', '3', '5'], 0]]],
  ]);
  expect(errors).toEqual([
    'Question 1 (line 1): it is true/false, and Class Gauntlet plays only multiple choice with one right answer.',
    'Question 3 (line 5): it is fill in the blank, and Class Gauntlet plays only multiple choice with one right answer.',
  ]);
});

test('leaves out a question with a picture or more than four choices', async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="multichoice">
    <name><text>Square</text></name>
    <questiontext format="moodle_auto_format"><text>What colour is this square?</text></questiontext>
    <image>squares/red.png</image>
    <image_base64>iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==</image_base64>
    <single>true</single>
    <answer fraction="100"><text>Red</text></answer>
    <answer fraction="0"><text>Blue</text></answer>
  </question>
  <question type="multichoice">
    <name><text>Five</text></name>
    <questiontext format="html"><text>Pick a vowel</text></questiontext>
    <single>true</single>
    <answer fraction="100"><text>A</text></answer>
    <answer fraction="0"><text>B</text></answer>
    <answer fraction="0"><text>C</text></answer>
    <answer fraction="0"><text>D</text></answer>
    <answer fraction="0"><text>F</text></answer>
  </question>
  <question type="multichoice">
    <name><text>Plain</text></name>
    <questiontext format="html"><text><![CDATA[<p>Which is <b>largest</b>?</p>]]></text></questiontext>
    <single>true</single>
    <answer fraction="100"><text>10</text></answer>
    <answer fraction="0"><text>2</text></answer>
  </question>
</quiz>`;
  const { sets, errors } = await importQuestionFile(file('moodle.xml', xml));
  expect(sets[0].questions.map((q) => [q.prompt, q.choices])).toEqual([['Which is largest?', ['10', '2']]]);
  expect(errors).toEqual([
    'Question 1 (line 3): it has a picture, and Class Gauntlet shows only text.',
    'Question 2 (line 12): it has 5 answer choices, and Class Gauntlet plays 2 to 4.',
  ]);
});

test('a file that isn’t questions says so', async () => {
  const { sets, errors } = await importQuestionFile(file('notes.txt', 'Remember to bring a pencil.\n'));
  expect(sets).toEqual([]);
  expect(errors).toEqual(['No questions were found in “notes.txt” in a format Class Gauntlet reads.']);
});

test('the AI instructions’ example pastes in cleanly', async () => {
  const example = aiInstructions.slice(aiInstructions.indexOf('Example:\n') + 9);
  const { sets, errors } = await importPasted(example);
  expect(errors).toEqual([]);
  expect(sets[0].questions.map((q) => q.correct)).toEqual([1, 1]);
});

test('a Google Forms printout says why its questions can’t come in: it never shows the answer key', async () => {
  const bytes = new Uint8Array(await Bun.file(new URL('./fixtures/Grade 6 Math Check-in.pdf', import.meta.url)).arrayBuffer());
  const { sets, errors } = await importQuestionFile({ name: 'Grade 6 Math Check-in.pdf', bytes });
  expect(sets).toEqual([]);
  expect(errors).toHaveLength(10);
  expect(errors[0]).toContain('Google Forms printouts don’t show which answer is right');
});

test('topics survive export and re-import, and other formats’ topics come through', async () => {
  const [set] = (await importQuestionFile(file('Facts.csv', templateCsv))).sets;
  set.questions[0].topics = ['multiplication', 'times tables'];
  set.questions[1].topics = ['World War II'];
  const again = await importQuestionFile(file('Facts.csv', exportCsv(set)));
  expect(again.sets[0].questions.map((q) => q.topics)).toEqual([
    ['multiplication', 'times tables'],
    ['World War II'],
    undefined,
  ]);

  const gift =
    '$CATEGORY: $course$/Social Studies/Geography\n\nCapital of France? {=Paris ~Rome ~Oslo}\n';
  const moodle = await importQuestionFile(file('quiz.gift', gift));
  expect(moodle.sets.flatMap((s) => s.questions.map((q) => q.topics))).toEqual([['Geography']]);
});
