import type { Question, QuestionBank } from '../game/types';

/**
 * Finding questions across the whole library, the way Notion filters a
 * table: a search box, and filters on a property (a bank, a Topic) that each
 * keep questions matching any of their values. Every filter must match.
 */

export type QuestionFilter = { property: 'bank' | 'topic'; values: string[] };
export type BrowseQuery = { search: string; filters: QuestionFilter[] };
export type BrowseRow = { question: Question; bank: QuestionBank };

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Every Topic in the library, in the spelling first seen. */
export function libraryTopics(library: QuestionBank[]): string[] {
  const topics: string[] = [];
  for (const bank of library)
    for (const question of bank.questions)
      for (const topic of question.topics ?? []) if (!topics.some((t) => same(t, topic))) topics.push(topic);
  return topics;
}

function matches(row: BrowseRow, filter: QuestionFilter): boolean {
  if (!filter.values.length) return true;
  if (filter.property === 'bank') return filter.values.includes(row.bank.id);
  return filter.values.some((value) => row.question.topics?.some((topic) => same(topic, value)));
}

export function browse(library: QuestionBank[], query: BrowseQuery): BrowseRow[] {
  const words = query.search.toLowerCase().trim();
  return library
    .flatMap((bank) => bank.questions.map((question) => ({ question, bank })))
    .filter(
      (row) =>
        (!words || [row.question.prompt, ...row.question.choices].some((text) => text.toLowerCase().includes(words))) &&
        query.filters.every((filter) => matches(row, filter)),
    );
}

/** The questions picked in the browser, and the one the last plain or Cmd-click landed on. */
export type Selection = { ids: string[]; anchor: string | null };

/**
 * Selecting the way a file list does: a click selects one question (or
 * clears it, if it's all that's selected), Cmd/Ctrl-click adds or removes
 * one, and Shift-click adds the run from the anchor to here.
 */
export function select(
  current: Selection,
  id: string,
  keys: { toggle?: boolean; range?: boolean },
  order: string[],
): Selection {
  if (keys.range && current.anchor && order.includes(current.anchor)) {
    const [from, to] = [order.indexOf(current.anchor), order.indexOf(id)].sort((a, b) => a - b);
    const run = order.slice(from, to + 1);
    return { ids: [...current.ids, ...run.filter((i) => !current.ids.includes(i))], anchor: current.anchor };
  }
  if (keys.toggle) {
    const ids = current.ids.includes(id) ? current.ids.filter((i) => i !== id) : [...current.ids, id];
    return { ids, anchor: id };
  }
  const only = current.ids.length === 1 && current.ids[0] === id;
  return { ids: only ? [] : [id], anchor: id };
}
