<script lang="ts">
  // The waiting room, on the projector: where to go, the PIN, a QR code, and
  // everyone who has joined. Tap a name to choose the first champion or to
  // remove them.
  import Avatar from '../components/Avatar.svelte';
  import Gauntlet from '../components/Gauntlet.svelte';
  import { host } from '../host.svelte';
  import { Settings } from '@lucide/svelte';
  import JoinBanner from './JoinBanner.svelte';

  let { onsettings }: { onsettings: () => void } = $props();

  const s = $derived(host.session!);
  const players = $derived(s.players);
  let menuFor = $state('');

  function choose(id: string) {
    host.run((e) => e.chooseNextOne(s.pendingNextOneId === id ? null : id));
    menuFor = '';
  }
</script>

<div class="lobby">
  <JoinBanner />

  <div class="bar">
    <button class="icon-btn" onclick={onsettings} aria-label="Settings" title="Settings">
      <Settings size={22} />
    </button>
    <span class="count"><strong>{players.length}</strong> {players.length === 1 ? 'player' : 'players'}</span>
    <span class="title">{s.setTitle}</span>
    <button class="start" disabled={players.length < 2} onclick={() => host.run((e) => e.startGame())}>
      Start
    </button>
  </div>

  {#if players.length === 0}
    <div class="empty">
      <Gauntlet size={170} />
      <p>Waiting for players…</p>
    </div>
  {:else}
    <ul class="players">
      {#each players as p (p.id)}
        <li class:away={!p.connected} class:picked={s.pendingNextOneId === p.id}>
          <button class="chip" onclick={() => (menuFor = menuFor === p.id ? '' : p.id)} aria-expanded={menuFor === p.id}>
            <Avatar name={p.nickname} size={34} />
            <span>{p.nickname}</span>
            {#if s.pendingNextOneId === p.id}<span class="badge" title="Goes first">⚔</span>{/if}
          </button>
          {#if menuFor === p.id}
            <div class="menu">
              <button onclick={() => choose(p.id)}>{s.pendingNextOneId === p.id ? 'Let the spotlight choose' : 'Make them the champion'}</button>
              <button class="danger" onclick={() => { host.kick(p.id); menuFor = ''; }}>Remove</button>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
    <p class="hint">
      {players.length < 2 ? 'You need at least two players.' : s.pendingNextOneId ? '' : 'When you start, the spotlight picks the first champion. Tap a name to choose instead.'}
    </p>
  {/if}
</div>

<style>
  .lobby {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem clamp(1rem, 3vw, 2.5rem) 2rem;
    color: var(--paper);
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .icon-btn {
    display: grid;
    place-items: center;
    width: 3rem;
    height: 3rem;
    border-radius: 12px;
    border: 1px solid rgb(255 250 243 / 0.25);
    background: rgb(255 250 243 / 0.08);
    color: var(--paper);
    cursor: pointer;
  }
  .icon-btn:hover {
    background: rgb(255 250 243 / 0.18);
  }
  .count {
    font-size: 1.2rem;
    background: rgb(255 250 243 / 0.1);
    padding: 0.5rem 1rem;
    border-radius: 999px;
  }
  .count strong {
    font-family: var(--display);
    font-weight: 400;
    font-size: 1.6rem;
  }
  .title {
    flex: 1;
    text-align: center;
    color: rgb(255 250 243 / 0.6);
    font-family: var(--serif);
    font-style: italic;
  }
  .start {
    font: inherit;
    font-weight: 800;
    font-size: 1.3rem;
    padding: 0.8rem 2.4rem;
    border-radius: 12px;
    border: none;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
    box-shadow: inset 0 -5px 0 rgb(0 0 0 / 0.18);
  }
  .start:hover:not(:disabled) {
    background: #fff;
  }
  .start:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .empty {
    flex: 1;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 1rem;
    opacity: 0.85;
  }
  .empty p {
    font-family: var(--display);
    font-size: 2.2rem;
  }
  .players {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    align-content: flex-start;
  }
  li {
    position: relative;
    animation: pop 0.35s both;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.35rem 1.1rem 0.35rem 0.35rem;
    border-radius: 999px;
    border: 2px solid transparent;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-weight: 800;
    font-size: 1.15rem;
    cursor: pointer;
  }
  .chip:hover {
    text-decoration: line-through;
    text-decoration-color: rgb(51 42 36 / 0.25);
  }
  .picked .chip {
    border-color: var(--amber-strong);
    box-shadow: 0 0 0 4px rgb(240 210 124 / 0.35);
  }
  .badge {
    color: var(--accent);
  }
  .away {
    opacity: 0.5;
  }
  .menu {
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    display: grid;
    min-width: 13rem;
    padding: 0.35rem;
    background: var(--paper);
    border-radius: 10px;
    box-shadow: var(--shadow-dialog);
  }
  .menu button {
    text-align: left;
    background: none;
    border: none;
    padding: 0.55rem 0.75rem;
    border-radius: 6px;
    font: inherit;
    color: var(--ink);
    cursor: pointer;
  }
  .menu button:hover {
    background: var(--paper-low);
  }
  .menu .danger {
    color: var(--bad);
  }
  .hint {
    text-align: center;
    color: rgb(255 250 243 / 0.6);
  }
  @media (max-width: 52rem) {
    .title {
      display: none;
    }
  }
</style>
