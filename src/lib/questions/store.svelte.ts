import type { QuestionBank } from '../game/types';
import { randomId } from '../game/engine';
import { sampleSet, sampleSetId } from './sample';

/**
 * A teacher's question sets live in this browser's local storage; nothing is
 * uploaded. Share links and CSV files move them between computers.
 */

const key = 'classgauntlet:sets';

function load(): QuestionBank[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      // An untouched copy of the sample (never saved, so updatedAt 0) follows the latest version.
      return (JSON.parse(raw) as QuestionBank[]).map((set) =>
        set.id === sampleSetId && set.updatedAt === 0 ? sampleSet() : set,
      );
    }
  } catch {
    /* fall through to the sample */
  }
  return [sampleSet()];
}

class QuestionLibrary {
  sets = $state<QuestionBank[]>(load());

  #save() {
    try {
      localStorage.setItem(key, JSON.stringify(this.sets));
    } catch {
      /* storage full or blocked */
    }
  }

  get(id: string): QuestionBank | undefined {
    return this.sets.find((set) => set.id === id);
  }

  /** Newest first, with the sample at the end. */
  get sorted(): QuestionBank[] {
    return [...this.sets].sort(
      (a, b) => Number(a.id === sampleSetId) - Number(b.id === sampleSetId) || b.updatedAt - a.updatedAt,
    );
  }

  save(set: QuestionBank) {
    const copy = { ...$state.snapshot(set), updatedAt: Date.now() } as QuestionBank;
    const index = this.sets.findIndex((s) => s.id === set.id);
    if (index >= 0) this.sets[index] = copy;
    else this.sets.push(copy);
    this.#save();
  }

  add(set: Omit<QuestionBank, 'id' | 'updatedAt'>): QuestionBank {
    const created = { ...set, id: randomId(), updatedAt: Date.now() };
    this.sets.push(created);
    this.#save();
    return created;
  }

  duplicate(id: string): QuestionBank | undefined {
    const original = this.get(id);
    if (!original) return undefined;
    const copy = $state.snapshot(original) as QuestionBank;
    return this.add({
      ...copy,
      title: `${copy.title.replace(/^Sample: /, '')} (copy)`,
      questions: copy.questions.map((q) => ({ ...q, id: randomId() })),
    });
  }

  remove(id: string) {
    this.sets = this.sets.filter((set) => set.id !== id);
    this.#save();
  }

  restoreSample() {
    if (!this.get(sampleSetId)) {
      this.sets.push(sampleSet());
      this.#save();
    }
  }
}

export const library = new QuestionLibrary();
