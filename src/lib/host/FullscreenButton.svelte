<script lang="ts">
  // Fills the projector with the game, and back. Shown on every host screen.
  import { Maximize, Minimize } from '@lucide/svelte';

  let full = $state(false);
  const supported = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;

  function toggle() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  }
</script>

<svelte:document onfullscreenchange={() => (full = !!document.fullscreenElement)} />

{#if supported}
  <button class="full" onclick={toggle} aria-label={full ? 'Leave full screen' : 'Full screen'} title={full ? 'Leave full screen' : 'Full screen'}>
    {#if full}<Minimize size={20} />{:else}<Maximize size={20} />{/if}
  </button>
{/if}

<style>
  .full {
    position: fixed;
    left: clamp(1rem, 2.5vw, 2rem);
    bottom: 1.25rem;
    z-index: 6;
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 10px;
    border: 1px solid rgb(255 250 243 / 0.25);
    background: rgb(255 250 243 / 0.08);
    color: var(--paper);
    cursor: pointer;
  }
  .full:hover {
    background: rgb(255 250 243 / 0.18);
  }
</style>
