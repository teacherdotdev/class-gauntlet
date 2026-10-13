<script lang="ts">
  // Building a Peril! Board: questions from the browser on the left go onto
  // Tiles on the right. Drag one onto a Tile, drag a whole list onto a
  // Column's title, or click a Tile and then a question. Clicking a filled
  // Tile shows its question, to swap or take off.
  import {
    addColumn,
    clearTile,
    fillColumn,
    fillNextColumn,
    MAX_COLUMNS,
    onBoard,
    placeQuestion,
    removeColumn,
    renameColumn,
    swapTiles,
    type BoardDraft,
  } from '../game/peril/draft';
  import { library } from '../questions/store.svelte';
  import { X } from '@lucide/svelte';
  import { dragged, endDrag, startDrag } from './drag';
  import QuestionBrowser from './QuestionBrowser.svelte';

  let { draft = $bindable() }: { draft: BoardDraft } = $props();

  type Spot = { column: number; row: number };
  let selected = $state<Spot | null>(null);
  let shown = $state<Spot | null>(null);
  let over = $state('');

  const used = $derived(onBoard(draft));
  const questions = $derived(new Map(library.sorted.flatMap((bank) => bank.questions.map((q) => [q.id, q] as const))));
  const titleOf = (c: number) => draft.columns[c]?.title.trim() || `Column ${c + 1}`;
  const pickLabel = $derived(selected ? `Place on ${titleOf(selected.column)} ${(selected.row + 1) * 100}` : null);
  const shownQuestion = $derived(shown ? questions.get(draft.columns[shown.column]?.tiles[shown.row] ?? '') : undefined);

  /** Onto the chosen Tile, or else into the first empty Tiles, in order. */
  function add(ids: string[]) {
    for (const id of ids) {
      if (selected) {
        draft = placeQuestion(draft, selected.column, selected.row, id);
        selected = null;
        continue;
      }
      const c = draft.columns.findIndex((column) => column.tiles.includes(null));
      if (c < 0) return;
      draft = placeQuestion(draft, c, draft.columns[c].tiles.indexOf(null), id);
    }
  }

  function clickTile(column: number, row: number) {
    shown = null;
    if (draft.columns[column].tiles[row]) shown = { column, row };
    else selected = selected?.column === column && selected.row === row ? null : { column, row };
  }

  function dropOnTile(event: DragEvent, column: number, row: number) {
    event.preventDefault();
    over = '';
    const d = dragged();
    endDrag();
    if (!d?.ids.length) return;
    if (d.from) draft = swapTiles(draft, d.from, { column, row });
    // A list dropped on a Tile fills its Column's empty Tiles.
    else if (d.ids.length === 1) draft = placeQuestion(draft, column, row, d.ids[0]);
    else draft = fillColumn(draft, column, d.ids, d.title);
  }

  function dropOnColumn(event: DragEvent, column: number) {
    event.preventDefault();
    over = '';
    const d = dragged();
    endDrag();
    if (d?.ids.length) draft = fillColumn(draft, column, d.ids, d.title);
  }

  const allow = (key: string) => (event: DragEvent) => {
    event.preventDefault();
    over = key;
  };
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && ((selected = null), (shown = null))} />

