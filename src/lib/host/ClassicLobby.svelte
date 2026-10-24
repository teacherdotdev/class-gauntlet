<script lang="ts">
  // Classic's waiting room: where to join, who's here, and the rules behind
  // the gear (remembered for the next game). On the Big Screen nobody joins,
  // so it just says how a class review goes.
  import Avatar from '../components/Avatar.svelte';
  import { host } from '../host.svelte';
  import { plural } from '../words';
  import { Settings } from '@lucide/svelte';
  import JoinBanner from './JoinBanner.svelte';
  import { classicRules, saveClassicRules } from './setup';

  const s = $derived(host.classic!);
  let menuFor = $state('');
  let dialog: HTMLDialogElement;
  let timerSeconds = $state(20);
  let scoring = $state(false);

  function openRules() {
    ({ timerSeconds, scoring } = s.settings);
    dialog.showModal();
  }

  function saveRules(event: SubmitEvent) {
    event.preventDefault();
    if (host.runClassic((e) => e.updateSettings({ timerSeconds, scoring }))) {
      saveClassicRules({ ...classicRules(), timerSeconds, scoring });
      dialog.close();
    }
  }
</script>

<div class="lobby">
  {#if !s.bigScreen}<JoinBanner />{/if}

  <div class="bar">
    <button class="icon-btn" onclick={openRules} aria-label="Rules" title="Rules"><Settings size={22} /></button>
    {#if !s.bigScreen}<span class="count"><strong>{s.players.length}</strong> {s.players.length === 1 ? 'player' : 'players'}</span>{/if}
    <span class="title">Classic · {s.title} · {plural(s.questions.length, 'question')}</span>
    <button class="start" disabled={!s.players.length && !s.bigScreen} onclick={() => host.runClassic((e) => e.start())}>Start</button>
  </div>
  {#if host.notice}<p class="notice" role="alert">{host.notice}</p>{/if}

  {#if s.bigScreen}
    <div class="big-screen">
      <h1>Class review</h1>
      <p>Each question goes up with a timer. The class answers on mini whiteboards or with their hands, and you show the answer when everyone’s ready.</p>
    </div>
  {/if}
  <ul class="players">
    {#each s.players as p (p.id)}
      <li class:away={!p.connected}>
        <button class="chip" onclick={() => (menuFor = menuFor === p.id ? '' : p.id)} aria-expanded={menuFor === p.id}>
          <Avatar name={p.nickname} size={30} />
          <span>{p.nickname}</span>
        </button>
        {#if menuFor === p.id}
          <div class="menu">
            <button class="danger" onclick={() => { host.kick(p.id); menuFor = ''; }}>Remove</button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
  {#if !s.players.length && !s.bigScreen}<p class="waiting">Waiting for players…</p>{/if}
</div>

<dialog bind:this={dialog} aria-labelledby="classic-rules-title">
  <form onsubmit={saveRules}>
    <h2 id="classic-rules-title">Rules</h2>
    <label class="field">Seconds to answer <input type="number" min="5" max="120" bind:value={timerSeconds} /></label>
    {#if !s.bigScreen}<label class="check"><input type="checkbox" bind:checked={scoring} /> <span><strong>Keep score</strong>: points for right answers, more for quick ones</span></label>{/if}
    <p class="hint">Your next game starts with these too.</p>
    <div class="actions">
      <button type="button" class="btn-quiet" onclick={() => dialog.close()}>Cancel</button>
      <button class="btn-primary">Save</button>
    </div>
  </form>
</dialog>

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
    font-size: 1.4rem;
    cursor: pointer;
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
  .start:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .notice {
    text-align: center;
    color: var(--amber-strong);
  }
  .players {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem;
  }
  li {
    position: relative;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.9rem 0.3rem 0.3rem;
    border-radius: 999px;
    border: 0;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }
  .away {
    opacity: 0.5;
  }
  .menu {
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 0;
    z-index: 5;
    padding: 0.35rem;
    background: var(--paper);
    border-radius: 10px;
    box-shadow: var(--shadow-dialog);
  }
  .menu button {
    font: inherit;
    padding: 0.5rem 0.75rem;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--bad);
    cursor: pointer;
  }
  .big-screen {
    flex: 1;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 1rem;
    text-align: center;
  }
  .big-screen h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.6rem, 6vw, 4.4rem);
  }
  .big-screen p {
    max-width: 40rem;
    font-size: 1.3rem;
    color: rgb(255 250 243 / 0.75);
  }
  .waiting {
    text-align: center;
    font-family: var(--display);
    font-size: 2.2rem;
    opacity: 0.85;
  }
  form {
    display: grid;
    gap: 0.8rem;
    min-width: min(24rem, 80vw);
  }
  h2 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 2rem;
  }
  .check {
    display: flex;
    gap: 0.6rem;
    align-items: baseline;
  }
  .hint {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>
