import JSZip from 'jszip';
import type { Picture } from '@teacherdotdev/question-commons';
import type { Question, QuestionBank } from '../game/types';
import { randomId } from '../game/engine';
import { fromPlain, hasContent, isPlain, pictureNote, picturesIn, plainOf, type RichMark, type RichNode, type RichText } from '../rich/text';
import { cleanQuestion } from './edit';
import type { ImportResult } from './import';

/**
 * A Bank File is one Question Bank saved as a Test Parrot Package (see
 * docs/adr/0002): `<Bank title>.parrot.zip`, holding `parrot.json` and each
 * Picture under `media/`, named by its SHA-256. Test Parrot reads it, and we
 * read Test Parrot's. Its Rich Text is ours under a `document` wrapper; what
 * Test Parrot has no place for rides in `classGauntlet` fields it ignores:
 *
 * - a question's explanation, as `classGauntlet.explanation` on the question;
 * - a Picture's width as a share of its natural width, as `classGauntlet.ratio`
 *   on its image node;
 * - a Picture only an explanation shows, declared in the record's own
 *   `classGauntlet.media` and kept under `classGauntlet/` in the zip, since Test
 *   Parrot refuses a Media Asset none of the words it reads shows.
 *
 * GIFs and SVGs are written as they are, though Test Parrot refuses them:
 * animated signs matter more than opening the file there.
 */

type Document = { type: 'document'; content: FileNode[] };
type Crop = { left: number; top: number; right: number; bottom: number };
/** A rich-text node as the file has it. */
type FileNode = {
  type: string;
  content?: FileNode[];
  text?: string;
  marks?: RichMark[];
  level?: number;
  start?: number;
  language?: string;
  source?: string;
  header?: boolean;
  asset?: string;
  alt?: string;
  caption?: string;
  crop?: Crop;
  pending?: { image?: number; page?: number };
  classGauntlet?: { ratio?: number };
};
type MediaAsset = { id: string; mimeType: string; width: number; height: number; file?: string; bytes?: string };
type FileChoice = { id: string; content: Document; correct: boolean };
type FileQuestion = {
  id: string;
  type: string;
  stem: Document;
  topics?: string[];
  choices?: FileChoice[];
  classGauntlet?: { explanation?: Document };
};
type FileRecord = {
  format: string;
  formatVersion: string;
  requiredFeatures?: string[];
  bank: { name: string; questions: FileQuestion[] };
  media?: MediaAsset[];
  classGauntlet?: { media?: MediaAsset[] };
};

const PACKAGE = 'test-parrot/package';
const RECORD = 'test-parrot/question-bank';
const ROOT = 'parrot.json';
const GENERATOR = { name: 'Class Gauntlet', version: '0.1.0' };
/** Every record version Test Parrot has published. Their rich text is one shape; through 0.7.0 a Media Asset carries its bytes as base64. */
const RECORD_VERSIONS = ['0.1.0', '0.2.0', '0.3.0', '0.4.0', '0.5.0', '0.6.0', '0.7.0', '0.8.0', '0.9.0', '0.10.0'];

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

/** `<title>.parrot.zip`, without the characters a file name can't hold. */
export function bankFileName(set: QuestionBank): string {
  const title = set.title.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim();
  return `${title || 'Question Bank'}.parrot.zip`;
}

// ---------------------------------------------------------------------------
// Pictures: what they are and how big, from their bytes alone, so a Bank File
// is written the same in a test as in the browser.

const ascii = (bytes: Uint8Array, at: number, length: number) => String.fromCharCode(...bytes.subarray(at, at + length));

/** The type the bytes say they are, which wins over the one they were kept under. */
function sniff(bytes: Uint8Array): string | null {
  if (bytes[0] === 0x89 && ascii(bytes, 1, 3) === 'PNG') return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return 'image/webp';
  if (ascii(bytes, 0, 4) === 'GIF8') return 'image/gif';
  if (/<svg[\s>]/i.test(new TextDecoder().decode(bytes.subarray(0, 4096)))) return 'image/svg+xml';
  return null;
}

