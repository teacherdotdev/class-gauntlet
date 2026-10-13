import type { Question, QuestionBank } from '../game/types';
import { withoutPictures, type RichQuestion } from '../rich/text';

/**
 * A question set can travel in a link: the set is compressed into the part of
 * the address after #, which browsers never send to a server. Opening the link
 * offers to add the set to that teacher's library. Formatting and math come
 * along; pictures are too big for a link, and leave a note where they were.
 */

/** Old links may also carry s (subject) and g (grade), which are ignored now. */
type Packed = { t: string; s?: string; g?: string; q: [string, string[], number, string?, string[]?, RichQuestion?][] };

function linkRich(q: Question): RichQuestion | undefined {
  if (!q.rich) return undefined;
  const { prompt, choices, explanation } = q.rich;
  return { prompt: withoutPictures(prompt), choices: choices.map(withoutPictures), ...(explanation ? { explanation: withoutPictures(explanation) } : {}) };
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function shareLink(origin: string, set: QuestionBank): Promise<string> {
  const packed: Packed = {
    t: set.title,
    q: set.questions.map((q) => {
      const rich = linkRich(q);
      return rich
        ? [q.prompt, q.choices, q.correct, q.explanation ?? '', q.topics ?? [], rich]
        : q.topics?.length
          ? [q.prompt, q.choices, q.correct, q.explanation ?? '', q.topics]
          : q.explanation
            ? [q.prompt, q.choices, q.correct, q.explanation]
            : [q.prompt, q.choices, q.correct];
    }),
  };
  const bytes = await pipe(new TextEncoder().encode(JSON.stringify(packed)), new CompressionStream('deflate-raw'));
  return `${origin}/banks#set=${toBase64Url(bytes)}`;
}

export async function readShared(hash: string): Promise<Omit<QuestionBank, 'id' | 'updatedAt'> | null> {
  const match = hash.match(/set=([\w-]+)/);
  if (!match) return null;
  try {
    const bytes = await pipe(fromBase64Url(match[1]), new DecompressionStream('deflate-raw'));
    const packed = JSON.parse(new TextDecoder().decode(bytes)) as Packed;
    return {
      title: String(packed.t),
      questions: packed.q.map(([prompt, choices, correct, explanation, topics, rich], i) => ({
        id: `shared-${i}-${Math.random().toString(36).slice(2, 8)}`,
        prompt: String(prompt),
        choices: choices.map(String),
        correct: Number(correct),
        explanation: explanation ? String(explanation) : undefined,
        ...(Array.isArray(topics) && topics.length ? { topics: topics.map(String) } : {}),
        ...(rich && Array.isArray(rich.prompt) && Array.isArray(rich.choices) && rich.choices.length === choices.length ? { rich } : {}),
      })),
    };
  } catch {
    return null;
  }
}
