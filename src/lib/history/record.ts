import { reportOf } from '../game/classic/engine';
import type { ClassicSession } from '../game/classic/types';
import { standings } from '../game/engine';
import type { PerilSession } from '../game/peril/types';
import { buildPerilView } from '../game/peril/views';
import type { Session } from '../game/types';

/**
 * One finished Session, as History keeps it: when, which Game Mode, and how
 * everyone placed. Students are known only by the nickname they played under.
 */
export type GameRecord = {
  id: string;
  mode: 'champion' | 'peril' | 'classic';
  title: string;
  startedAt: number;
  endedAt: number;
  /** Played on the Big Screen. Absent in records from before it existed. */
  bigScreen?: boolean;
  /** Empty unless the game was played in Teams. */
  teams: { name: string; rank: number; points: number }[];
  /** In Teams, a student's rank and points are their Team's. In unscored Classic, points are right answers. */
  players: { nickname: string; rank: number; points: number; team: string | null }[];
};

export function recordOf(session: Session | PerilSession | ClassicSession, endedAt: number): GameRecord {
  const base = {
    id: `${session.code}-${session.createdAt}`,
    startedAt: session.createdAt,
    endedAt,
    ...(session.bigScreen ? { bigScreen: true } : {}),
  };
  if (session.mode === 'classic') {
    const rows = reportOf(session).students.map((s) => ({ nickname: s.nickname, points: session.settings.scoring ? s.points : s.correct }));
    rows.sort((a, b) => b.points - a.points || a.nickname.localeCompare(b.nickname));
    return {
      ...base,
      mode: 'classic',
      title: session.title,
      teams: [],
      players: rows.map((row) => ({ ...row, rank: rows.findIndex((r) => r.points === row.points) + 1, team: null })),
    };
  }
  if (session.mode !== 'peril') {
    return {
      ...base,
      mode: 'champion',
      title: session.setTitle,
      teams: [],
      players: standings(session.players).map((row) => ({ nickname: row.nickname, rank: row.rank, points: row.points, team: null })),
    };
  }
  const table = buildPerilView(session, { now: endedAt }).standings;
  const teamOf = (teamId: string | null) => session.teams.find((team) => team.id === teamId)?.name ?? null;
  return {
    ...base,
    mode: 'peril',
    title: 'Peril!',
    teams: session.teams.length ? table.map(({ name, rank, points }) => ({ name, rank, points })) : [],
    players: session.teams.length
      ? table.flatMap((row) =>
          session.players
            .filter((p) => teamOf(p.teamId) === row.name)
            .map((p) => ({ nickname: p.nickname, rank: row.rank, points: row.points, team: row.name })),
        )
      : table.map(({ name, rank, points }) => ({ nickname: name, rank, points, team: null })),
  };
}
