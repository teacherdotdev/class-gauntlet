/**
 * Undo and redo for edits to a question bank. Before each change, record the
 * state it changes from. Changes that share a `coalesce` key in a row (typing
 * in one field) count as one step.
 */
export class UndoStack<T> {
  #past: T[] = [];
  #future: T[] = [];
  #lastKey: string | null = null;

  record(before: T, coalesce?: string) {
    if (!coalesce || coalesce !== this.#lastKey) this.#past.push(before);
    this.#lastKey = coalesce ?? null;
    this.#future = [];
  }

  /** The state to go back to from `current`, or null when there's nothing to undo. */
  undo(current: T): T | null {
    const previous = this.#past.pop();
    if (previous === undefined) return null;
    this.#future.push(current);
    this.#lastKey = null;
    return previous;
  }

  redo(current: T): T | null {
    const next = this.#future.pop();
    if (next === undefined) return null;
    this.#past.push(current);
    this.#lastKey = null;
    return next;
  }

  get canUndo() {
    return this.#past.length > 0;
  }

  get canRedo() {
    return this.#future.length > 0;
  }
}
