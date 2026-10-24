/**
 * Keys on the host screens, so a teacher can run a game from the keyboard or
 * a presentation clicker (which sends → / PageDown, or Space): those move the
 * game on, A–D or 1–4 pick an answer, and 1–8 pick a Team.
 */

export type HostKey =
  | { kind: 'next' }
  /** A–D, or 1–4. */
  | { kind: 'choice'; index: number }
  /** 1–9, counted from 0. */
  | { kind: 'number'; index: number };

export function hostKey(event: KeyboardEvent): HostKey | null {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return null;
  const target = event.target as HTMLElement | null;
  if (target?.closest?.('input, textarea, select, [contenteditable], dialog')) return null;
  const key = event.key;
  if (key === 'ArrowRight' || key === 'PageDown') return { kind: 'next' };
  // Space on a focused button already presses that button.
  if (key === ' ' && !target?.closest?.('button, a')) return { kind: 'next' };
  const letter = 'abcd'.indexOf(key.toLowerCase());
  if (key.length === 1 && letter >= 0) return { kind: 'choice', index: letter };
  if (/^[1-9]$/.test(key)) return { kind: 'number', index: Number(key) - 1 };
  return null;
}

/** The answer a key picks, if it picks one of `count` answers. */
export function choiceOf(key: HostKey | null, count: number): number | null {
  if (!key || key.kind === 'next') return null;
  return key.index < count ? key.index : null;
}
