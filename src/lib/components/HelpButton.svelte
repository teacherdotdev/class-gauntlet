<script lang="ts">
  // The one way to reach a person, the way TestParrot has it: a quiet question
  // mark that opens a short note on how the game works and who to email. The
  // browser's own modal dialog keeps focus inside it and closes on Escape.
  import { supportEmail, supportMailto } from '../support';

  let dialog = $state<HTMLDialogElement>();

  // A press on the dimmed backdrop lands on the dialog element itself.
  function closeOnBackdrop(event: MouseEvent) {
    if (event.target === dialog) dialog?.close();
  }
</script>

<button type="button" class="help" aria-label="Help" aria-haspopup="dialog" title="Help" onclick={() => dialog?.showModal()}>
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
  </svg>
</button>

<dialog bind:this={dialog} class="help-dialog" aria-labelledby="help-title" onclick={closeOnBackdrop}>
  <header>
    <h2 id="help-title">Need a hand?</h2>
    <button type="button" class="close" aria-label="Close help" onclick={() => dialog?.close()}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
    </button>
  </header>

  <h3>How it works</h3>
  <ol>
    <li><strong>Pick your questions</strong>: write a set, paste one from a spreadsheet, or use the sample.</li>
    <li><strong>Host a game</strong> on the computer connected to your projector. Keep that tab open while you play.</li>
    <li><strong>Students join</strong> on their phones with the PIN or the QR code. No accounts.</li>
    <li><strong>The spotlight picks a champion</strong>. The class answers first, then the champion. Tap Next between questions.</li>
  </ol>

  <h3>Get in touch</h3>
  <p>
    Running into trouble or have an idea? Email us at <a href={supportMailto('help')}>{supportEmail}</a>.
  </p>

  <p class="links"><a href="/about">About</a> · <a href="/privacy">Privacy</a></p>
</dialog>

<style>
  .help {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 2.4rem;
    height: 2.4rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
  }
  .help:hover,
  .help:focus-visible {
    background: var(--paper-low);
    color: var(--accent);
  }
  .help-dialog {
    width: min(28rem, calc(100vw - 2rem));
    margin: auto;
    padding: 1.25rem 1.4rem 1.4rem;
    border: none;
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 18px 60px rgb(51 42 36 / 0.24);
  }
  .help-dialog::backdrop {
    background: rgb(51 42 36 / 0.42);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }
  h2 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 1.9rem;
  }
  h3 {
    margin: 0.9rem 0 0.35rem;
    font-size: 1rem;
    font-weight: 600;
  }
  .close {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 6px;
    background: none;
    color: var(--muted);
    cursor: pointer;
  }
  .close:hover {
    background: var(--paper-low);
    color: var(--ink);
  }
  ol {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding-left: 1.2rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  p {
    font-size: 0.9rem;
    line-height: 1.55;
  }
  a {
    color: var(--accent);
    font-weight: 600;
  }
  .links {
    margin-top: 1rem;
    color: var(--muted);
  }
</style>
