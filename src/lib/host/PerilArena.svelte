<script lang="ts">
  // Peril! on the projector: the Board of Tiles, then the open Tile with its
  // buzzers, and the standings when every Tile is played. The teacher can
  // pick a Tile for whoever has Control at any time. On the Big Screen the
  // teacher also taps the Team that buzzed, the answer it gave, and a
  // Treasure Trove's Wager.
  import Rich from '../rich/Rich.svelte';
  import AnswerBlock from '../components/AnswerBlock.svelte';
  import TimerRing from '../components/TimerRing.svelte';
  import { emptyDraft, onBoard } from '../game/peril/draft';
  import { host } from '../host.svelte';
  import { choiceOf, hostKey } from './keys';
  import { spacedCode } from '../protocol';
  import BoardBuilder from '../setup/BoardBuilder.svelte';
  import PerilRulesDialog from './PerilRulesDialog.svelte';

  const v = $derived(host.perilView!);
  const s = $derived(host.peril!);
  const open = $derived(v.open);
  const scores = $derived(
    v.solo
      ? v.roster.map((p) => ({ id: p.id, name: p.nickname, points: p.points }))
      : v.teams.map((t) => ({ id: t.id, name: t.name, points: t.points })),
  );
  const clockMs = $derived(
    v.phase === 'BUZZING'
      ? s.settings.buzzSeconds * 1000
      : v.phase === 'WAGERING'
        ? s.settings.wagerSeconds * 1000
        : (v.solo ? s.settings.answerSeconds : s.settings.voteSeconds) * 1000,
  );
  const running = $derived(['BUZZING', 'ANSWERING', 'WAGERING'].includes(v.phase) && s.open?.deadline != null);

  // Big Screen: what the Team with a Treasure Trove may wager.
  const maxWager = $derived(Math.max(v.teams.find((t) => t.id === s.open?.answering)?.points ?? 0, 500));
  let wagerAmount = $state(100);
  $effect(() => {
    if (v.phase === 'WAGERING') wagerAmount = Math.min(100, maxWager);
  });
  const wagers = $derived(
    [...new Set([5, Math.floor(maxWager / 4), Math.floor(maxWager / 2), maxWager])].filter((n) => n >= 5),
  );

  function onkeydown(event: KeyboardEvent) {
    const key = hostKey(event);
    if (!key) return;
    if (key.kind === 'next') {
      if (v.phase === 'READING') host.runPeril((e) => e.armBuzzers());
      else if (v.phase === 'REVEAL') host.runPeril((e) => e.next());
      else return;
    } else if (!v.bigScreen) return;
    else if (v.phase === 'BUZZING' && key.kind === 'number') {
      const team = v.teams[key.index];
      if (!team) return;
      host.runPeril((e) => e.buzzFor(team.id));
    } else if (v.phase === 'ANSWERING') {
      const choice = choiceOf(key, open?.choices?.length ?? 0);
      if (choice === null) return;
      host.runPeril((e) => e.answerFor(choice));
    } else return;
    event.preventDefault();
  }

  // Another board starts empty; the last one's questions have all been played.
  let building = $state(false);
  let draft = $state(emptyDraft());
  let rules: PerilRulesDialog;

  function deal() {
    if (host.dealPeril($state.snapshot(draft))) {
      building = false;
      draft = emptyDraft();
    }
  }

  const letters = ['A', 'B', 'C', 'D'];
</script>

<svelte:window {onkeydown} />

