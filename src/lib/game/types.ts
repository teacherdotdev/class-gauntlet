/**
 * Everything the game knows, as plain data. The teacher's tab owns one
 * `Session`, saves it to local storage after every change, and sends each
 * student only the slice they are allowed to see (see views.ts).
 */

export type Question = {
  id: string;
  prompt: string;
  /** Two to four answers. The original game used three. */
  choices: string[];
  /** Index into `choices`. */
  correct: number;
  explanation?: string;
  /** Concepts the question covers; a Topic gathers questions across banks. */
  topics?: string[];
};

export type QuestionBank = {
  id: string;
  title: string;
  questions: Question[];
  updatedAt: number;
};

/** The One sits in the spotlight; the Mob challenges them; the Crowd (Comeback Crew) keeps playing after a miss. */
export type Role = 'one' | 'mob' | 'crowd';

export type Player = {
  id: string;
  /** Proves a reconnecting device is the same student. Never sent to other students. */
  secret: string;
  nickname: string;
  role: Role;
  points: number;
  streak: number;
  hasBeenOne: boolean;
  joinedAt: number;
  connected: boolean;
};

export type Help = 'poll' | 'ask' | 'trust';

export type Settings = {
  /** How long the class has to answer (Phase A). */
  timerSeconds: number;
  /** Wrong answers The One can survive. */
  strikes: number;
  questionsPerGame: number;
  /** "On a Roll": fast, unaided correct answers by The One can earn back a strike. */
  momentumEnabled: boolean;
  momentumThreshold: number;
  shuffleQuestions: boolean;
  survivalDrip: number;
  bankPerElimination: number;
  jackpotMultiplier: number;
  bankKeepFractionOnFlameout: number;
  mobCorrectPoints: number;
  crowdCorrectPoints: number;
  streakBonusPerStep: number;
  deckSurvivedMobBonus: number;
  helpsPerGame: Record<Help, number>;
  askSpeakerBonus: number;
  momentumFastK: number;
  momentumWindowMinMs: number;
  momentumWindowMaxMs: number;
};

export const DEFAULT_SETTINGS: Settings = {
  timerSeconds: 20,
  strikes: 2,
  questionsPerGame: 12,
  momentumEnabled: false,
  momentumThreshold: 4,
  shuffleQuestions: false,
  survivalDrip: 10,
  bankPerElimination: 20,
  jackpotMultiplier: 1.5,
  bankKeepFractionOnFlameout: 0,
  mobCorrectPoints: 10,
  crowdCorrectPoints: 5,
  streakBonusPerStep: 2,
  deckSurvivedMobBonus: 15,
  helpsPerGame: { poll: 1, ask: 1, trust: 1 },
  askSpeakerBonus: 5,
  momentumFastK: 1.25,
  momentumWindowMinMs: 8_000,
  momentumWindowMaxMs: 20_000,
};

export type Phase =
  /** Students are joining. */
  | 'LOBBY'
  /** A game has started (or a question finished) and the next question is not open yet. */
  | 'BETWEEN'
  /** Everybody but The One answers on their own device. */
  | 'PHASE_A'
  /** The class has answered; the teacher is about to show the question to The One. */
  | 'PHASE_A_LOCKED'
  /** The One sees the question and may use a lifeline. */
  | 'PHASE_B'
  /** The One has locked a final answer; the teacher reveals it. */
  | 'ONE_LOCKED'
  /** The answer is on the board with points and role changes. */
  | 'REVEAL'
  /** A game finished; standings are up and the teacher picks the next One. */
  | 'LEADERBOARD'
  | 'ENDED';

export type EndReason = 'flameout' | 'deck_survived' | 'mob_emptied';

export type Answer = { playerId: string; choice: number; ms: number };

export type HelpResult =
  | { type: 'poll'; choice: number; count: number; total: number }
  | {
      type: 'ask';
      speakers: { playerId: string; nickname: string; choice: number }[];
      bonusEach: number;
    }
  | { type: 'trust'; choice: number; counts: number[] };

export type Attempt = {
  id: string;
  /** 1-based number of this question within the game. */
  index: number;
  question: Question;
  startedAt: number;
  /** Absolute time the class's answers lock; null while paused. */
  deadline: number | null;
  /** Remaining ms while paused in Phase A. */
  pausedRemainingMs: number | null;
  /** When the current pause began, so paused time doesn't count against anyone's speed. */
  pausedAt: number | null;
  eligible: string[];
  answers: Answer[];
  phaseBStartedAt: number | null;
  oneAnswer: number | null;
  oneMs: number | null;
  helpUsed: Help | null;
  helpResult: HelpResult | null;
};

export type ScoreDelta = { playerId: string; points: number; reason: string };

export type RevealResult = {
  correct: number;
  oneAnswer: number;
  oneCorrect: boolean;
  counts: number[];
  demoted: string[];
  deltas: ScoreDelta[];
  bankDelta: number;
  momentumCredited: boolean;
  momentumFilled: boolean;
};

export type GameResult = {
  reason: EndReason;
  payouts: { playerId: string; points: number }[];
  bank: number;
  bankedByOne: number;
};

export type Game = {
  ordinal: number;
  oneId: string;
  /** Positions in the session deck this game uses. */
  deck: number[];
  offset: number;
  strikes: number;
  bank: number;
  helpsUsed: Record<Help, boolean>;
  momentum: { progress: number; awardedOnce: boolean };
  active: Attempt | null;
  reveal: RevealResult | null;
  result: GameResult | null;
};

export type Session = {
  /** Absent in games saved before Peril! existed. */
  mode?: 'champion';
  version: 1;
  code: string;
  createdAt: number;
  setTitle: string;
  questions: Question[];
  /** Order the deck is played in (indexes into `questions`). */
  order: number[];
  /** Next unplayed position in `order`; wraps around when the deck runs out. */
  deckPos: number;
  settings: Settings;
  players: Player[];
  phase: Phase;
  /** When PAUSED, the phase to go back to. */
  paused: boolean;
  game: Game | null;
  pendingNextOneId: string | null;
  /** Game results so far, newest last. */
  history: { ordinal: number; oneId: string; reason: EndReason; bankedByOne: number }[];
  /** Bumped on every change, so viewers can ignore stale messages. */
  seq: number;
};
