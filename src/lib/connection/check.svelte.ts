import { hosts, server } from '../peer';
import { judge, report, type Findings, type ServerTry, type Verdict } from './diagnose';

/**
 * Checks whether this computer's network is good for hosting: that it can
 * reach the matchmaking server (and not a filter's page in its place), open
 * the live connection a game keeps to it, and reach the relay students fall
 * back on. Runs once per page load and again when the computer comes back
 * online; the workspace's status light shows the answer.
 */

export const connection = $state<{
  running: boolean;
  findings: Findings | null;
  verdict: Verdict | null;
  report: string;
}>({ running: false, findings: null, verdict: null, report: '' });

const waitMs = 6000;
const errorText = (error: unknown) => (error instanceof Error ? `${error.name}: ${error.message}` : String(error));

async function tryServer(host: string): Promise<ServerTry> {
  const base = `${server.secure ? 'https' : 'http'}://${host}:${server.port}${server.path}`;
  let answer: string;
  try {
    const response = await fetch(`${base}/peerjs/id`, { cache: 'no-store', signal: AbortSignal.timeout(waitMs) });
    const text = (await response.text()).trim();
    // A filter's block page can also answer "OK", so check it really sent an address.
    answer = response.ok && /^[\w-]{8,}$/.test(text) ? 'ok' : response.ok ? 'filtered' : `answered ${response.status}`;
  } catch (error) {
    answer = errorText(error);
  }
  if (answer !== 'ok') return { host, answer };
  return { host, answer, live: await tryLive(base.replace(/^http/, 'ws')) };
}

/** Opens the live connection the way PeerJS does, waits for the server's welcome, then lets go. */
function tryLive(base: string): Promise<string> {
  return new Promise((resolve) => {
    const id = `classgauntlet-check-${crypto.randomUUID().slice(0, 8)}`;
    let socket: WebSocket;
    const done = (result: string) => {
      clearTimeout(timer);
      socket.onclose = socket.onerror = socket.onmessage = null;
      socket.close();
      resolve(result);
    };
    const timer = setTimeout(() => done(`no welcome after ${waitMs / 1000}s`), waitMs);
    try {
      socket = new WebSocket(`${base}/peerjs?key=peerjs&id=${id}&token=${crypto.randomUUID().slice(0, 8)}`);
    } catch (error) {
      clearTimeout(timer);
      return resolve(errorText(error));
    }
    socket.onmessage = (event) => {
      try {
        if (JSON.parse(String(event.data)).type === 'OPEN') done('ok');
      } catch {
        done('filtered (unexpected reply)');
      }
    };
    socket.onerror = () => done('blocked (the connection failed)');
    socket.onclose = (event) => done(`closed (code ${event.code})`);
  });
}

async function relayServers(): Promise<{ servers: RTCIceServer[]; logins: number | string }> {
  try {
    const response = await fetch('/api/turn', { cache: 'no-store', signal: AbortSignal.timeout(waitMs) });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { servers: [], logins: `none (answered ${response.status}${body.error ? `: ${body.error}` : ''})` };
    }
    const servers = (await response.json()).iceServers as RTCIceServer[];
    return { servers, logins: servers.flatMap((s) => [s.urls].flat()).length };
  } catch (error) {
    return { servers: [], logins: `none (${errorText(error)})` };
  }
}

/** Gathers the routes this device could offer a student, and what the relay said when it refused. */
async function tryRoutes(relay: RTCIceServer[]): Promise<Pick<Findings, 'routes' | 'relayErrors'>> {
  const routes = { host: 0, srflx: 0, relay: 0 };
  const relayErrors: string[] = [];
  if (typeof RTCPeerConnection === 'undefined') return { routes, relayErrors: ['This browser has no WebRTC.'] };
  const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, ...relay] });
  pc.addEventListener('icecandidate', (event) => {
    const type = event.candidate?.type;
    if (type && type in routes) routes[type as keyof typeof routes]++;
  });
  pc.addEventListener('icecandidateerror', (event) => {
    const { url, errorCode, errorText } = event as RTCPeerConnectionIceErrorEvent;
    const line = `${url} → ${errorCode} ${errorText}`.trim();
    if (url && !relayErrors.includes(line)) relayErrors.push(line);
  });
  pc.createDataChannel('check');
  await pc.setLocalDescription(await pc.createOffer());
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 8000);
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer);
        resolve();
      }
    });
  });
  pc.close();
  return { routes, relayErrors };
}

export async function checkConnection() {
  if (connection.running) return;
  connection.running = true;
  const online = navigator.onLine;
  const [servers, relay] = await Promise.all([Promise.all(hosts.map(tryServer)), relayServers()]);
  const findings: Findings = { online, servers, relayLogins: relay.logins, ...(await tryRoutes(relay.servers)) };
  const verdict = judge(findings);
  Object.assign(connection, {
    running: false,
    findings,
    verdict,
    report: report(findings, verdict, { when: new Date(), browser: navigator.userAgent }),
  });
}

let watching = false;

/** Checks now, unless this page already has, and again whenever the computer comes back online. */
export function watchConnection() {
  if (!connection.findings) void checkConnection();
  if (watching) return;
  watching = true;
  window.addEventListener('online', () => void checkConnection());
  window.addEventListener('offline', () => void checkConnection());
}
