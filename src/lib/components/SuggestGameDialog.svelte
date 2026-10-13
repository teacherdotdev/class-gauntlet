<script lang="ts">
  // "Suggest a game mode": like Math Figures' "Request a generator", a short
  // note, the address with a copy button (many school computers have no
  // email app), and a button that starts the email.
  import { Check, Copy, Mail, X } from '@lucide/svelte';
  import { supportEmail, supportMailto } from '../support';

  let dialog: HTMLDialogElement;
  let copied = $state(false);

  export function open() {
    dialog.showModal();
  }

  const mailto = supportMailto(
    'Game mode suggestion',
    'The game I’d like to play with my class:\n\nHow a round would go:\n\nWhat it reminds me of (a game show, a board game, another site):\n\n',
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(supportEmail);
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {
      /* the address is on screen to copy by hand */
    }
  }
</script>

<dialog bind:this={dialog} aria-labelledby="suggest-title" onclick={(e) => e.target === dialog && dialog.close()}>
  <div class="body">
    <header>
      <h2 id="suggest-title">Suggest a game mode</h2>
      <button type="button" class="close" onclick={() => dialog.close()} aria-label="Close"><X size={18} /></button>
    </header>
    <p>Got a game your class would love? Email us your idea, and we may build it.</p>
    <p>Tell us how a round goes, and what it reminds you of: a game show, a board game, another site. The more detail, the better the game.</p>
    <div class="address">
      <span>{supportEmail}</span>
      <button type="button" class="copy" onclick={copy}>
        {#if copied}<Check size={15} aria-hidden="true" /> Copied{:else}<Copy size={15} aria-hidden="true" /> Copy{/if}
      </button>
    </div>
    <a class="btn-primary open" href={mailto}><Mail size={17} aria-hidden="true" /> Open in email</a>
  </div>
</dialog>

<style>
  dialog {
    max-width: min(28rem, calc(100vw - 2rem));
    padding: 0;
    border: 0;
    border-radius: 16px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: var(--shadow-dialog);
  }
  dialog::backdrop {
    background: rgb(36 28 23 / 0.45);
  }
  .body {
    display: grid;
    gap: 0.75rem;
    padding: 1.25rem 1.4rem 1.4rem;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h2 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 1.9rem;
  }
  .close {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--muted);
    cursor: pointer;
  }
  .close:hover {
    background: var(--paper-low);
  }
  .address {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.35rem 0.35rem 0.35rem 0.8rem;
    border: 1.5px solid var(--line-strong);
    border-radius: 10px;
    font-weight: 600;
    word-break: break-all;
  }
  .copy {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    flex: none;
    padding: 0.4rem 0.65rem;
    border: 0;
    border-radius: 7px;
    background: var(--accent-wash);
    color: var(--accent-dark);
    font: inherit;
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
  }
  .open {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    text-decoration: none;
  }
</style>
