<script lang="ts">
  // A student's phone during Peril!: choose a Team, pick a Tile when you have
  // Control, slam the buzzer, answer (or vote with your Team), and wager on a
  // Treasure Trove.
  import Rich from '../rich/Rich.svelte';
  import type { PerilView } from '../game/peril/views';
  import { student } from '../student.svelte';
  import AnswerBlock from './AnswerBlock.svelte';
  import Avatar from './Avatar.svelte';

  let { view, seconds }: { view: PerilView; seconds: number | null } = $props();

  const me = $derived(view.me!);
  const open = $derived(view.open);
  const phase = $derived(view.phase);
  const team = $derived(view.teams.find((t) => t.id === me.teamId));
  const mine = $derived(view.solo ? view.control?.id === me.id : view.control?.id === me.teamId);
  const answeringIsMine = $derived(
    !!open?.answering && open.answering === (view.solo ? me.nickname : team?.name),
  );
  const letter = (i: number | null | undefined) => (i == null ? '' : String.fromCharCode(65 + i));
  let wager = $state(100);

  const mood = $derived.by(() => {
    if (phase === 'REVEAL' && open?.result && answeringIsMine)
      return open.result.correct ? 'good' : 'bad';
    if (
      phase === 'REVEAL' &&
      open?.result?.correct &&
      open.result.name === (view.solo ? me.nickname : team?.name)
    )
      return 'good';
    if (phase === 'BUZZING' && me.canBuzz) return 'armed';
    return 'night';
  });
</script>

