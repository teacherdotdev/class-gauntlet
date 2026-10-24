<script lang="ts">
  // Editing one question, in a pop-up over the bank, laid out the way Test
  // Parrot's question editor is: the question's front matter (its Topics) in
  // rows at the top, then the question as a page, its answers in one dashed
  // box with a radio to mark the right one, and why it's right underneath.
  // One toolbar at the top acts on whichever part the teacher is in (the
  // question, until they pick another). It works on a copy: Save question (or
  // Cmd/Ctrl+Enter) keeps it; Cancel or Escape lets it go, asking first if
  // anything changed.
  import { Plus, Tags, Trash2, X } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import TopicInput from '../components/TopicInput.svelte';
  import type { Question } from '../game/types';
  import RichEditor from '../rich/RichEditor.svelte';
  import RichToolbar from '../rich/RichToolbar.svelte';
  import { noFormats, type Formats, type RichCommand } from '../rich/toolbar';
  import { fromPlain, plainOf, type RichQuestion, type RichText } from '../rich/text';
  import { cleanQuestion, questionProblems } from './edit';

  let {
    question,
    isNew,
    knownTopics,
    onsave,
    ondelete,
    onclose,
  }: {
    question: Question;
    isNew: boolean;
    knownTopics: string[];
    onsave: (question: Question) => void;
    ondelete: () => void;
    onclose: () => void;
  } = $props();

  // A working copy, so Cancel leaves the bank untouched.
  // (The page remounts the panel for each question, so reading it once is right.)
  // Every field is Rich Text while it's edited; saving works out the plain text.
  let draft = $state<Question>(untrack(() => structuredClone($state.snapshot(question))));
  let rich = $state<RichQuestion>(
    untrack(() =>
      structuredClone(
        $state.snapshot(question.rich) ?? {
          prompt: fromPlain(question.prompt),
          choices: question.choices.map(fromPlain),
          explanation: fromPlain(question.explanation ?? ''),
        },
      ),
    ),
  );
  // Each answer's editor keeps its place when one above it is removed.
  let nextKey = 0;
  let keys = $state(untrack(() => question.choices.map(() => nextKey++)));
  let problems = $state<string[]>([]);
  /** Every field's editor, and the one the toolbar acts on. */
  const editors: Record<string, RichEditor> = {};
  let active = 'prompt';
  let formats = $state<Formats>(noFormats);
  let pictureProblem = $state('');
  let dialog: HTMLDialogElement;
  const current = (): Question => cleanQuestion({ ...$state.snapshot(draft), rich: $state.snapshot(rich) } as Question);
  const dirty = $derived(JSON.stringify(current()) !== JSON.stringify(cleanQuestion(question)));
  const letter = (i: number) => String.fromCharCode(65 + i);

  $effect(() => {
    dialog.showModal();
  });

  function save() {
    const saved = current();
    problems = questionProblems(saved);
    if (!problems.length) onsave(saved);
  }

  const field = (name: string) => ({
    onfocus: () => (active = name),
    onformats: (next: Formats) => (formats = next),
    onproblem: (message: string) => (pictureProblem = message),
  });

  function runTool(command: RichCommand) {
    pictureProblem = '';
    (editors[active] ?? editors.prompt)?.run(command);
  }

  function setChoice(i: number, value: RichText) {
    rich.choices[i] = value;
    draft.choices[i] = plainOf(value);
  }

  function close() {
    if (!dirty || confirm('Close without saving this question?')) onclose();
  }

  function addChoice() {
    draft.choices.push('');
    rich.choices.push(fromPlain(''));
    keys.push(nextKey++);
  }

  function removeChoice(i: number) {
    draft.choices.splice(i, 1);
    rich.choices.splice(i, 1);
    keys.splice(i, 1);
    if (draft.correct === i) draft.correct = 0;
    else if (draft.correct > i) draft.correct--;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      save();
    }
  }
</script>

<dialog
  bind:this={dialog}
  class="qdialog"
  aria-label={isNew ? 'New question' : 'Edit question'}
  {onkeydown}
  oncancel={(e) => {
    e.preventDefault();
    close();
  }}
  onclick={(e) => e.target === dialog && close()}
