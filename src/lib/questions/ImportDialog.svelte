<script lang="ts">
  // Importing questions, after Test Parrot's: drop a file (or click to choose
  // one), or paste cells from a spreadsheet. We read it, show what's coming in
  // and what was left out, and the teacher confirms. For a worksheet, PDF or
  // photo, an AI chat can turn it into our spreadsheet first.
  import { Check, ClipboardPaste, Download, FileUp, Sparkles, X } from '@lucide/svelte';
  import { FORMATS } from '@teacherdotdev/question-commons';
  import type { QuestionBank } from '../game/types';
  import { plural } from '../words';
  import { aiInstructions, downloadCsv, templateCsv } from './csv';
  import { importPasted, importQuestionFile, questionFileTypes, type ImportResult } from './import';
  import { library } from './store.svelte';

  let { onimported }: { onimported?: (message: string) => void } = $props();

  type Phase = 'choose' | 'reading' | 'review';
  let dialog: HTMLDialogElement;
  let phase = $state<Phase>('choose');
  let pasting = $state(false);
  let pasted = $state('');
  let dragging = $state(false);
  let error = $state('');
  let copied = $state(false);
  let result = $state<ImportResult | null>(null);
  let fileName = $state('');
  /** The banks read, each with whether to import it and its (editable) name. */
  let picks = $state<{ bank: QuestionBank; take: boolean; title: string }[]>([]);
  let shown = $state(0);

  /** The tools whose files we read, by the name a teacher knows them by. */
  const sources = [...new Map(FORMATS.map((f) => [f.originator, FORMATS.filter((g) => g.originator === f.originator)])).entries()].map(
    ([originator, formats]) => ({
      name: originator === 'IMS QTI' ? 'QTI (Canvas, Brightspace…)' : originator,
      detail: formats.map((f) => `${f.label} (${f.fileTypes.join(' ')})`).join('\n'),
    }),
  );

  export function open(file?: File) {
    reset();
    dialog.showModal();
    if (file) void readFile(file);
  }

  function reset() {
    phase = 'choose';
    pasting = false;
    pasted = '';
    error = '';
    result = null;
    picks = [];
    shown = 0;
  }

  function close() {
    dialog.close();
  }

  async function readFile(file: File) {
    if (file.size > 20_000_000) {
      error = 'That file is too big for a question bank (over 20 MB).';
      return;
    }
    fileName = file.name;
    show(await (phase = 'reading', importQuestionFile({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) })));
  }

  async function readPasted() {
    fileName = 'Pasted questions';
    phase = 'reading';
    show(await importPasted(pasted));
  }

  function show(read: ImportResult) {
    result = read;
    if (!read.sets.length) {
      phase = 'choose';
      error = read.errors[0] ?? 'No questions were found in a format Class Gauntlet reads.';
      return;
    }
    error = '';
    picks = read.sets.map((bank) => ({ bank, take: true, title: bank.title }));
    shown = 0;
    phase = 'review';
  }

  const coming = $derived(picks.filter((p) => p.take));
  const comingCount = $derived(coming.reduce((n, p) => n + p.bank.questions.length, 0));
  const leftOut = $derived(result?.errors ?? []);

  function confirm() {
    for (const p of coming) library.add({ ...$state.snapshot(p.bank), title: p.title.trim() || p.bank.title });
    onimported?.(`Added ${plural(comingCount, 'question')} in ${plural(coming.length, 'bank')}.`);
    close();
  }

  async function copyInstructions() {
    try {
      await navigator.clipboard.writeText(aiInstructions);
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {
      prompt('Copy these instructions:', aiInstructions);
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    dragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) void readFile(file);
  }
</script>

<dialog bind:this={dialog} class:review={phase === 'review'} aria-labelledby="import-title" onclose={reset}>
  <div class="body">
    <header>
      <div>
        <h2 id="import-title">Import questions</h2>
        {#if phase === 'review' && result?.formatLabel}<p class="sub">Read “{fileName}” as {result.formatLabel}</p>{/if}
      </div>
      <button type="button" class="close" onclick={close} aria-label="Close"><X size={18} /></button>
    </header>

    {#if phase === 'review'}
      <p class="status" role="status">
        {plural(comingCount + leftOut.length, 'question')} found · <strong>{comingCount} coming in</strong>{#if leftOut.length}&nbsp;· <span class="bad">{leftOut.length} left out</span>{/if}
      </p>
      {#if leftOut.length}
        <details class="left-out" open={leftOut.length <= 6}>
          <summary>{plural(leftOut.length, 'question')} left out, and why</summary>
          <ul>{#each leftOut.slice(0, 40) as reason, i (i)}<li>{reason}</li>{/each}{#if leftOut.length > 40}<li>…and {leftOut.length - 40} more.</li>{/if}</ul>
        </details>
      {/if}

      <div class="review-grid">
        <ul class="banks" aria-label="Banks to import">
          {#each picks as p, i (i)}
            <li class:on={shown === i}>
              <input type="checkbox" bind:checked={p.take} aria-label="Import {p.title}" />
              <button type="button" onclick={() => (shown = i)}>
                <strong>{p.title}</strong>
                <small>{plural(p.bank.questions.length, 'question')}</small>
              </button>
            </li>
          {/each}
        </ul>
        {#if picks[shown]}
          <section class="preview" aria-label="Preview">
            <label class="field">Bank name <input bind:value={picks[shown].title} /></label>
            <ol>
              {#each picks[shown].bank.questions as q (q.id)}
                <li>
                  <p>{q.prompt}</p>
                  <ul class="choices">
                    {#each q.choices as c, ci (ci)}<li class:right={ci === q.correct}>{c}</li>{/each}
                  </ul>
                </li>
              {/each}
            </ol>
          </section>
        {/if}
      </div>

      <footer>
        <button type="button" class="btn-quiet" onclick={reset}>Choose another file</button>
        <span class="spacer"></span>
        <button type="button" class="btn-ghost" onclick={close}>Cancel</button>
        <button type="button" class="btn-primary" disabled={!coming.length} onclick={confirm}>Import {plural(comingCount, 'question')}</button>
      </footer>
    {:else}
      <label
        class="drop"
        class:dragging
        ondragover={(e) => { e.preventDefault(); dragging = true; }}
        ondragleave={() => (dragging = false)}
        ondrop={onDrop}
      >
        <input
          type="file"
          accept={`${questionFileTypes},.pdf`}
          aria-label="A question file"
          onchange={(e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (file) void readFile(file);
          }}
        />
        <FileUp size={30} aria-hidden="true" />
        <strong>{phase === 'reading' ? 'Reading your file…' : 'Drop your question file here'}</strong>
        <span>or click to choose it</span>
      </label>

      {#if error}
        <div class="error" role="alert">
          <p>{error}</p>
          <p>If it’s a worksheet, PDF or picture, copy the instructions for an AI below. Having trouble? Email us the file and we’ll help.</p>
        </div>
      {/if}

      <div class="supports">
        <span>Supports</span>
        <ul>
          {#each sources as source (source.name)}<li title={source.detail}>{source.name}</li>{/each}
        </ul>
      </div>

      {#if pasting}
        <div class="paste">
          <label class="field">Paste cells from Google Sheets or Excel, header row included
            <textarea bind:value={pasted} rows="7" placeholder={'question\tA\tB\tC\tanswer\nWhat is 7 × 8?\t54\t56\t64\tB'}></textarea>
          </label>
          <p class="hint">Columns: <strong>question, A, B, C, D, answer, explanation, topics</strong>. D, explanation and topics are optional; <em>answer</em> is the letter of the right choice. Kahoot and Blooket spreadsheets work too.</p>
          <div class="row">
            <button type="button" class="btn-ghost" onclick={() => (pasting = false)}>Cancel</button>
            <button type="button" class="btn-primary" disabled={!pasted.trim() || phase === 'reading'} onclick={readPasted}>Read my questions</button>
          </div>
        </div>
      {:else}
        <div class="alt">
          <span>Only have it in a spreadsheet?</span>
          <button type="button" class="link" onclick={() => (pasting = true)}><ClipboardPaste size={15} aria-hidden="true" /> Paste the cells</button>
          <button type="button" class="link" onclick={() => downloadCsv('question-template.csv', templateCsv)}><Download size={15} aria-hidden="true" /> Download our template</button>
          <button type="button" class="link" onclick={copyInstructions} title="Paste these into an AI chat such as Claude or ChatGPT with your worksheet, PDF or photo, then paste its reply here">
            {#if copied}<Check size={15} aria-hidden="true" /> Copied{:else}<Sparkles size={15} aria-hidden="true" /> Copy instructions for an AI{/if}
          </button>
          <small class="ai-note">Have a worksheet, PDF or photo? An AI chat can write it in our template: paste it these instructions with your file, then paste its reply here.</small>
        </div>
      {/if}

    {/if}
  </div>
</dialog>

<style>
  dialog {
    width: min(36rem, calc(100vw - 2rem));
    max-height: calc(100vh - 2.5rem);
    padding: 0;
    border: 0;
    border-radius: 16px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: var(--shadow-dialog);
  }
  dialog.review {
    width: min(64rem, calc(100vw - 2rem));
  }
  dialog::backdrop {
    background: rgb(36 28 23 / 0.45);
    backdrop-filter: blur(2px);
  }
  .body {
    display: grid;
    gap: 1rem;
    padding: 1.25rem 1.4rem 1.4rem;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: start;
  }
  h2 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 2rem;
    line-height: 1.1;
  }
  .sub {
    color: var(--muted);
  }
  .close {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--muted);
    cursor: pointer;
  }
  .close:hover {
    background: var(--paper-low);
  }
  .drop {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 0.3rem;
    padding: 1.9rem 1.25rem 1.6rem;
    border: 1.5px dashed var(--accent);
    border-radius: 12px;
    background:
      radial-gradient(circle, var(--accent-line) 1.3px, transparent 1.4px) 0 0 / 15px 15px,
      var(--paper);
    color: var(--accent-dark);
    text-align: center;
    cursor: pointer;
    transition:
      background-color 0.12s,
      box-shadow 0.12s;
  }
  .drop input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .drop:hover,
  .drop:focus-within,
  .drop.dragging {
    background-color: var(--accent-wash);
    box-shadow: 0 0 0 3px var(--accent-wash);
  }
  .drop strong {
    color: var(--ink);
    font-size: 1.05rem;
  }
  .drop span {
    color: var(--muted);
  }
  .error {
    display: grid;
    gap: 0.3rem;
    padding: 0.75rem 0.9rem;
    border-radius: 10px;
    background: var(--bad-wash);
    border: 1px solid var(--bad-line);
    color: var(--bad);
  }
  .error p + p {
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .supports {
    display: grid;
    justify-items: center;
    gap: 0.4rem;
  }
  .supports > span {
    font-weight: 800;
    font-size: 0.85rem;
  }
  .supports ul {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.3rem;
  }
  .supports li {
    padding: 0.1rem 0.6rem;
    border-radius: 999px;
    background: var(--paper-low);
    border: 1px solid var(--line);
    font-size: 0.8rem;
    white-space: nowrap;
  }
  .alt {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 0.35rem 1rem;
    color: var(--muted);
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    border: 0;
    background: none;
    padding: 0;
    color: var(--accent-dark);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
  .link:hover {
    text-decoration: underline;
  }
  .ai-note {
    flex-basis: 100%;
    text-align: center;
    font-size: 0.82rem;
  }
  .paste {
    display: grid;
    gap: 0.5rem;
  }
  .paste textarea {
    font-family: ui-monospace, monospace;
    font-size: 0.85rem;
  }
  .hint {
    color: var(--muted);
    font-size: 0.85rem;
  }
  .row {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  .status strong {
    font-weight: 800;
  }
  .bad {
    color: var(--bad);
  }
  .left-out {
    padding: 0.6rem 0.8rem;
    border-radius: 10px;
    background: var(--bad-wash);
  }
  .left-out summary {
    font-weight: 700;
    cursor: pointer;
  }
  .left-out ul {
    margin-top: 0.4rem;
    padding-left: 1.2rem;
    font-size: 0.9rem;
    max-height: 9rem;
    overflow: auto;
  }
  .review-grid {
    display: grid;
    grid-template-columns: 16rem minmax(0, 1fr);
    gap: 1rem;
    height: min(26rem, 50vh);
  }
  .banks {
    list-style: none;
    display: grid;
    gap: 0.35rem;
    align-content: start;
    overflow: auto;
  }
  .banks li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.6rem;
    border-radius: 10px;
    border: 1px solid var(--line);
  }
  .banks li.on {
    border-color: var(--accent);
    background: var(--accent-wash);
  }
  .banks button {
    flex: 1;
    display: grid;
    border: 0;
    background: none;
    text-align: left;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  .banks small {
    color: var(--muted);
  }
  .preview {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.6rem;
    min-height: 0;
  }
  .preview ol {
    overflow: auto;
    display: grid;
    gap: 0.6rem;
    align-content: start;
    padding-left: 1.4rem;
  }
  .preview ol > li p {
    font-weight: 600;
  }
  .choices {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.25rem;
  }
  .choices li {
    padding: 0.05rem 0.5rem;
    border-radius: 6px;
    background: var(--paper-low);
    font-size: 0.85rem;
  }
  .choices li.right {
    background: var(--good-wash);
    color: var(--good);
    font-weight: 700;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .spacer {
    flex: 1;
  }
  @media (max-width: 44rem) {
    .review-grid {
      grid-template-columns: 1fr;
      height: auto;
    }
    .banks {
      max-height: 9rem;
    }
    .preview ol {
      max-height: 18rem;
    }
  }
</style>
