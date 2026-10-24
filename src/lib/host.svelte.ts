import type { DataConnection, Peer } from 'peerjs';
import { createPeer, keepAlive, roomPrefix } from './peer';
import { createSession, Engine, type Result } from './game/engine';
import { ClassicEngine, createClassicSession } from './game/classic/engine';
import type { ClassicSession, ClassicSettings } from './game/classic/types';
import { buildClassicView, type ClassicView } from './game/classic/views';
import { createPerilSession, PerilEngine } from './game/peril/engine';
import type { PerilSession, PerilSettings } from './game/peril/types';
import { buildPerilView, type PerilView } from './game/peril/views';
import { toBoard, type BoardDraft } from './game/peril/draft';
import type { Question, Session, Settings } from './game/types';
import { buildView, type View } from './game/views';
import { recordOf } from './history/record';
import { gameHistory } from './history/store.svelte';
import { library } from './questions/store.svelte';
import { joinUrl, newRoomCode, type HostMessage, type StudentMessage } from './protocol';
import { pictureFile } from './rich/pictures.svelte';
import { picturesIn } from './rich/text';

/**
 * The teacher's tab is the game. It holds a room address on the matchmaking
 * server, accepts a direct connection from each student, runs the rules, and
 * sends every device the view it is allowed to see. The whole game is saved to
 * local storage after every change, so reloading the tab picks up where it was.
 * A Big Screen game never touches the network: nobody joins, and the teacher
 * enters every choice on this screen.
 */

const savedKey = 'classgauntlet:host';

type Saved = { session: Session | PerilSession | ClassicSession; kicked: string[] };

/** Any Game Mode's rules; they all share joining, leaving and the clock. */
type RoomEngine = Engine | PerilEngine | ClassicEngine;

export function savedGame(): Saved | null {
  try {
    const raw = localStorage.getItem(savedKey);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    return saved?.session?.version === 1 ? saved : null;
  } catch {
    return null;
  }
}

export function forgetSavedGame() {
  try {
    localStorage.removeItem(savedKey);
  } catch {
    /* storage blocked */
  }
}

export type RoomStatus =
  /** Registering the room code with the matchmaking server. */
  | 'opening'
  /** Students can join. */
  | 'open'
  /** After a reload the server still holds the old address for a short while. */
  | 'reclaiming'
  /** Lost the matchmaking server; students already connected keep playing. */
  | 'reconnecting'
  | 'failed'
  /** The teacher ended the game; the room is gone but the final standings stay up. */
  | 'closed'
  /** Played on the Big Screen: no room on the matchmaking server at all. */
  | 'local';

class HostRoom {
  /** Champion's rules, while a Champion Session runs. */
  engine: Engine | null = null;
  /** Peril!'s rules, while a Peril! Session runs. */
  perilEngine: PerilEngine | null = null;
  /** Classic's rules, while a Classic Session runs. */
  classicEngine: ClassicEngine | null = null;
  /** A copy of the session for the teacher's screens; replaced on every change. */
  session = $state.raw<Session | null>(null);
  peril = $state.raw<PerilSession | null>(null);
  classic = $state.raw<ClassicSession | null>(null);
  /** The public view, as the projector sees it. */
  view = $state.raw<View | null>(null);
  perilView = $state.raw<PerilView | null>(null);
  classicView = $state.raw<ClassicView | null>(null);
  status = $state<RoomStatus>('opening');
  problem = $state('');
  /** Last command the teacher tried that was not allowed. */
  notice = $state('');

  #peer: Peer | null = null;
  #connections = new Map<string, DataConnection>();
  #picturesSent = new WeakMap<DataConnection, Set<string>>();
  #ticker = 0;
  #reclaimTries = 0;
  #broadcastQueued = false;

