import { expect, test } from 'bun:test';
import Ajv2020 from 'ajv/dist/2020';
import JSZip from 'jszip';
import type { QuestionBank } from '../game/types';
import { fromPlain, type RichNode, type RichText } from '../rich/text';
import { bankFileName, isBankFile, readBankFile, writeBankFile } from './bank-file';
import { cleanQuestion } from './edit';
import { keepPictures } from './import';

const fixtures = new URL('./fixtures/test-parrot/', import.meta.url).pathname;
const fixture = async (name: string) => new Uint8Array(await Bun.file(fixtures + name).arrayBuffer());
const json = async (name: string) => JSON.parse(new TextDecoder().decode(await fixture(name)));

const BLUE = 'sha256:3eb6d464a6c5947d4bd697a140ce49868dab5c038eb708985432c2fa4c108672'; // 40 × 20 PNG
const PIXEL = 'sha256:c414cd0e204de974f73753c7e28d7638e7b3691bb8b1a2bab6b25bb7fed7ce77'; // 1 × 1 PNG
const mediaFile = (id: string) => `media/${id.replace(':', '-')}.png`;

const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (bytes: Uint8Array) => hex(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>));
/** How Class Gauntlet names a Picture (pictures.svelte.ts). */
const hashOf = async (bytes: Uint8Array) => (await sha256(bytes)).slice(0, 32);

// A 3 × 2 GIF, a JPEG whose EXIF turns its 10 × 20 pixels a quarter turn, and two SVGs.
const GIF = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 3, 0, 2, 0, 0x80, 0, 0, 0xff, 0xff, 0xff, 0, 0, 0, 0x2c, 0, 0, 0, 0, 3, 0, 2, 0, 0, 2, 2, 0x44, 1, 0, 0x3b,
]);
const JPEG = Uint8Array.from([
  0xff, 0xd8,
  // APP1 Exif, big-endian TIFF, one IFD entry: Orientation = 6.
  0xff, 0xe1, 0, 34, 0x45, 0x78, 0x69, 0x66, 0, 0, 0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, 6, 0, 0, 0, 0, 0, 0,
  // SOF0: 20 high, 10 wide.
  0xff, 0xc0, 0, 11, 8, 0, 20, 0, 10, 1, 1, 0x11, 0,
  0xff, 0xd9,
]);
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32px"><rect width="64" height="32"/></svg>');
const SVG_BOX = new TextEncoder().encode('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"></svg>');

/** A browser's Pictures, by hash. */
async function library(list: [string, Uint8Array][]) {
  const pictures = new Map<string, { type: string; bytes: ArrayBuffer }>();
  const hashes: Record<string, string> = {};
  for (const [type, bytes] of list) {
    const hash = await hashOf(bytes);
    pictures.set(hash, { type, bytes: bytes.slice().buffer });
    hashes[type] = hash;
  }
  return { hashes, picture: async (hash: string) => pictures.get(hash) ?? null };
}

const text = (value: string, marks?: RichNode['marks']): RichNode => ({ type: 'text', text: value, ...(marks ? { marks } : {}) });
const paragraph = (...content: RichNode[]): RichNode => ({ type: 'paragraph', content });

