<script lang="ts">
  // Every question in the library, to search and filter the way Notion
  // filters a table (see FilterChips). Click to select, Shift- or Cmd-click
  // for more; + adds, and dragging carries the selection.
  import Rich from '../rich/Rich.svelte';
  import type { Question } from '../game/types';
  import { Plus } from '@lucide/svelte';
  import { browse, libraryTopics, select, type QuestionFilter, type Selection } from '../questions/browse';
  import { library } from '../questions/store.svelte';
  import { plural } from '../words';
  import { endDrag, startDrag } from './drag';
  import FilterChips from './FilterChips.svelte';

  let {
    used,
    pickLabel = null,
    onadd,
    onaddall,
  }: {
    /** Questions already placed; they leave the list. */
    used: Set<string>;
    /** When set, clicking a question picks it, e.g. "Place on Halves 300". */
    pickLabel?: string | null;
    /** Adds these questions (the + on a card, or the selection). */
    onadd: (ids: string[]) => void;
    /** Adds every question showing, with the name the filter gives them. */
    onaddall?: (ids: string[], title: string) => void;
  } = $props();

  let search = $state('');
  let filters = $state<QuestionFilter[]>([]);
  let selection = $state<Selection>({ ids: [], anchor: null });

  const topics = $derived(libraryTopics(library.sorted));
  const rows = $derived(browse(library.sorted, { search, filters }).filter((row) => !used.has(row.question.id)));
  const order = $derived(rows.map((row) => row.question.id));
  /** Selected questions still showing, in list order. */
  const selected = $derived(order.filter((id) => selection.ids.includes(id)));

  function clickRow(event: MouseEvent, question: Question) {
    // With a Tile waiting, a click places the question there.
    if (pickLabel) return onadd([question.id]);
    selection = select(selection, question.id, { toggle: event.metaKey || event.ctrlKey, range: event.shiftKey }, order);
  }

  function addFrom(id: string) {
    onadd(selected.includes(id) ? selected : [id]);
    selection = { ids: [], anchor: null };
  }

  /** Dragging a selected question carries the whole selection. */
  const dragIds = (id: string) => (selected.includes(id) ? selected : [id]);

  const labelOf = (filter: QuestionFilter, value: string) =>
    filter.property === 'bank' ? (library.get(value)?.title ?? 'Missing bank') : value;
  /** The name a whole list gives a Column: the one value it's filtered to, if any. */
  const listTitle = $derived.by(() => {
    const chosen = filters.flatMap((filter) => filter.values.map((value) => labelOf(filter, value)));
    return chosen.length === 1 ? chosen[0] : search.trim();
  });

</script>


<div class="browser">
  <input class="search" type="search" bind:value={search} placeholder="Search questions" aria-label="Search questions" />

  <FilterChips bind:filters properties={['bank', 'topic']} {topics} />

  <div class="results-head">
    <span>{plural(rows.length, 'question')}</span>
    {#if rows.length}
      {#if onaddall}<button class="btn-quiet small" onclick={() => onaddall(rows.map((r) => r.question.id), listTitle)}>Add all {rows.length}</button>{/if}
    {/if}
  </div>
  {#if pickLabel}<p class="picking">Click a question to {pickLabel.toLowerCase()}.</p>{/if}

  {#if selected.length}
    <div class="selected-bar" role="status">
      <span>{plural(selected.length, 'question')} selected</span>
      <button class="btn-quiet small" onclick={() => (selection = { ids: [], anchor: null })}>Clear</button>
      <button class="btn-primary small" onclick={() => addFrom(selected[0])}><Plus size={15} aria-hidden="true" /> Add {selected.length}</button>
    </div>
  {:else if !pickLabel}
    <p class="tip">Click to select; Shift- or {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}-click for more. Drag them across, or press +.</p>
  {/if}

  <ul class="rows">
    {#each rows as row (row.question.id)}
      {@const id = row.question.id}
      <li
        class="card"
        class:selected={selected.includes(id)}
        draggable="true"
        ondragstart={(e) => startDrag(e, { ids: dragIds(id), title: '' })}
        ondragend={endDrag}
      >
        <button class="row" onclick={(e) => clickRow(e, row.question)} aria-pressed={selected.includes(id)} title={pickLabel ?? undefined}>
          <span class="prompt"><Rich rich={row.question.rich?.prompt} text={row.question.prompt} /></span>
          <span class="meta">
            <span>{row.bank.title}</span>
            {#each row.question.topics ?? [] as topic (topic)}<span class="topic">{topic}</span>{/each}
          </span>
        </button>
        <button
          class="plus"
          onclick={() => addFrom(id)}
          aria-label={selected.includes(id) && selected.length > 1 ? `Add the ${selected.length} selected questions` : `Add “${row.question.prompt}”`}
          title={selected.includes(id) && selected.length > 1 ? `Add ${selected.length} selected` : 'Add'}
        >
          <Plus size={18} />
        </button>
      </li>
    {:else}
      <li class="none">No questions match. <a href="/banks">Add some to a bank</a>.</li>
    {/each}
  </ul>
</div>

<style>
  .browser {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    min-height: 0;
    height: 100%;
  }
  .search {
    font: inherit;
    padding: 0.6rem 0.8rem;
    border-radius: 10px;
    border: 1px solid var(--line-strong);
    background: var(--paper);
  }
  .results-head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--muted);
    font-size: 0.9rem;
  }
  .results-head > span:first-child {
    flex: 1;
  }
  .small {
    font-size: 0.85rem;
  }
  .picking {
    padding: 0.45rem 0.7rem;
    border-radius: 8px;
    background: var(--amber);
    color: #5a4000;
    font-weight: 700;
    font-size: 0.9rem;
  }
  .rows {
    list-style: none;
    display: grid;
    gap: 0.4rem;
    overflow: auto;
    min-height: 0;
    flex: 1;
    align-content: start;
    padding-right: 0.25rem;
  }
  .card {
    position: relative;
    display: flex;
    align-items: stretch;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--paper);
    cursor: grab;
  }
  .card:hover {
    border-color: var(--accent-line);
    box-shadow: var(--shadow-lift);
  }
  /* A highlighter swipe across what's selected. */
  .card.selected {
    border-color: var(--amber-border);
    background: linear-gradient(100deg, rgb(246 226 168 / 0.95), rgb(240 210 124 / 0.75) 70%, rgb(246 226 168 / 0.55));
  }
  .row {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 0.25rem;
    padding: 0.6rem 0.75rem;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: inherit;
  }
  .plus {
    display: grid;
    place-items: center;
    width: 2.4rem;
    flex: none;
    border: 0;
    border-left: 1px solid var(--line);
    border-radius: 0 10px 10px 0;
    background: none;
    color: var(--accent-dark);
    cursor: pointer;
  }
  .plus:hover {
    background: var(--accent-wash);
  }
  .selected-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.4rem 0.4rem 0.75rem;
    border-radius: 10px;
    background: var(--amber);
    font-weight: 700;
    font-size: 0.9rem;
  }
  .selected-bar span {
    flex: 1;
  }
  .selected-bar .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .tip {
    color: var(--muted);
    font-size: 0.82rem;
  }
  .prompt {
    --picture-max: 4rem;
    font-weight: 600;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
    font-size: 0.78rem;
    color: var(--muted);
  }
  .topic {
    padding: 0 0.4rem;
    border-radius: 999px;
    background: var(--paper-low);
    border: 1px solid var(--line);
  }
  .none {
    color: var(--muted);
    padding: 0.5rem;
  }
</style>
