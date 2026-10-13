<script lang="ts">
  import { X } from '@lucide/svelte';
  // A question's Topics as chips. Type a Topic and press Enter (or a comma);
  // Topics already in the library are suggested as you type.
  let {
    topics = $bindable(),
    suggestions = [],
    label,
  }: { topics: string[] | undefined; suggestions?: string[]; label: string } = $props();

  let text = $state('');
  const listId = `topics-${Math.random().toString(36).slice(2)}`;
  const current = $derived(topics ?? []);

  function add(raw: string) {
    const topic = raw.trim().replace(/\s+/g, ' ');
    if (topic && !current.some((t) => t.toLowerCase() === topic.toLowerCase()))
      topics = [...current, topic];
    text = '';
  }

  function remove(topic: string) {
    const next = current.filter((t) => t !== topic);
    topics = next.length ? next : undefined;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add(text);
    } else if (event.key === 'Backspace' && !text && current.length)
      remove(current[current.length - 1]);
  }
</script>

<div class="topics">
  {#each current as topic (topic)}
    <span class="chip"
      >{topic}<button type="button" onclick={() => remove(topic)} aria-label="Remove topic {topic}"
        ><X size={16} /></button
      ></span
    >
  {/each}
  <input
    bind:value={text}
    {onkeydown}
    onblur={() => text && add(text)}
    list={listId}
    placeholder={current.length ? 'Add a topic' : 'fractions, word problems…'}
    aria-label={label}
  />
  <datalist id={listId}>
    {#each suggestions.filter((s) => !current.some((t) => t.toLowerCase() === s.toLowerCase())) as s (s)}<option
        value={s}
      ></option>{/each}
  </datalist>
</div>

<style>
  .topics {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
    padding: 0.35rem 0.5rem;
    border-radius: var(--radius);
    border: 1px solid var(--line-strong);
    background: var(--paper);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.3rem 0.15rem 0.65rem;
    border-radius: 999px;
    background: var(--accent-wash);
    border: 1px solid var(--accent-line);
    font-size: 0.9rem;
  }
  .chip button {
    border: 0;
    background: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 0.75rem;
  }
  input {
    flex: 1;
    min-width: 8rem;
    border: 0;
    font: inherit;
    padding: 0.3rem;
    background: transparent;
  }
  input:focus {
    outline: none;
  }
</style>