/** A bank with every kind of Rich Text, and a Picture in an explanation only. */
async function richBank(withGif: boolean) {
  const blue = await fixture(mediaFile(BLUE));
  const pixel = await fixture(mediaFile(PIXEL));
  const { hashes, picture } = await library([
    ['image/png', blue],
    ['image/gif', GIF],
  ]);
  const pixelHash = await hashOf(pixel);
  const all = async (hash: string) => (hash === pixelHash ? { type: 'image/png', bytes: pixel.slice().buffer } : picture(hash));
  const prompt: RichText = [
    { type: 'heading', level: 2, content: [text('Rich content')] },
    paragraph(
      text('strong', [{ type: 'strong' }]),
      text(' emphasis', [{ type: 'emphasis' }]),
      text(' code', [{ type: 'inline-code' }]),
      text(' strike', [{ type: 'strike' }]),
      text('2', [{ type: 'subscript' }]),
      text('3', [{ type: 'superscript' }]),
      text(' source', [{ type: 'link', href: 'https://example.org/source', title: 'Source' }]),
      { type: 'hard-break' },
      { type: 'inline-math', source: 'x^2' },
      { type: 'block-image', asset: hashes['image/png'], alt: 'Inline blue' },
    ),
    { type: 'blockquote', content: [paragraph(text('Quoted evidence'))] },
    { type: 'bullet-list', content: [{ type: 'list-item', content: [paragraph(text('Bullet'))] }] },
    { type: 'ordered-list', start: 3, content: [{ type: 'list-item', content: [paragraph(text('Third'))] }] },
    { type: 'code-block', language: 'js', text: 'const answer = 42' },
    { type: 'rule' },
    {
      type: 'table',
      content: [
        { type: 'table-row', header: true, content: [{ type: 'table-cell', header: true, content: [paragraph(text('Heading'))] }] },
        { type: 'table-row', content: [{ type: 'table-cell', content: [paragraph(text('Value'))] }] },
      ],
    },
    { type: 'display-math', source: 'x^2+y^2=z^2' },
    { type: 'block-image', asset: hashes['image/png'], alt: 'A blue rectangle', ratio: 0.5 },
  ];
  const set: QuestionBank = {
    id: 'bank',
    title: 'Everything: rich',
    updatedAt: 1,
    questions: [
      cleanQuestion({
        id: 'q1',
        prompt: '',
        choices: [],
        correct: 1,
        topics: ['Chemistry', 'Formatting'],
        rich: {
          prompt,
          choices: [
            fromPlain('Plain'),
            [paragraph(text('H'), text('2', [{ type: 'subscript' }]), text('O'))],
            withGif ? [{ type: 'block-image', asset: hashes['image/gif'], alt: 'A wave' }] : fromPlain('No picture'),
            [{ type: 'display-math', source: '\\frac{1}{2}' }],
          ],
          explanation: [paragraph(text('Because ', [{ type: 'emphasis' }]), text('of this:')), { type: 'block-image', asset: pixelHash }],
        },
      }),
      cleanQuestion({ id: 'q2', prompt: 'What is 2 + 2?', choices: ['3', '4'], correct: 1, explanation: 'Two and two\nmake four.' }),
    ],
  };
  return { set, picture: all };
}

const unzip = async (bytes: Uint8Array) => {
  const zip = await JSZip.loadAsync(bytes);
  const pack = JSON.parse(await zip.file('parrot.json')!.async('string'));
  return { zip, pack, record: pack.questionBanks[0].record };
};

/** Reads a file back as the import dialog would: its Pictures stored under Class Gauntlet's hashes. */
async function roundTrip(bytes: Uint8Array) {
  const read = await readBankFile({ name: 'Everything.parrot.zip', bytes });
  const sets = await keepPictures(read.sets, read.pictures, async (blob) => hashOf(new Uint8Array(await blob.arrayBuffer())));
  return { ...read, sets };
}

const withoutIds = (set: QuestionBank) => set.questions.map(({ id: _id, ...q }) => q);

test('a bank comes back from its Bank File as it went in, GIF and all', async () => {
  const { set, picture } = await richBank(true);
  const bytes = await writeBankFile(set, picture);
  const back = await roundTrip(bytes);
  expect(back.errors).toEqual([]);
  expect(back.formatLabel).toBe('Test Parrot');
  expect(back.sets.map((s) => s.title)).toEqual(['Everything: rich']);
  expect(withoutIds(back.sets[0])).toEqual(withoutIds(set));
  expect(set.questions[0].rich).toBeDefined();
  expect(set.questions[1].explanation).toBe('Two and two\nmake four.');
  // The GIF is written as it is, under its own type.
  const { record, zip } = await unzip(bytes);
  const gif = record.media.find((m: { mimeType: string }) => m.mimeType === 'image/gif');
  expect(gif).toMatchObject({ width: 3, height: 2, file: `media/sha256-${await sha256(GIF)}.gif` });
  expect(zip.file(gif.file)).not.toBeNull();
});

test('what Test Parrot has no place for rides in classGauntlet fields', async () => {
  const { set, picture } = await richBank(false);
  const { record, zip } = await unzip(await writeBankFile(set, picture));
  const [q1, q2] = record.bank.questions;
  expect(q1.classGauntlet.explanation.type).toBe('document');
  expect(q2.classGauntlet.explanation.content).toEqual([{ type: 'paragraph', content: [text('Two and two'), { type: 'hard-break' }, text('make four.')] }]);
  const figure = q1.stem.content.find((n: { type: string }) => n.type === 'block-image');
  expect(figure).toEqual({ type: 'block-image', asset: BLUE, alt: 'A blue rectangle', classGauntlet: { ratio: 0.5 } });
  expect(q1.stem.content[1].content.at(-1)).toEqual({ type: 'inline-image', asset: BLUE, alt: 'Inline blue' });
  // The pixel is only in an explanation, which Test Parrot doesn't read, so it isn't one of its Media Assets.
  expect(record.media.map((m: { id: string }) => m.id)).toEqual([BLUE]);
  expect(record.classGauntlet.media).toEqual([{ id: PIXEL, mimeType: 'image/png', width: 1, height: 1, file: `classGauntlet/sha256-${PIXEL.slice(7)}.png` }]);
  expect(zip.file(`classGauntlet/sha256-${PIXEL.slice(7)}.png`)).not.toBeNull();
});

