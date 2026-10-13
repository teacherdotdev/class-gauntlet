<script lang="ts">
  // Peril!'s rules for this game, behind the gear. They start from the last game's, and the
  // next game starts from these.
  import { host } from '../host.svelte';
  import { savePerilRules, type PerilRules } from './setup';

  let dialog: HTMLDialogElement;
  let rules = $state<PerilRules | null>(null);

  export function open() {
    const { teams: _, ...current } = host.peril!.settings;
    rules = current;
    dialog.showModal();
  }

  function save(event: SubmitEvent) {
    event.preventDefault();
    if (rules && host.runPeril((e) => e.updateSettings($state.snapshot(rules!)))) {
      savePerilRules($state.snapshot(rules));
      dialog.close();
    }
  }
</script>

<dialog bind:this={dialog} aria-labelledby="peril-rules-title">
  {#if rules}
    <form onsubmit={save}>
      <h2 id="peril-rules-title">Rules of the realm</h2>
      <label class="check"><input type="checkbox" bind:checked={rules.wrongAnswerPenalty} /> <span><strong>Lose points for a wrong answer</strong></span></label>
      <label class="check"><input type="checkbox" bind:checked={rules.treasureTrove} /> <span><strong>Treasure Trove</strong> <small>(from the next board)</small></span></label>
      <label class="field">Seconds to buzz <input type="number" min="3" max="60" bind:value={rules.buzzSeconds} /></label>
      <label class="field">Seconds to answer (Solo) <input type="number" min="3" max="60" bind:value={rules.answerSeconds} /></label>
      <label class="field">Seconds for a Team to vote <input type="number" min="5" max="60" bind:value={rules.voteSeconds} /></label>
      <label class="field">Seconds to wager <input type="number" min="5" max="60" bind:value={rules.wagerSeconds} /></label>
      <p class="hint">Your next game starts with these too.</p>
      {#if host.notice}<p class="problem" role="alert">{host.notice}</p>{/if}
      <div class="actions">
        <button type="button" class="btn-quiet" onclick={() => dialog.close()}>Cancel</button>
        <button class="btn-primary">Save</button>
      </div>
    </form>
  {/if}
</dialog>

<style>
  form {
    display: grid;
    gap: 0.8rem;
    min-width: min(26rem, 80vw);
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
  .problem {
    color: var(--bad);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>
