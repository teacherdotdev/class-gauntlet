/**
 * What the connection check found, judged: whether this network is good for
 * hosting, a short code for the likeliest cause, and a plain-text report a
 * teacher can copy into an email (the way Happy Hallways does it).
 *
 * The report never includes network addresses or relay logins: only names,
 * counts, states and error messages.
 */

/** How one matchmaking server name fared. */
export type ServerTry = {
  host: string;
  /** Asking it for a spare address: 'ok', 'filtered' (something else answered), or the error. */
  answer: 'ok' | 'filtered' | string;
  /** Opening the live connection a game needs: 'ok', or the error. Not tried when it didn't answer. */
  live?: 'ok' | string;
};

export type Findings = {
  online: boolean;
  servers: ServerTry[];
  /** How many relay addresses /api/turn handed out, or why it didn't. */
  relayLogins: number | string;
  /** Routes this device found: its own address, the address the internet sees, and through the relay. */
  routes: { host: number; srflx: number; relay: number };
  relayErrors: string[];
};

export type Verdict = {
  /** good: ready to host. partial: hosting works, but students on strict networks may not get through. bad: students can't join. */
  level: 'good' | 'partial' | 'bad';
  code: 'OK' | 'OFFLINE' | 'FILTERED' | 'SERVER-BLOCKED' | 'LIVE-BLOCKED' | 'NO-RELAY' | 'RELAY-BLOCKED';
  headline: string;
  advice: string;
};

export function judge(f: Findings): Verdict {
  if (!f.online)
    return {
      level: 'bad',
      code: 'OFFLINE',
      headline: 'This computer is offline.',
      advice: 'Connect to Wi-Fi or a network cable, then check again.',
    };
  if (!f.servers.some((s) => s.live === 'ok')) {
    if (f.servers.some((s) => s.answer === 'ok'))
      return {
        level: 'bad',
        code: 'LIVE-BLOCKED',
        headline: 'The matchmaking server answers, but the network stops the live connection a game needs.',
        advice: 'Ask your school’s IT team to allow WebSocket (wss) connections to peer.classgauntlet.com on port 443.',
      };
    if (f.servers.some((s) => s.answer === 'filtered'))
      return {
        level: 'bad',
        code: 'FILTERED',
        headline: 'A web filter is answering in place of the matchmaking server.',
        advice: 'Ask your school’s IT team to allow peer.classgauntlet.com, including WebSocket (wss) connections on port 443.',
      };
    return {
      level: 'bad',
      code: 'SERVER-BLOCKED',
      headline: 'This network can’t reach the matchmaking server, so students can’t join.',
      advice: 'Ask your school’s IT team to allow peer.classgauntlet.com, including WebSocket (wss) connections on port 443.',
    };
  }
  if (typeof f.relayLogins === 'string' || f.relayLogins === 0)
    return {
      level: 'partial',
      code: 'NO-RELAY',
      headline: 'Ready to host, but this computer couldn’t get logins for the relay.',
      advice: 'Students on the same network usually still connect. If some can’t, reload and check again, then send us the report.',
    };
  if (f.routes.relay === 0)
    return {
      level: 'partial',
      code: 'RELAY-BLOCKED',
      headline: 'Ready to host, but the network blocks the relay.',
      advice:
        'Students usually still connect directly. If some can’t, ask your IT team to allow turn.classgauntlet.com (UDP 3478 and TCP 80) and turn.cloudflare.com (TCP 443).',
    };
  return { level: 'good', code: 'OK', headline: 'Ready to host. Students can join.', advice: '' };
}

const describe = (counts: Record<string, number>) =>
  Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => `${kind} ${count}`)
    .join(', ') || 'none';

export function report(f: Findings, verdict: Verdict, extra: { when: Date; browser: string }): string {
  const lines = [
    `Class Gauntlet connection report (${verdict.code})`,
    `Problem: ${verdict.headline}`,
    `When: ${extra.when.toISOString()}`,
    `Browser: ${extra.browser}`,
    `Online: ${f.online ? 'yes' : 'no'}`,
    'Matchmaking server:',
    ...f.servers.map((s) => `  ${s.host}: answer ${s.answer}${s.live ? `, live connection ${s.live}` : ''}`),
    `Relay logins: ${typeof f.relayLogins === 'number' ? `${f.relayLogins} addresses` : f.relayLogins}`,
    `Routes this device found: ${describe(f.routes)}`,
  ];
  if (f.relayErrors.length) lines.push('Relay errors:', ...f.relayErrors.slice(0, 8).map((line) => `  ${line}`));
  return lines.join('\n');
}
