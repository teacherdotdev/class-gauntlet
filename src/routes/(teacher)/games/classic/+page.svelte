<script lang="ts">
  // Classic's setup: choose the questions to ask, in order. The rules
  // are the last game's, behind the gear in the lobby.
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { host } from '#lib/host.svelte.ts';
  import { classicDeck, classicRules, playsWithoutDevices, saveClassicDeck, saveClassicRules } from '#lib/host/setup.ts';
  import { library } from '#lib/questions/store.svelte.ts';
  import { questionsFor, titleFor } from '#lib/setup/deck.ts';
  import QuestionList from '#lib/setup/QuestionList.svelte';
  import { plural } from '#lib/words.ts';

  const fromBank = library.get(page.url.searchParams.get('bank') ?? '');
  let ids = $state(fromBank ? fromBank.questions.map((q) => q.id) : classicDeck());
  const deck = $derived(questionsFor(library.sorted, ids));
  let shuffleQuestions = $state(classicRules().shuffleQuestions);
  // Chosen beside Host on the Games page.
  const noDevices = playsWithoutDevices('classic');

  function open() {
    if (!deck.length) return;
    saveClassicDeck(deck.map((q) => q.id));
    const settings = { ...classicRules(), shuffleQuestions };
    saveClassicRules(settings);
    host.createClassic({ title: titleFor(library.sorted, deck), questions: $state.snapshot(deck), settings, noDevices });
    goto('/host');
  }
</script>

<svelte:head><title>Classic · Class Gauntlet</title></svelte:head>

<header class="bar">
  <a class="btn-quiet" href="/games">← Games</a>
  <h1>Classic</h1>
  {#if noDevices}<span class="no-devices">No student devices</span>{/if}
  <span class="spacer"></span>
  <label class="shuffle"><input type="checkbox" bind:checked={shuffleQuestions} /> Shuffle</label>
  <span class="count">{plural(deck.length, 'question')}</span>
  <button class="btn-primary" disabled={!deck.length} onclick={open}>{noDevices ? 'Open the game ▸' : 'Open the lobby ▸'}</button>
</header>

<QuestionList bind:ids />

<style>
  .bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.9rem;
    margin-bottom: 1.1rem;
  }
  h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 2.4rem;
    line-height: 1;
  }
  .spacer {
    flex: 1;
  }
  .shuffle {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }
  .shuffle input {
    accent-color: var(--accent);
  }
  .count {
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
