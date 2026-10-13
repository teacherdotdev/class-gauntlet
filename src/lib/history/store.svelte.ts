import type { GameRecord } from './record';

/** History lives in this browser's local storage, newest first. */

const key = 'classgauntlet:history';

function load(): GameRecord[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as GameRecord[];
  } catch {
    return [];
  }
}

class GameHistory {
  records = $state<GameRecord[]>(load());

  #save() {
    try {
      localStorage.setItem(key, JSON.stringify(this.records));
    } catch {
      /* storage full or blocked */
    }
  }

  add(record: GameRecord) {
    this.records = [record, ...this.records.filter((r) => r.id !== record.id)];
    this.#save();
  }

  get(id: string): GameRecord | undefined {
    return this.records.find((r) => r.id === id);
  }

  clear() {
    this.records = [];
    this.#save();
  }
}

export const gameHistory = new GameHistory();
