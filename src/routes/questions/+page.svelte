<script lang="ts">
  import { goto } from '$app/navigation';
  import Brand from '#lib/components/Brand.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import type { QuestionSet } from '#lib/game/types.ts';
  import { aiInstructions, csvFileName, downloadCsv, exportCsv, templateCsv } from '#lib/questions/csv.ts';
  import { importPasted, importQuestionFile, questionFileTypes, type ImportResult } from '#lib/questions/import.ts';
  import { sampleSetId } from '#lib/questions/sample.ts';
  import { readShared, shareLink } from '#lib/questions/share.ts';
  import { library } from '#lib/questions/store.svelte.ts';
  import { plural } from '#lib/words.ts';

  let importErrors = $state<string[]>([]);
  let aiCopied = $state(false);
  let importMessage = $state('');
  let pasteOpen = $state(false);
  let pasted = $state('');
  let shared = $state<Omit<QuestionSet, 'id' | 'updatedAt'> | null>(null);
  let linkFor = $state('');
  let menuFor = $state('');
  let fileInput: HTMLInputElement;

  // A share link puts the set after # in the address; offer to add it.
  $effect(() => {
    if (location.hash.includes('set=')) void readShared(location.hash).then((set) => (shared = set));
  });

  function addShared() {
    if (!shared) return;
    const set = library.add(shared);
    shared = null;
    history.replaceState(history.state, '', '/questions');
    goto(`/questions/edit?id=${set.id}`);
  }

  function showImport({ sets, errors, formatLabel }: ImportResult) {
    for (const set of sets) library.add(set);
    importErrors = errors;
    const count = sets.reduce((t, set) => t + set.questions.length, 0);
    importMessage = sets.length
      ? `Read as ${formatLabel}: added ${plural(count, 'question')} in ${plural(sets.length, 'set')}.${errors.length ? ' These were left out:' : ''}`
      : '';
    if (sets.length) pasteOpen = false;
  }

  async function onFile(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    fileInput.value = '';
    if (file.size > 20_000_000) {
      importMessage = '';
      importErrors = ['That file is too big for a question set (over 20 MB).'];
      return;
    }
    showImport(await importQuestionFile({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) }));
  }

  async function copyAiInstructions() {
    try {
      await navigator.clipboard.writeText(aiInstructions);
      aiCopied = true;
      setTimeout(() => (aiCopied = false), 1800);
    } catch {
      prompt('Copy these instructions:', aiInstructions);
    }
  }

  function exportAll() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`class-gauntlet-sets-${stamp}.csv`, exportCsv($state.snapshot(library.sorted) as QuestionSet[]));
  }

  async function copyShare(set: QuestionSet) {
    const link = await shareLink(location.origin, $state.snapshot(set) as QuestionSet);
    try {
      await navigator.clipboard.writeText(link);
      linkFor = set.id;
      setTimeout(() => (linkFor = ''), 1800);
    } catch {
      prompt('Copy this link:', link);
    }
    menuFor = '';
  }

  function remove(set: QuestionSet) {
    if (confirm(`Delete “${set.title}”? This can’t be undone.`)) library.remove(set.id);
    menuFor = '';
  }
</script>

<svelte:head><title>Question sets · Class Gauntlet</title></svelte:head>

