import { DEFAULT_CLASSIC_SETTINGS, type ClassicSettings } from '../game/classic/types';
import { emptyDraft, type BoardDraft } from '../game/peril/draft';
import { DEFAULT_PERIL_SETTINGS, type PerilSettings } from '../game/peril/types';
import { DEFAULT_SETTINGS, type Settings } from '../game/types';

/**
 * What this browser remembers for each Game Mode: the rules it was last played
 * with and how the teacher last set it up. Missing or broken storage
 * just means starting from the defaults.
 */

export type ChampionRules = Pick<Settings, 'timerSeconds' | 'strikes' | 'questionsPerGame' | 'momentumEnabled' | 'shuffleQuestions'>;
export type PerilRules = Omit<PerilSettings, 'teams'>;
export type PerilSetup = { draft: BoardDraft; solo: boolean; teamCount: number };

const keys = {
  // Champion's rules have always lived here, beside a few older fields.
  championRules: 'classgauntlet:prefs',
  championDeck: 'classgauntlet:champion-deck',
  perilRules: 'classgauntlet:peril-rules',
  perilSetup: 'classgauntlet:peril-setup',
  classicRules: 'classgauntlet:classic-rules',
  classicDeck: 'classgauntlet:classic-deck',
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* fine */
  }
}

export function championRules(): ChampionRules {
  const { timerSeconds, strikes, questionsPerGame, momentumEnabled, shuffleQuestions } = load<Settings>(keys.championRules, DEFAULT_SETTINGS);
  return { timerSeconds, strikes, questionsPerGame, momentumEnabled, shuffleQuestions };
}

export const saveChampionRules = (rules: ChampionRules) => save(keys.championRules, { ...load(keys.championRules, {}), ...rules });

/** The questions (by id) Champion last played, in order. */
export function championDeck(): string[] {
  return load<{ ids: string[] }>(keys.championDeck, { ids: [] }).ids;
}

export const saveChampionDeck = (ids: string[]) => save(keys.championDeck, { ids });

export function perilRules(): PerilRules {
  const { teams: _, ...defaults } = DEFAULT_PERIL_SETTINGS;
  return load<PerilRules>(keys.perilRules, defaults);
}

export const savePerilRules = (rules: PerilRules) => save(keys.perilRules, rules);

export function perilSetup(): PerilSetup {
  return load<PerilSetup>(keys.perilSetup, { draft: emptyDraft(), solo: true, teamCount: 4 });
}

export const savePerilSetup = (setup: PerilSetup) => save(keys.perilSetup, setup);

export const classicRules = (): ClassicSettings => load<ClassicSettings>(keys.classicRules, DEFAULT_CLASSIC_SETTINGS);
export const saveClassicRules = (rules: ClassicSettings) => save(keys.classicRules, rules);

/** The questions (by id) Classic last played, in order. */
export const classicDeck = (): string[] => load<{ ids: string[] }>(keys.classicDeck, { ids: [] }).ids;
export const saveClassicDeck = (ids: string[]) => save(keys.classicDeck, { ids });
