<script lang="ts">
  // Peril!'s setup: build the Board, choose Solo or Teams, open the lobby.
  // Team names and the rules wait in the lobby (rules are the last game's).
  // With no student devices it's always Teams, with nobody in them.
  import { goto } from '$app/navigation';
  import { onBoard } from '#lib/game/peril/draft.ts';
  import { teamNames } from '#lib/game/peril/names.ts';
  import { host } from '#lib/host.svelte.ts';
  import { perilRules, perilSetup, playsWithoutDevices, savePerilSetup } from '#lib/host/setup.ts';
  import BoardBuilder from '#lib/setup/BoardBuilder.svelte';
  import { plural } from '#lib/words.ts';

  let setup = $state(perilSetup());
  const tiles = $derived(onBoard(setup.draft).size);
  // Chosen beside Host on the Games page.
  const noDevices = playsWithoutDevices('peril');
  const solo = $derived(setup.solo && !noDevices);

  $effect(() => savePerilSetup($state.snapshot(setup)));

  function open() {
    if (!tiles) return;
    const chosen = $state.snapshot(setup);
    host.createPeril({
      draft: chosen.draft,
      settings: { ...perilRules(), teams: solo ? null : { names: teamNames(chosen.teamCount), assign: 'auto' } },
      noDevices,
    });
    goto('/host');
  }
</script>

<svelte:head><title>Peril! · Class Gauntlet</title></svelte:head>

<header class="bar">
  <a class="btn-quiet" href="/games">← Games</a>
  <h1>Peril!</h1>
  {#if noDevices}<span class="no-devices">No student devices</span>{/if}
  {#if !noDevices}
    <div class="segmented" role="radiogroup" aria-label="Players">
      <button role="radio" aria-checked={setup.solo} class:on={setup.solo} onclick={() => (setup.solo = true)}>Solo</button>
      <button role="radio" aria-checked={!setup.solo} class:on={!setup.solo} onclick={() => (setup.solo = false)}>Teams</button>
    </div>
  {/if}
  {#if !solo}
    <label class="count">
      <input type="number" min="2" max="8" bind:value={setup.teamCount} aria-label="Number of teams" />
      teams
    </label>
  {/if}
  <span class="spacer"></span>
  <span class="tiles">{plural(tiles, 'tile')}</span>
  <button class="btn-primary" disabled={!tiles} onclick={open}>{noDevices ? 'Open the game ▸' : 'Open the lobby ▸'}</button>
</header>

<BoardBuilder bind:draft={setup.draft} />

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    flex-wrap: wrap;
    margin-bottom: 1.1rem;
  }
  h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 2.4rem;
    line-height: 1;
    color: var(--gules);
  }
  .segmented {
    display: inline-flex;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    overflow: hidden;
  }
  .segmented button {
    font: inherit;
    font-weight: 700;
    padding: 0.4rem 1rem;
    border: 0;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .segmented button.on {
    background: var(--accent);
    color: var(--paper);
  }
  .count {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--muted);
  }
  .count input {
    width: 3.5rem;
    font: inherit;
    padding: 0.3rem 0.4rem;
    border-radius: 8px;
    border: 1px solid var(--line-strong);
  }
  .spacer {
    flex: 1;
  }
  .tiles {
    color: var(--muted);
  }
  .no-devices {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    background: var(--accent-wash);
    color: var(--accent-dark);
    font-weight: 700;
  }
</style>
