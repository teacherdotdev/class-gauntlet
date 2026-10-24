import { describe, expect, test } from 'bun:test';
import { CLASS_ID, createSession, Engine, nicknameProblem } from './engine';
import { buildView } from './views';
import type { Question, Settings } from './types';

const questions: Question[] = Array.from({ length: 5 }, (_, i) => ({
  id: `q${i}`,
  prompt: `Question ${i}`,
  choices: ['A', 'B', 'C'],
  correct: 1,
}));

function setup(names = ['Ana', 'Ben', 'Cy', 'Dee']) {
  let now = 1_000_000;
  let seed = 1;
  const clock = {
    now: () => now,
    random: () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    },
  };
  const engine = new Engine(createSession({ code: 'ABC234', setTitle: 'Test', questions, clock }), clock);
  const ids = names.map((nickname) => {
    const joined = engine.join({ nickname });
    if (!joined.ok) throw new Error(joined.message);
    return joined.player.id;
  });
  return { engine, ids, advance: (ms: number) => (now += ms) };
}

function answerAll(engine: Engine, choices: Record<string, number>) {
  const active = engine.session.game!.active!;
  for (const [id, choice] of Object.entries(choices)) expect(engine.answer(id, active.id, choice).ok).toBe(true);
}

describe('Class Gauntlet engine', () => {
  test('One right: wrong Mob members join the Comeback Crew and fund the bank', () => {
    const { engine, ids } = setup();
    const [one, ben, cy, dee] = ids;
    expect(engine.startGame(one).ok).toBe(true);
    expect(engine.openQuestion().ok).toBe(true);
    expect(engine.session.phase).toBe('PHASE_A');
    answerAll(engine, { [ben]: 1, [cy]: 0, [dee]: 2 });
    expect(engine.session.phase).toBe('PHASE_A_LOCKED');
    expect(engine.showToOne().ok).toBe(true);
    const attempt = engine.session.game!.active!.id;
    expect(engine.oneAnswer(one, attempt, 1).ok).toBe(true);
    expect(engine.reveal().ok).toBe(true);
    const p = (id: string) => engine.player(id)!;
    expect(p(cy).role).toBe('crowd');
    expect(p(dee).role).toBe('crowd');
    expect(p(ben).role).toBe('mob');
    expect(p(ben).points).toBe(12); // 10 + streak bonus 2
    expect(engine.session.game!.bank).toBe(40);
    expect(p(one).points).toBe(10); // survival drip
    expect(engine.session.game!.result).toBeNull();
  });

  test('Mob emptied pays The One a jackpot', () => {
    const { engine, ids } = setup(['Ana', 'Ben']);
    const [one, ben] = ids;
    engine.startGame(one);
    engine.openQuestion();
    answerAll(engine, { [ben]: 0 });
    engine.showToOne();
    engine.oneAnswer(one, engine.session.game!.active!.id, 1);
    engine.reveal();
    const result = engine.session.game!.result!;
    expect(result.reason).toBe('mob_emptied');
    expect(result.bankedByOne).toBe(30); // 20 × 1.5
    expect(engine.next().ok).toBe(true);
    expect(engine.session.phase).toBe('LEADERBOARD');
    expect(engine.session.pendingNextOneId).toBe(ben);
  });

  test('Flameout splits the bank among the surviving Mob', () => {
    const { engine, ids } = setup();
    const [one, ben, cy, dee] = ids;
    engine.startGame(one);
    // Q1: One right, Dee knocked out → bank 20.
    engine.openQuestion();
    answerAll(engine, { [ben]: 1, [cy]: 1, [dee]: 0 });
    engine.showToOne();
    engine.oneAnswer(one, engine.session.game!.active!.id, 1);
    engine.reveal();
    // Q2 and Q3: One wrong twice → flameout.
    for (let i = 0; i < 2; i++) {
      engine.next();
      answerAll(engine, { [ben]: 1, [cy]: 1, [dee]: 1 });
      engine.showToOne();
      engine.oneAnswer(one, engine.session.game!.active!.id, 0);
      engine.reveal();
    }
    const result = engine.session.game!.result!;
    expect(result.reason).toBe('flameout');
    expect(result.payouts).toEqual([
      { playerId: ben, points: 10 },
      { playerId: cy, points: 10 },
    ]);
  });

  test('Lifelines: poll counts, ask picks one right and one wrong, trust locks the plurality', () => {
    const { engine, ids } = setup();
    const [one, ben, cy, dee] = ids;
    engine.startGame(one);
    engine.openQuestion();
    answerAll(engine, { [ben]: 1, [cy]: 0, [dee]: 0 });
    engine.showToOne();
    expect(engine.helpPoll(one, 0).ok).toBe(true);
    expect(engine.session.game!.active!.helpResult).toEqual({ type: 'poll', choice: 0, count: 2, total: 3 });
    expect(engine.helpAsk(one).ok).toBe(false); // one lifeline per question
    engine.oneAnswer(one, engine.session.game!.active!.id, 1);
    engine.reveal();
    engine.next();
    answerAll(engine, { [ben]: 1, [cy]: 0, [dee]: 2 });
    engine.showToOne();
    expect(engine.helpAsk(one).ok).toBe(true);
    const ask = engine.session.game!.active!.helpResult;
    if (ask?.type !== 'ask') throw new Error('expected ask');
    expect(ask.speakers.map((s) => s.choice === 1).sort()).toEqual([false, true]);
    engine.oneAnswer(one, engine.session.game!.active!.id, 1);
    engine.reveal();
    engine.next();
    answerAll(engine, { [ben]: 2 });
    expect(engine.lock().ok).toBe(true);
    engine.showToOne();
    expect(engine.helpTrust(one).ok).toBe(true);
    expect(engine.session.phase).toBe('ONE_LOCKED');
    expect(engine.session.game!.active!.oneAnswer).toBe(2);
  });

  test('Timer locks Phase A, and pausing stops the clock', () => {
    const { engine, ids, advance } = setup();
    engine.startGame(ids[0]);
    engine.openQuestion();
    advance(5_000);
    engine.pause();
    advance(60_000);
    expect(engine.tick()).toBe(false);
    engine.resume();
    advance(14_000);
    expect(engine.tick()).toBe(false);
    advance(1_100);
    expect(engine.tick()).toBe(true);
    expect(engine.session.phase).toBe('PHASE_A_LOCKED');
  });

  test('Views hide the question from The One and the projector during Phase A, and the answer until reveal', () => {
    const { engine, ids } = setup();
    const [one, ben] = ids;
    engine.startGame(one);
    engine.openQuestion();
    const opts = { now: Date.now(), pauseReason: null };
    expect(buildView(engine.session, opts).question!.prompt).toBeNull();
    expect(buildView(engine.session, { ...opts, viewerId: one }).question!.prompt).toBeNull();
    const benView = buildView(engine.session, { ...opts, viewerId: ben });
    expect(benView.question!.prompt).toBe('Question 0');
    expect(JSON.stringify(benView)).not.toContain('"correct"');
  });

  test('Rejoining with the secret restores the seat; late joiners are Comeback Crew', () => {
    const { engine, ids } = setup();
    engine.startGame(ids[0]);
    const ben = engine.player(ids[1])!;
    engine.setConnected(ben.id, false);
    expect(engine.join({ playerId: ben.id, secret: 'nope', nickname: 'Ben' }).ok).toBe(false);
    const back = engine.join({ playerId: ben.id, secret: ben.secret, nickname: 'Ben' });
    expect(back.ok && back.rejoined).toBe(true);
    const late = engine.join({ nickname: 'Eve' });
    expect(late.ok && late.player.role).toBe('crowd');
  });

  test('One disconnecting during the Spotlight Round pauses the game until they return', () => {
    const { engine, ids } = setup();
    const [one, ben, cy, dee] = ids;
    engine.startGame(one);
    engine.openQuestion();
    answerAll(engine, { [ben]: 1, [cy]: 1, [dee]: 1 });
    engine.showToOne();
    engine.setConnected(one, false);
    expect(engine.session.paused).toBe(true);
    engine.setConnected(one, true);
    expect(engine.session.paused).toBe(false);
  });

  test('Nickname rules', () => {
    expect(nicknameProblem('', [])).not.toBeNull();
    expect(nicknameProblem('Ana', ['ana'])).toContain('Ana 2');
    expect(nicknameProblem('stupid head', [])).not.toBeNull();
    expect(nicknameProblem('Ana', [])).toBeNull();
  });
});