type Size = { width: number; height: number };

function jpegSize(bytes: Uint8Array): Size | null {
  let at = 2;
  let size: Size | null = null;
  let orientation = 1;
  while (at + 8 < bytes.length && bytes[at] === 0xff) {
    const marker = bytes[at + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const length = (bytes[at + 2] << 8) | bytes[at + 3];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      size = { height: (bytes[at + 5] << 8) | bytes[at + 6], width: (bytes[at + 7] << 8) | bytes[at + 8] };
      break;
    }
    if (marker === 0xe1 && ascii(bytes, at + 4, 6) === 'Exif\0\0') orientation = exifOrientation(bytes.subarray(at + 10, at + 2 + length));
    if (length < 2) return null;
    at += 2 + length;
  }
  // Orientations 5 to 8 keep a camera's pixels a quarter turn from how they're seen; Test Parrot measures them upright.
  return size && orientation >= 5 ? { width: size.height, height: size.width } : size;
}

function exifOrientation(tiff: Uint8Array): number {
  const order = ascii(tiff, 0, 2);
  if (order !== 'II' && order !== 'MM') return 1;
  const little = order === 'II';
  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  const ifd = view.getUint32(4, little);
  if (ifd + 2 > tiff.length) return 1;
  for (let i = 0; i < view.getUint16(ifd, little); i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > tiff.length) return 1;
    if (view.getUint16(entry, little) === 0x0112) return view.getUint16(entry + 8, little);
  }
  return 1;
}

function webpSize(bytes: Uint8Array): Size | null {
  const kind = ascii(bytes, 12, 4);
  if (kind === 'VP8X') return { width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16) };
  if (kind === 'VP8L' && bytes[20] === 0x2f) {
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (kind === 'VP8 ') return { width: (bytes[26] | (bytes[27] << 8)) & 0x3fff, height: (bytes[28] | (bytes[29] << 8)) & 0x3fff };
  return null;
}

/** An SVG's size from its width and height, else its viewBox, else the 300 × 150 a browser gives it. */
function svgSize(bytes: Uint8Array): Size {
  const tag = new TextDecoder().decode(bytes).match(/<svg\b[^>]*>/i)?.[0] ?? '';
  const attribute = (name: string) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
  const length = (value: string | undefined) => (value && /^\s*[\d.]+\s*(px)?\s*$/.test(value) ? parseFloat(value) : NaN);
  const box = (attribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number);
  const width = length(attribute('width')) || box[2] || 300;
  const height = length(attribute('height')) || box[3] || 150;
  return { width, height };
}

function sizeOf(mimeType: string, bytes: Uint8Array): Size | null {
  const size =
    mimeType === 'image/png' && bytes.length >= 24
      ? { width: new DataView(bytes.buffer, bytes.byteOffset).getUint32(16), height: new DataView(bytes.buffer, bytes.byteOffset).getUint32(20) }
      : mimeType === 'image/jpeg'
        ? jpegSize(bytes)
        : mimeType === 'image/webp' && bytes.length >= 30
          ? webpSize(bytes)
          : mimeType === 'image/gif' && bytes.length >= 10
            ? { width: bytes[6] | (bytes[7] << 8), height: bytes[8] | (bytes[9] << 8) }
            : mimeType === 'image/svg+xml'
              ? svgSize(bytes)
              : null;
  return size && size.width > 0 && size.height > 0 ? { width: Math.max(1, Math.round(size.width)), height: Math.max(1, Math.round(size.height)) } : null;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>));
  return [...digest].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const fileOf = (id: string, mimeType: string, folder: string) => `${folder}/${id.replace(':', '-')}.${EXTENSIONS[mimeType] ?? (mimeType.split('/')[1]?.replace(/\W.*/, '') || 'bin')}`;

// ---------------------------------------------------------------------------
// Writing

type Kept = { id: string; mimeType: string; width: number; height: number; bytes: Uint8Array };

const doc = (content: FileNode[]): Document => ({ type: 'document', content });
const safeLink = (mark: RichMark) => mark.type !== 'link' || /^https?:\/\//i.test(mark.href);
/** Nodes whose content runs as words, where a picture is inline. */
const INLINE_PARENTS = new Set(['paragraph', 'heading']);

