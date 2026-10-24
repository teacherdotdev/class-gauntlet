<script lang="ts">
  // Champion's setup: choose the questions to play, in order. The rules
  // are the last game's, behind the gear in the lobby.
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { host } from '#lib/host.svelte.ts';
  import { championDeck, championRules, playsOnBigScreen, saveChampionDeck, savePlaysOnBigScreen } from '#lib/host/setup.ts';
  import { library } from '#lib/questions/store.svelte.ts';
  import { questionsFor, titleFor } from '#lib/setup/deck.ts';
  import PlaysOn from '#lib/setup/PlaysOn.svelte';
  import QuestionList from '#lib/setup/QuestionList.svelte';
  import { plural } from '#lib/words.ts';

  const fromBank = library.get(page.url.searchParams.get('bank') ?? '');
  let ids = $state(fromBank ? fromBank.questions.map((q) => q.id) : championDeck());
  const deck = $derived(questionsFor(library.sorted, ids));
  let bigScreen = $state(playsOnBigScreen('champion'));

  function open() {
    if (!deck.length) return;
    saveChampionDeck(deck.map((q) => q.id));
    savePlaysOnBigScreen('champion', bigScreen);
    host.create({ setTitle: titleFor(library.sorted, deck), questions: $state.snapshot(deck), settings: championRules(), bigScreen });
    goto('/host');
  }
</script>

<svelte:head><title>Champion · Class Gauntlet</title></svelte:head>

<header class="bar">
  <a class="btn-quiet" href="/games">← Games</a>
  <h1>Champion</h1>
  <PlaysOn bind:bigScreen />
  <span class="spacer"></span>
  <span class="count">{plural(deck.length, 'question')}</span>
  <button class="btn-primary" disabled={!deck.length} onclick={open}>{bigScreen ? 'Set up the Big Screen ▸' : 'Open the lobby ▸'}</button>
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
  .count {
    color: var(--muted);
  }
</style>
