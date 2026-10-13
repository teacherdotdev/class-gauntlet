<script lang="ts">
  // Where to join, the PIN and a QR code, big enough to read from the back of
  // the room. Shared by every Game Mode's lobby.
  import QrCode from '../components/QrCode.svelte';
  import { host } from '../host.svelte';
  import { spacedCode } from '../protocol';

  const code = $derived((host.session ?? host.peril ?? host.classic)?.code ?? '');
  const site = $derived(host.joinUrl.replace(/^https?:\/\//, '').replace(/\/join.*/, ''));
</script>

<header class="banner">
  <div class="where">
    <span class="label">Join at</span>
    <strong>{site}</strong>
  </div>
  <div class="pin">
    <span class="label">Game PIN</span>
    <strong aria-label="Game PIN {code.split('').join(' ')}">{spacedCode(code)}</strong>
  </div>
  <div class="qr"><QrCode text={host.joinUrl} label="Scan to join" /></div>
</header>

{#if host.status !== 'open'}
  <p class="status" role="status">
    {host.status === 'reclaiming'
      ? 'Getting your game PIN back…'
      : host.status === 'opening'
        ? 'Opening the game…'
        : host.problem || 'Reconnecting…'}
  </p>
{/if}

<style>
  .banner {
    align-self: center;
    display: flex;
    align-items: center;
    gap: clamp(1rem, 3vw, 2.5rem);
    padding: 1rem 1.25rem 1rem 2rem;
    background: var(--paper);
    color: var(--ink);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgb(0 0 0 / 0.35);
    border: 3px solid var(--or);
    max-width: 100%;
  }
  .where,
  .pin {
    display: grid;
  }
  .where strong {
    font-size: clamp(1.2rem, 2.2vw, 2rem);
  }
  .pin {
    padding-left: clamp(1rem, 3vw, 2.5rem);
    border-left: 2px solid var(--line);
  }
  .pin strong {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(3rem, 7vw, 6.5rem);
    line-height: 0.95;
    letter-spacing: 0.04em;
    color: var(--accent-dark);
    font-variant-numeric: tabular-nums;
  }
  .label {
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .qr {
    width: clamp(6rem, 11vw, 9.5rem);
    background: #fff;
    padding: 0.4rem;
    border-radius: 8px;
  }
  .qr :global(svg) {
    display: block;
    width: 100%;
    height: auto;
  }
  .status {
    text-align: center;
    color: var(--amber-strong);
    font-weight: 600;
  }
  .status {
    text-align: center;
    color: var(--amber-strong);
    font-weight: 600;
  }
  @media (max-width: 52rem) {
    .banner {
      flex-wrap: wrap;
      justify-content: center;
      padding: 1rem;
    }
    .pin {
      border-left: none;
      padding-left: 0;
    }
  }
</style>
