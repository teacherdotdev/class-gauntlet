<script lang="ts">
  // One question bank, after Test Parrot's: the outline on the left (every
  // question, or one Topic), the questions as cards beside it with search
  // and filters, and a pop-up to edit the one you click. A bank has no
  // order. Everything saves as you go, and Cmd/Ctrl+Z undoes it.
  import Rich from '#lib/rich/Rich.svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { ArrowLeft, Copy, Download, Play, Plus, Redo2, Trash2, Undo2 } from '@lucide/svelte';
  import { randomId } from '#lib/game/engine.ts';
  import type { Question, QuestionBank } from '#lib/game/types.ts';
  import { browse, libraryTopics, type QuestionFilter } from '#lib/questions/browse.ts';
  import { csvFileName, downloadCsv, exportCsv } from '#lib/questions/csv.ts';
  import QuestionDialog from '#lib/questions/QuestionDialog.svelte';
  import { sampleSetId } from '#lib/questions/sample.ts';
  import { library } from '#lib/questions/store.svelte.ts';
  import { UndoStack } from '#lib/questions/undo.ts';
  import FilterChips from '#lib/setup/FilterChips.svelte';
  import { plural } from '#lib/words.ts';

  const id = page.url.searchParams.get('id') ?? '';
  const bank = $derived(library.get(id));
  const isSample = id === sampleSetId;

  let editing = $state<{ question: Question; isNew: boolean } | null>(null);
  let search = $state('');
  let filters = $state<QuestionFilter[]>([]);
  let toast = $state<{ message: string; undo: boolean } | null>(null);
  let toastTimer = 0;
  let titleBox = $state<HTMLInputElement>();

  /** Snapshots of the bank before each change, for Cmd/Ctrl+Z. */
  const undoStack = new UndoStack<QuestionBank>();
  let canUndo = $state(false);
  let canRedo = $state(false);

  $effect(() => {
    if (!bank) goto('/banks', { replaceState: true });
  });
  $effect(() => {
    // A brand-new bank starts with its title ready to type over.
    if (page.url.searchParams.has('new') && titleBox) {
      titleBox.select();
      history.replaceState(history.state, '', `/banks/edit?id=${id}`);
    }
  });

  const knownTopics = $derived(libraryTopics(library.sorted));
  const bankTopics = $derived(
    bank
      ? libraryTopics([bank]).map((t) => ({
          name: t,
          count: bank.questions.filter((q) => q.topics?.some((x) => x.toLowerCase() === t.toLowerCase())).length,
        }))
      : [],
  );
  const shown = $derived(bank ? browse([bank], { search, filters }).map((row) => row.question) : []);
  /** The one Topic the filters narrow to, so the outline can light it. */
  const outlineTopic = $derived(filters.length === 1 && filters[0].values.length === 1 ? filters[0].values[0] : null);

  const snapshot = () => $state.snapshot(bank) as QuestionBank;

  /** Saves a change to the bank, remembering how it was, for undo. */
  function change(changes: Partial<QuestionBank>, coalesce?: string) {
    if (!bank) return;
    undoStack.record(snapshot(), coalesce);
    library.save({ ...snapshot(), ...changes });
    canUndo = undoStack.canUndo;
    canRedo = false;
  }

  function step(direction: 'undo' | 'redo') {
    if (!bank) return;
    const to = direction === 'undo' ? undoStack.undo(snapshot()) : undoStack.redo(snapshot());
    if (!to) return;
    library.save(to);
    canUndo = undoStack.canUndo;
    canRedo = undoStack.canRedo;
    say(direction === 'undo' ? 'Undone.' : 'Redone.', false);
  }

  function say(message: string, undo = true) {
    toast = { message, undo };
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toast = null), 5000);
  }

  function newQuestion() {
    const topic = outlineTopic;
    editing = { question: { id: randomId(), prompt: '', choices: ['', '', ''], correct: 0, ...(topic ? { topics: [topic] } : {}) }, isNew: true };
  }

  function saveQuestion(question: Question) {
    if (!bank) return;
    const questions = snapshot().questions;
    const at = questions.findIndex((q) => q.id === question.id);
    if (at >= 0) questions[at] = question;
    else questions.push(question);
    change({ questions });
    say(editing?.isNew ? 'Question added.' : 'Question saved.');
    editing = null;
  }

  function deleteQuestion(questionId: string) {
    if (!bank) return;
    change({ questions: bank.questions.filter((q) => q.id !== questionId) });
    if (editing?.question.id === questionId) editing = null;
    say('Question deleted.');
  }

  function duplicateQuestion(questionId: string) {
    if (!bank) return;
    const questions = snapshot().questions;
    const at = questions.findIndex((q) => q.id === questionId);
    questions.splice(at + 1, 0, { ...questions[at], id: randomId() });
    change({ questions });
    say('Question duplicated.');
  }

  function showTopic(topic: string | null) {
    filters = topic ? [{ property: 'topic', values: [topic] }] : [];
  }

  function onkeydown(event: KeyboardEvent) {
    if (editing || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
    // Text boxes keep their own undo while you type in them; the title counts as the bank's.
    const target = event.target as HTMLElement;
    if (target.closest?.('input, textarea') && target !== titleBox) return;
    event.preventDefault();
    step(event.shiftKey ? 'redo' : 'undo');
  }

  const letter = (i: number) => String.fromCharCode(65 + i);
</script>

<svelte:head><title>{bank?.title || 'Question bank'} · Class Gauntlet</title></svelte:head>
<svelte:window {onkeydown} />

{#if bank}
  <div class="editor">
    <header class="top">
      <a class="btn-quiet back" href="/banks"><ArrowLeft size={16} aria-hidden="true" /> Question banks</a>
      <div class="title-row">
        <input
          bind:this={titleBox}
          class="title"
          value={bank.title}
          aria-label="Bank title"
          placeholder="Untitled bank"
          oninput={(e) => change({ title: e.currentTarget.value }, 'title')}
          onblur={(e) => !e.currentTarget.value.trim() && change({ title: 'Untitled bank' })}
          onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <div class="actions">
          <button class="icon-btn" onclick={() => step('undo')} disabled={!canUndo} aria-label="Undo" title="Undo (⌘/Ctrl+Z)"><Undo2 size={18} /></button>
          <button class="icon-btn" onclick={() => step('redo')} disabled={!canRedo} aria-label="Redo" title="Redo (⇧⌘/Ctrl+Z)"><Redo2 size={18} /></button>
          <button class="btn-ghost" onclick={() => downloadCsv(csvFileName(bank.title), exportCsv(snapshot()))} disabled={!bank.questions.length}><Download size={16} aria-hidden="true" /> Download CSV</button>
          <a class="btn-ghost" href="/games?bank={bank.id}"><Play size={16} aria-hidden="true" /> Play</a>
          <button class="btn-primary" onclick={newQuestion}><Plus size={16} aria-hidden="true" /> New question</button>
        </div>
      </div>
      {#if isSample}<p class="hint">This is the sample bank. If you delete it, you can bring it back from the Question banks page.</p>{/if}
    </header>

    <div class="frame">
      <div class="workspace">
        <nav class="outline" aria-label="Outline">
          <h3>Outline</h3>
          <button class:on={!filters.length} aria-pressed={!filters.length} onclick={() => showTopic(null)}>All questions <span>{bank.questions.length}</span></button>
          <h3>Topics</h3>
          {#each bankTopics as t (t.name)}
            <button class:on={outlineTopic === t.name} aria-pressed={outlineTopic === t.name} onclick={() => showTopic(outlineTopic === t.name ? null : t.name)}>{t.name} <span>{t.count}</span></button>
          {:else}
            <p class="none">No topics yet. Topics added to a question are listed here.</p>
          {/each}
        </nav>

        <section class="list" aria-label="Questions">
          <div class="bar">
            <input class="search" type="search" bind:value={search} placeholder="Search questions" aria-label="Search questions" />
            <FilterChips bind:filters properties={['topic']} topics={bankTopics.map((t) => t.name)} />
            <span class="count">{plural(shown.length, 'question')}</span>
          </div>
          <ul>
            {#each shown as question (question.id)}
              <li class="card">
                <button class="read" onclick={() => (editing = { question, isNew: false })} aria-label="Edit question: {question.prompt}">
                  <strong class="prompt"><Rich rich={question.rich?.prompt} text={question.prompt} /></strong>
                  <span class="choices">
                    {#each question.choices as c, ci (ci)}<span class:right={ci === question.correct}>{letter(ci)}. <Rich rich={question.rich?.choices[ci]} text={c} /></span>{/each}
                  </span>
                  {#if question.topics?.length || question.explanation}
                    <span class="extra">
                      {#each question.topics ?? [] as t (t)}<span class="topic">{t}</span>{/each}
                      {#if question.explanation}<em><Rich rich={question.rich?.explanation} text={question.explanation} /></em>{/if}
                    </span>
                  {/if}
                </button>
                <span class="tools">
                  <button class="icon" onclick={() => duplicateQuestion(question.id)} aria-label="Duplicate: {question.prompt}" title="Duplicate"><Copy size={16} /></button>
                  <button class="icon" onclick={() => deleteQuestion(question.id)} aria-label="Delete: {question.prompt}" title="Delete"><Trash2 size={16} /></button>
                </span>
              </li>
            {:else}
              <li class="empty">
                {#if bank.questions.length}No questions match.{:else}No questions yet. <button class="link" onclick={newQuestion}>Write the first one</button>, or import some from the Question banks page.{/if}
              </li>
            {/each}
          </ul>
        </section>
      </div>
    </div>
  </div>

  {#if editing}
    {#key editing.question.id}
      <QuestionDialog
        question={editing.question}
        isNew={editing.isNew}
        {knownTopics}
        onsave={saveQuestion}
        ondelete={() => editing && deleteQuestion(editing.question.id)}
        onclose={() => (editing = null)}
      />
    {/key}
  {/if}

  {#if toast}
    <div class="toast" role="status">
      <span>{toast.message}</span>
      {#if toast.undo}<button onclick={() => step('undo')}>Undo</button>{/if}
    </div>
  {/if}
{/if}

<style>
  /* The whole editor fits the window; only the list of questions scrolls. */
  .editor {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    min-height: 0;
  }
  .top {
    display: grid;
    gap: 0.5rem;
  }
  .back {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
  .title-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .title {
    flex: 1 1 18rem;
    min-width: 0;
    font-family: var(--display);
    font-size: clamp(2rem, 4vw, 2.8rem);
    border: 0;
    border-bottom: 2px dashed transparent;
    background: transparent;
    color: var(--ink);
    padding: 0;
  }
  .title:hover,
  .title:focus {
    outline: none;
    border-bottom-color: var(--line-strong);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .actions > * {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    text-decoration: none;
  }
  .icon-btn {
    display: grid;
    place-items: center;
    width: 2.3rem;
    height: 2.3rem;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink-soft);
    cursor: pointer;
  }
  .icon-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .hint {
    color: var(--muted);
  }
  .frame {
    flex: 1;
    min-height: 0;
    container-type: inline-size;
  }
  .workspace {
    height: 100%;
    display: grid;
    grid-template-columns: 13rem minmax(0, 1fr);
    gap: 1.25rem;
  }
  .outline {
    display: grid;
    align-content: start;
    gap: 0.15rem;
    overflow: auto;
    min-height: 0;
  }
  .outline h3 {
    margin: 0.6rem 0 0.25rem;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .outline h3:first-child {
    margin-top: 0;
  }
  .outline button {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.45rem 0.6rem;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-soft);
    font: inherit;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .outline button span {
    color: var(--muted);
    font-weight: 400;
  }
  .outline button:hover {
    background: var(--paper-low);
  }
  .outline button.on {
    background: var(--accent-wash);
    color: var(--accent-dark);
  }
  .none {
    color: var(--muted);
    font-size: 0.85rem;
    padding: 0 0.6rem;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    min-height: 0;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .search {
    flex: 0 1 22rem;
    min-width: 12rem;
    font: inherit;
    padding: 0.55rem 0.8rem;
    border-radius: 10px;
    border: 1px solid var(--line-strong);
    background: var(--paper);
  }
  .count {
    margin-left: auto;
    color: var(--muted);
    font-size: 0.9rem;
  }
  ul {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: 0.6rem;
    align-content: start;
    overflow: auto;
    flex: 1;
    min-height: 0;
    padding: 0.1rem 0.25rem 0.5rem 0;
  }
  .card {
    position: relative;
    display: flex;
    align-items: stretch;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--paper);
    transition:
      border-color 0.12s,
      box-shadow 0.12s;
  }
  .card:hover {
    border-color: var(--accent-line);
    box-shadow: var(--shadow-lift);
  }
  .read {
    flex: 1;
    min-width: 0;
    display: grid;
    align-content: start;
    gap: 0.35rem;
    padding: 0.8rem 0.9rem;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 0.9rem;
    color: var(--ink-soft);
    font-size: 0.92rem;
  }
  .choices .right {
    color: var(--good);
    font-weight: 800;
  }
  .extra {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
    font-size: 0.82rem;
    color: var(--muted);
  }
  .topic {
    padding: 0 0.45rem;
    border-radius: 999px;
    background: var(--paper-low);
    border: 1px solid var(--line);
  }
  .tools {
    display: flex;
    align-items: start;
    gap: 0.1rem;
    padding: 0.5rem 0.5rem 0 0;
    opacity: 0;
    transition: opacity 0.12s;
  }
  .card:hover .tools,
  .card:focus-within .tools {
    opacity: 1;
  }
  .icon {
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
  .icon:hover {
    background: var(--paper-low);
    color: var(--ink);
  }
  .empty {
    grid-column: 1 / -1;
    padding: 2rem 1rem;
    text-align: center;
    color: var(--muted);
  }
  .link {
    border: 0;
    background: none;
    padding: 0;
    color: var(--accent-dark);
    font: inherit;
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: 1.25rem;
    transform: translateX(-50%);
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.6rem 0.7rem 0.6rem 1rem;
    border-radius: 12px;
    background: var(--ink);
    color: var(--paper);
    box-shadow: var(--shadow-dialog);
  }
  .toast button {
    border: 0;
    border-radius: 8px;
    padding: 0.3rem 0.7rem;
    background: rgb(255 250 243 / 0.15);
    color: var(--paper);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }
  /* Narrow: the Topics go across the top of the list. */
  @container (max-width: 48rem) {
    .workspace {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
    }
    .outline {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }
    .outline h3,
    .none {
      display: none;
    }
  }
  .read .prompt {
    display: block;
    --picture-max: 6rem;
  }
</style>
