<script lang="ts">
  // Choosing the questions to play, in order: the question browser on the
  // left, the list on the right. Drag questions across, click them, or filter
  // to a bank and press Add all. Champion and Classic both set up this way.
  import Rich from '../rich/Rich.svelte';
  import { library } from '../questions/store.svelte';
  import { ArrowDown, ArrowUp, X } from '@lucide/svelte';
  import { dragged, endDrag } from './drag';
  import QuestionBrowser from './QuestionBrowser.svelte';

  let { ids = $bindable() }: { ids: string[] } = $props();
  let over = $state(false);

  const questions = $derived(new Map(library.sorted.flatMap((bank) => bank.questions.map((q) => [q.id, q] as const))));
  const deck = $derived(ids.flatMap((id) => questions.get(id) ?? []));
  const used = $derived(new Set(ids));

  const add = (more: string[]) => (ids = [...ids, ...more.filter((id) => !ids.includes(id))]);
  const remove = (id: string) => (ids = ids.filter((i) => i !== id));

  function move(i: number, by: number) {
    const j = i + by;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[i], next[j]] = [next[j], next[i]];
    ids = next;
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    over = false;
    const d = dragged();
    endDrag();
    if (d) add(d.ids);
  }
</script>

<div class="frame">
<div class="split">
  <aside class="left">
    <QuestionBrowser {used} onadd={add} onaddall={add} />
  </aside>
  <section
    class="deck"
    class:over
    aria-label="Questions to play"
    ondragover={(e) => { e.preventDefault(); over = true; }}
    ondragleave={() => (over = false)}
    ondrop={drop}
  >
    <div class="deck-head">
      <h2>Questions to play</h2>
      {#if deck.length}<button class="btn-quiet" onclick={() => (ids = [])}>Clear</button>{/if}
    </div>
    {#if deck.length}
      <ol>
        {#each deck as q, i (q.id)}
          <li>
            <span class="n">{i + 1}</span>
            <span class="prompt"><Rich rich={q.rich?.prompt} text={q.prompt} /></span>
            <button class="icon" onclick={() => move(i, -1)} disabled={i === 0} aria-label="Move question {i + 1} up"><ArrowUp size={16} /></button>
            <button class="icon" onclick={() => move(i, 1)} disabled={i === deck.length - 1} aria-label="Move question {i + 1} down"><ArrowDown size={16} /></button>
            <button class="icon" onclick={() => remove(q.id)} aria-label="Remove question {i + 1}"><X size={16} /></button>
          </li>
        {/each}
      </ol>
    {:else}
      <p class="empty">Drag questions here, press + on them, or filter to a bank and press <strong>Add all</strong>.</p>
    {/if}
  </section>
</div>
</div>

<style>
  .frame {
    container-type: inline-size;
  }
  .split {
    display: grid;
    grid-template-columns: minmax(18rem, 26rem) minmax(0, 1fr);
    gap: 1.5rem;
    height: calc(100vh - 9.5rem);
    min-height: 30rem;
  }
  .left {
    min-height: 0;
  }
  .deck {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    min-height: 0;
    padding: 1rem;
    border-radius: 16px;
    background: var(--paper);
    border: 2px dashed var(--line-strong);
  }
  .deck.over {
    border-color: var(--accent);
    background: var(--accent-wash);
  }
  .deck-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h2 {
    font-family: var(--serif);
    font-size: 1.2rem;
  }
  ol {
    list-style: none;
    display: grid;
    gap: 0.35rem;
    overflow: auto;
    align-content: start;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    border-radius: 10px;
    background: var(--paper-low);
  }
  .n {
    font-family: var(--display);
    font-size: 1.2rem;
    width: 1.8rem;
    color: var(--accent);
  }
  .prompt {
    --picture-max: 4rem;
    flex: 1;
    min-width: 0;
  }
  .icon {
    border: 0;
    background: none;
    color: var(--muted);
    cursor: pointer;
    padding: 0.2rem 0.35rem;
  }
  .icon:disabled {
    opacity: 0.3;
  }
  .empty {
    margin: auto;
    max-width: 24rem;
    text-align: center;
    color: var(--muted);
  }
  @container (max-width: 50rem) {
    .split {
      grid-template-columns: 1fr;
      height: auto;
    }
    .left {
      height: 24rem;
    }
    .deck {
      min-height: 16rem;
    }
  }
</style>
