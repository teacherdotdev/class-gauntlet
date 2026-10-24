<script lang="ts">
  // Where students play this Session: on their own devices, or all together on
  // the Big Screen, with the teacher entering every choice. Every Game Mode's
  // setup has it.
  import { Monitor, Smartphone } from '@lucide/svelte';

  let { bigScreen = $bindable() }: { bigScreen: boolean } = $props();
</script>

<div class="segmented" role="radiogroup" aria-label="Students play on">
  <button role="radio" aria-checked={!bigScreen} class:on={!bigScreen} onclick={() => (bigScreen = false)} title="Students join with a PIN on their own devices">
    <Smartphone size={16} /> Their devices
  </button>
  <button role="radio" aria-checked={bigScreen} class:on={bigScreen} onclick={() => (bigScreen = true)} title="No student devices: the class plays together and you tap every choice on the screen">
    <Monitor size={16} /> Big Screen
  </button>
</div>

<style>
  .segmented {
    display: inline-flex;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    overflow: hidden;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font: inherit;
    font-weight: 700;
    padding: 0.4rem 1rem;
    border: 0;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  button.on {
    background: var(--accent);
    color: var(--paper);
  }
</style>
