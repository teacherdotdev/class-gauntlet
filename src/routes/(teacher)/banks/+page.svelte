<script lang="ts">
  // Every question bank in this browser. Import and Export at the top, a "…"
  // menu on each card, and a new bank opens straight into the editor. A file
  // dropped anywhere on the page goes to the importer.
  import { goto } from '$app/navigation';
  import { EllipsisVertical, Plus, Upload } from '@lucide/svelte';
  import type { QuestionBank } from '#lib/game/types.ts';
  import ImportDialog from '#lib/questions/ImportDialog.svelte';
  import ShareDialog from '#lib/questions/ShareDialog.svelte';
  import { bankFileName, downloadBankFile, writeBankFile } from '#lib/questions/bank-file.ts';
  import { csvFileName, downloadCsv, exportCsv } from '#lib/questions/csv.ts';
  import DownloadButton from '#lib/questions/DownloadButton.svelte';
  import { pictureFile } from '#lib/rich/pictures.svelte.ts';
  import { sampleSetId } from '#lib/questions/sample.ts';
  import { readShared } from '#lib/questions/share.ts';
  import { library } from '#lib/questions/store.svelte.ts';
  import { plural } from '#lib/words.ts';

  let importer: ImportDialog;
  let sharer: ShareDialog;
  let notice = $state('');
  let shared = $state<Omit<QuestionBank, 'id' | 'updatedAt'> | null>(null);
  let menuFor = $state('');
  let dropping = $state(false);

  // A share link puts the bank after # in the address; offer to add it.
  $effect(() => {
    if (location.hash.includes('set=')) void readShared(location.hash).then((bank) => (shared = bank));
  });

  function flash(message: string) {
    notice = message;
    setTimeout(() => (notice = ''), 5000);
  }

  function addShared() {
    if (!shared) return;
    const bank = library.add(shared);
    shared = null;
    history.replaceState(history.state, '', '/banks');
    goto(`/banks/edit?id=${bank.id}`);
  }

  function newBank() {
    const bank = library.add({ title: 'Untitled bank', questions: [] });
    goto(`/banks/edit?id=${bank.id}&new=1`);
  }

  const stamp = () => new Date().toISOString().slice(0, 10);

  /** Every bank in one Bank File, which imports back as the same banks, Pictures and all. */
  async function exportAll() {
    downloadBankFile(`class-gauntlet-banks-${stamp()}.parrot.zip`, await writeBankFile($state.snapshot(library.sorted) as QuestionBank[], pictureFile));
  }

  async function download(bank: QuestionBank) {
    menuFor = '';
    const set = $state.snapshot(bank) as QuestionBank;
    downloadBankFile(bankFileName(set), await writeBankFile(set, pictureFile));
  }

  function share(bank: QuestionBank) {
    menuFor = '';
    void sharer.share($state.snapshot(bank) as QuestionBank);
  }

  function remove(bank: QuestionBank) {
    menuFor = '';
    if (confirm(`Delete “${bank.title}”? This can’t be undone.`)) library.remove(bank.id);
  }

  function topicsOf(bank: QuestionBank): string[] {
    const seen = new Map<string, string>();
    for (const q of bank.questions) for (const t of q.topics ?? []) if (!seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t);
    return [...seen.values()];
  }

  function ago(ms: number): string {
    if (!ms) return '';
    const minutes = Math.round((Date.now() - ms) / 60_000);
    if (minutes < 1) return 'Updated just now';
    if (minutes < 60) return `Updated ${plural(minutes, 'minute')} ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `Updated ${plural(hours, 'hour')} ago`;
    return `Updated ${new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  const hasFile = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files');
</script>

<svelte:head><title>Question banks · Class Gauntlet</title></svelte:head>
<svelte:window
  onpointerdown={(e) => !(e.target as Element).closest?.('.menu-wrap') && (menuFor = '')}
  onkeydown={(e) => e.key === 'Escape' && (menuFor = '')}
  ondragover={(e) => { if (hasFile(e)) { e.preventDefault(); dropping = true; } }}
  ondragleave={(e) => !e.relatedTarget && (dropping = false)}
  ondrop={(e) => {
    if (!hasFile(e)) return;
    e.preventDefault();
    dropping = false;
    const file = e.dataTransfer?.files[0];
    if (file) importer.open(file);
  }}
/>

<div class="head">
  <div>
    <h1>Question banks</h1>
    <p class="lede">Saved in this browser.</p>
  </div>
  <div class="actions">
    <button class="btn-ghost" onclick={() => importer.open()}><Upload size={17} aria-hidden="true" /> Import</button>
    <DownloadButton
      label="Export"
      title="Download every bank as one file, Pictures and all"
      disabled={!library.sets.some((set) => set.questions.length)}
      ondownload={exportAll}
      oncsv={() => downloadCsv(`class-gauntlet-banks-${stamp()}.csv`, exportCsv($state.snapshot(library.sorted) as QuestionBank[]))}
    />
    <button class="btn-primary" onclick={newBank}><Plus size={17} aria-hidden="true" /> New bank</button>
  </div>
</div>

{#if notice}<p class="notice" role="status">{notice}</p>{/if}

{#if shared}
  <section class="panel shared">
    <div>
      <p class="label">Shared with you</p>
      <h2>{shared.title}</h2>
      <p class="lede">{plural(shared.questions.length, 'question')}</p>
    </div>
    <div class="actions">
      <button class="btn-primary" onclick={addShared}>Add to my banks</button>
      <button class="btn-ghost" onclick={() => (shared = null)}>No thanks</button>
    </div>
  </section>
{/if}

<section class="grid">
  {#each library.sorted as bank (bank.id)}
    {@const topics = topicsOf(bank)}
    <article class="card">
      <a class="body" href="/banks/edit?id={bank.id}">
        <h2>{bank.title}</h2>
        <p class="meta">
          {plural(bank.questions.length, 'question')}
        </p>
        {#if topics.length}
          <ul class="topics">
            {#each topics.slice(0, 3) as topic (topic)}<li>{topic}</li>{/each}
            {#if topics.length > 3}<li class="more">+{topics.length - 3}</li>{/if}
          </ul>
        {/if}
        <p class="foot">
          {#if bank.id === sampleSetId}<span class="pill muted">Sample</span>{/if}
          <span>{ago(bank.updatedAt)}</span>
        </p>
      </a>
      <div class="menu-wrap">
        <button class="dots" onclick={() => (menuFor = menuFor === bank.id ? '' : bank.id)} aria-expanded={menuFor === bank.id} aria-label="More for {bank.title}">
          <EllipsisVertical size={18} />
        </button>
        {#if menuFor === bank.id}
          <div class="menu" role="menu">
            <button role="menuitem" onclick={() => goto(`/banks/edit?id=${bank.id}`)}>Open</button>
            <button role="menuitem" disabled={!bank.questions.length} onclick={() => share(bank)}>Share</button>
            <button role="menuitem" disabled={!bank.questions.length} onclick={() => download(bank)}>Download</button>
            <button role="menuitem" disabled={!bank.questions.length} onclick={() => { downloadCsv(csvFileName(bank.title), exportCsv($state.snapshot(bank) as QuestionBank)); menuFor = ''; }}>Download as spreadsheet (CSV)</button>
            <button role="menuitem" onclick={() => { const copy = library.duplicate(bank.id); menuFor = ''; if (copy) goto(`/banks/edit?id=${copy.id}`); }}>Duplicate</button>
            <hr />
            <button role="menuitem" class="danger" onclick={() => remove(bank)}>Delete</button>
          </div>
        {/if}
      </div>
    </article>
  {/each}
  <button class="card new" onclick={newBank}><Plus size={22} aria-hidden="true" /> New bank</button>
</section>

{#if !library.get(sampleSetId)}
  <p class="lede"><button class="link" onclick={() => library.restoreSample()}>Bring back the sample bank</button></p>
{/if}

{#if dropping}
  <div class="drop-overlay" aria-hidden="true"><div><Upload size={32} /><strong>Drop to import</strong><span>A question file from another tool, or a spreadsheet</span></div></div>
{/if}

<ImportDialog bind:this={importer} onimported={flash} />
<ShareDialog bind:this={sharer} onshared={flash} />

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.25rem;
  }
  h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.4rem, 5vw, 3.2rem);
  }
  .lede {
    color: var(--muted);
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .actions button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .notice {
    margin-bottom: 1rem;
    padding: 0.6rem 0.9rem;
    border-radius: 10px;
    background: var(--good-wash);
    border: 1px solid var(--good-line);
    color: var(--good);
    font-weight: 700;
  }
  .shared {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.25rem;
    background: var(--accent-wash);
    border-color: var(--accent-line);
  }
  .label {
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 1rem;
  }
  .card {
    position: relative;
    min-height: 11rem;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: var(--paper);
    box-shadow: var(--shadow-rest);
    transition:
      border-color 0.12s,
      box-shadow 0.12s;
  }
  .card:hover {
    border-color: var(--accent-line);
    box-shadow: var(--shadow-lift);
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    height: 100%;
    padding: 1rem 2.75rem 0.9rem 1.1rem;
    color: var(--ink);
    text-decoration: none;
  }
  .body h2 {
    font-family: var(--serif);
    font-size: 1.15rem;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  .meta {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .topics {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  .topics li {
    padding: 0 0.5rem;
    border-radius: 999px;
    background: var(--paper-low);
    border: 1px solid var(--line);
    font-size: 0.78rem;
  }
  .topics .more {
    color: var(--muted);
  }
  .foot {
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--muted);
    font-size: 0.8rem;
  }
  .menu-wrap {
    position: absolute;
    top: 0.55rem;
    right: 0.55rem;
  }
  .dots {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--muted);
    cursor: pointer;
  }
  .dots:hover,
  .dots[aria-expanded='true'] {
    background: var(--paper-low);
    color: var(--ink);
  }
  .menu {
    position: absolute;
    top: calc(100% + 0.25rem);
    right: 0;
    z-index: 10;
    display: grid;
    min-width: 12rem;
    padding: 0.35rem;
    border-radius: 10px;
    background: var(--paper);
    box-shadow: var(--shadow-dialog);
  }
  .menu button {
    text-align: left;
    padding: 0.5rem 0.7rem;
    border: 0;
    border-radius: 6px;
    background: none;
    font: inherit;
    color: var(--ink);
    cursor: pointer;
  }
  .menu button:hover:not(:disabled) {
    background: var(--paper-low);
  }
  .menu button:disabled {
    color: var(--muted);
    cursor: default;
  }
  .menu hr {
    border: 0;
    border-top: 1px solid var(--line);
    margin: 0.25rem 0;
  }
  .menu .danger {
    color: var(--bad);
  }
  .new {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    border: 2px dashed var(--line-strong);
    background: rgb(255 250 243 / 0.5);
    box-shadow: none;
    color: var(--accent-dark);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }
  .link {
    background: none;
    border: none;
    padding: 0;
    color: var(--accent);
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
  }
  .drop-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    background: rgb(36 28 23 / 0.35);
    pointer-events: none;
  }
  .drop-overlay div {
    display: grid;
    justify-items: center;
    gap: 0.3rem;
    padding: 2rem 2.5rem;
    border-radius: 16px;
    border: 2px dashed var(--accent);
    background: var(--paper);
    color: var(--accent-dark);
  }
  .drop-overlay span {
    color: var(--muted);
  }
</style>