/** Rich Text as the file writes it. `shown` collects each Picture it shows; a Picture this browser lacks leaves a Picture Note. */
function toFile(rich: RichText, pictures: Map<string, Kept | null>, shown: Set<string>, inline = false): FileNode[] {
  return rich.flatMap((node): FileNode[] => {
    if (node.type === 'block-image') {
      const kept = node.asset ? pictures.get(node.asset) : null;
      if (!kept) {
        const note: FileNode = { type: 'text', text: pictureNote(node.alt) };
        return [inline ? note : { type: 'paragraph', content: [note] }];
      }
      shown.add(kept.id);
      return [
        {
          type: inline ? 'inline-image' : 'block-image',
          asset: kept.id,
          ...(node.alt ? { alt: node.alt } : {}),
          ...(node.ratio ? { classGauntlet: { ratio: node.ratio } } : {}),
        },
      ];
    }
    if (node.type === 'blank') return [{ type: 'text', text: '_____' }];
    if (node.type === 'text') {
      if (!node.text) return [];
      // Test Parrot takes only web links; a mailto: link is left as its words.
      const marks = node.marks?.filter(safeLink);
      return [{ type: 'text', text: node.text, ...(marks?.length ? { marks } : {}) }];
    }
    const { content, marks: _marks, ratio: _ratio, asset: _asset, alt: _alt, ...rest } = node;
    const math = node.type === 'inline-math' || node.type === 'display-math';
    return [
      {
        ...rest,
        ...(math ? { source: node.source ?? '' } : {}),
        ...(content ? { content: toFile(content, pictures, shown, INLINE_PARENTS.has(node.type)) } : {}),
      },
    ];
  });
}

type Lookup = (hash: string) => Promise<{ type: string; bytes: ArrayBuffer } | null>;

/** One bank as a Question Bank Record, its pictures put into `files`. */
async function recordOf(set: QuestionBank, picture: Lookup, files: Map<string, Uint8Array>) {
  const words = (q: Question) => ({
    prompt: q.rich?.prompt ?? fromPlain(q.prompt),
    choices: q.choices.map((c, i) => q.rich?.choices[i] ?? fromPlain(c)),
    explanation: q.rich?.explanation ?? (q.explanation ? fromPlain(q.explanation) : undefined),
  });

  const pictures = new Map<string, Kept | null>();
  for (const hash of picturesIn(set.questions.map((q) => q.rich))) {
    const found = await picture(hash).catch(() => null);
    if (!found) {
      pictures.set(hash, null);
      continue;
    }
    const bytes = new Uint8Array(found.bytes);
    const mimeType = sniff(bytes) ?? found.type;
    // A picture whose size can't be read still goes; Test Parrot will say so.
    const size = sizeOf(mimeType, bytes) ?? { width: 1, height: 1 };
    pictures.set(hash, { id: `sha256:${await sha256(bytes)}`, mimeType, ...size, bytes });
  }

  const shown = new Set<string>();
  const behind = new Set<string>();
  const questions: FileQuestion[] = set.questions.map((q, i) => {
    const id = `q${i + 1}`;
    const { prompt, choices, explanation } = words(q);
    return {
      id,
      type: 'multiple-choice',
      stem: doc(toFile(prompt, pictures, shown)),
      ...(q.topics?.length ? { topics: q.topics } : {}),
      choices: choices.map((c, j) => ({ id: `${id}-c${j + 1}`, content: doc(toFile(c, pictures, shown)), correct: j === q.correct })),
      ...(explanation && hasContent(explanation) ? { classGauntlet: { explanation: doc(toFile(explanation, pictures, behind)) } } : {}),
    };
  });

  const declare =(ids: string[], folder: string): MediaAsset[] =>
    [...pictures.values()]
      .filter((kept): kept is Kept => !!kept && ids.includes(kept.id))
      .filter((kept, i, all) => all.findIndex((other) => other.id === kept.id) === i)
      .map(({ bytes, ...asset }) => {
        const file = fileOf(asset.id, asset.mimeType, folder);
        files.set(file, bytes);
        return { ...asset, file };
      });
  const media = declare([...shown], 'media');
  const explanationsOnly = declare([...behind].filter((id) => !shown.has(id)), 'classGauntlet');

  return {
    format: RECORD,
    formatVersion: '0.10.0',
    generator: GENERATOR,
    requiredFeatures: [],
    bank: { name: set.title, questions },
    media,
    ...(explanationsOnly.length ? { classGauntlet: { media: explanationsOnly } } : {}),
  };
}