>
  <header>
    <h2>{isNew ? 'New question' : 'Edit question'}</h2>
    <button class="icon" onclick={close} aria-label="Close"><X size={18} /></button>
  </header>

  <div class="front">
    <div class="row">
      <span class="prop"><Tags size={14} aria-hidden="true" /> Topics</span>
      <TopicInput bind:topics={draft.topics} suggestions={knownTopics} label="Topics" />
    </div>
  </div>

  <div class="tools"><RichToolbar {formats} onrun={runTool} /></div>

  <div class="page">
    <div class="sheet">
      <RichEditor
        bind:this={editors.prompt}
        value={rich.prompt}
        onchange={(value) => ((rich.prompt = value), (draft.prompt = plainOf(value)))}
        label="Question"
        placeholder="Write the question. Type / for lists, tables and more."
        autofocus={isNew}
        {...field('prompt')}
      />

      <div class="answers" role="group" aria-label="Answers">
        {#each keys as key, i (key)}
          <div class="choice" class:right={draft.correct === i}>
            <button
              type="button"
              class="radio"
              onclick={() => (draft.correct = i)}
              aria-pressed={draft.correct === i}
              aria-label="{letter(i)} is the right answer"
              title="Mark as the right answer"
            ></button>
            <div class="answer">
              <RichEditor
                bind:this={editors[`choice-${key}`]}
                value={rich.choices[i]}
                onchange={(value) => setChoice(i, value)}
                label="Answer {letter(i)}"
                placeholder="Answer"
                {...field(`choice-${key}`)}
              />
            </div>
            {#if draft.choices.length > 2}
              <button type="button" class="remove" onclick={() => removeChoice(i)} aria-label="Remove answer {letter(i)}" title="Remove this answer"><X size={15} /></button>
            {/if}
          </div>
        {/each}
        {#if draft.choices.length < 4}
          <button type="button" class="add" onclick={addChoice}><Plus size={15} aria-hidden="true" /> Add answer</button>
        {/if}
      </div>

      <div class="why">
        <span class="prop">Explanation</span>
        <RichEditor
          value={rich.explanation ?? fromPlain('')}
          onchange={(value) => ((rich.explanation = value), (draft.explanation = plainOf(value)))}
          label="Explanation"
          placeholder="Explain the answer"
          {...field('explanation')}
        />
      </div>

      {#if pictureProblem}<p class="problems" role="alert">{pictureProblem}</p>{/if}
      {#if problems.length}
        <ul class="problems" role="alert">{#each problems as p (p)}<li>{p}</li>{/each}</ul>
      {/if}
    </div>
  </div>

  <footer>
    {#if !isNew}<button class="btn-quiet danger" onclick={ondelete}><Trash2 size={16} aria-hidden="true" /> Delete</button>{/if}
    <span class="spacer"></span>
    <button class="btn-ghost" onclick={close}>Cancel</button>
    <button class="btn-primary" onclick={save} title="Save (⌘/Ctrl + Enter)">Save question</button>
  </footer>
</dialog>

<style>
  .qdialog {
    width: min(61rem, calc(100vw - 2rem));
    height: min(51rem, calc(100dvh - 2rem));
    padding: 0;
    border: 0;
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: var(--shadow-dialog);
    flex-direction: column;
    overflow: hidden;
  }
  .qdialog[open] {
    display: flex;
  }
  .qdialog::backdrop {
    background: rgb(36 28 23 / 0.45);
    backdrop-filter: blur(2px);
  }
  header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.45rem 0.6rem 0.45rem 1.1rem;
    border-bottom: 1px solid var(--line);
  }
  h2 {
    font-family: var(--serif);
    font-size: 1.1rem;
    margin-right: auto;
  }
  .icon {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    flex: none;
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
  /* The front matter hangs off the same left edge as the question below it. */
  .front {
    padding: 0.7rem max(2.25rem, calc((100% - 45rem) / 2));
    border-bottom: 1px solid var(--line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .row :global(.topics) {
    flex: 1;
  }
  .prop {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    flex: 0 0 7.5rem;
    color: var(--ink-soft);
    font-size: 0.82rem;
  }
  .page {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  .sheet {
    display: grid;
    align-content: start;
    gap: 1.4rem;
    padding: 2rem max(2.25rem, calc((100% - 45rem) / 2)) 2.5rem;
  }
  /* The toolbar runs across the dialog under the front matter, as Google
     Docs' does, its buttons starting at the question's own left margin. */
  .tools {
    display: flex;
    padding: 0.3rem calc(max(2.25rem, calc((100% - 45rem) / 2)) - 0.5rem);
    border-bottom: 1px solid var(--line);
  }
  .sheet > :global(.rich-editor .ProseMirror p) {
    font-size: 1.05rem;
  }
  /* Answers as Test Parrot draws them: dashed cells you type into, a radio
     hard against the left of each, and Add answer along the bottom. */
  .answers {
    border: 1px dashed var(--line-strong);
    border-radius: 6px;
    overflow: hidden;
  }
  .choice {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.6rem 0.75rem;
    border-bottom: 1px dashed var(--line-strong);
  }
  .choice.right {
    background: var(--good-wash);
  }
  .answer {
    flex: 1;
    min-width: 0;
  }
  .radio {
    flex: none;
    width: 1rem;
    height: 1rem;
    margin-top: 0.22rem;
    padding: 0;
    border: 1.5px solid var(--muted);
    border-radius: 50%;
    background: var(--paper);
    cursor: pointer;
  }
  .radio:hover {
    border-color: var(--good);
  }
  .choice.right .radio {
    border-color: var(--good);
    background: radial-gradient(circle, var(--good) 0 45%, var(--paper) 50%);
  }
  .remove {
    flex: none;
    display: grid;
    place-items: center;
    width: 1.5rem;
    height: 1.5rem;
    border: 0;
    border-radius: 5px;
    background: none;
    color: var(--muted);
    cursor: pointer;
    opacity: 0;
    transition: opacity 120ms;
  }
  .choice:hover .remove,
  .choice:focus-within .remove,
  .remove:focus-visible {
    opacity: 1;
  }
  .remove:hover {
    background: var(--paper-low);
    color: var(--ink);
  }
  .add {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 0;
    background: none;
    color: var(--ink-soft);
    font: inherit;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .add:hover {
    background: var(--paper-low);
    color: var(--accent);
  }
  .choice:last-of-type:not(:has(+ .add)) {
    border-bottom: 0;
  }
  /* Its own dashed box, drawn like the answers, so what's written in it plainly belongs to it. */
  .why {
    display: grid;
    gap: 0.3rem;
    padding: 0.6rem 0.75rem;
    border: 1px dashed var(--line-strong);
    border-radius: 6px;
  }
  .why .prop {
    flex: none;
  }
  .problems {
    padding: 0.6rem 0.9rem 0.6rem 1.8rem;
    border-radius: 10px;
    background: var(--bad-wash);
    color: var(--bad);
  }
  p.problems {
    padding-left: 0.9rem;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.1rem;
    border-top: 1px solid var(--line);
  }
  footer .danger {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--bad);
  }
  .spacer {
    flex: 1;
  }
</style>
