import type { EndReason, Phase, Role } from './game/types';

/** The friendly names the original game used on screen. */
export const roleName: Record<Role, string> = {
  one: 'Champion',
  mob: 'The Class',
  crowd: 'Comeback Crew',
};

export const helpName = { poll: 'Poll the Class', ask: 'Ask Two', trust: 'Go with the Class' } as const;
export const helpBlurb = {
  poll: 'Pick an answer and see how many classmates chose it',
  ask: 'Two classmates explain their answers out loud',
  trust: 'Lock in the class’s most popular answer',
} as const;

export const phaseName: Record<Phase, string> = {
  LOBBY: 'Lobby',
  BETWEEN: 'Getting ready',
  PHASE_A: 'Everybody answers',
  PHASE_A_LOCKED: 'Answers are in',
  PHASE_B: 'Spotlight Round',
  ONE_LOCKED: 'Final answer',
  REVEAL: 'The Reveal',
  RESCUE: 'Rescue',
  LEADERBOARD: 'Leaderboard',
  ENDED: 'Final standings',
};

export function endHeadline(reason: EndReason, one: string, bankedByOne: number): string {
  if (reason === 'flameout') return `The class wins the Prize Pot!`;
  if (reason === 'mob_emptied') return `Jackpot! ${one} wins ${bankedByOne} points`;
  return `${one} cleared every question!`;
}

export function endDetail(reason: EndReason, one: string, teamWinners: number, noDevices = false): string {
  if (noDevices) return reason === 'flameout' ? `${one} ran out of chances. The class takes the pot.` : `${one} banks the Prize Pot.`;
  if (reason === 'flameout')
    return teamWinners > 0
      ? `${one} ran out of chances. ${teamWinners} ${teamWinners === 1 ? 'classmate splits' : 'classmates split'} the pot.`
      : `${one} ran out of chances. The class holds the field.`;
  if (reason === 'mob_emptied') return 'The whole class fell to the Comeback Crew.';
  return `${one} banks the Prize Pot, and every classmate still standing earns a bonus.`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
