<script lang="ts">
  // Sharing a bank. Without Pictures, Share just copies a Share Link. A link
  // can't carry Pictures, so a bank with them asks first: download the Bank
  // File to send instead, or copy the link without them.
  import { Download } from '@lucide/svelte';
  import type { QuestionBank } from '../game/types';
  import { pictureFile } from '../rich/pictures.svelte';
  import { picturesIn } from '../rich/text';
  import { plural } from '../words';
  import { bankFileName, downloadBankFile, writeBankFile } from './bank-file';
  import { shareLink } from './share';

  let { onshared }: { onshared?: (message: string) => void } = $props();

  let dialog: HTMLDialogElement;
  let bank = $state<QuestionBank | null>(null);
  let pictures = $state(0);
  let animated = $state(false);
  let working = $state(false);

  /** Shares a bank: copies its link, or asks first when it has Pictures. */
  export async function share(next: QuestionBank) {
    const hashes = [...picturesIn(next.questions)];
    if (!hashes.length) return copyLink(next);
    bank = next;
    pictures = hashes.length;
    const types = await Promise.all(hashes.map(async (hash) => (await pictureFile(hash))?.type ?? ''));
    animated = types.some((type) => /gif|svg/.test(type));
    dialog.showModal();
  }

  async function copyLink(set: QuestionBank) {
    const link = await shareLink(location.origin, set);
    try {
      await navigator.clipboard.writeText(link);
      onshared?.(`Share link for “${set.title}” copied.`);
    } catch {
      prompt('Copy this link:', link);
    }
  }

  async function download() {
    if (!bank) return;
    working = true;
    try {
      downloadBankFile(bankFileName(bank), await writeBankFile(bank, pictureFile));
      onshared?.(`Downloaded “${bankFileName(bank)}”. Send it to your colleague.`);
      dialog.close();
    } finally {
      working = false;
    }
  }

  async function linkAnyway() {
    const set = bank;
    if (!set) return;
    dialog.close();
    await copyLink(set);
  }
</script>

<dialog bind:this={dialog} aria-labelledby="share-title" onclose={() => (bank = null)} onclick={(e) => e.target === dialog && dialog.close()}>
  {#if bank}
    <div class="body">
      <h2 id="share-title">Share “{bank.title}”</h2>
      <p>This bank has {plural(pictures, 'Picture')}, and a link can’t carry them.</p>
      <p class="muted">Send the file instead: your colleague opens Class Gauntlet, chooses <strong>Import</strong> and picks the file.</p>
      {#if animated}<p class="muted">Test Parrot can’t open this file, because it has an animated or SVG Picture. Class Gauntlet can.</p>{/if}
      <div class="actions">
        <button type="button" class="btn-quiet" onclick={linkAnyway}>Copy link without Pictures</button>
        <button type="button" class="btn-primary" onclick={download} disabled={working}>
          <Download size={16} aria-hidden="true" /> {working ? 'Preparing…' : 'Download file'}
        </button>
      </div>
    </div>
  {/if}
</dialog>

<style>
  .body {
    display: grid;
    gap: 0.7rem;
    max-width: 30rem;
  }
  h2 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 1.8rem;
  }
  .muted {
    color: var(--ink-soft);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 0.4rem;
  }
  .actions .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
</style>