/**
 * The Bank File's bytes: one bank, or several as Export writes them (a bank
 * with no questions is left out). `picture` gives a Picture's bytes and type
 * by its Class Gauntlet hash, or null if this browser lacks it (then a
 * Picture Note is written in its place).
 */
export async function writeBankFile(sets: QuestionBank | QuestionBank[], picture: Lookup): Promise<Uint8Array> {
  const banks = [sets].flat();
  const filled = banks.filter((set) => set.questions.length);
  if (!filled.length)
    throw new Error(
      banks.length === 1
        ? `“${banks[0].title}” has no questions, so there's nothing to save in a Bank File.`
        : 'These banks have no questions, so there’s nothing to save in a Bank File.',
    );

  const files = new Map<string, Uint8Array>();
  const questionBanks = [];
  for (const [i, set] of filled.entries()) questionBanks.push({ id: `bank-${i + 1}`, record: await recordOf(set, picture, files) });
  const pack = { format: PACKAGE, formatVersion: '0.1.0', generator: GENERATOR, requiredFeatures: [], questionBanks, exams: [] };

  // Dated alike, as Test Parrot dates them, so the same bank always zips to the same bytes.
  const date = new Date(2000, 0, 1);
  const zip = new JSZip();
  zip.file(ROOT, JSON.stringify(pack, null, 2), { date, compression: 'DEFLATE' });
  // Pictures are compressed already.
  for (const path of [...files.keys()].sort()) zip.file(path, files.get(path)!, { date, compression: 'STORE' });
  return zip.generateAsync({ type: 'uint8array' });
}

/** Saves a Bank File as a download. */
export function downloadBankFile(name: string, bytes: Uint8Array) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/zip' }));
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Reading

const isZip = (bytes: Uint8Array) => bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;

function holds(bytes: Uint8Array, text: string): boolean {
  const needle = new TextEncoder().encode(text);
  for (let at = bytes.indexOf(needle[0]); at !== -1; at = bytes.indexOf(needle[0], at + 1))
    if (needle.every((byte, i) => bytes[at + i] === byte)) return true;
  return false;
}

/** Whether these bytes are a Test Parrot package or record: a zip with parrot.json, or that JSON bare. */
export function isBankFile(file: { name: string; bytes: Uint8Array }): boolean {
  if (isZip(file.bytes)) return /\.parrot\.zip$/i.test(file.name) || holds(file.bytes, ROOT);
  const head = new TextDecoder().decode(file.bytes.subarray(0, 65536)).replace(/^﻿/, '');
  return head.trimStart().startsWith('{') && /"format"\s*:\s*"test-parrot\/(package|question-bank)"/.test(head);
}

/** Cuts a picture to a Picture Crop, or says it can't (null), and the whole picture is kept. */
export type Cropper = (picture: Picture, crop: Crop) => Promise<Picture | null>;

/** Crops in the browser. Where there is no canvas to draw on (tests), the whole picture is kept. */
export const cropInBrowser: Cropper = async (picture, crop) => {
  if (typeof createImageBitmap !== 'function' || typeof OffscreenCanvas !== 'function') return null;
  try {
    // Crops are fractions of the upright picture, as createImageBitmap turns a camera photo.
    const bitmap = await createImageBitmap(new Blob([picture.bytes as Uint8Array<ArrayBuffer>], { type: picture.mimeType }));
    const x = Math.round(crop.left * bitmap.width);
    const y = Math.round(crop.top * bitmap.height);
    const width = Math.max(1, Math.round(crop.right * bitmap.width) - x);
    const height = Math.max(1, Math.round(crop.bottom * bitmap.height) - y);
    const canvas = new OffscreenCanvas(width, height);
    canvas.getContext('2d')?.drawImage(bitmap, x, y, width, height, 0, 0, width, height);
    bitmap.close();
    const type = picture.mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await canvas.convertToBlob({ type, quality: 0.92 });
    return { bytes: new Uint8Array(await blob.arrayBuffer()), mimeType: blob.type || type };
  } catch {
    return null;
  }
};

