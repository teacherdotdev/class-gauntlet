<script lang="ts">
  // Every Game Mode as title art, the way Blooket lays out its games. Click
  // one to see what it's like on the right, then Host it.
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import ChampionLogo from '#lib/components/art/ChampionLogo.svelte';
  import ClassicLogo from '#lib/components/art/ClassicLogo.svelte';
  import PerilLogo from '#lib/components/art/PerilLogo.svelte';
  import SuggestGameDialog from '#lib/components/SuggestGameDialog.svelte';
  import { Plus } from '@lucide/svelte';
  import { forgetSavedGame, host, savedGame } from '#lib/host.svelte.ts';
  import { plural } from '#lib/words.ts';

  type Mode = 'champion' | 'peril' | 'classic';
  const games: { id: Mode; name: string; tagline: string; how: string[]; players: string; length: string }[] = [
    {
      id: 'champion',
      name: 'Champion',
      tagline: 'One student holds the field against the whole class.',
      how: [
        'The spotlight picks a Champion. Everyone else answers first, on their own devices.',
        'Then the Champion answers alone, with three lifelines up their sleeve.',
        'Classmates who miss when the Champion is right fall to the Comeback Crew, and keep playing for smaller points.',
      ],
      players: 'Whole class, one Champion at a time',
      length: 'About 10 minutes a round',
    },
    {
      id: 'peril',
      name: 'Peril!',
      tagline: 'A board of tiles worth 100 to 500, and a race to the buzzer.',
      how: [
        'You build the board from your question banks: drag questions onto tiles.',
        'Whoever has control picks a tile. Arm the buzzers; the first to buzz answers. Teams vote together.',
        'A wrong answer costs the tile’s value. One tile hides the Treasure Trove: wager your points on it.',
      ],
      players: 'Solo or teams',
      length: '15–25 minutes a board',
    },
    {
      id: 'classic',
      name: 'Classic',
      tagline: 'Plain and simple: everyone answers every question.',
      how: [
        'Each question goes up on the board, and every student answers on their own device before the timer runs out.',
        'The answer shows with how many chose each option, never who, so nobody is singled out.',
        'At the end, a report shows how each student did and which questions the class found hardest. Points are off unless you turn them on.',
      ],
      players: 'Whole class, each on their own',
      length: 'As long as your questions',
    },
  ];

  let chosen = $state<Mode>('champion');
  let suggest: SuggestGameDialog;
  const game = $derived(games.find((g) => g.id === chosen)!);
  const bank = page.url.searchParams.get('bank');

  let saved = $state.raw(savedGame());
  const resumable = $derived(saved && saved.session.phase !== 'ENDED' ? saved : null);

  function resume() {
    if (!resumable) return;
    host.resume(resumable);
    goto('/host');
  }
</script>

<svelte:head><title>Games · Class Gauntlet</title></svelte:head>

