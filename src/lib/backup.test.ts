import { expect, test } from 'bun:test';
import { collectBackup, describeBackup, readBackup, restoreBackup, type Backup } from './backup';

function memory(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries));
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

const bank = { id: 'b1', title: 'Fractions', updatedAt: 1, questions: [{ id: 'q1' }, { id: 'q2' }] };

test('a backup holds the banks, History and every Game Mode’s rules and setup, but not a game in progress', () => {
  const storage = memory({
    'classgauntlet:sets': JSON.stringify([bank]),
    'classgauntlet:history': JSON.stringify([{ id: 'g1' }]),
    'classgauntlet:peril-setup': JSON.stringify({ solo: false, teamCount: 3 }),
    'classgauntlet:classic-rules': JSON.stringify({ timerSeconds: 30 }),
    'classgauntlet:host': JSON.stringify({ code: '1234' }),
    'classgauntlet:seat:1234': 'x',
  });
  const backup = collectBackup(storage, new Date('2026-10-12T00:00:00Z'));
  expect(backup.kind).toBe('class-gauntlet-backup');
  expect(backup.exportedAt).toBe('2026-10-12T00:00:00.000Z');
  expect(backup.data).toEqual({
    banks: [bank],
    history: [{ id: 'g1' }],
    perilSetup: { solo: false, teamCount: 3 },
    classicRules: { timerSeconds: 30 },
  });
  expect(describeBackup(backup)).toBe('1 question bank (2 questions), 1 game in History');
  expect(describeBackup({ ...backup, data: { ...backup.data, pictures: [{ hash: 'h', type: 'image/png', data: '' }] } })).toBe(
    '1 question bank (2 questions, 1 picture), 1 game in History',
  );
});

test('restoring a backup replaces everything, and what the backup lacks is cleared', () => {
  const storage = memory({
    'classgauntlet:sets': '[]',
    'classgauntlet:classic-deck': JSON.stringify({ ids: ['old'] }),
    'classgauntlet:host': 'kept',
  });
  const backup: Backup = { kind: 'class-gauntlet-backup', version: 1, exportedAt: '', data: { banks: [bank], history: [] } };
  restoreBackup(storage, backup);
  expect(JSON.parse(storage.getItem('classgauntlet:sets')!)).toEqual([bank]);
  expect(storage.getItem('classgauntlet:history')).toBe('[]');
  expect(storage.getItem('classgauntlet:classic-deck')).toBeNull();
  expect(storage.getItem('classgauntlet:host')).toBe('kept');
});

test('a backup survives the round trip through a file', () => {
  const storage = memory({ 'classgauntlet:sets': JSON.stringify([bank]), 'classgauntlet:prefs': JSON.stringify({ strikes: 3 }) });
  const read = readBackup(JSON.stringify(collectBackup(storage)));
  expect('problem' in read).toBe(false);
  const fresh = memory();
  restoreBackup(fresh, read as Backup);
  expect(fresh.map).toEqual(storage.map);
});

test('files that aren’t backups are refused with a reason', () => {
  expect(readBackup('question,A,B')).toEqual({ problem: expect.stringContaining('isn’t JSON') });
  expect(readBackup('{"kind":"something"}')).toEqual({ problem: expect.stringContaining('isn’t a Class Gauntlet backup') });
  expect(readBackup('{"kind":"class-gauntlet-backup","version":9,"data":{}}')).toEqual({ problem: expect.stringContaining('newer') });
  expect(readBackup('{"kind":"class-gauntlet-backup","version":1,"data":{"banks":{}}}')).toEqual({ problem: expect.stringContaining('damaged') });
  expect(readBackup('{"kind":"class-gauntlet-backup","version":1,"data":{"pictures":"x"}}')).toEqual({ problem: expect.stringContaining('damaged') });
});
