<script lang="ts">
  // The data this browser keeps, as one file to take elsewhere or bring
  // back. Each game's rules are set as you host it, not here.
  import { Download, Upload } from '@lucide/svelte';
  import { collectBackup, describeBackup, readBackup, restoreBackup, type Backup } from '#lib/backup.ts';
  import { gameHistory } from '#lib/history/store.svelte.ts';
  import { library } from '#lib/questions/store.svelte.ts';

  let picker: HTMLInputElement;
  let incoming = $state<{ name: string; backup: Backup } | null>(null);
  let problem = $state('');
  // The banks come from the library, which shows the sample even before it's saved.
  const everything = () => {
    const backup = collectBackup(localStorage);
    backup.data.banks = $state.snapshot(library.sets);
    return backup;
  };
  const current = $derived(describeBackup({ ...everything(), data: { banks: library.sets, history: gameHistory.records } }));

  function exportAll() {
    const text = JSON.stringify(everything(), null, 2);
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    Object.assign(document.createElement('a'), { href: url, download: `class-gauntlet-backup-${new Date().toISOString().slice(0, 10)}.json` }).click();
    URL.revokeObjectURL(url);
  }

  async function choose(file: File | undefined) {
    problem = '';
    incoming = null;
    if (!file) return;
    const read = readBackup(await file.text());
    if ('problem' in read) problem = read.problem;
    else incoming = { name: file.name, backup: read };
  }

  function replace() {
    if (!incoming) return;
    restoreBackup(localStorage, incoming.backup);
    location.reload();
  }
</script>

<svelte:head><title>Settings · Class Gauntlet</title></svelte:head>

<h1>Settings</h1>

<section class="panel">
  <h2>Your data</h2>
  <p class="note">
    Everything lives only in this browser: your question banks, History, and how you last set up and played each game. Export it all
    as one file to keep a backup or move to another computer.
  </p>
  <p class="have">In this browser: <strong>{current}</strong></p>

  <div class="row">
    <button class="btn-primary" onclick={exportAll}><Download size={18} /> Export everything</button>
    <button class="btn-ghost" onclick={() => picker.click()}><Upload size={18} /> Import a backup…</button>
    <input bind:this={picker} type="file" accept=".json,application/json" hidden onchange={(e) => choose(e.currentTarget.files?.[0])} />
  </div>

  {#if problem}<p class="problem" role="alert">{problem}</p>{/if}

  {#if incoming}
    <div class="confirm" role="alert">
      <p>
        <strong>{incoming.name}</strong>
        {#if incoming.backup.exportedAt}<span class="when">from {new Date(incoming.backup.exportedAt).toLocaleDateString()}</span>{/if}
        has {describeBackup(incoming.backup)}.
      </p>
      <p>Importing replaces everything in this browser with it. Export first if you want to keep what's here.</p>
      <div class="row">
        <button class="btn-quiet" onclick={() => (incoming = null)}>Cancel</button>
        <button class="btn-primary danger-fill" onclick={replace}>Replace everything</button>
      </div>
    </div>
  {/if}

  <hr />
  <div class="row">
    <button class="btn-quiet danger" disabled={!gameHistory.records.length} onclick={() => confirm('Clear every game from History?') && gameHistory.clear()}>
      Clear History
    </button>
  </div>
</section>

<style>
  h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.4rem, 5vw, 3.2rem);
    margin-bottom: 1.25rem;
  }
  .panel {
    display: grid;
    gap: 0.9rem;
    max-width: 44rem;
  }
  h2 {
    font-family: var(--serif);
    font-size: 1.3rem;
  }
  .note,
  .when {
    color: var(--muted);
  }
  .row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .row button {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }
  .confirm {
    display: grid;
    gap: 0.6rem;
    padding: 0.9rem 1rem;
    border: 1px solid var(--bad-line);
    border-radius: 0.6rem;
    background: var(--bad-wash);
  }
  .problem {
    color: var(--bad);
  }
  hr {
    border: 0;
    border-top: 1px solid var(--line);
  }
  .danger {
    color: var(--bad);
  }
  .danger-fill {
    background: var(--bad);
    border-color: var(--bad);
  }
</style>