{#if resumable}
  <section class="resume">
    <div>
      <strong>Game {resumable.session.code} is still going</strong>
      <span>
        {resumable.session.mode === 'peril'
          ? 'Peril!'
          : resumable.session.mode === 'classic'
            ? `Classic · ${resumable.session.title}`
            : `Champion · ${resumable.session.setTitle}`} · {plural(resumable.session.players.length, 'player')}
      </span>
    </div>
    <button class="btn-primary" onclick={resume}>Resume</button>
    <button class="btn-quiet" onclick={() => { forgetSavedGame(); saved = null; }}>Discard</button>
  </section>
{/if}

<div class="layout">
  <section>
    <h1>Games</h1>
    <ul class="grid">
      {#each games as g (g.id)}
        <li>
          <button class="tile" class:on={chosen === g.id} onclick={() => (chosen = g.id)} aria-pressed={chosen === g.id} aria-label={g.name}>
            {#if g.id === 'champion'}<ChampionLogo size={320} />{:else if g.id === 'peril'}<PerilLogo size={320} />{:else}<ClassicLogo size={320} />{/if}
          </button>
        </li>
      {/each}
      <li>
        <button class="suggest" onclick={() => suggest.open()}>
          <span class="plus"><Plus size={22} aria-hidden="true" /></span>
          <span class="suggest-title">Suggest a game mode</span>
          <span class="suggest-text">Got a game your class would love? Tell us, and we may build it.</span>
        </button>
      </li>
    </ul>
  </section>

  <aside class="preview" aria-label="{game.name} preview">
    {#if chosen === 'champion'}<ChampionLogo size={360} />{:else if chosen === 'peril'}<PerilLogo size={360} />{:else}<ClassicLogo size={360} />{/if}
    <h2>{game.name}</h2>
    <p class="tagline">{game.tagline}</p>
    <ol class="how">
      {#each game.how as step, i (i)}<li>{step}</li>{/each}
    </ol>
    <dl>
      <div><dt>Players</dt><dd>{game.players}</dd></div>
      <div><dt>Length</dt><dd>{game.length}</dd></div>
    </dl>
    <a class="host" href="/games/{game.id}{bank ? `?bank=${bank}` : ''}">Host {game.name} ▸</a>
  </aside>
</div>

<SuggestGameDialog bind:this={suggest} />

<style>
  .suggest {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    width: 100%;
    height: 100%;
    min-height: 11rem;
    padding: 1.25rem;
    border: 2px dashed var(--line-strong);
    border-radius: 18px;
    background: rgb(255 250 243 / 0.6);
    color: var(--ink);
    font: inherit;
    text-align: center;
    cursor: pointer;
  }
  .suggest:hover {
    background: var(--paper);
    border-color: var(--accent);
  }
  .plus {
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.6rem;
    margin-bottom: 0.3rem;
    border-radius: 50%;
    background: var(--accent-wash);
    color: var(--accent-dark);
  }
  .suggest-title {
    font-weight: 800;
  }
  .suggest-text {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .resume {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1.1rem;
    margin-bottom: 1.25rem;
    border-radius: 12px;
    background: #fff6dc;
    border: 1px solid var(--amber-border);
  }
  .resume div {
    flex: 1;
    display: grid;
  }
  .resume span {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(20rem, 26rem);
    gap: 2rem;
    align-items: start;
  }
  h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.4rem, 5vw, 3.2rem);
    margin-bottom: 1rem;
  }
  .grid {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    gap: 1rem;
  }
  .tile {
    display: grid;
    place-items: center;
    width: 100%;
    padding: 0.6rem;
    border-radius: 18px;
    border: 3px solid transparent;
    background: transparent;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .tile :global(svg) {
    width: 100%;
    height: auto;
  }
  .tile:hover {
    transform: translateY(-3px) rotate(-0.6deg);
  }
  .tile.on {
    border-color: var(--accent);
    background: var(--accent-wash);
  }
  .preview {
    position: sticky;
    top: 2rem;
    display: grid;
    gap: 0.8rem;
    padding: 1.25rem;
    border-radius: 18px;
    background: var(--paper);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-lift);
  }
  .preview :global(svg) {
    justify-self: center;
    width: 100%;
    max-width: 26rem;
    height: auto;
  }
  h2 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 2.2rem;
    line-height: 1;
  }
  .tagline {
    font-family: var(--serif);
    font-size: 1.1rem;
  }
  .how {
    display: grid;
    gap: 0.45rem;
    padding-left: 1.3rem;
    color: var(--ink-soft);
  }
  dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }
  dd {
    margin: 0;
  }
  dt {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .host {
    display: block;
    text-align: center;
    padding: 0.85rem 1rem;
    border-radius: 12px;
    background: var(--accent);
    color: var(--paper);
    font-weight: 800;
    font-size: 1.15rem;
    text-decoration: none;
    box-shadow: inset 0 -4px 0 rgb(0 0 0 / 0.18);
  }
  .host:hover {
    background: var(--accent-dark);
  }
  @media (max-width: 64rem) {
    .layout {
      grid-template-columns: 1fr;
    }
    .preview {
      position: static;
    }
  }
</style>
