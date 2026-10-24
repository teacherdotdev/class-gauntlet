<script lang="ts">
  // The Use student devices switch above Host, on unless the teacher turns it
  // off: then nobody joins, and the teacher taps every choice on the one
  // screen. The info button says so.
  import { Info } from '@lucide/svelte';

  let { noDevices = $bindable() }: { noDevices: boolean } = $props();
</script>

<div class="plays-on">
  <label class="switch" class:on={!noDevices}>
    <input type="checkbox" role="switch" bind:checked={() => !noDevices, (on) => (noDevices = !on)} aria-describedby="student-devices-info" />
    <span class="track" aria-hidden="true"><span class="knob"></span></span>
    Use student devices
  </label>
  <span class="info">
    <button type="button" class="info-btn" aria-label="What does Use student devices mean?" aria-describedby="student-devices-info"><Info size={18} /></button>
    <span class="tip" id="student-devices-info" role="tooltip">
      <span><strong>On:</strong> students join with a PIN on their own phones, tablets or laptops.</span>
      <span><strong>Off:</strong> no student devices. The class plays together from the one screen at the front of the room, and
        you tap every choice. Nothing goes over the internet, so it keeps working if the Wi-Fi drops.</span>
    </span>
  </span>
</div>

<style>
  .plays-on {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 700;
    color: var(--ink-soft);
    cursor: pointer;
  }
  /* Invisible but covering the whole label, so a click anywhere on it toggles. */
  input {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .switch:has(input:focus-visible) .track {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .track {
    position: relative;
    width: 2.1rem;
    height: 1.2rem;
    border-radius: 999px;
    background: var(--line-strong);
    transition: background 0.15s;
  }
  .knob {
    position: absolute;
    top: 0.15rem;
    left: 0.15rem;
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 50%;
    background: var(--paper);
    transition: transform 0.15s;
  }
  .on .track {
    background: var(--accent);
  }
  .on .knob {
    transform: translateX(0.9rem);
  }
  .info {
    position: relative;
    display: inline-flex;
  }
  .info-btn {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--muted);
    cursor: help;
  }
  .info-btn:hover,
  .info-btn:focus-visible {
    color: var(--accent-dark);
    background: var(--accent-wash);
  }
  .tip {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 0.5rem);
    transform: translateX(-50%);
    z-index: 10;
    width: 18rem;
    padding: 0.75rem 0.9rem;
    border-radius: 10px;
    background: var(--ink);
    color: var(--paper);
    font-size: 0.9rem;
    line-height: 1.4;
    box-shadow: var(--shadow-dialog);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.12s;
  }
  .tip span {
    display: block;
  }
  .tip span + span {
    margin-top: 0.4rem;
  }
  .info:hover .tip,
  .info:focus-within .tip {
    opacity: 1;
    visibility: visible;
  }
</style>
