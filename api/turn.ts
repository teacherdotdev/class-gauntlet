/**
 * Hands the browser short-lived logins for Cloudflare's relay (TURN) servers.
 * When a school network blocks a direct connection between two devices, the
 * encrypted data is passed through the relay instead; the relay can't read it.
 *
 * The long-lived Cloudflare token (TURN_KEY_ID, TURN_KEY_API_TOKEN) stays here
 * on the server; the browser only ever sees logins that expire on their own.
 * Runs as a Vercel function in production, and inside `vite dev` locally.
 */
const loginHours = 12;

/**
 * Our own names for Cloudflare's relay (DNS-only CNAMEs to turn.cloudflare.com),
 * for school filters that block the name turn.cloudflare.com. Cloudflare only
 * honours these for plain TURN over UDP and TCP; TLS (turns:) must keep its own
 * name. A filter that lets classgauntlet.com through likely lets its own name
 * through too; the others are shared with Happy Hallways.
 */
const ourRelayNames = ['turn.classgauntlet.com', 'turn.teacher.dev', 'turn.happyhallways.com'];

export async function GET(): Promise<Response> {
  const { TURN_KEY_ID, TURN_KEY_API_TOKEN } = process.env;
  if (!TURN_KEY_ID || !TURN_KEY_API_TOKEN)
    return Response.json({ error: 'Relay is not set up' }, { status: 503 });

  const response = await fetch(
    `https://rtc.live.cloudflare.com/v1/turn/keys/${TURN_KEY_ID}/credentials/generate-ice-servers`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TURN_KEY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ttl: loginHours * 60 * 60 }),
    },
  );
  if (!response.ok)
    return Response.json({ error: `Relay answered ${response.status}` }, { status: 502 });

  const { iceServers } = (await response.json()) as {
    iceServers: RTCIceServer[];
  };
  const servers = [iceServers].flat().map(withoutPort53);
  return Response.json(
    { iceServers: [...servers, ...servers.flatMap(underOurNames)] },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

/** Browsers refuse port 53 (it's reserved for DNS), so waiting on it only slows connecting. */
function withoutPort53(server: RTCIceServer): RTCIceServer {
  return {
    ...server,
    urls: [server.urls].flat().filter((url) => !/:53(\?|$)/.test(url)),
  };
}

/** The same relay logins again, with each plain TURN address under each of our own names. */
function underOurNames(server: RTCIceServer): RTCIceServer[] {
  const plainTurn = [server.urls].flat().filter((url) => url.startsWith('turn:turn.cloudflare.com'));
  if (plainTurn.length === 0) return [];
  return ourRelayNames.map((name) => ({
    ...server,
    urls: plainTurn.map((url) => url.replace('turn.cloudflare.com', name)),
  }));
}