const TYPE_NAMES: Record<string, string> = {
  matching: 'matching',
  'fill-in-the-blank': 'fill in the blank',
  'short-answer': 'short answer',
  multipart: 'multipart',
};

/** Why a question can't be played before its words are read, or null when it may be. */
function unplayable(q: FileQuestion): string | null {
  if (q.type !== 'multiple-choice' && q.type !== 'true-false')
    return `it is ${TYPE_NAMES[q.type] ?? `a kind of question Class Gauntlet doesn't know (“${q.type}”)`}, and Class Gauntlet plays only multiple choice with one right answer.`;
  const choices = Array.isArray(q.choices) ? q.choices : [];
  if (choices.length < 2 || choices.length > 4) return `it has ${choices.length} answer choices, and Class Gauntlet plays 2 to 4.`;
  const right = choices.filter((c) => c.correct === true).length;
  if (right > 1) return 'it has more than one right answer, and Class Gauntlet plays only multiple choice with one.';
  if (!right) return 'no answer choice is marked right.';
  return null;
}

/** Why a question's answers can't be played, once they're Rich Text. */
function unplayableChoices(choices: RichText[]): string | null {
  if (choices.some((c) => !hasContent(c))) return 'an answer choice is blank.';
  const keys = choices.map((c) => (isPlain(c) ? plainOf(c).toLowerCase() : JSON.stringify(c)));
  if (new Set(keys).size !== keys.length) return 'two answer choices are the same.';
  return null;
}

const MARKS = new Set(['strong', 'emphasis', 'inline-code', 'strike', 'subscript', 'superscript', 'link']);
const NODES = new Set([
  'paragraph',
  'heading',
  'blockquote',
  'bullet-list',
  'ordered-list',
  'list-item',
  'code-block',
  'rule',
  'table',
  'table-row',
  'table-cell',
  'text',
  'hard-break',
  'inline-math',
  'display-math',
]);

function decodeBase64(text: string): Uint8Array | undefined {
  try {
    return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
  } catch {
    return undefined;
  }
}

/** How one file's pictures are found and kept while its Rich Text is read. */
class Reader {
  /** Every picture the file carries, by asset id. */
  media = new Map<string, Picture>();
  /** The pictures the read Rich Text shows, under the keys it names them by. */
  pictures: Record<string, Picture> = {};
  private crops = new Map<string, Promise<string>>();

  constructor(private crop: Cropper) {}

  private whole(asset: string): string {
    this.pictures[asset] = this.media.get(asset)!;
    return asset;
  }

  /** The key a cropped picture is kept under: its own SHA-256, as Test Parrot names pictures. */
  private cropped(asset: string, crop: Crop): Promise<string> {
    const key = `${asset} ${crop.left} ${crop.top} ${crop.right} ${crop.bottom}`;
    let found = this.crops.get(key);
    if (!found) {
      found = (async () => {
        const cut = await this.crop(this.media.get(asset)!, crop).catch(() => null);
        if (!cut) return this.whole(asset);
        const id = `sha256:${await sha256(cut.bytes)}`;
        this.pictures[id] = cut;
        return id;
      })();
      this.crops.set(key, found);
    }
    return found;
  }