test('a written Bank File is a valid Test Parrot package and record', async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validatePackage = ajv.compile(await json('package-0.1.0.schema.json'));
  const validateRecord = ajv.compile(await json('question-bank-0.10.0.schema.json'));
  const { set, picture } = await richBank(false);
  const { pack, record, zip } = await unzip(await writeBankFile(set, picture));
  expect(validatePackage(pack) ? [] : validatePackage.errors).toEqual([]);
  expect(validateRecord(record) ? [] : validateRecord.errors).toEqual([]);
  expect(pack).toMatchObject({ format: 'test-parrot/package', formatVersion: '0.1.0', requiredFeatures: [], exams: [] });

  // What the schema can't say: every Media Asset is shown where Test Parrot reads, and its file matches it.
  const shown = new Set<string>();
  const walk = (node: { asset?: string; content?: unknown[] }) => {
    if (node.asset) shown.add(node.asset);
    for (const child of node.content ?? []) walk(child as typeof node);
  };
  for (const q of record.bank.questions) for (const document of [q.stem, ...q.choices.map((c: { content: unknown }) => c.content)]) walk(document);
  expect([...shown].sort()).toEqual(record.media.map((m: { id: string }) => m.id).sort());
  const underMedia = Object.keys(zip.files).filter((path) => path.startsWith('media/') && !zip.files[path].dir);
  expect(underMedia.sort()).toEqual(record.media.map((m: { file: string }) => m.file).sort());
  for (const asset of record.media) expect(`sha256:${await sha256(await zip.file(asset.file)!.async('uint8array'))}`).toBe(asset.id);
  expect(record.media[0]).toMatchObject({ width: 40, height: 20 });
});

test('Picture sizes come from their bytes, a camera photo measured upright', async () => {
  const { hashes, picture } = await library([
    ['image/jpeg', JPEG],
    ['image/svg+xml', SVG],
    ['image/x-svg', SVG_BOX],
  ]);
  const choices = Object.values(hashes).map((asset) => [{ type: 'block-image', asset }] as RichText);
  const set: QuestionBank = { id: 'b', title: 'Sizes', updatedAt: 1, questions: [cleanQuestion({ id: 'q', prompt: 'Which?', choices: [], correct: 0, rich: { prompt: fromPlain('Which?'), choices } })] };
  const { record } = await unzip(await writeBankFile(set, picture));
  expect(record.media.map((m: { mimeType: string; width: number; height: number; file: string }) => [m.mimeType, m.width, m.height, m.file.split('.')[1]])).toEqual([
    ['image/jpeg', 20, 10, 'jpg'],
    ['image/svg+xml', 64, 32, 'svg'],
    ['image/svg+xml', 120, 90, 'svg'],
  ]);
});

test('a Picture this browser lacks is written as a Picture Note, and a mailto: link as its words', async () => {
  const set: QuestionBank = {
    id: 'b',
    title: 'Notes',
    updatedAt: 1,
    questions: [
      cleanQuestion({
        id: 'q',
        prompt: '',
        choices: [],
        correct: 0,
        rich: {
          prompt: [paragraph(text('Write to '), text('me', [{ type: 'link', href: 'mailto:me@example.org' }, { type: 'strong' }])), { type: 'block-image', asset: 'f'.repeat(32), alt: 'A map' }],
          choices: [fromPlain('Yes'), fromPlain('No')],
        },
      }),
    ],
  };
  const bytes = await writeBankFile(set, async () => null);
  const { record } = await unzip(bytes);
  expect(record.media).toEqual([]);
  expect(record.bank.questions[0].stem.content).toEqual([
    paragraph(text('Write to '), text('me', [{ type: 'strong' }])),
    paragraph(text('[picture: A map]')),
  ]);
  const back = await readBankFile({ name: 'Notes.parrot.zip', bytes });
  expect(back.sets[0].questions[0].prompt).toBe('Write to me\n[picture: A map]');
});

