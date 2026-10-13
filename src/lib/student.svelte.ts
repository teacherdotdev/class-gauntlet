import type { DataConnection, Peer } from 'peerjs';
import { createPeer, keepAlive, roomPrefix } from './peer';
import type { Help } from './game/types';
import type { ClassicView } from './game/classic/views';
import type { PerilView } from './game/peril/views';
import type { View } from './game/views';
import type { HostMessage, StudentMessage } from './protocol';
import { receivePicture } from './rich/pictures.svelte';

/**
 * A student's device. It dials the teacher's tab by room code, introduces
 * itself, and from then on just shows whatever view the teacher's tab sends.
 * Its seat (player id + secret) is kept in local storage, so a reload, a
 * dropped Wi-Fi connection or a locked phone puts the student right back in
 * with their points.
 */

type Seat = { playerId: string; secret: string; nickname: string };

const seatKey = (code: string) => `classgauntlet:seat:${code}`;

function loadSeat(code: string): Seat | null {
  try {
    return JSON.parse(localStorage.getItem(seatKey(code)) ?? 'null') as Seat | null;
  } catch {
    return null;
  }
}

function saveSeat(code: string, seat: Seat | null) {
  try {
    if (seat) localStorage.setItem(seatKey(code), JSON.stringify(seat));
    else localStorage.removeItem(seatKey(code));
  } catch {
    /* storage blocked: the student just can't rejoin after a reload */
  }
}

export type PlayerStatus =
  | 'idle'
  | 'connecting'
  /** In the game and live. */
  | 'playing'
  /** Was in the game; trying to get back to the teacher's tab. */
  | 'reconnecting'
  | 'denied'
  | 'removed';

class StudentLink {
  status = $state<PlayerStatus>('idle');
  code = $state('');
  nickname = $state('');
  view = $state.raw<View | null>(null);
  perilView = $state.raw<PerilView | null>(null);
  classicView = $state.raw<ClassicView | null>(null);
  /** When the class's answers lock (Peril!: when the running clock ends), on this device's clock. */
  deadline = $state<number | null>(null);
  problem = $state('');
  notice = $state('');
  /** Set after a few seconds of trying, to suggest checking the code. */
  slow = $state(false);

  #peer: Peer | null = null;
  #connection: DataConnection | null = null;
  #retry = 0;
  #slowTimer = 0;
  #noticeTimer = 0;
  #joinedOnce = false;

  savedSeat(code: string) {
    return loadSeat(code);
  }

  /** Joins (or rejoins) the room with this code. */
  async join(code: string, nickname: string) {
    this.leaveQuietly();
    this.code = code;
    this.nickname = nickname.trim() || loadSeat(code)?.nickname || '';
    this.problem = '';
    this.slow = false;
    this.#joinedOnce = !!loadSeat(code);
    this.status = this.#joinedOnce ? 'reconnecting' : 'connecting';
    clearTimeout(this.#slowTimer);
    this.#slowTimer = window.setTimeout(() => {
      if (this.status === 'connecting' || this.status === 'reconnecting') this.slow = true;
    }, 8000);

    const peer = await createPeer();
    if (this.code !== code) {
      peer.destroy();
      return;
    }
    this.#peer = peer;
    peer.on('open', () => this.#dial());
    peer.on('error', (error) => {
      if (this.#peer !== peer) return;
      if (error.type === 'peer-unavailable') {
        if (this.#joinedOnce) {
          // The teacher's tab may be reloading; keep trying quietly.
          this.status = 'reconnecting';
        } else {
          this.status = 'denied';
          this.problem = 'No game with that code is open. Check the code on the board.';
          this.leaveQuietly(false);
        }
      } else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(error.type)) {
        if (this.status === 'playing') this.status = 'reconnecting';
        this.problem = 'Can’t reach the internet. Still trying…';
      } else if (error.type === 'browser-incompatible') {
        this.status = 'denied';
        this.problem = 'This browser can’t join. Try Chrome, Safari, Edge or Firefox.';
      }
    });
    clearInterval(this.#retry);
    this.#retry = window.setInterval(() => {
      if (this.status === 'reconnecting' && !this.#connection?.open) this.#dial();
    }, 4000);
  }