  private async picture(node: FileNode, inline: boolean): Promise<RichNode> {
    const note = (description?: string): RichNode => {
      const text: RichNode = { type: 'text', text: pictureNote(description) };
      return inline ? text : { type: 'paragraph', content: [text] };
    };
    const alt = (node.caption?.trim() || node.alt?.trim()) ?? '';
    if (node.pending) return note(node.pending.image ? `IMG ${node.pending.image}` : node.pending.page ? `page ${node.pending.page}` : alt);
    if (!node.asset || !this.media.has(node.asset)) return note(alt);
    const { left = 0, top = 0, right = 1, bottom = 1 } = node.crop ?? {};
    // A crop that keeps everything, or nothing, shows the whole picture.
    const whole = (left <= 0 && top <= 0 && right >= 1 && bottom >= 1) || left >= right || top >= bottom;
    const asset = whole ? this.whole(node.asset) : await this.cropped(node.asset, { left, top, right, bottom });
    const ratio = Number(node.classGauntlet?.ratio);
    return {
      type: 'block-image',
      asset,
      ...(alt ? { alt } : {}),
      ...(Number.isFinite(ratio) && ratio > 0 && ratio !== 1 ? { ratio } : {}),
    };
  }

  /** The file's Rich Text as ours. Side-by-Sides give their Panels' content in order; centring and sizes are left behind. */
  async rich(nodes: unknown, inline = false): Promise<RichText> {
    const out: RichText = [];
    for (const node of Array.isArray(nodes) ? (nodes as FileNode[]) : []) {
      if (!node || typeof node !== 'object') continue;
      if (node.type === 'block-image' || node.type === 'inline-image') out.push(await this.picture(node, inline));
      else if (!NODES.has(node.type)) out.push(...(await this.rich(node.content, inline)));
      else if (node.type === 'text') {
        if (typeof node.text !== 'string' || !node.text) continue;
        const marks = (node.marks ?? []).filter((m) => MARKS.has(m?.type) && safeLink(m));
        out.push({ type: 'text', text: node.text, ...(marks.length ? { marks } : {}) });
      } else {
        const next: RichNode = { type: node.type as RichNode['type'] };
        if (typeof node.level === 'number') next.level = node.level;
        if (typeof node.start === 'number') next.start = node.start;
        if (typeof node.language === 'string') next.language = node.language;
        if (typeof node.source === 'string') next.source = node.source;
        if (typeof node.header === 'boolean') next.header = node.header;
        if (typeof node.text === 'string') next.text = node.text;
        if (node.content) {
          const content = await this.rich(node.content, INLINE_PARENTS.has(node.type));
          if (content.length) next.content = content;
        }
        out.push(next);
      }
    }
    return out;
  }

