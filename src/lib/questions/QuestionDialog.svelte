<script lang="ts">
  // Editing one question, in a pop-up over the bank. Topics come first, as
  // front matter. It works on a copy: Save question (or Cmd/Ctrl+Enter) keeps
  // it; Cancel or Escape lets it go, asking first if anything changed.
  import { Check, Plus, Trash2, X } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import TopicInput from '../components/TopicInput.svelte';
  import type { Question } from '../game/types';
  import RichEditor from '../rich/RichEditor.svelte';
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

  <div class="fields">
    <div class="front">
      <span>Topics</span>
      <TopicInput bind:topics={draft.topics} suggestions={knownTopics} label="Topics" />
    </div>
    <div class="field">
      <span>Question</span>
      <RichEditor
        value={rich.prompt}
        onchange={(value) => ((rich.prompt = value), (draft.prompt = plainOf(value)))}
        label="Question"
        placeholder="e.g. What is 7 × 8? Type / for a picture, math or a table."
        autofocus={isNew}
      />
    </div>

    <fieldset>
      <legend>Answers <small>(click a letter to mark the right one)</small></legend>
      {#each keys as key, i (key)}
        <div class="choice" class:right={draft.correct === i}>
          <button
            type="button"
            class="mark"
            onclick={() => (draft.correct = i)}
            aria-pressed={draft.correct === i}
            aria-label="{letter(i)} is the right answer"
          >
            {#if draft.correct === i}<Check size={16} />{:else}{letter(i)}{/if}
          </button>
          <div class="answer"><RichEditor value={rich.choices[i]} onchange={(value) => setChoice(i, value)} label="Answer {letter(i)}" placeholder="Answer {letter(i)}" /></div>
          {#if draft.choices.length > 2}
            <button type="button" class="icon" onclick={() => removeChoice(i)} aria-label="Remove answer {letter(i)}"><X size={16} /></button>
          {/if}
        </div>
      {/each}
      {#if draft.choices.length < 4}
        <button type="button" class="btn-quiet add" onclick={addChoice}><Plus size={15} aria-hidden="true" /> Add answer {letter(draft.choices.length)}</button>
      {/if}
    </fieldset>

    <div class="field">
      <span>Why it’s right <small>(optional, shown after the answer)</small></span>
      <RichEditor
        value={rich.explanation ?? fromPlain('')}
        onchange={(value) => ((rich.explanation = value), (draft.explanation = plainOf(value)))}
        label="Why it’s right"
        placeholder="A short explanation"
      />
    </div>


    {#if problems.length}
      <ul class="problems" role="alert">{#each problems as p (p)}<li>{p}</li>{/each}</ul>
    {/if}
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
    width: min(48rem, calc(100vw - 2rem));
    max-height: calc(100dvh - 2rem);
    padding: 0;
    border: 0;
    border-radius: 16px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: var(--shadow-dialog);
    flex-direction: column;
  }
  .qdialog[open] {
    display: flex;
  }
  .qdialog::backdrop {
    background: rgb(36 28 23 / 0.45);
    backdrop-filter: blur(2px);
  }
  .front {
    display: grid;
    grid-template-columns: 5rem minmax(0, 1fr);
    align-items: center;
    gap: 0.75rem;
    padding-bottom: 0.9rem;
    border-bottom: 1px solid var(--line);
    font-weight: 700;
  }
  .front :global(.topics) {
    font-weight: 400;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.1rem 0.5rem;
  }
  h2 {
    font-family: var(--serif);
    font-size: 1.2rem;
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
  .fields {
    flex: 1;
    overflow: auto;
    display: grid;
    align-content: start;
    gap: 1rem;
    padding: 0.5rem 1.1rem 1rem;
  }
  fieldset {
    border: 0;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.45rem;
  }
  legend {
    font-weight: 700;
    margin-bottom: 0.35rem;
  }
  legend small,
  .field small {
    font-weight: 400;
    color: var(--muted);
  }
  .choice {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
  }
  .choice > .mark,
  .choice > .icon {
    margin-top: 0.15rem;
  }
  .answer {
    flex: 1;
    min-width: 0;
  }
  .choice.right .answer :global(.rich-editor) {
    border-color: var(--good-line);
    box-shadow: inset 4px 0 0 var(--good);
  }
  .field {
    display: grid;
    gap: 0.35rem;
  }
  .field > span {
    font-weight: 700;
  }
  .mark {
    display: grid;
    place-items: center;
    width: 2.1rem;
    height: 2.1rem;
    flex: none;
    border-radius: 50%;
    border: 1.5px solid var(--line-strong);
    background: var(--paper);
    color: var(--muted);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }
  .choice.right .mark {
    border-color: var(--good);
    background: var(--good);
    color: var(--paper);
  }
  .add {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
  .problems {
    padding: 0.6rem 0.9rem 0.6rem 1.8rem;
    border-radius: 10px;
    background: var(--bad-wash);
    color: var(--bad);
  }
  footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8rem 1.1rem;
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
