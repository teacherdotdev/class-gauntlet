<script lang="ts">
  // Download as a Bank File, which keeps everything, with a spreadsheet one
  // step away behind the arrow for teachers who edit in Sheets or Excel.
  import { ChevronDown, Download } from '@lucide/svelte';

  let {
    label = 'Download',
    title,
    disabled = false,
    ondownload,
    oncsv,
  }: { label?: string; title?: string; disabled?: boolean; ondownload: () => void; oncsv: () => void } = $props();

  let open = $state(false);
  let wrap: HTMLDivElement;
</script>

<svelte:window
  onpointerdown={(e) => open && !wrap.contains(e.target as Node) && (open = false)}
  onkeydown={(e) => e.key === 'Escape' && (open = false)}
/>

<div class="split" bind:this={wrap}>
  <button class="btn-ghost main" {title} {disabled} onclick={ondownload}><Download size={16} aria-hidden="true" /> {label}</button>
  <button class="btn-ghost more" {disabled} aria-label="More ways to {label.toLowerCase()}" aria-expanded={open} onclick={() => (open = !open)}>
    <ChevronDown size={16} />
  </button>
  {#if open}
    <div class="menu" role="menu">
      <button role="menuitem" onclick={() => ((open = false), ondownload())}>
        <strong>File for Class Gauntlet</strong>
        <small>Keeps Pictures, math and formatting</small>
      </button>
      <button role="menuitem" onclick={() => ((open = false), oncsv())}>
        <strong>Spreadsheet (CSV)</strong>
        <small>To edit in Sheets or Excel; Pictures are left out</small>
      </button>
    </div>
  {/if}
</div>

<style>
  .split {
    position: relative;
    display: inline-flex;
  }
  .main {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .more {
    display: grid;
    place-items: center;
    padding-inline: 0.45rem;
    margin-left: -1px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  .menu {
    position: absolute;
    top: calc(100% + 0.35rem);
    right: 0;
    z-index: 20;
    display: grid;
    min-width: 17rem;
    padding: 0.3rem;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    box-shadow: var(--shadow-lift);
  }
  .menu button {
    display: grid;
    gap: 0.1rem;
    padding: 0.5rem 0.65rem;
    border: 0;
    border-radius: 7px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .menu button:hover {
    background: var(--paper-low);
  }
  .menu small {
    color: var(--muted);
  }
</style>