<div class="frame">
<div class="builder">
  <aside class="left">
    <QuestionBrowser {used} {pickLabel} onadd={add} onaddall={(ids, title) => (draft = fillNextColumn(draft, ids, title))} />
  </aside>

  <section class="right" aria-label="Board">
    <div class="board" style="--cols: {draft.columns.length}">
      {#each draft.columns as column, c (c)}
        <div class="column">
          <div
            class="head"
            class:over={over === `h${c}`}
            role="group"
            aria-label="Column {c + 1}"
            ondragover={allow(`h${c}`)}
            ondragleave={() => (over = '')}
            ondrop={(e) => dropOnColumn(e, c)}
          >
            <textarea rows="2" value={column.title} placeholder="Column {c + 1}" aria-label="Column {c + 1} title" oninput={(e) => (draft = renameColumn(draft, c, e.currentTarget.value.replace(/\n/g, ' ')))}></textarea>
            {#if draft.columns.length > 1}
              <button class="x" onclick={() => (draft = removeColumn(draft, c))} aria-label="Remove column {c + 1}" title="Remove column"><X size={16} /></button>
            {/if}
          </div>
          {#each column.tiles as id, r (r)}
            {@const question = id ? questions.get(id) : undefined}
            <button
              class="tile"
              class:filled={!!question}
              class:selected={selected?.column === c && selected.row === r}
              class:over={over === `${c}:${r}`}
              draggable={!!question}
              ondragstart={(e) => id && startDrag(e, { ids: [id], title: '', from: { column: c, row: r } })}
              ondragend={endDrag}
              ondragover={allow(`${c}:${r}`)}
              ondragleave={() => (over = '')}
              ondrop={(e) => dropOnTile(e, c, r)}
              onclick={() => clickTile(c, r)}
              aria-label="{titleOf(c)} {(r + 1) * 100}: {question ? question.prompt : 'empty'}"
            >
              <span class="value">{(r + 1) * 100}</span>
              {#if question}<span class="q">{question.prompt}</span>{:else}<span class="plus">+</span>{/if}
            </button>
          {/each}
        </div>
      {/each}
      {#if draft.columns.length < MAX_COLUMNS}
        <button class="add-col" onclick={() => (draft = addColumn(draft))}>+ Column</button>
      {/if}
    </div>
    <p class="hint">Drag questions onto tiles, or click a tile and then a question. Add all fills the next empty column.</p>

    {#if shown && shownQuestion}
      <div class="card" role="dialog" aria-label="Tile question">
        <p class="where">{titleOf(shown.column)} · {(shown.row + 1) * 100}</p>
        <p class="prompt">{shownQuestion.prompt}</p>
        <ol type="A">
          {#each shownQuestion.choices as choice, i (i)}<li class:correct={i === shownQuestion.correct}>{choice}</li>{/each}
        </ol>
        <div class="actions">
          <button class="btn-ghost" onclick={() => ((selected = shown), (shown = null))}>Swap question</button>
          <button class="btn-quiet danger" onclick={() => { draft = clearTile(draft, shown!.column, shown!.row); shown = null; }}>Take off the board</button>
          <button class="btn-quiet" onclick={() => (shown = null)}>Close</button>
        </div>
      </div>
    {/if}
  </section>
</div>
</div>

<style>
  /* The builder sizes itself to the room beside the sidebar, not the window. */
  .frame {
    container-type: inline-size;
  }
  .builder {
    display: grid;
    grid-template-columns: minmax(18rem, 26rem) minmax(0, 1fr);
    gap: 1.5rem;
    height: calc(100vh - 9.5rem);
    min-height: 32rem;
  }
  .left {
    min-height: 0;
  }
  .right {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    min-width: 0;
  }
  .board {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(7rem, 1fr)) auto;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 0.75rem;
    border-radius: 16px;
    background: var(--night);
  }
  .column {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto repeat(5, minmax(0, 1fr));
    gap: 0.5rem;
    min-width: 0;
  }
  .head {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0.3rem;
    border-radius: 10px;
    background: var(--paper);
    border: 2px solid transparent;
  }
  .head.over {
    border-color: var(--amber-strong);
    box-shadow: 0 0 0 4px rgb(240 210 124 / 0.4);
  }
  .head textarea {
    flex: 1;
    width: 100%;
    min-width: 0;
    resize: none;
    font-family: var(--serif);
    font-weight: 700;
    font-size: 0.9rem;
    line-height: 1.2;
    text-align: center;
    border: 0;
    background: transparent;
    padding: 0.2rem;
    overflow: hidden;
  }
  /* Remove shows when the Column is pointed at or focused. */
  .x {
    position: absolute;
    top: -0.45rem;
    right: -0.45rem;
    width: 1.4rem;
    height: 1.4rem;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: var(--ink);
    color: var(--paper);
    font-size: 0.7rem;
    cursor: pointer;
    opacity: 0;
  }
  .head:hover .x,
  .head:focus-within .x,
  .x:focus-visible {
    opacity: 1;
  }
  .tile {
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 0.2rem;
    min-height: 4.2rem;
    padding: 0.4rem;
    border-radius: 10px;
    border: 2px dashed rgb(255 250 243 / 0.25);
    background: rgb(255 250 243 / 0.04);
    color: rgb(255 250 243 / 0.55);
    font: inherit;
    cursor: pointer;
    overflow: hidden;
    min-width: 0;
  }
  .tile.filled {
    cursor: grab;
  }
  .tile.filled {
    border: 2px solid var(--or);
    background: linear-gradient(170deg, #2f5d8f, #1d3c60);
    color: var(--paper);
  }
  .tile.selected,
  .tile.over {
    border: 2px solid var(--amber-strong);
    box-shadow: 0 0 0 4px rgb(240 210 124 / 0.35);
  }
  .value {
    font-family: var(--display);
    font-size: 1.5rem;
    line-height: 1;
    color: var(--amber-strong);
  }
  .q {
    font-size: 0.75rem;
    line-height: 1.2;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: anywhere;
  }
  .plus {
    font-size: 1.2rem;
  }
  .add-col {
    align-self: stretch;
    writing-mode: vertical-rl;
    font: inherit;
    font-weight: 700;
    padding: 0.5rem;
    border-radius: 10px;
    border: 2px dashed rgb(255 250 243 / 0.25);
    background: transparent;
    color: rgb(255 250 243 / 0.7);
    cursor: pointer;
  }
  .hint {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .card {
    position: absolute;
    right: 1rem;
    bottom: 3rem;
    width: min(26rem, 90%);
    display: grid;
    gap: 0.5rem;
    padding: 1rem 1.1rem;
    border-radius: 14px;
    background: var(--paper);
    box-shadow: var(--shadow-dialog);
  }
  .where {
    font-weight: 800;
    color: var(--accent-dark);
    font-size: 0.85rem;
  }
  .prompt {
    font-family: var(--serif);
    font-weight: 700;
    font-size: 1.1rem;
  }
  .card ol {
    padding-left: 1.4rem;
  }
  li.correct {
    color: var(--good);
    font-weight: 800;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .danger {
    color: var(--bad);
  }
  @container (max-width: 54rem) {
    .builder {
      grid-template-columns: 1fr;
      height: auto;
    }
    .left {
      height: 24rem;
    }
    .column {
      grid-template-rows: auto repeat(5, 4.2rem);
    }
  }
</style>
