import { expect, test } from 'bun:test';
import { createSession, Engine } from '../game/engine';
import { createPerilSession, PerilEngine } from '../game/peril/engine';
import { recordOf } from './record';

let seed = 9;
const clock = { now: () => 1_000, random: () => ((seed = (seed * 16807) % 2147483647) / 2147483647) };
const question = { id: 'q', prompt: 'Q', choices: ['a', 'b'], correct: 0 };

test('a Champion Session is remembered with its title and every student’s rank and points', () => {
  const engine = new Engine(createSession({ code: '111111', setTitle: 'Fractions', questions: [question], clock }), clock);
  for (const nickname of ['Ana', 'Ben']) engine.join({ nickname });
  engine.session.players[1].points = 30;
  expect(recordOf(engine.session, 61_000)).toEqual({
    id: '111111-1000',
    mode: 'champion',
    title: 'Fractions',
    startedAt: 1_000,
    endedAt: 61_000,
    teams: [],
    players: [
      { nickname: 'Ben', rank: 1, points: 30, team: null },
      { nickname: 'Ana', rank: 2, points: 0, team: null },
    ],
  });
});

test('a Peril! Session in Teams is remembered with Team standings and each student’s Team', () => {
  const engine = new PerilEngine(
    createPerilSession({ code: '222222', settings: { teams: { names: ['Wyverns', 'Griffins'], assign: 'auto' } }, clock }),
    clock,
  );
  for (const nickname of ['Ana', 'Ben']) engine.join({ nickname });
  engine.session.teams[1].points = 300;
  const record = recordOf(engine.session, 5_000);
  expect(record.mode).toBe('peril');
  expect(record.title).toBe('Peril!');
  expect(record.teams).toEqual([
    { name: 'Griffins', rank: 1, points: 300 },
    { name: 'Wyverns', rank: 2, points: 0 },
  ]);
  expect(record.players).toEqual([
    { nickname: 'Ben', rank: 1, points: 300, team: 'Griffins' },
    { nickname: 'Ana', rank: 2, points: 0, team: 'Wyverns' },
  ]);
});

test('a Classic Session is remembered with each student ranked by right answers (or points, when scored)', async () => {
  const { ClassicEngine, createClassicSession } = await import('../game/classic/engine');
  const engine = new ClassicEngine(createClassicSession({ code: '333333', title: 'Facts', questions: [question], clock }), clock);
  const ids = ['Ana', 'Ben'].map((nickname) => {
    const joined = engine.join({ nickname });
    if (!joined.ok) throw new Error(joined.message);
    return joined.player.id;
  });
  engine.start();
  engine.answer(ids[0], 1);
  engine.answer(ids[1], 0);
  const record = recordOf(engine.session, 9_000);
  expect(record).toMatchObject({ mode: 'classic', title: 'Facts', teams: [] });
  expect(record.players).toEqual([
    { nickname: 'Ben', rank: 1, points: 1, team: null },
    { nickname: 'Ana', rank: 2, points: 0, team: null },
  ]);
});
