/**
 * Everything this browser keeps for a teacher, as one file: question banks
 * (with their pictures), History, and each Game Mode's remembered rules and setup. Importing a
 * backup replaces all of it. A game in progress and students' seats stay
 * behind; they belong to this computer's open tabs.
 */

const keys = {
  banks: 'classgauntlet:sets',
  history: 'classgauntlet:history',
  championRules: 'classgauntlet:prefs',
  championDeck: 'classgauntlet:champion-deck',
  perilRules: 'classgauntlet:peril-rules',
  perilSetup: 'classgauntlet:peril-setup',
  classicRules: 'classgauntlet:classic-rules',
  classicDeck: 'classgauntlet:classic-deck',
} as const;

export type BackupPart = keyof typeof keys;
export type Backup = {
  kind: 'class-gauntlet-backup';
  version: 1;
  exportedAt: string;
  data: Partial<Record<BackupPart, unknown>> & {
    /** The pictures the banks show, as base64; they live in IndexedDB, not local storage. */
    pictures?: { hash: string; type: string; data: string }[];
  };
};

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function collectBackup(storage: Store, now = new Date()): Backup {
  const data: Backup['data'] = {};
  for (const [part, key] of Object.entries(keys) as [BackupPart, string][]) {
    const raw = storage.getItem(key);
    if (raw == null) continue;
    try {
      data[part] = JSON.parse(raw);
    } catch {
      /* a broken entry isn't worth keeping */
    }
  }
  return { kind: 'class-gauntlet-backup', version: 1, exportedAt: now.toISOString(), data };
}

/** Reads a backup file, or says what's wrong with it. */
export function readBackup(text: string): Backup | { problem: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { problem: 'That file isn’t a Class Gauntlet backup (it isn’t JSON).' };
  }
  const backup = parsed as Partial<Backup> | null;
  if (backup?.kind !== 'class-gauntlet-backup' || typeof backup.data !== 'object' || !backup.data)
    return { problem: 'That file isn’t a Class Gauntlet backup.' };
  if (typeof backup.version !== 'number' || backup.version > 1)
    return { problem: 'That backup is from a newer Class Gauntlet. Reload the page and try again.' };
  for (const part of ['banks', 'history', 'pictures'] as const)
    if (part in backup.data && !Array.isArray(backup.data[part])) return { problem: `The ${part} in that backup are damaged.` };
  return backup as Backup;
}

/** Replaces everything this browser keeps with the backup's. */
export function restoreBackup(storage: Store, backup: Backup) {
  for (const [part, key] of Object.entries(keys) as [BackupPart, string][]) {
    if (part in backup.data) storage.setItem(key, JSON.stringify(backup.data[part]));
    else storage.removeItem(key);
  }
}

/** "3 question banks (40 questions, 2 pictures), 12 games in History" */
export function describeBackup(backup: Backup): string {
  const banks = (backup.data.banks ?? []) as { questions?: unknown[] }[];
  const questions = banks.reduce((n, bank) => n + (bank.questions?.length ?? 0), 0);
  const games = ((backup.data.history ?? []) as unknown[]).length;
  const pictures = backup.data.pictures?.length ?? 0;
  const s = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  return `${s(banks.length, 'question bank')} (${s(questions, 'question')}${pictures ? `, ${s(pictures, 'picture')}` : ''}), ${s(games, 'game')} in History`;
}