test('Export writes every bank into one Bank File, which imports as the same banks', async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validateRecord = ajv.compile(await json('question-bank-0.10.0.schema.json'));
  const { set, picture } = await richBank(false);
  const plain: QuestionBank = { id: 'p', title: 'Facts', questions: [{ id: 'f', prompt: 'What is 7 × 8?', choices: ['54', '56'], correct: 1 }], updatedAt: 1 };
  const empty: QuestionBank = { id: 'e', title: 'Empty', questions: [], updatedAt: 1 };
  const bytes = await writeBankFile([set, empty, plain], picture);
  const { pack } = await unzip(bytes);
  expect(pack.questionBanks.map((b: { id: string; record: { bank: { name: string } } }) => [b.id, b.record.bank.name])).toEqual([
    ['bank-1', 'Everything: rich'],
    ['bank-2', 'Facts'],
  ]);
  for (const bank of pack.questionBanks) expect(validateRecord(bank.record) ? [] : validateRecord.errors).toEqual([]);
  const back = await roundTrip(bytes);
  expect(back.sets.map(withoutIds)).toEqual([withoutIds(set), withoutIds(plain)]);
});

test('an empty bank can’t be written', async () => {
  await expect(writeBankFile({ id: 'b', title: 'Empty', questions: [], updatedAt: 1 }, async () => null)).rejects.toThrow('“Empty” has no questions');
});

test('a Bank File is named after its bank', () => {
  expect(bankFileName({ id: 'b', title: 'Unit 3: Cells / Plants?', questions: [], updatedAt: 1 })).toBe('Unit 3 Cells Plants.parrot.zip');
  expect(bankFileName({ id: 'b', title: '  ', questions: [], updatedAt: 1 })).toBe('Question Bank.parrot.zip');
});

test('tells a Test Parrot file from other files', async () => {
  const { set, picture } = await richBank(false);
  const written = await writeBankFile(set, picture);
  expect(isBankFile({ name: 'x.zip', bytes: written })).toBe(true);
  expect(isBankFile({ name: 'bank.json', bytes: await fixture('bank-only.json') })).toBe(true);
  expect(isBankFile({ name: 'record.json', bytes: await fixture('true-false.json') })).toBe(true);
  expect(isBankFile({ name: 'q.csv', bytes: new TextEncoder().encode('question,A,B\n') })).toBe(false);
  expect(isBankFile({ name: 'other.json', bytes: new TextEncoder().encode('{"format":"something-else"}') })).toBe(false);
  const other = new JSZip();
  other.file('word/document.xml', '<w/>');
  expect(isBankFile({ name: 'q.docx', bytes: await other.generateAsync({ type: 'uint8array' }) })).toBe(false);
});

// ---------------------------------------------------------------------------
// Test Parrot's own examples

/** A record example in a zip, as Test Parrot would write it, beside the pictures it names. */
async function zipped(record: { media?: { file: string }[] }) {
  const zip = new JSZip();
  zip.file('parrot.json', JSON.stringify(record));
  for (const { file } of record.media ?? []) zip.file(file, await fixture(file));
  return zip.generateAsync({ type: 'uint8array' });
}

const plainSets = (result: { sets: QuestionBank[] }) => result.sets.map((s) => [s.title, s.questions.map((q) => [q.prompt, q.choices, q.correct])]);

test('reads Test Parrot’s packages, one set per bank, leaving out what it can’t play', async () => {
  const one = await readBankFile({ name: 'bank-only.json', bytes: await fixture('bank-only.json') });
  expect(plainSets(one)).toEqual([
    [
      'Cells',
      [
        ['Which organelle releases energy from food?', ['Nucleus', 'Mitochondrion', 'Ribosome', 'Vacuole'], 1],
        ['What surrounds every cell?', ['Cell wall', 'Chloroplast', 'Cell membrane', 'Cytoplasm'], 2],
        ['Plant cells have chloroplasts.', ['True', 'False'], 0],
      ],
    ],
  ]);
  expect(one.errors).toEqual([
    'Question 4: it is matching, and Class Gauntlet plays only multiple choice with one right answer.',
    'Question 5: it is short answer, and Class Gauntlet plays only multiple choice with one right answer.',
  ]);
  const several = await readBankFile({ name: 'several-banks.json', bytes: await fixture('several-banks.json') });
  expect(several.sets.map((s) => [s.title, s.questions.length])).toEqual([
    ['Cells', 3],
    ['Forces', 1],
  ]);
  expect(several.errors.at(-1)).toBe('Question 2 in “Forces”: it is short answer, and Class Gauntlet plays only multiple choice with one right answer.');
});

