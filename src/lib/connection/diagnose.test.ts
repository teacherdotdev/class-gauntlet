import { expect, test } from 'bun:test';
import { judge, report, type Findings } from './diagnose';

const fine: Findings = {
  online: true,
  servers: [
    { host: 'peer.classgauntlet.com', answer: 'ok', live: 'ok' },
    { host: 'peer.teacher.dev', answer: 'ok', live: 'ok' },
  ],
  relayLogins: 9,
  routes: { host: 1, srflx: 1, relay: 4 },
  relayErrors: [],
};

test('a network that reaches matchmaking and the relay is good', () => {
  expect(judge(fine)).toMatchObject({ level: 'good', code: 'OK' });
});

test('one matchmaking name getting through is enough', () => {
  const servers = [{ host: 'peer.classgauntlet.com', answer: 'ok', live: 'ok' }, { host: 'peer.teacher.dev', answer: 'TypeError: Failed to fetch' }];
  expect(judge({ ...fine, servers }).level).toBe('good');
});

test('students can’t join when no live connection opens, and the code says why', () => {
  const no = (answer: string, live?: string) => judge({ ...fine, servers: [{ host: 'peer.classgauntlet.com', answer, live }] });
  expect(no('TypeError: Failed to fetch')).toMatchObject({ level: 'bad', code: 'SERVER-BLOCKED' });
  expect(no('filtered')).toMatchObject({ level: 'bad', code: 'FILTERED' });
  expect(no('ok', 'blocked (the connection failed)')).toMatchObject({ level: 'bad', code: 'LIVE-BLOCKED' });
  expect(judge({ ...fine, online: false }).code).toBe('OFFLINE');
});

test('a blocked relay still lets the teacher host, with a warning', () => {
  expect(judge({ ...fine, relayLogins: 'none (answered 503: Relay is not set up)' })).toMatchObject({ level: 'partial', code: 'NO-RELAY' });
  expect(judge({ ...fine, routes: { host: 1, srflx: 1, relay: 0 } })).toMatchObject({ level: 'partial', code: 'RELAY-BLOCKED' });
});

test('the report lists each step, without network addresses', () => {
  const findings: Findings = {
    ...fine,
    servers: [{ host: 'peer.classgauntlet.com', answer: 'ok', live: 'closed (code 1006)' }],
    routes: { host: 2, srflx: 0, relay: 0 },
    relayErrors: ['turn:turn.classgauntlet.com:3478?transport=udp → 701 TURN host lookup received error.'],
  };
  const text = report(findings, judge(findings), { when: new Date('2026-10-13T15:00:00Z'), browser: 'Chrome' });
  expect(text).toBe(
    [
      'Class Gauntlet connection report (LIVE-BLOCKED)',
      'Problem: The matchmaking server answers, but the network stops the live connection a game needs.',
      'When: 2026-10-13T15:00:00.000Z',
      'Browser: Chrome',
      'Online: yes',
      'Matchmaking server:',
      '  peer.classgauntlet.com: answer ok, live connection closed (code 1006)',
      'Relay logins: 9 addresses',
      'Routes this device found: host 2',
      'Relay errors:',
      '  turn:turn.classgauntlet.com:3478?transport=udp → 701 TURN host lookup received error.',
    ].join('\n'),
  );
});
