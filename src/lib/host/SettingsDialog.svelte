<script lang="ts">
  // The rules, behind the gear button. The next game starts from them too.
  import { host } from '../host.svelte';
  import { saveChampionRules } from './setup';

  let dialog: HTMLDialogElement;
  let timerSeconds = $state(20);
  let strikes = $state(2);
  let questionsPerGame = $state(12);
  let momentumEnabled = $state(false);
  let shuffleQuestions = $state(false);
  let rescues = $state(true);
  let rescueStreak = $state(3);
  let championPick = $state<'spotlight' | 'teacher'>('spotlight');
  let championsOnce = $state(true);
  const noDevices = $derived(!!host.session?.noDevices);

  export function open() {
    const s = host.session?.settings;
    if (s) {
      ({ timerSeconds, strikes, questionsPerGame, momentumEnabled, shuffleQuestions, championPick, championsOnce } = s);
      rescues = s.rescueStreak > 0;
      rescueStreak = s.rescueStreak > 0 ? s.rescueStreak : 3;
    }
    dialog.showModal();
  }

  function save(event: SubmitEvent) {
    event.preventDefault();
    const rules = {
      timerSeconds,
      strikes,
      questionsPerGame,
      momentumEnabled,
      shuffleQuestions,
      rescueStreak: rescues ? rescueStreak : 0,
      championPick,
      championsOnce,
    };
    if (host.run((e) => e.updateSettings(rules))) {
      saveChampionRules(rules);
      dialog.close();
    }
  }
</script>

<dialog bind:this={dialog} aria-labelledby="settings-title">
  <form onsubmit={save}>
    <h2 id="settings-title">Rules of the joust</h2>
    <label class="field">Seconds to answer
      <input type="number" min="5" max="120" bind:value={timerSeconds} />
    </label>
    <label class="field">Chances for the champion
      <input type="number" min="1" max="5" bind:value={strikes} />
      <small>Wrong answers they can survive. Applies from the next round.</small>
    </label>
    <label class="field">Questions per round
      <input type="number" min="1" max="50" bind:value={questionsPerGame} />
      <small>Each new champion gets the next questions in the set.</small>
    </label>
    <label class="check"><input type="checkbox" bind:checked={shuffleQuestions} /> Shuffle the questions</label>
    <label class="check">
      <input type="checkbox" bind:checked={momentumEnabled} />
      <span><strong>On a Roll</strong>: quick answers without a lifeline win the champion a chance back (once a round)</span>
    </label>
    {#if !noDevices}
      <label class="check">
        <input type="checkbox" bind:checked={rescues} />
        <span><strong>Rescue</strong>: when most of the class gets {rescueStreak} in a row right, they vote someone back from the Comeback Crew</span>
      </label>
      {#if rescues}
        <label class="field">Right in a row for a Rescue
          <input type="number" min="2" max="10" bind:value={rescueStreak} />
        </label>
      {/if}
      <fieldset class="field">
        <legend>Who picks each champion</legend>
        <label class="check"><input type="radio" name="pick" value="spotlight" bind:group={championPick} /> The spotlight, at random</label>
        <label class="check"><input type="radio" name="pick" value="teacher" bind:group={championPick} /> I do</label>
      </fieldset>
      {#if championPick === 'spotlight'}
        <label class="check"><input type="checkbox" bind:checked={championsOnce} /> Skip students who’ve been champion, until everyone has</label>
      {/if}
    {/if}
    {#if host.notice}<p class="problem">{host.notice}</p>{/if}
    <div class="actions">
      <button type="button" class="btn-ghost" onclick={() => dialog.close()}>Cancel</button>
      <button class="btn-primary">Save</button>
    </div>
  </form>
</dialog>

<style>
  form {
    display: grid;
    gap: 0.9rem;
  }
  h2 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 2rem;
  }
  .check {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    color: var(--ink-soft);
  }
  .check input {
    margin-top: 0.25rem;
  }
  fieldset {
    border: 0;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.35rem;
  }
  legend {
    margin-bottom: 0.35rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
  }
  .problem {
    color: var(--bad);
    font-weight: 600;
  }
</style>