  get #room(): RoomEngine | null {
    return this.engine ?? this.perilEngine ?? this.classicEngine;
  }

  /** True while either Game Mode has a room open. */
  get active() {
    return !!(this.session ?? this.peril ?? this.classic);
  }

  /** True while a Big Screen game is up. */
  get bigScreen() {
    return !!(this.session ?? this.peril ?? this.classic)?.bigScreen;
  }

  get joinUrl() {
    const code = (this.session ?? this.peril ?? this.classic)?.code;
    return code ? joinUrl(location.origin, code) : '';
  }

  /** Starts a new game room with the chosen questions. */
  create(input: { setTitle: string; questions: Question[]; settings: Partial<Settings>; bigScreen?: boolean }) {
    const session = createSession({ code: newRoomCode(), ...input });
    this.#start(new Engine(session));
  }

  /** Starts a Peril! room; the board the teacher built is dealt when they start. */
  createPeril(input: { settings: Partial<PerilSettings>; draft: BoardDraft; bigScreen?: boolean }) {
    const session = createPerilSession({ code: newRoomCode(), settings: input.settings, bigScreen: input.bigScreen });
    session.draft = input.draft;
    this.#start(new PerilEngine(session));
  }

  /** Starts a Classic room with the chosen questions. */
  createClassic(input: { title: string; questions: Question[]; settings: Partial<ClassicSettings>; bigScreen?: boolean }) {
    this.#start(new ClassicEngine(createClassicSession({ code: newRoomCode(), ...input })));
  }

  resume(saved: Saved) {
    const s = saved.session;
    const engine = s.mode === 'peril' ? new PerilEngine(s) : s.mode === 'classic' ? new ClassicEngine(s) : new Engine(s);
    for (const id of saved.kicked) engine.kicked.add(id);
    this.#start(engine);
  }

  #start(engine: RoomEngine) {
    this.close();
    if (engine instanceof PerilEngine) this.perilEngine = engine;
    else if (engine instanceof ClassicEngine) this.classicEngine = engine;
    else this.engine = engine;
    this.#reclaimTries = 0;
    this.#ticker = window.setInterval(() => this.#tick(), 200);
    this.#commit();
    if (engine.session.bigScreen) this.status = 'local';
    else void this.#open();
  }

  /**
   * The game moves itself along inside a question, so the teacher only taps
   * Next between questions: the class's timer runs out (or everyone answers),
   * a beat later the question swings to The One, and a drumroll after The One
   * locks in, the answer is revealed.
   */
  #phaseSeen = '';
  #phaseSince = 0;
  static readonly beats: Partial<Record<string, number>> = { PHASE_A_LOCKED: 2200, ONE_LOCKED: 2600 };

  #tick() {
    const other = this.perilEngine ?? this.classicEngine;
    if (other) {
      if (other.tick()) this.#commit();
      return;
    }
    const engine = this.engine;
    if (!engine) return;
    let changed = engine.tick();
    const phase = engine.session.phase;
    if (phase !== this.#phaseSeen) {
      this.#phaseSeen = phase;
      this.#phaseSince = Date.now();
    }
    // On the Big Screen the teacher says when the champion may look again.
    const beat = phase === 'PHASE_A_LOCKED' && engine.session.bigScreen ? undefined : HostRoom.beats[phase];
    if (beat !== undefined && Date.now() - this.#phaseSince >= beat) {
      const result = phase === 'PHASE_A_LOCKED' ? engine.showToOne() : engine.reveal();
      changed ||= result.ok;
    }
    if (changed) this.#commit();
  }

  async #open() {
    const engine = this.#room;
    if (!engine) return;
    this.status = this.#reclaimTries > 0 ? 'reclaiming' : 'opening';
    const peer = await createPeer(roomPrefix + engine.session.code);
    if (this.#room !== engine) {
      peer.destroy();
      return;
    }
    this.#peer = peer;
    peer.on('open', () => {
      this.status = 'open';
      this.problem = '';
      this.#reclaimTries = 0;
    });
    peer.on('disconnected', () => {
      if (this.#peer === peer) this.status = 'reconnecting';
    });
    peer.on('connection', (connection) => this.#accept(connection));
    peer.on('error', (error) => {
      if (this.#peer !== peer) return;
      if (error.type === 'unavailable-id') {
        // Either another game has this PIN, or the server still remembers this
        // tab from before a reload (it lets go within a minute). A game nobody
        // has joined yet just takes a new PIN; a game in progress keeps trying.
        peer.destroy();
        this.#peer = null;
        if (engine.session.players.length === 0 && engine.session.phase === 'LOBBY') {
          engine.session.code = newRoomCode();
          this.#commit();
          void this.#open();
          return;
        }
        this.#reclaimTries++;
        this.status = 'reclaiming';
        if (this.#reclaimTries > 40) {
          this.status = 'failed';
          this.problem = 'This room code is still in use by another tab. Close other copies of this page, or start a new room.';
          return;
        }
        setTimeout(() => void this.#open(), 3000);
      } else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(error.type)) {
        this.status = 'reconnecting';
        this.problem = 'Can’t reach the matchmaking server. Students already playing can keep going; new students can join once it’s back.';
      } else if (error.type === 'browser-incompatible') {
        this.status = 'failed';
        this.problem = 'This browser can’t host the game. Try Chrome, Edge, Firefox or Safari.';
      }
    });
  }

  #accept(connection: DataConnection) {
    let playerId: string | null = null;
    connection.on('open', () => keepAlive(connection));
    connection.on('data', (data) => {
      const message = data as StudentMessage;
      const engine = this.#room;
      if (!engine || !message || typeof message !== 'object') return;
      if (message.type === 'ping') return;
      if (message.type === 'hello') {
        const joined = engine.join({
          playerId: message.playerId,
          secret: message.secret,
          nickname: String(message.nickname ?? ''),
        });
        if (!joined.ok) {
          const forget = !!message.playerId && !engine.player(message.playerId);
          this.#send(connection, { type: 'denied', message: joined.message, forget });
          return;
        }
        playerId = joined.player.id;
        // One device per seat: a newer connection replaces an older one.
        const previous = this.#connections.get(playerId);
        this.#connections.set(playerId, connection);
        if (previous && previous !== connection) previous.close();
        this.#send(connection, {
          type: 'welcome',
          playerId,
          secret: joined.player.secret,
          nickname: joined.player.nickname,
        });
        this.#commit();
        return;
      }
      if (!playerId) return;
      if (message.type === 'leave') {
        engine.kick(playerId);
        this.#connections.delete(playerId);
        connection.close();
        this.#commit();
        return;
      }
      let result: Result;
      if (engine instanceof PerilEngine) {
        if (message.type === 'buzz') result = engine.buzz(playerId);
        else if (message.type === 'vote') result = engine.answer(playerId, Number(message.choice));
        else if (message.type === 'wager') result = engine.wager(playerId, Number(message.amount));
        else if (message.type === 'pick') result = engine.pickTile(Number(message.column), Number(message.row), playerId);
        else if (message.type === 'choose-team') result = engine.chooseTeam(playerId, String(message.teamId));
        else return;
      } else if (engine instanceof ClassicEngine) {
        if (message.type === 'classic-answer') result = engine.answer(playerId, Number(message.choice));
        else return;
      } else if (message.type === 'answer') result = engine.answer(playerId, message.attemptId, message.choice);
      else if (message.type === 'one-answer') result = engine.oneAnswer(playerId, message.attemptId, message.choice);
      else if (message.type === 'help')
        result =
          message.help === 'poll'
            ? engine.helpPoll(playerId, Number(message.choice))
            : message.help === 'ask'
              ? engine.helpAsk(playerId)
              : engine.helpTrust(playerId);
      else return;
      if (result.ok) this.#commit();
      else this.#send(connection, { type: 'notice', message: result.message });
    });
    connection.on('close', () => {
      if (!playerId || this.#connections.get(playerId) !== connection) return;
      this.#connections.delete(playerId);
      this.#room?.setConnected(playerId, false);
      this.#commit();
    });
    connection.on('error', () => connection.close());
  }

  #send(connection: DataConnection, message: HostMessage) {
    if (connection.open) connection.send(message);
  }

  /** Saves the game and, on the next tick, sends every screen its view. */
  #commit() {
    const engine = this.#room;
    if (!engine) return;
    if (engine instanceof PerilEngine) {
      this.peril = structuredClone(engine.session);
      this.perilView = buildPerilView(engine.session, { now: Date.now() });
    } else if (engine instanceof ClassicEngine) {
      this.classic = structuredClone(engine.session);
      this.classicView = buildClassicView(engine.session, { now: Date.now() });
    } else {
      this.session = structuredClone(engine.session);
      this.view = buildView(engine.session, { now: Date.now(), pauseReason: engine.pauseReason });
    }
    try {
      localStorage.setItem(savedKey, JSON.stringify({ session: engine.session, kicked: [...engine.kicked] } satisfies Saved));
    } catch {
      /* storage full or blocked: the game still runs */
    }
    if (this.#broadcastQueued) return;
    this.#broadcastQueued = true;
    queueMicrotask(() => {
      this.#broadcastQueued = false;
      this.#broadcast();
    });
  }

  /** Sends a device the pictures its view shows that it hasn't had yet. */
  #sendPictures(connection: DataConnection, view: unknown) {
    let sent = this.#picturesSent.get(connection);
    if (!sent) this.#picturesSent.set(connection, (sent = new Set()));
    for (const hash of picturesIn(view)) {
      if (sent.has(hash)) continue;
      sent.add(hash);
      void pictureFile(hash).then((file) => {
        if (file) this.#send(connection, { type: 'picture', hash, mime: file.type, bytes: file.bytes });
      });
    }
  }

  #broadcast() {
    const engine = this.#room;
    if (!engine) return;
    const now = Date.now();
    for (const [playerId, connection] of this.#connections) {
      const view =
        engine instanceof PerilEngine
          ? buildPerilView(engine.session, { now, viewerId: playerId })
          : engine instanceof ClassicEngine
            ? buildClassicView(engine.session, { now, viewerId: playerId })
            : buildView(engine.session, { now, pauseReason: engine.pauseReason, viewerId: playerId });
      this.#sendPictures(connection, view);
      this.#send(connection, { type: 'view', view });
    }
  }

  /** Runs a teacher command; shows its message if it wasn't allowed. */
  run(command: (engine: Engine) => Result): boolean {
    if (!this.engine) return false;
    const result = command(this.engine);
    this.notice = result.ok ? '' : result.message;
    if (result.ok) this.#commit();
    return result.ok;
  }

  /** Runs a Peril! teacher command, the same way. */
  runPeril(command: (engine: PerilEngine) => Result): boolean {
    if (!this.perilEngine) return false;
    const result = command(this.perilEngine);
    this.notice = result.ok ? '' : result.message;
    if (result.ok) this.#commit();
    return result.ok;
  }

  /** Runs a Classic teacher command, the same way. */
  runClassic(command: (engine: ClassicEngine) => Result): boolean {
    if (!this.classicEngine) return false;
    const result = command(this.classicEngine);
    this.notice = result.ok ? '' : result.message;
    if (result.ok) this.#commit();
    return result.ok;
  }

  /** Deals the Peril! board the teacher built and starts playing it. */
  dealPeril(draft: BoardDraft): boolean {
    const board = toBoard(draft, $state.snapshot(library.sorted), {
      treasureTrove: !!this.peril?.settings.treasureTrove,
      random: Math.random,
    });
    return this.runPeril((engine) => {
      const result = engine.startBoard(board);
      if (result.ok) engine.session.draft = draft;
      return result;
    });
  }

  #runAny(command: (engine: RoomEngine) => Result): boolean {
    return this.perilEngine ? this.runPeril(command) : this.classicEngine ? this.runClassic(command) : this.run(command);
  }

  kick(playerId: string) {
    const connection = this.#connections.get(playerId);
    if (this.#runAny((engine) => engine.kick(playerId)) && connection) {
      this.#connections.delete(playerId);
      this.#send(connection, { type: 'removed' });
      setTimeout(() => connection.close(), 300);
    }
  }

  /** Ends the room for good and lets the matchmaking server forget it. */
  finish() {
    const session = this.#room?.session;
    // Classic on the Big Screen has nobody to place; Peril!'s Teams there have no members.
    const placed = session?.players.length || (session?.mode === 'peril' && session.bigScreen && session.phase !== 'LOBBY');
    if (session && placed) gameHistory.add(recordOf(structuredClone(session), Date.now()));
    this.#runAny((engine) => engine.endSession());
    // Give the final standings a moment to reach every screen, then hang up.
    setTimeout(() => {
      forgetSavedGame();
      this.#hangUp();
      this.status = 'closed';
      this.problem = '';
    }, 1500);
  }

  #hangUp() {
    clearInterval(this.#ticker);
    for (const connection of this.#connections.values()) connection.close();
    this.#connections.clear();
    this.#peer?.destroy();
    this.#peer = null;
  }

  close() {
    this.#hangUp();
    this.engine = null;
    this.perilEngine = null;
    this.classicEngine = null;
    this.session = null;
    this.view = null;
    this.peril = null;
    this.perilView = null;
    this.classic = null;
    this.classicView = null;
  }
}

export const host = new HostRoom();
