import type { Help } from './game/types';
import type { ClassicView } from './game/classic/views';
import type { PerilView } from './game/peril/views';
import type { View } from './game/views';

/** What a student's device sends the teacher's tab. */
export type StudentMessage =
  | { type: 'hello'; nickname: string; playerId?: string; secret?: string }
  | { type: 'answer'; attemptId: string; choice: number }
  | { type: 'one-answer'; attemptId: string; choice: number }
  | { type: 'help'; help: Help; choice?: number }
  /** Peril! */
  | { type: 'buzz' }
  | { type: 'vote'; choice: number }
  | { type: 'wager'; amount: number }
  | { type: 'pick'; column: number; row: number }
  | { type: 'choose-team'; teamId: string }
  /** Classic */
  | { type: 'classic-answer'; choice: number }
  | { type: 'leave' }
  | { type: 'ping' };

/** What the teacher's tab sends a student's device. */
export type HostMessage =
  | { type: 'welcome'; playerId: string; secret: string; nickname: string }
  /** The device can't join; `forget` means its saved seat is no good. */
  | { type: 'denied'; message: string; forget: boolean }
  | { type: 'view'; view: View | PerilView | ClassicView }
  | { type: 'notice'; message: string }
  | { type: 'removed' }
  | { type: 'ping' };

/** A six-digit game PIN, easy to type on a phone's number pad. */
export function newRoomCode(): string {
  return String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
}

export function cleanRoomCode(input: string): string {
  return input.replace(/\D/g, '').slice(0, 6);
}

/** "482913" → "482 913", for reading off the board. */
export function spacedCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}

export function joinUrl(origin: string, code: string): string {
  return `${origin}/join?code=${code}`;
}