describe('Champion with no student devices', () => {
  function noDevices(settings: Partial<Settings> = {}) {
    let now = 1_000_000;
    const clock = { now: () => now, random: () => 0.5 };
    const engine = new Engine(
      createSession({ code: 'ABC234', setTitle: 'Test', questions, settings: { questionsPerGame: 3, strikes: 2, ...settings }, noDevices: true, clock }),
      clock,
    );
    const ok = (result: { ok: boolean; message?: string }) => expect(result).toEqual({ ok: true });
    /** Plays one question: the champion looks away, the class votes, the champion answers. */
    const play = (classMajority: number | null, oneChoice: number) => {
      ok(engine.next());
      expect(buildView(engine.session, { now, pauseReason: null }).question?.prompt).toBeNull();
      ok(engine.showToClass());
      ok(classMajority === null ? engine.lock() : engine.classAnswer(classMajority));
      expect(engine.session.phase).toBe('PHASE_A_LOCKED');
      expect(buildView(engine.session, { now, pauseReason: null }).question?.prompt).toBeNull();
      ok(engine.showToOne());
      ok(engine.answerForOne(oneChoice));
      ok(engine.reveal());
    };
    return { engine, ok, play, advance: (ms: number) => (now += ms) };
  }

  test('a named champion plays the Class Majority: the pot grows more when the class was wrong', () => {
    const { engine, ok, play } = noDevices();
    ok(engine.startNamedRound('Ana'));
    expect(engine.session.players.map((p) => p.nickname)).toEqual(['The Class', 'Ana']);
    play(1, 1);
    expect(engine.session.game!.bank).toBe(100);
    play(0, 1);
    expect(engine.session.game!.bank).toBe(300);
    expect(engine.session.game!.reveal!.classMajority).toBe(0);
    play(null, 1);
    // Every question cleared: Ana banks the pot.
    expect(engine.session.game!.result).toMatchObject({ reason: 'deck_survived', bankedByOne: 400 });
    expect(engine.player(CLASS_ID)!.points).toBe(0);
    expect(engine.session.players.find((p) => p.nickname === 'Ana')!.points).toBe(400);
  });

  test('out of chances, The Class wins the pot; the next champion is named, and a name that returns keeps its points', () => {
    const { engine, ok, play } = noDevices();
    ok(engine.startNamedRound('Ana'));
    play(0, 1);
    play(1, 0);
    play(1, 2);
    expect(engine.session.game!.result).toMatchObject({ reason: 'flameout' });
    expect(engine.player(CLASS_ID)!.points).toBe(200);
    ok(engine.next());
    expect(engine.session.phase).toBe('LEADERBOARD');
    expect(engine.session.pendingNextOneId).toBeNull();
    ok(engine.startNamedRound('Ben'));
    expect(engine.session.players).toHaveLength(3);
    ok(engine.endGame());
    ok(engine.startNamedRound('ana'));
    expect(engine.session.players).toHaveLength(3);
    expect(engine.startNamedRound('  ').ok).toBe(false);
  });

  test('the timer is only a guide, and the class only votes once it has seen the question', () => {
    const { engine, ok, advance } = noDevices();
    ok(engine.startNamedRound('Ana'));
    ok(engine.openQuestion());
    expect(engine.session.game!.active!.deadline).toBeNull();
    expect(engine.classAnswer(1).ok).toBe(false);
    ok(engine.showToClass());
    advance(60_000);
    expect(engine.tick()).toBe(false);
    expect(engine.session.phase).toBe('PHASE_A');
  });

  test('lifelines: Poll shows the Class Majority, Go with the Class locks it in, Ask Two only marks itself used', () => {
    const { engine, ok } = noDevices();
    ok(engine.startNamedRound('Ana'));
    const one = engine.session.game!.oneId;
    const toChampion = (majority: number | null) => {
      ok(engine.showToClass());
      ok(majority === null ? engine.lock() : engine.classAnswer(majority));
      ok(engine.showToOne());
    };
    ok(engine.openQuestion());
    toChampion(2);
    ok(engine.helpPoll(one, 0));
    expect(engine.session.game!.active!.helpResult).toEqual({ type: 'majority', choice: 2 });
    ok(engine.answerForOne(1));
    ok(engine.reveal());
    ok(engine.next());
    toChampion(null);
    expect(engine.helpTrust(one).ok).toBe(false);
    ok(engine.helpAsk(one));
    expect(engine.session.game!.active!.helpResult).toEqual({ type: 'ask', speakers: [], bonusEach: 0 });
    expect(engine.session.game!.helpsUsed.ask).toBe(true);
    ok(engine.answerForOne(1));
    ok(engine.reveal());
    ok(engine.next());
    toChampion(0);
    ok(engine.helpTrust(one));
    expect(engine.session.game!.active!.oneAnswer).toBe(0);
    expect(engine.session.phase).toBe('ONE_LOCKED');
  });
});
