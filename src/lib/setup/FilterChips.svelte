<script lang="ts">
  // Notion-style filters: "+ Filter" adds a chip on a property (a bank, a
  // Topic), and each chip keeps questions matching any value it holds. Every
  // chip must match. A click outside a chip's pop-up closes it.
  import { ChevronDown, Plus } from '@lucide/svelte';
  import type { QuestionFilter } from '../questions/browse';
  import { library } from '../questions/store.svelte';

  let {
    filters = $bindable(),
    properties,
    topics,
  }: { filters: QuestionFilter[]; properties: QuestionFilter['property'][]; topics: string[] } = $props();

  let adding = $state(false);
  let editing = $state<number | null>(null);
  let valueSearch = $state('');

  const name = { bank: 'Bank', topic: 'Topic' } as const;
  const banks = $derived(library.sorted.filter((bank) => bank.questions.length));
  const labelOf = (filter: QuestionFilter, value: string) =>
    filter.property === 'bank' ? (library.get(value)?.title ?? 'Missing bank') : value;
  const optionsOf = (filter: QuestionFilter) =>
    (filter.property === 'bank' ? banks.map((b) => ({ value: b.id, label: b.title })) : topics.map((t) => ({ value: t, label: t }))).filter(
      (option) => option.label.toLowerCase().includes(valueSearch.toLowerCase()),
    );

  function addFilter(property: QuestionFilter['property']) {
    filters = [...filters, { property, values: [] }];
    adding = false;
    editing = filters.length - 1;
    valueSearch = '';
  }

  function toggleValue(index: number, value: string) {
    const filter = filters[index];
    filter.values = filter.values.includes(value) ? filter.values.filter((v) => v !== value) : [...filter.values, value];
  }

  function removeFilter(index: number) {
    filters = filters.filter((_, i) => i !== index);
    editing = null;
  }
</script>

<svelte:window
  onkeydown={(e) => e.key === 'Escape' && ((adding = false), (editing = null))}
  onpointerdown={(e) => {
    if (!(e.target as Element).closest?.('.chip-wrap')) {
      adding = false;
      editing = null;
    }
  }}
/>

<div class="filters">
  {#each filters as filter, i (i)}
    <div class="chip-wrap">
      <button class="chip" class:empty={!filter.values.length} onclick={() => ((editing = editing === i ? null : i), (valueSearch = ''))} aria-expanded={editing === i}>
        <span class="prop">{name[filter.property]}</span>
        {filter.values.length ? filter.values.map((v) => labelOf(filter, v)).join(', ') : 'any'}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {#if editing === i}
        <div class="pop" role="dialog" aria-label="{name[filter.property]} filter">
          <input bind:value={valueSearch} placeholder="Search {filter.property === 'bank' ? 'banks' : 'topics'}" aria-label="Search values" />
          <ul>
            {#each optionsOf(filter) as option (option.value)}
              <li>
                <label><input type="checkbox" checked={filter.values.includes(option.value)} onchange={() => toggleValue(i, option.value)} /> {option.label}</label>
              </li>
            {:else}
              <li class="none">{filter.property === 'topic' ? 'No topics yet. Add them to a question.' : 'Nothing matches.'}</li>
            {/each}
          </ul>
          <button class="remove" onclick={() => removeFilter(i)}>Remove filter</button>
        </div>
      {/if}
    </div>
  {/each}
  <div class="chip-wrap">
    {#if properties.length === 1}
      <button class="add" onclick={() => addFilter(properties[0])}><Plus size={14} aria-hidden="true" /> Filter</button>
    {:else}
      <button class="add" onclick={() => (adding = !adding)} aria-expanded={adding}><Plus size={14} aria-hidden="true" /> Filter</button>
      {#if adding}
        <div class="pop menu" role="menu">
          {#each properties as property (property)}<button role="menuitem" onclick={() => addFilter(property)}>{name[property]}</button>{/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }
  .chip-wrap {
    position: relative;
  }
  .chip,
  .add {
    font: inherit;
    font-size: 0.85rem;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    border: 1px solid var(--accent-line);
    background: var(--accent-wash);
    color: var(--accent-dark);
    cursor: pointer;
  }
  .chip.empty {
    background: var(--paper);
  }
  .prop {
    font-weight: 800;
    margin-right: 0.15rem;
  }
  .add {
    border-style: dashed;
    background: transparent;
    color: var(--muted);
    border-color: var(--line-strong);
  }
  .pop {
    position: absolute;
    top: calc(100% + 0.3rem);
    left: 0;
    z-index: 10;
    min-width: 15rem;
    max-height: 18rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.5rem;
    border-radius: 10px;
    background: var(--paper);
    box-shadow: var(--shadow-dialog);
  }
  .pop input:not([type]) {
    font: inherit;
    padding: 0.35rem 0.5rem;
    border-radius: 6px;
    border: 1px solid var(--line);
  }
  .pop ul {
    list-style: none;
    overflow: auto;
  }
  .pop label {
    display: flex;
    gap: 0.4rem;
    padding: 0.3rem 0.25rem;
    border-radius: 6px;
    cursor: pointer;
  }
  .pop label:hover {
    background: var(--paper-low);
  }
  .menu button,
  .remove {
    font: inherit;
    text-align: left;
    padding: 0.4rem 0.5rem;
    border: 0;
    border-radius: 6px;
    background: none;
    cursor: pointer;
  }
  .menu button:hover {
    background: var(--paper-low);
  }
  .remove {
    color: var(--bad);
    border-top: 1px solid var(--line);
    border-radius: 0;
  }
  .chip,
  .add {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .none {
    color: var(--muted);
    padding: 0.4rem;
    font-size: 0.85rem;
  }
</style>