test('reads Test Parrot’s records: multiple choice, true/false with its Topics, and nothing from matching', async () => {
  const minimal = await readBankFile({ name: 'm.json', bytes: await fixture('minimal-multiple-choice.json') });
  expect(plainSets(minimal)).toEqual([['Minimal Multiple Choice', [['Which number is prime?', ['Four', 'Five'], 1]]]]);
  const trueFalse = await readBankFile({ name: 'tf.json', bytes: await fixture('true-false.json') });
  expect(trueFalse.sets[0].questions.map((q) => [q.choices, q.correct, q.topics])).toEqual([
    [['True', 'False'], 0, undefined],
    [['True', 'False'], 1, ['Astronomy']],
  ]);
  const matching = await readBankFile({ name: 'matching.json', bytes: await fixture('matching.json') });
  expect(matching.sets).toEqual([]);
  expect(matching.errors).toEqual([
    'Question 1: it is matching, and Class Gauntlet plays only multiple choice with one right answer.',
    'Question 2: it is matching, and Class Gauntlet plays only multiple choice with one right answer.',
  ]);
});

test('a Pending Image becomes a Picture Note naming its tag or page', async () => {
  const pending = await readBankFile({ name: 'p.json', bytes: await fixture('pending-images.json') });
  expect(plainSets(pending)).toEqual([
    [
      'Pending Images',
      [
        ['Which graph shows a function that is increasing everywhere?', ['[picture: IMG 2]', '[picture: IMG 3]', '[picture: IMG 4]'], 1],
        ['[picture: IMG 1]\nWhich bus route has the most stops on the map?', ['Route 4', 'Route 9'], 0],
      ],
    ],
  ]);
  expect(pending.sets[0].questions[1].rich?.prompt[0]).toEqual(paragraph(text('[picture: IMG 1]')));
  const record = await json('minimal-multiple-choice.json');
  record.bank.questions[0].stem.content.push({ type: 'paragraph', content: [{ type: 'inline-image', pending: { page: 2 } }] });
  const paged = await readBankFile({ name: 'p.json', bytes: new TextEncoder().encode(JSON.stringify(record)) });
  expect(paged.sets[0].questions[0].prompt).toBe('Which number is prime?\n[picture: page 2]');
});

test('reads every rich-text node Test Parrot writes, Side-by-Sides as their Panels in order', async () => {
  const record = await json('complete-rich-text.json');
  const [q] = record.bank.questions;
  record.bank.questions = [
    { id: 'q1', type: 'multiple-choice', stem: q.stem, choices: [q1Choice('q1-c1', 'Yes', true), q1Choice('q1-c2', 'No', false)] },
  ];
  const read = await readBankFile({ name: 'complete.parrot.zip', bytes: await zipped(record) });
  expect(read.errors).toEqual([]);
  const prompt = read.sets[0].questions[0].rich!.prompt;
  expect(prompt.map((n) => n.type)).toEqual([
    'heading',
    'paragraph',
    'blockquote',
    'bullet-list',
    'ordered-list',
    'code-block',
    'rule',
    'table',
    'display-math',
    'block-image',
    'paragraph',
    'paragraph',
  ]);
  // An inline image is a picture of ours; a caption wins over alt; the authored size stays behind.
  expect(prompt[1].content!.at(-1)).toEqual({ type: 'block-image', asset: PIXEL, alt: 'One pixel' });
  expect(prompt[9]).toEqual({ type: 'block-image', asset: PIXEL, alt: 'Canonical image' });
  expect(prompt[1].content!.slice(0, 7).map((n) => n.marks)).toEqual(q.stem.content[1].content.slice(0, 7).map((n: RichNode) => n.marks));
  expect(prompt.slice(-2)).toEqual([paragraph(text('Left panel')), paragraph(text('Right panel'))]);
  expect(Object.keys(read.pictures)).toEqual([PIXEL]);
  expect(read.pictures[PIXEL].mimeType).toBe('image/png');
});

function q1Choice(id: string, words: string, correct: boolean) {
  return { id, content: { type: 'document', content: [{ type: 'paragraph', content: [{ type: 'text', text: words }] }] }, correct };
}