  #dial() {
    const peer = this.#peer;
    if (!peer || peer.destroyed || peer.disconnected) return;
    this.#connection?.close();
    const connection = peer.connect(roomPrefix + this.code, { reliable: true });
    this.#connection = connection;
    connection.on('open', () => {
      keepAlive(connection);
      const seat = loadSeat(this.code);
      this.#send({
        type: 'hello',
        nickname: this.nickname,
        ...(seat ? { playerId: seat.playerId, secret: seat.secret } : {}),
      });
    });
    connection.on('data', (data) => {
      if (this.#connection === connection) this.#receive(data as HostMessage);
    });
    connection.on('close', () => {
      if (this.#connection !== connection) return;
      this.#connection = null;
      if (this.status === 'playing' || this.status === 'connecting') {
        this.status = 'reconnecting';
        this.#joinedOnce = true;
      }
    });
  }

  #receive(message: HostMessage) {
    switch (message.type) {
      case 'welcome':
        saveSeat(this.code, { playerId: message.playerId, secret: message.secret, nickname: message.nickname });
        this.nickname = message.nickname;
        this.#joinedOnce = true;
        this.status = 'playing';
        this.problem = '';
        this.slow = false;
        break;
      case 'picture': {
        const bytes = message.bytes instanceof Uint8Array ? message.bytes.slice().buffer : message.bytes;
        receivePicture({ hash: message.hash, type: message.mime, bytes });
        break;
      }
      case 'view': {
        const view = message.view;
        const remainingMs = view.mode === 'peril' ? view.open?.remainingMs : view.question?.remainingMs;
        this.view = view.mode === 'champion' ? view : null;
        this.perilView = view.mode === 'peril' ? view : null;
        this.classicView = view.mode === 'classic' ? view : null;
        this.deadline = remainingMs != null ? Date.now() + remainingMs : null;
        if (view.phase === 'ENDED') saveSeat(this.code, null);
        break;
      }
      case 'denied':
        if (message.forget) {
          // The saved seat is from an old game; try again as a new player if we have a name.
          saveSeat(this.code, null);
          if (this.nickname) {
            this.#send({ type: 'hello', nickname: this.nickname });
            return;
          }
        }
        this.status = 'denied';
        this.problem = message.message;
        this.#joinedOnce = false;
        this.leaveQuietly(false);
        break;
      case 'notice':
        this.notice = message.message;
        clearTimeout(this.#noticeTimer);
        this.#noticeTimer = window.setTimeout(() => (this.notice = ''), 4000);
        break;
      case 'removed':
        saveSeat(this.code, null);
        this.status = 'removed';
        this.leaveQuietly(false);
        break;
    }
  }

  #send(message: StudentMessage) {
    if (this.#connection?.open) this.#connection.send(message);
  }

  answer(choice: number) {
    const attemptId = this.view?.question?.attemptId;
    if (attemptId) this.#send({ type: 'answer', attemptId, choice });
  }

  oneAnswer(choice: number) {
    const attemptId = this.view?.question?.attemptId;
    if (attemptId) this.#send({ type: 'one-answer', attemptId, choice });
  }

  help(help: Help, choice?: number) {
    this.#send({ type: 'help', help, ...(choice === undefined ? {} : { choice }) });
  }

  buzz() {
    this.#send({ type: 'buzz' });
  }

  vote(choice: number) {
    this.#send({ type: 'vote', choice });
  }

  wager(amount: number) {
    this.#send({ type: 'wager', amount });
  }

  pick(column: number, row: number) {
    this.#send({ type: 'pick', column, row });
  }

  classicAnswer(choice: number) {
    this.#send({ type: 'classic-answer', choice });
  }

  chooseTeam(teamId: string) {
    this.#send({ type: 'choose-team', teamId });
  }

  /** Leaves the game for good: the teacher's roster drops this student. */
  leave() {
    this.#send({ type: 'leave' });
    saveSeat(this.code, null);
    setTimeout(() => this.leaveQuietly(), 200);
  }

  /** Hangs up without telling the teacher (e.g. joining a different game). */
  leaveQuietly(resetStatus = true) {
    clearInterval(this.#retry);
    clearTimeout(this.#slowTimer);
    this.#connection?.close();
    this.#connection = null;
    this.#peer?.destroy();
    this.#peer = null;
    if (resetStatus) {
      this.status = 'idle';
      this.view = null;
      this.perilView = null;
      this.classicView = null;
    }
  }
}

export const student = new StudentLink();