  /** A document's Rich Text, never empty. */
  async document(value: unknown): Promise<RichText> {
    const rich = await this.rich((value as Document | undefined)?.content);
    return rich.length ? rich : [{ type: 'paragraph' }];
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Reads a Bank File, or any Test Parrot package or record, into the shape
 * importQuestionFile gives. Each bank becomes a set and Exams are left
 * behind. Only multiple choice and true/false with two to four answers and
 * one right one come in; every other question is left out and named in
 * `errors`. `pictures` are keyed by the file's asset ids. A Picture Crop is
 * cut by `crop`; where it can't be, the whole picture is shown.
 */
export async function readBankFile(
  file: { name: string; bytes: Uint8Array },
  { crop = cropInBrowser }: { crop?: Cropper } = {},
): Promise<ImportResult> {
  const formatLabel = 'Test Parrot';
  const fail = (message: string): ImportResult => ({ sets: [], errors: [message], formatLabel, pictures: {} });

  let json: Uint8Array = file.bytes;
  const files = new Map<string, Uint8Array>();
  if (isZip(file.bytes)) {
    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(file.bytes);
    } catch {
      return fail(`“${file.name}” could not be opened as a zip file.`);
    }
    const root = zip.file(ROOT);
    if (!root) return fail(`“${file.name}” has no ${ROOT}, so it is not a Test Parrot file.`);
    json = await root.async('uint8array');
    for (const entry of Object.values(zip.files)) if (!entry.dir && entry.name !== ROOT) files.set(entry.name, await entry.async('uint8array'));
  }

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(json).replace(/^﻿/, ''));
  } catch {
    return fail(`“${file.name}” is not a Test Parrot file Class Gauntlet can read: its JSON is broken.`);
  }
  if (!isRecord(value) || (value.format !== PACKAGE && value.format !== RECORD)) return fail(`“${file.name}” is not a Test Parrot package or Question Bank.`);

  let records: unknown[];
  if (value.format === PACKAGE) {
    if (value.formatVersion !== '0.1.0')
      return fail(`“${file.name}” is a Test Parrot package of version ${String(value.formatVersion)}, and Class Gauntlet reads only version 0.1.0.`);
    if (Array.isArray(value.requiredFeatures) && value.requiredFeatures.length)
      return fail(`“${file.name}” needs ${value.requiredFeatures.join(', ')}, which Class Gauntlet doesn't know.`);
    records = Array.isArray(value.questionBanks) ? value.questionBanks.map((bank) => (isRecord(bank) ? bank.record : null)) : [];
  } else records = [value];

  const reader = new Reader(crop);
  const errors: string[] = [];
  const sets: QuestionBank[] = [];
  const several = records.length > 1;
  for (const candidate of records) {
    const record = candidate as FileRecord;
    const name = isRecord(record) && isRecord(record.bank) && typeof record.bank.name === 'string' ? record.bank.name.trim() : '';
    const called = name ? `“${name}”` : 'A Question Bank';
    if (!isRecord(record) || record.format !== RECORD || !isRecord(record.bank) || !Array.isArray(record.bank.questions)) {
      errors.push(`${called} in “${file.name}” is not a Test Parrot Question Bank.`);
      continue;
    }
    if (!RECORD_VERSIONS.includes(record.formatVersion)) {
      errors.push(`${called} is a Test Parrot Question Bank of version ${record.formatVersion}, and Class Gauntlet reads versions 0.1.0 to 0.10.0.`);
      continue;
    }
    if (record.requiredFeatures?.length) {
      errors.push(`${called} needs ${record.requiredFeatures.join(', ')}, which Class Gauntlet doesn't know.`);
      continue;
    }
    for (const asset of [...(record.media ?? []), ...(record.classGauntlet?.media ?? [])]) {
      if (!isRecord(asset) || typeof asset.id !== 'string') continue;
      const bytes = asset.file ? files.get(asset.file) : asset.bytes ? decodeBase64(asset.bytes) : undefined;
      if (bytes) reader.media.set(asset.id, { bytes, mimeType: sniff(bytes) ?? asset.mimeType });
    }

    const questions: Question[] = [];
    for (const [i, q] of record.bank.questions.entries()) {
      const where = `Question ${i + 1}${several && name ? ` in “${name}”` : ''}`;
      const why = isRecord(q) ? unplayable(q) : 'it is not a question Class Gauntlet can read.';
      if (why) {
        errors.push(`${where}: ${why}`);
        continue;
      }
      const choices = await Promise.all(q.choices!.map((c) => reader.document(c.content)));
      const clash = unplayableChoices(choices);
      if (clash) {
        errors.push(`${where}: ${clash}`);
        continue;
      }
      const explanation = q.classGauntlet?.explanation ? await reader.document(q.classGauntlet.explanation) : undefined;
      const topics = Array.isArray(q.topics) ? q.topics.filter((t) => typeof t === 'string' && t.trim()) : [];
      questions.push(
        cleanQuestion({
          id: randomId(),
          prompt: '',
          choices: [],
          correct: q.choices!.findIndex((c) => c.correct === true),
          ...(topics.length ? { topics } : {}),
          rich: { prompt: await reader.document(q.stem), choices, ...(explanation && hasContent(explanation) ? { explanation } : {}) },
        }),
      );
    }
    if (!questions.length) continue;
    sets.push({ id: randomId(), title: name || file.name.replace(/(\.parrot)?\.(zip|json)$/i, ''), questions, updatedAt: Date.now() });
  }

  const shown = picturesIn(sets);
  const pictures = Object.fromEntries(Object.entries(reader.pictures).filter(([key]) => shown.has(key)));
  return { sets, errors, formatLabel, pictures };
}