<div class="arena">
  <header class="top">
    {#if v.bigScreen}<span class="pin">Big Screen</span>{:else}<span class="pin">PIN <strong>{spacedCode(v.code)}</strong></span>{/if}
    <ol class="scores">
      {#each scores as c (c.id)}
        <li class:control={v.control?.id === c.id}>
          <span class="who">{c.name}</span>
          <strong class:neg={c.points < 0}>{c.points}</strong>
        </li>
      {/each}
    </ol>
    {#if v.phase !== 'ENDED'}<button class="quiet" onclick={() => host.finish()}>End game</button
      >{/if}
  </header>
  {#if host.notice}<p class="notice" role="alert">{host.notice}</p>{/if}

  {#if v.phase === 'BOARD'}
    <p class="banner">
      <strong>{v.control?.name ?? 'Someone'}</strong>
      {v.solo ? 'picks' : 'pick'} a tile
    </p>
    <div class="board" style="--cols: {v.board.length}">
      {#each v.board as column, c (c)}
        <div class="column">
          <h2>{column.title}</h2>
          {#each column.tiles as tile, r (r)}
            <button
              class="tile"
              style="grid-row: {tile.value / 100 + 1}"
              disabled={tile.played}
              onclick={() => host.runPeril((e) => e.pickTile(c, r))}
              aria-label="{column.title} for {tile.value}"
            >
              {tile.played ? '' : tile.value}
            </button>
          {/each}
        </div>
      {/each}
    </div>
  {:else if open}
    <section class="open" class:trove={open.treasureTrove}>
      <div class="head">
        <span class="worth"
          >{v.board[open.column]?.title} · {open.treasureTrove
            ? 'Treasure Trove!'
            : open.value}</span
        >
        {#if running}<TimerRing
            deadline={s.open?.deadline ?? null}
            totalMs={clockMs}
            size={96}
          />{/if}
      </div>

      {#if v.phase === 'WAGERING' && v.bigScreen}
        <h1 class="prompt">💰 Treasure Trove!</h1>
        <p class="status"><strong>{open.answering}</strong>, how much will you wager? (up to {maxWager})</p>
        <div class="team-picks">
          {#each wagers as amount (amount)}
            <button class="pick" onclick={() => host.runPeril((e) => e.wagerFor(amount))}>{amount === maxWager ? `All ${amount}` : amount}</button>
          {/each}
        </div>
        <form class="wager" onsubmit={(event) => { event.preventDefault(); host.runPeril((e) => e.wagerFor(wagerAmount)); }}>
          <input type="number" min="5" max={maxWager} bind:value={wagerAmount} aria-label="Wager" />
          <button class="go">Wager</button>
        </form>
      {:else if v.phase === 'WAGERING'}
        <h1 class="prompt">💰 Treasure Trove!</h1>
        <p class="status">
          {open.answering}
          {v.solo ? 'is' : 'are'} setting a wager… {v.solo ? '' : `${open.wagered}/${open.voters}`}
        </p>
      {:else}
        <h1 class="prompt"><Rich rich={open.rich?.prompt} text={open.prompt ?? ''} /></h1>
        <div class="choices">
          {#each open.choices ?? [] as text, i (i)}
            <AnswerBlock
              index={i}
              {text} rich={open.rich?.choices[i]}
              big
              onclick={v.bigScreen && v.phase === 'ANSWERING' ? () => host.runPeril((e) => e.answerFor(i)) : undefined}
              state={open.correct === null
                ? 'idle'
                : i === open.correct
                  ? 'correct'
                  : i === open.result?.choice
                    ? 'wrong'
                    : 'faded'}
            />
          {/each}
        </div>
        <p class="status">
          {#if v.phase === 'READING'}
            Read it together, then arm the buzzers.
          {:else if v.phase === 'BUZZING' && v.bigScreen}
            <strong>Buzz now!</strong> Who was first?
          {:else if v.phase === 'ANSWERING' && v.bigScreen}
            {#if open.wager !== null}<strong>{open.answering}</strong> wagered {open.wager}.{/if}
            <strong>{open.answering}</strong>, what’s your answer? Tap the one they say.
          {:else if v.phase === 'BUZZING'}
            <strong>Buzz now!</strong>{#if open.lockedOut.length}&nbsp;· Out: {open.lockedOut.join(
                ', ',
              )}{/if}
          {:else if v.phase === 'ANSWERING'}
            {#if open.wager !== null}<strong>{open.answering}</strong> wagered {open.wager}.{/if}
            {#if v.solo}<strong>{open.buzzer ?? open.answering}</strong> is answering…{:else}<strong
                >{open.answering}</strong
              >
              {open.buzzer ? `(${open.buzzer} buzzed)` : ''} are voting · {open.voted}/{open.voters}{/if}
          {:else if v.phase === 'REVEAL'}
            {#if open.result?.correct}
              <strong>{open.result.name}</strong> got it: +{open.result.points}
            {:else if open.result?.name}
              The answer was {letters[open.correct ?? 0]}. {open.result.name}: {open.result.points}
            {:else}
              Nobody buzzed. The answer was {letters[open.correct ?? 0]}.
            {/if}
          {/if}
        </p>
        {#if v.phase === 'REVEAL' && open.explanation}<p class="explanation">
            <Rich rich={open.rich?.explanation} text={open.explanation} />
          </p>{/if}
      {/if}

      {#if v.phase === 'BUZZING' && v.bigScreen}
        <div class="team-picks">
          {#each v.teams as team, i (team.id)}
            <button class="pick" disabled={!!s.open?.lockedOut.includes(team.id)} onclick={() => host.runPeril((e) => e.buzzFor(team.id))}>
              <small>{i + 1}</small> {team.name}
            </button>
          {/each}
        </div>
        {#if open.lockedOut.length}<p class="explanation">Out: {open.lockedOut.join(', ')}</p>{/if}
      {/if}

      <div class="actions">
        {#if v.phase === 'READING'}
          <button class="go" onclick={() => host.runPeril((e) => e.armBuzzers())}
            >Arm buzzers</button
          >
        {:else if v.phase === 'REVEAL'}
          <button class="go" onclick={() => host.runPeril((e) => e.next())}>Next ▸</button>
        {/if}
      </div>
    </section>
  {:else if v.phase === 'FINAL' || v.phase === 'ENDED'}
    <h1 class="big-title">
      {v.phase === 'ENDED' ? 'Champions of the realm' : 'The board is cleared'}
    </h1>
    <ol class="standings">
      {#each v.standings as row (row.name)}
        <li>
          <span class="rank">{row.rank}</span>
          <span class="who">{row.name}</span>
          <strong>{row.points}</strong>
          {#if !v.solo}
            <ul class="members">
              {#each row.members as m (m.nickname)}
                <li>
                  {m.nickname}
                  <small
                    >{m.rightVotes} right · {m.buzzesWon}
                    {m.buzzesWon === 1 ? 'buzz' : 'buzzes'} won</small
                  >
                </li>
              {/each}
            </ul>
          {/if}
        </li>
      {/each}
    </ol>
    {#if v.phase === 'FINAL'}
      <div class="actions">
        <button class="go" onclick={() => (building = true)}>Play another board</button>
        <button class="quiet" onclick={() => rules.open()}>Rules</button>
        <button class="quiet" onclick={() => host.finish()}>End game</button>
      </div>
    {/if}
  {/if}
</div>

{#if building}
  <div class="again" role="dialog" aria-label="Build another board">
    <header>
      <h2>Another board</h2>
      <span class="spacer"></span>
      <button class="btn-quiet" onclick={() => (building = false)}>Cancel</button>
      <button class="btn-primary" disabled={!onBoard(draft).size} onclick={deal}>Deal the board ▸</button>
    </header>
    <BoardBuilder bind:draft />
  </div>
{/if}
<PerilRulesDialog bind:this={rules} />

<style>
  .arena {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem clamp(1rem, 3vw, 2.5rem) 2rem;
    color: var(--paper);
  }
  .top {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .pin {
    color: rgb(255 250 243 / 0.7);
    white-space: nowrap;
  }
  .scores {
    flex: 1;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }
  .scores li {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    padding: 0.35rem 0.9rem;
    border-radius: 999px;
    background: rgb(255 250 243 / 0.1);
    border: 2px solid transparent;
  }
  .scores li.control {
    border-color: var(--amber-strong);
  }
  .scores strong {
    font-family: var(--display);
    font-weight: 400;
    font-size: 1.4rem;
  }
  .neg {
    color: #f3a593;
  }
  .quiet {
    font: inherit;
    padding: 0.5rem 1rem;
    border-radius: 10px;
    border: 1px solid rgb(255 250 243 / 0.3);
    background: transparent;
    color: var(--paper);
    cursor: pointer;
  }
  .notice {
    text-align: center;
    color: var(--amber-strong);
  }
  .banner {
    text-align: center;
    font-size: 1.4rem;
  }
  .board {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
    gap: 0.6rem;
  }
  .column {
    display: grid;
    grid-template-rows: auto repeat(5, minmax(4.5rem, 1fr));
    gap: 0.6rem;
  }
  .column h2 {
    display: grid;
    place-items: center;
    min-height: 4.5rem;
    padding: 0.5rem;
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--serif);
    font-size: clamp(0.95rem, 1.6vw, 1.4rem);
    text-align: center;
    overflow-wrap: anywhere;
  }
  .tile {
    border: 3px solid var(--or);
    border-radius: 10px;
    background: linear-gradient(170deg, #2f5d8f, #1d3c60);
    color: var(--amber-strong);
    font-family: var(--display);
    font-size: clamp(1.8rem, 4vw, 3.4rem);
    cursor: pointer;
    box-shadow: inset 0 -5px 0 rgb(0 0 0 / 0.25);
  }
  .tile:hover:not(:disabled) {
    filter: brightness(1.15);
  }
  .tile:disabled {
    background: rgb(255 250 243 / 0.05);
    border-color: rgb(255 250 243 / 0.1);
    cursor: default;
  }
  .open {
    flex: 1;
    display: grid;
    align-content: center;
    gap: 1.25rem;
    max-width: 70rem;
    width: 100%;
    margin: 0 auto;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .worth {
    font-family: var(--display);
    font-size: 2rem;
    color: var(--amber-strong);
  }
  .trove .worth {
    color: #ffd76a;
  }
  .prompt {
    --picture-max: 38vh;
    font-family: var(--serif);
    font-size: clamp(1.8rem, 4vw, 3.2rem);
    line-height: 1.2;
  }
  .choices {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  .status {
    font-size: 1.4rem;
    text-align: center;
  }
  .explanation {
    text-align: center;
    color: rgb(255 250 243 / 0.75);
    font-style: italic;
  }
  .team-picks {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }
  .pick {
    display: inline-flex;
    align-items: baseline;
    gap: 0.5rem;
    font: inherit;
    font-weight: 800;
    font-size: 1.4rem;
    padding: 0.9rem 1.6rem;
    border-radius: 14px;
    border: 3px solid var(--or);
    background: linear-gradient(170deg, #2f5d8f, #1d3c60);
    color: var(--paper);
    cursor: pointer;
  }
  .pick small {
    font-size: 0.9rem;
    opacity: 0.6;
  }
  .pick:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .wager {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }
  .wager input {
    width: 8rem;
    font: inherit;
    font-size: 1.4rem;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    border: none;
  }
  .actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  .go {
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
  .big-title {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.4rem, 6vw, 4.4rem);
    text-align: center;
  }
  .standings {
    list-style: none;
    display: grid;
    gap: 0.6rem;
    max-width: 44rem;
    width: 100%;
    margin: 0 auto;
  }
  .standings > li {
    display: grid;
    grid-template-columns: 2.5rem 1fr auto;
    align-items: center;
    gap: 0.25rem 1rem;
    padding: 0.8rem 1.2rem;
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
  }
  .rank {
    font-family: var(--display);
    font-size: 1.8rem;
    color: var(--accent);
  }
  .standings .who {
    font-weight: 800;
    font-size: 1.3rem;
  }
  .standings strong {
    font-family: var(--display);
    font-weight: 400;
    font-size: 1.8rem;
  }
  .members {
    grid-column: 2 / -1;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    color: var(--muted);
  }
  .again {
    position: fixed;
    inset: 0;
    z-index: 20;
    overflow: auto;
    padding: 1.25rem clamp(1rem, 3vw, 2.5rem);
    background: var(--ground);
    color: var(--ink);
  }
  .again header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .again h2 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 2.2rem;
  }
  .spacer {
    flex: 1;
  }
  @media (max-width: 40rem) {
    .choices {
      grid-template-columns: 1fr;
    }
  }
</style>
