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

  export function open() {
    const s = host.session?.settings;
    if (s) ({ timerSeconds, strikes, questionsPerGame, momentumEnabled, shuffleQuestions } = s);
    dialog.showModal();
  }

  function save(event: SubmitEvent) {
    event.preventDefault();
    if (host.run((e) => e.updateSettings({ timerSeconds, strikes, questionsPerGame, momentumEnabled, shuffleQuestions }))) {
      saveChampionRules({ timerSeconds, strikes, questionsPerGame, momentumEnabled, shuffleQuestions });
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