async function croppedRecord() {
  const record = await json('cropped-picture.json');
  const [q] = record.bank.questions;
  record.bank.questions = [{ ...q, type: 'multiple-choice', choices: [q1Choice('q1-c1', 'A rectangle', true), q1Choice('q1-c2', 'A circle', false)] }];
  return zipped(record);
}

test('a Picture Crop is cut by the cropper it is given', async () => {
  const seen: unknown[] = [];
  const cut = { bytes: Uint8Array.from([1, 2, 3]), mimeType: 'image/png' };
  const read = await readBankFile({ name: 'crop.parrot.zip', bytes: await croppedRecord() }, { crop: async (picture, crop) => (seen.push([picture.bytes.length, crop]), cut) });
  const key = `sha256:${await sha256(cut.bytes)}`;
  expect(seen).toEqual([[(await fixture(mediaFile(BLUE))).length, { left: 0.25, top: 0.25, right: 0.75, bottom: 0.75 }]]);
  expect(read.sets[0].questions[0].rich!.prompt[1]).toEqual({ type: 'block-image', asset: key, alt: 'A blue rectangle' });
  expect(read.pictures).toEqual({ [key]: cut });
});

test('without a canvas to crop on, the whole picture is kept', async () => {
  const read = await readBankFile({ name: 'crop.parrot.zip', bytes: await croppedRecord() });
  expect(read.sets[0].questions[0].rich!.prompt[1]).toEqual({ type: 'block-image', asset: BLUE, alt: 'A blue rectangle' });
  expect(Object.keys(read.pictures)).toEqual([BLUE]);
});

test('an older record’s base64 pictures come in', async () => {
  const record = await json('complete-rich-text.json');
  const pixel = await fixture(mediaFile(PIXEL));
  record.formatVersion = '0.7.0';
  record.media = [{ id: PIXEL, mimeType: 'image/png', width: 1, height: 1, bytes: btoa(String.fromCharCode(...pixel)) }];
  record.bank.questions = [
    { id: 'q1', type: 'multiple-choice', stem: { type: 'document', content: [{ type: 'block-image', asset: PIXEL }] }, choices: [q1Choice('q1-c1', 'Yes', true), q1Choice('q1-c2', 'No', false)] },
  ];
  const read = await readBankFile({ name: 'old.json', bytes: new TextEncoder().encode(JSON.stringify(record)) });
  expect(read.errors).toEqual([]);
  expect(read.pictures[PIXEL].bytes).toEqual(pixel);
});

test('questions Class Gauntlet can’t play are named; a version it can’t read is said', async () => {
  const record = await json('minimal-multiple-choice.json');
  const choices = (n: number, right: number[]) => Array.from({ length: n }, (_, i) => q1Choice(`q1-c${i + 1}`, `Choice ${i + 1}`, right.includes(i)));
  const stem = record.bank.questions[0].stem;
  record.bank.questions = [
    { id: 'q1', type: 'multiple-choice', stem, choices: choices(5, [0]) },
    { id: 'q2', type: 'multiple-choice', stem, choices: choices(3, []) },
    { id: 'q3', type: 'multiple-choice', stem, choices: choices(3, [0, 1]) },
    { id: 'q4', type: 'fill-in-the-blank', stem },
    { id: 'q5', type: 'multiple-choice', stem, choices: [q1Choice('q5-c1', 'Same', true), q1Choice('q5-c2', 'same', false)] },
    { id: 'q6', type: 'multiple-choice', stem, choices: choices(4, [3]) },
  ];
  const read = await readBankFile({ name: 'mixed.json', bytes: new TextEncoder().encode(JSON.stringify(record)) });
  expect(read.sets[0].questions.map((q) => q.correct)).toEqual([3]);
  expect(read.errors).toEqual([
    'Question 1: it has 5 answer choices, and Class Gauntlet plays 2 to 4.',
    'Question 2: no answer choice is marked right.',
    'Question 3: it has more than one right answer, and Class Gauntlet plays only multiple choice with one.',
    'Question 4: it is fill in the blank, and Class Gauntlet plays only multiple choice with one right answer.',
    'Question 5: two answer choices are the same.',
  ]);
  record.formatVersion = '0.11.0';
  const newer = await readBankFile({ name: 'newer.json', bytes: new TextEncoder().encode(JSON.stringify(record)) });
  expect(newer.sets).toEqual([]);
  expect(newer.errors).toEqual(['“Minimal Multiple Choice” is a Test Parrot Question Bank of version 0.11.0, and Class Gauntlet reads versions 0.1.0 to 0.10.0.']);
});
