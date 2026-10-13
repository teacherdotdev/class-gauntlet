<script lang="ts">
  // One answer as a big coloured block (heraldic tinctures + a shape). On a
  // phone it is the button; on the teacher's screen it shows the answer and,
  // after the reveal, how many chose it.
  import Rich from '../rich/Rich.svelte';
  import type { RichText } from '../rich/text';
  import Shape from './Shape.svelte';

  let {
    index,
    text = '',
    rich = null,
    state = 'idle',
    count = null,
    total = 0,
    tag = '',
    onclick,
    big = false,
  }: {
    index: number;
    text?: string;
    rich?: RichText | null;
    state?: 'idle' | 'chosen' | 'correct' | 'wrong' | 'faded';
    count?: number | null;
    total?: number;
    tag?: string;
    onclick?: () => void;
    big?: boolean;
  } = $props();

  const tincture = $derived(['var(--gules)', 'var(--azure)', 'var(--or)', 'var(--vert)'][index] ?? 'var(--gules)');
  const letter = $derived(String.fromCharCode(65 + index));
</script>

<svelte:element
  this={onclick ? 'button' : 'div'}
  type={onclick ? 'button' : undefined}
  class="block {state}"
  class:big
  class:tap={!!onclick}
  style="--c: {tincture}"
  {onclick}
  role={onclick ? undefined : 'group'}
  aria-label="{letter}: {text}"
>
  {#if count !== null}
    <span class="bar" style="height: {total ? Math.max(6, (100 * count) / total) : 6}%" aria-hidden="true"></span>
  {/if}
  <span class="mark"><Shape {index} size={big ? 40 : 30} /></span>
  <span class="text"><Rich {rich} {text} /></span>
  {#if state === 'correct'}<span class="tick" aria-label="right answer">✓</span>{/if}
  {#if state === 'wrong'}<span class="tick" aria-label="not the answer">✗</span>{/if}
  {#if count !== null}<span class="count">{count}</span>{/if}
  {#if tag}<span class="tag">{tag}</span>{/if}
</svelte:element>

<style>
  .block {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 0.9rem;
    min-height: 5rem;
    padding: 0.9rem 1.1rem;
    border: none;
    border-radius: 12px;
    background: var(--c);
    color: #fff;
    text-align: left;
    font: inherit;
    box-shadow:
      inset 0 -5px 0 rgb(0 0 0 / 0.2),
      0 3px 8px rgb(51 42 36 / 0.18);
    transition:
      transform 0.12s,
      opacity 0.3s,
      filter 0.3s;
  }
  .tap {
    cursor: pointer;
    touch-action: manipulation;
  }
  .tap:active {
    transform: translateY(3px);
    box-shadow: inset 0 -2px 0 rgb(0 0 0 / 0.2);
  }
  .text {
    position: relative;
    flex: 1;
    min-width: 0;
    --picture-max: 7rem;
    font-family: var(--serif);
    font-weight: 700;
    font-size: 1.2rem;
    line-height: 1.2;
    overflow-wrap: anywhere;
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.25);
  }
  .big {
    min-height: 7rem;
    padding: 1.2rem 1.6rem;
  }
  .big .text {
    font-size: clamp(1.4rem, 2.6vw, 2.4rem);
  }
  .mark,
  .tick,
  .count,
  .tag {
    position: relative;
  }
  .tick {
    font-size: 1.8rem;
    font-weight: 800;
  }
  .count {
    font-family: var(--serif);
    font-weight: 700;
    font-size: 1.6rem;
    min-width: 2.2rem;
    text-align: right;
  }
  .big .count {
    font-size: 2.4rem;
  }
  .bar {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    background: rgb(255 255 255 / 0.16);
    transition: height 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .tag {
    position: absolute;
    top: -0.1rem;
    right: 0.6rem;
    background: var(--paper);
    color: var(--ink);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 0.2rem 0.55rem 0.15rem;
    border-radius: 0 0 8px 8px;
  }
  .chosen {
    outline: 5px solid var(--paper);
    outline-offset: -5px;
    animation: pulse 0.9s ease-in-out infinite;
  }
  .faded,
  .wrong {
    opacity: 0.35;
    filter: saturate(0.6);
  }
  .wrong {
    opacity: 0.55;
  }
  .correct {
    outline: 5px solid var(--paper);
    outline-offset: -5px;
    animation: pop 0.5s both;
  }
</style>