<main class="page">
  <header class="top">
    <Brand />
    <a class="btn-quiet" href="/host">Start a game →</a>
  </header>

  <div class="head">
    <div>
      <h1>Your question sets</h1>
      <p class="lede">Write your own, import a spreadsheet, or share a set with a colleague by link. Sets are saved in this browser, so export them to keep a backup.</p>
    </div>
    <div class="row">
      <a class="btn-primary" href="/questions/edit?new=1">+ New set</a>
      <button class="btn-ghost" onclick={() => fileInput.click()} title="A spreadsheet, a Kahoot or Blooket export, a Word document, or a quiz from Canvas, Moodle, Blackboard and more">Import a file</button>
      <button class="btn-ghost" onclick={() => (pasteOpen = !pasteOpen)}>Paste from a spreadsheet</button>
      <button class="btn-ghost" onclick={exportAll} disabled={!library.sets.length} title="Download every set as one CSV file, to back up or move to another computer">Export all</button>
      <input bind:this={fileInput} type="file" accept={questionFileTypes} hidden onchange={onFile} />
    </div>
  </div>

  {#if shared}
    <section class="panel shared">
      <div>
        <p class="label">Shared with you</p>
        <h2>{shared.title}</h2>
        <p class="lede">{plural(shared.questions.length, 'question')}{shared.subject ? ` · ${shared.subject}` : ''}</p>
      </div>
      <div class="row">
        <button class="btn-primary" onclick={addShared}>Add to my sets</button>
        <button class="btn-ghost" onclick={() => (shared = null)}>No thanks</button>
      </div>
    </section>
  {/if}

  {#if pasteOpen}
    <section class="panel paste">
      <p>
        Copy cells from Google Sheets or Excel, including a header row: <strong>question, A, B, C, D, answer, explanation</strong>.
        D and explanation are optional; <em>answer</em> is the letter of the right choice. Kahoot and Blooket spreadsheets work too.
        <button class="link" onclick={() => downloadCsv('question-template.csv', templateCsv)}>Download the template</button>
      </p>
      <div class="ai">
        <p>
          <strong>Have a worksheet or PDF?</strong> Copy these instructions into an AI chat such as Claude along with the file,
          then paste its reply here.
        </p>
        <button class="btn-ghost" onclick={copyAiInstructions}>{aiCopied ? 'Copied ✓' : 'Copy AI instructions'}</button>
      </div>
      <textarea bind:value={pasted} rows="8" placeholder={'question\tA\tB\tC\tanswer\nWhat is 7 × 8?\t54\t56\t64\tB'}></textarea>
      <div class="row">
        <button class="btn-primary" disabled={!pasted.trim()} onclick={async () => showImport(await importPasted(pasted))}>Import</button>
        <button class="btn-quiet" onclick={() => (pasteOpen = false)}>Cancel</button>
      </div>
    </section>
  {/if}

  {#if importMessage || importErrors.length}
    <section class="panel report" role="status">
      {#if importMessage}<p><strong>{importMessage}</strong></p>{/if}
      {#if importErrors.length}
        <ul>
          {#each importErrors.slice(0, 12) as error, i (i)}<li>{error}</li>{/each}
          {#if importErrors.length > 12}<li>…and {importErrors.length - 12} more.</li>{/if}
        </ul>
      {/if}
    </section>
  {/if}

  <section class="grid">
    {#each library.sorted as set (set.id)}
      <article class="card">
        <a class="body" href="/questions/edit?id={set.id}">
          <h2>{set.title}</h2>
          <p class="meta">
            {plural(set.questions.length, 'question')}{set.subject ? ` · ${set.subject}` : ''}{set.grade ? ` · Grade ${set.grade}` : ''}
          </p>
          {#if set.questions[0]}<p class="peek">“{set.questions[0].prompt}”</p>{/if}
        </a>
        <footer>
          {#if set.id === sampleSetId}<span class="pill muted">Sample</span>{:else}<span></span>{/if}
          <div class="row">
            {#if linkFor === set.id}<span class="pill good">Link copied</span>{/if}
            <button class="btn-quiet" onclick={() => (menuFor = menuFor === set.id ? '' : set.id)} aria-expanded={menuFor === set.id}>More ▾</button>
          </div>
          {#if menuFor === set.id}
            <div class="menu" role="menu">
              <button role="menuitem" onclick={() => copyShare(set)}>Copy share link</button>
              <button role="menuitem" onclick={() => { downloadCsv(csvFileName(set.title), exportCsv($state.snapshot(set) as QuestionSet)); menuFor = ''; }}>Download CSV</button>
              <button role="menuitem" onclick={() => { const copy = library.duplicate(set.id); menuFor = ''; if (copy) goto(`/questions/edit?id=${copy.id}`); }}>Duplicate</button>
              <button role="menuitem" class="danger" onclick={() => remove(set)}>Delete</button>
            </div>
          {/if}
        </footer>
      </article>
    {/each}
    <a class="card empty" href="/questions/edit?new=1">+ Write a new set</a>
  </section>

  {#if !library.get(sampleSetId)}
    <p class="lede"><button class="link" onclick={() => library.restoreSample()}>Bring back the sample set</button></p>
  {/if}
</main>
<Footer />

<style>
  .page {
    max-width: 68rem;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 1rem;
    display: grid;
    gap: 1.25rem;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
  }
  h1 {
    font-size: 2.2rem;
    margin-bottom: 0.3rem;
  }
  .row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .shared {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    background: var(--accent-wash);
    border-color: var(--accent-line);
  }
  .paste {
    display: grid;
    gap: 0.75rem;
  }
  textarea {
    width: 100%;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 0.88rem;
    padding: 0.6rem;
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    background: #fff;
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
  .report ul {
    padding-left: 1.2rem;
    color: var(--bad);
    margin-top: 0.4rem;
  }
  .ai {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--accent-line);
    border-radius: 10px;
    background: var(--accent-wash);
  }
  .ai p {
    flex: 1 1 18rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    gap: 1.1rem;
  }
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    box-shadow: var(--shadow-rest);
    transition:
      box-shadow 0.15s,
      transform 0.15s;
  }
  .card:hover {
    box-shadow: var(--shadow-lift);
    transform: translateY(-1px);
  }
  .body {
    flex: 1;
    padding: 1.1rem 1.2rem 0.6rem;
    color: inherit;
    text-decoration: none;
    display: grid;
    gap: 0.35rem;
    align-content: start;
  }
  .body h2 {
    font-size: 1.1rem;
  }
  .meta {
    color: var(--muted);
    font-size: 0.85rem;
  }
  .peek {
    font-family: var(--serif);
    font-style: italic;
    color: var(--ink-soft);
    font-size: 0.92rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.6rem 0.6rem 1.2rem;
  }
  .menu {
    position: absolute;
    right: 0.6rem;
    bottom: 2.8rem;
    z-index: 5;
    display: grid;
    min-width: 11rem;
    padding: 0.35rem;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 10px;
    box-shadow: 0 10px 28px rgb(51 42 36 / 0.18);
  }
  .menu button {
    text-align: left;
    background: none;
    border: none;
    padding: 0.5rem 0.7rem;
    border-radius: 6px;
    cursor: pointer;
  }
  .menu button:hover {
    background: var(--paper-low);
  }
  .menu .danger {
    color: var(--bad);
  }
  .empty {
    display: grid;
    place-items: center;
    min-height: 9rem;
    border: 2px dashed var(--line-strong);
    background: var(--paper-low);
    box-shadow: none;
    font-family: var(--serif);
    font-size: 1.1rem;
    color: var(--ink-soft);
    text-decoration: none;
  }
</style>