<div class="peril {mood}">
  <header class="strip">
    <Avatar name={me.nickname} size={30} />
    <span class="me">{me.nickname}</span>
    {#if team}<span class="tag">{team.name}</span>{/if}
    <span class="spacer"></span>
    {#if seconds !== null && ['BUZZING', 'ANSWERING', 'WAGERING'].includes(phase)}<span class="secs"
        >{seconds}</span
      >{/if}
    <span class="pts">{me.points}</span>
  </header>

  <section class="screen">
    {#if phase === 'LOBBY' || (me.canChooseTeam && !me.teamId)}
      {#if me.canChooseTeam}
        <div class="moment">
          <h1>{me.teamId ? `You’re with the ${team?.name}` : 'Choose your team'}</h1>
          <div class="teams">
            {#each view.teams as t (t.id)}
              <button
                class="team"
                class:on={t.id === me.teamId}
                onclick={() => student.chooseTeam(t.id)}
              >
                <strong>{t.name}</strong>
                <small>{t.members.length} {t.members.length === 1 ? 'member' : 'members'}</small>
              </button>
            {/each}
          </div>
        </div>
      {:else}
        <div class="moment">
          <Avatar name={me.nickname} size={96} />
          <h1>You’re in!</h1>
          <p>{team ? `You fight for the ${team.name}.` : 'See your name on the screen?'}</p>
        </div>
      {/if}
    {:else if phase === 'BOARD'}
      {#if me.canPick}
        <p class="prompt">Your pick! Choose a tile.</p>
        <div class="board" style="--cols: {view.board.length}">
          {#each view.board as column, c (c)}
            <div class="column">
              <span class="title">{column.title}</span>
              {#each column.tiles as tile, r (r)}
                <button class="tile" style="grid-row: {tile.value / 100 + 1}" disabled={tile.played} onclick={() => student.pick(c, r)}
                  >{tile.played ? '' : tile.value}</button
                >
              {/each}
            </div>
          {/each}
        </div>
      {:else}
        <div class="moment">
          <h1>
            {mine
              ? 'Your team picks'
              : `${view.control?.name ?? 'Someone'} ${view.solo ? 'picks' : 'pick'} a tile`}
          </h1>
          <p>Watch the board.</p>
        </div>
      {/if}
    {:else if phase === 'READING'}
      <div class="moment">
        <h1>Read the question</h1>
        <p>Get ready to buzz…</p>
      </div>
    {:else if phase === 'BUZZING'}
      {#if me.canBuzz}
        <button class="buzzer" onclick={() => student.buzz()}>BUZZ!</button>
      {:else}
        <div class="moment">
          <h1>You’ve had your try</h1>
          <p>Others may buzz now.</p>
        </div>
      {/if}
    {:else if phase === 'WAGERING'}
      {#if me.canWager}
        <form
          class="moment"
          onsubmit={(e) => {
            e.preventDefault();
            student.wager(wager);
          }}
        >
          <h1>💰 Treasure Trove!</h1>
          <p>
            How many points will you stake? Between 5 and {me.maxWager}.{view.solo
              ? ''
              : ' Your team plays the middle number.'}
          </p>
          <input
            class="big-input"
            type="number"
            min="5"
            max={me.maxWager}
            step="5"
            bind:value={wager}
            aria-label="Wager"
          />
          <button class="go">{me.myWager === null ? 'Wager' : `Change (now ${me.myWager})`}</button>
          {#if open?.teamWagers?.length}
            <p class="note">
              {open.teamWagers.map((w) => `${w.nickname}: ${w.amount}`).join(' · ')}
            </p>
          {/if}
        </form>
      {:else}
        <div class="moment">
          <h1>Treasure Trove!</h1>
          <p>{open?.answering} {view.solo ? 'is' : 'are'} wagering…</p>
        </div>
      {/if}
    {:else if phase === 'ANSWERING' && open?.choices}
      {#if me.canAnswer}
        <div class="prompt"><Rich rich={open.rich?.prompt} text={open.prompt ?? ''} /></div>
        {#if !view.solo}<p class="note">
            Vote with your team. Most votes wins{open.buzzer
              ? `; a tie goes to ${open.buzzer}`
              : ''}.
          </p>{/if}
        <div class="pad" class:four={open.choices.length === 4}>
          {#each open.choices as text, i (i)}
            <AnswerBlock
              index={i}
              {text} rich={open.rich?.choices[i]}
              big
              state={me.myVote === null ? 'idle' : me.myVote === i ? 'chosen' : 'faded'}
              count={open.tally ? open.tally[i] : null}
              total={open.voted}
              onclick={() => student.vote(i)}
            />
          {/each}
        </div>
      {:else}
        <div class="moment">
          <h1>
            {open.buzzer && view.solo
              ? `${open.buzzer} buzzed!`
              : `${open.answering} ${view.solo ? 'is' : 'are'} answering`}
          </h1>
          <p>{view.solo ? 'Watch the board.' : `${open.voted} of ${open.voters} have voted.`}</p>
        </div>
      {/if}
    {:else if phase === 'REVEAL' && open}
      <div class="moment">
        {#if open.result?.correct}
          <h1 class="shout">{answeringIsMine ? 'Got it!' : `${open.result.name} got it`}</h1>
          <p class="plus">+{open.result.points}</p>
        {:else if answeringIsMine && open.result}
          <h1 class="shout">Not quite</h1>
          {#if open.result.points}<p class="plus">{open.result.points}</p>{/if}
        {:else}
          <h1>The answer was {letter(open.correct)}</h1>
        {/if}
        {#if open.correct !== null && open.choices}<p>
            {letter(open.correct)}: <Rich rich={open.rich?.choices[open.correct]} text={open.choices[open.correct]} />
          </p>{/if}
      </div>
    {:else if phase === 'FINAL' || phase === 'ENDED'}
      <div class="moment">
        <p class="rank">#{me.rank}</p>
        <h1>{me.points} points</h1>
        <p>{phase === 'ENDED' ? 'Thanks for playing!' : 'Another board may follow…'}</p>
      </div>
    {/if}
  </section>
</div>

<style>
  .peril {
    flex: 1;
    display: flex;
    flex-direction: column;
    transition: background 0.4s;
  }
  .peril.good {
    background: var(--vert);
  }
  .peril.bad {
    background: var(--gules);
  }
  .peril.armed {
    background: radial-gradient(circle at 50% 60%, rgb(240 170 90 / 0.35), transparent 70%);
  }
  .strip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.75rem;
    background: rgb(0 0 0 / 0.25);
  }
  .me {
    font-weight: 800;
    max-width: 9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tag {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    background: rgb(255 250 243 / 0.15);
  }
  .spacer {
    flex: 1;
  }
  .secs {
    font-family: var(--display);
    font-size: 1.5rem;
    min-width: 2rem;
    text-align: center;
  }
  .pts {
    font-family: var(--display);
    font-size: 1.5rem;
    background: var(--paper);
    color: var(--ink);
    padding: 0 0.6rem;
    border-radius: 8px;
  }
  .screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    gap: 0.75rem;
  }
  .moment {
    flex: 1;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 0.6rem;
    text-align: center;
    padding: 1rem;
  }
  .moment h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 2.6rem;
    line-height: 1.05;
  }
  .moment p {
    font-size: 1.15rem;
    color: rgb(255 250 243 / 0.85);
  }
  .shout {
    font-size: 3.4rem !important;
  }
  .plus,
  .rank {
    font-family: var(--display);
    font-size: 2.6rem !important;
    color: var(--paper) !important;
  }
  .rank {
    font-size: 4.5rem !important;
    line-height: 1;
  }
  .prompt {
    --picture-max: 30vh;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--serif);
    font-weight: 700;
    font-size: 1.2rem;
    text-align: center;
    padding: 0.8rem 1rem;
    border-radius: 12px;
  }
  .note {
    text-align: center;
    color: rgb(255 250 243 / 0.8);
  }
  .teams {
    display: grid;
    gap: 0.6rem;
    width: 100%;
  }
  .team {
    display: grid;
    padding: 0.9rem;
    border-radius: 12px;
    border: 2px solid rgb(255 250 243 / 0.3);
    background: rgb(255 250 243 / 0.08);
    color: var(--paper);
    font: inherit;
    cursor: pointer;
  }
  .team.on {
    border-color: var(--amber-strong);
    background: rgb(240 210 124 / 0.2);
  }
  .team strong {
    font-family: var(--display);
    font-size: 1.6rem;
    font-weight: 400;
  }
  .board {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
    gap: 0.3rem;
  }
  .column {
    display: grid;
    grid-template-rows: auto repeat(5, minmax(3rem, 1fr));
    gap: 0.3rem;
  }
  .column .title {
    font-size: 0.7rem;
    font-weight: 800;
    text-align: center;
    overflow-wrap: anywhere;
  }
  .tile {
    border: 2px solid var(--or);
    border-radius: 8px;
    background: #2f5d8f;
    color: var(--amber-strong);
    font-family: var(--display);
    font-size: 1.3rem;
  }
  .tile:disabled {
    background: transparent;
    border-color: rgb(255 250 243 / 0.1);
  }
  .buzzer {
    flex: 1;
    margin: 1rem;
    border-radius: 50%;
    aspect-ratio: 1;
    align-self: center;
    width: min(80vw, 22rem);
    flex: none;
    border: 6px solid var(--amber-strong);
    background: radial-gradient(circle at 40% 35%, #e0543d, var(--gules) 60%, #7a2416);
    color: var(--paper);
    font-family: var(--display);
    font-size: 3.6rem;
    box-shadow:
      inset 0 -10px 0 rgb(0 0 0 / 0.25),
      0 10px 30px rgb(0 0 0 / 0.4);
    cursor: pointer;
  }
  .buzzer:active {
    transform: translateY(4px);
    box-shadow: inset 0 -4px 0 rgb(0 0 0 / 0.25);
  }
  .big-input {
    font: inherit;
    font-size: 2rem;
    text-align: center;
    width: 10rem;
    padding: 0.5rem;
    border-radius: 12px;
    border: 0;
  }
  .go {
    font: inherit;
    font-weight: 800;
    font-size: 1.2rem;
    padding: 0.7rem 2rem;
    border-radius: 12px;
    border: 0;
    background: var(--paper);
    color: var(--ink);
  }
  .pad {
    flex: 1;
    display: grid;
    gap: 0.6rem;
    grid-auto-rows: 1fr;
  }
  .pad.four {
    grid-template-columns: 1fr 1fr;
  }
  .pad :global(.block) {
    min-height: 5.5rem;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    gap: 0.5rem;
  }
  .pad :global(.block .text) {
    flex: none;
    font-size: 1.5rem;
  }
</style>
