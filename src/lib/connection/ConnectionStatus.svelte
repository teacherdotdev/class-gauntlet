<script lang="ts">
  // A light in the workspace's nav: green when this network is good for
  // hosting, amber when hosting works but the relay is blocked, red when
  // students can't join. Pressing it shows each step of the check and, when
  // something's wrong, a report to copy into an email, like Happy Hallways'.
  import { onMount } from 'svelte';
  import { Check, CircleAlert, CircleCheck, CircleX, Copy, Mail, RefreshCw, X } from '@lucide/svelte';
  import { supportEmail, supportMailto } from '../support';
  import { checkConnection, connection, watchConnection } from './check.svelte';

  let dialog: HTMLDialogElement;
  let copied = $state(false);

  onMount(watchConnection);

  const level = $derived(connection.running || !connection.verdict ? 'checking' : connection.verdict.level);
  const label = $derived(
    { checking: 'Checking connection…', good: 'Connection good', partial: 'Connection limited', bad: 'Connection problem' }[level],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(connection.report);
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {
      /* the report is on screen to copy by hand */
    }
  }
</script>

{#snippet step(ok: boolean | null, title: string, detail: string)}
  <li>
    {#if ok === true}<CircleCheck size={18} class="ok" aria-label="Passed" />
    {:else if ok === false}<CircleX size={18} class="fail" aria-label="Failed" />
    {:else}<CircleAlert size={18} class="warn" aria-label="Limited" />{/if}
    <div><strong>{title}</strong><span>{detail}</span></div>
  </li>
{/snippet}

<button type="button" class="status" aria-haspopup="dialog" onclick={() => dialog.showModal()}>
  <span class="light {level}" aria-hidden="true"></span>
  {label}
</button>

<dialog bind:this={dialog} aria-labelledby="connection-title" onclick={(e) => e.target === dialog && dialog.close()}>
  <div class="body">
    <header>
      <h2 id="connection-title">Your connection</h2>
      <button type="button" class="close" onclick={() => dialog.close()} aria-label="Close"><X size={18} /></button>
    </header>

    {#if !connection.findings || !connection.verdict}
      <p class="headline">Checking this network…</p>
    {:else}
      {@const f = connection.findings}
      {@const v = connection.verdict}
      <p class="headline {v.level}"><span class="light {v.level}" aria-hidden="true"></span>{v.headline}</p>
      <ul class="steps">
        {@render step(f.online, 'Internet', f.online ? 'This computer is online.' : 'This computer is offline.')}
        {#each f.servers as s (s.host)}
          {@render step(
            s.live === 'ok',
            `Matchmaking: ${s.host}`,
            s.live === 'ok'
              ? 'Reachable, and the live connection opens.'
              : s.answer === 'ok'
                ? `Answers, but the live connection doesn’t open: ${s.live}.`
                : s.answer === 'filtered'
                  ? 'Something else answered in its place, probably a web filter.'
                  : `Can’t reach it: ${s.answer}.`,
          )}
        {/each}
        {@render step(
          typeof f.relayLogins === 'number' && f.relayLogins > 0 ? true : null,
          'Relay logins',
          typeof f.relayLogins === 'number' ? `Got ${f.relayLogins} relay addresses.` : `Didn’t get any: ${f.relayLogins.replace(/^none \(|\)$/g, '')}.`,
        )}
        {@render step(
          f.routes.relay > 0 ? true : null,
          'Relay',
          f.routes.relay > 0
            ? 'Reachable, for students whose network blocks a direct connection.'
            : 'Not reachable from here. Students on the same network usually connect directly anyway.',
        )}
      </ul>
      {#if v.advice}<p class="advice">{v.advice}</p>{/if}
      {#if v.level !== 'good'}
        <div class="report">
          <div class="report-head">
            <strong>Connection report</strong>
            <button type="button" class="copy" onclick={copy}>
              {#if copied}<Check size={15} aria-hidden="true" /> Copied{:else}<Copy size={15} aria-hidden="true" /> Copy{/if}
            </button>
          </div>
          <pre>{connection.report}</pre>
          <p class="hint">Send this to {supportEmail} or your IT team. It has no student data or network addresses.</p>
          <a class="mail" href={supportMailto(`Connection report (${v.code})`, connection.report)}><Mail size={16} aria-hidden="true" /> Email it to us</a>
        </div>
      {/if}
    {/if}
    <button type="button" class="btn-ghost again" disabled={connection.running} onclick={() => void checkConnection()}>
      <RefreshCw size={16} aria-hidden="true" class={connection.running ? 'spin' : ''} />
      {connection.running ? 'Checking…' : 'Check again'}
    </button>
  </div>
</dialog>

<style>
  .status {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    width: 100%;
    padding: 0.55rem 0.75rem;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--muted);
    font: inherit;
    font-size: 0.88rem;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
  }
  .status:hover {
    background: var(--paper-low);
    color: var(--ink);
  }
  .light {
    flex: none;
    width: 0.7rem;
    height: 0.7rem;
    margin-inline: 0.35rem;
    border-radius: 50%;
    background: var(--line-strong);
  }
  .light.good {
    background: #3f9a52;
    box-shadow: 0 0 0 3px var(--good-wash);
  }
  .light.partial {
    background: var(--amber-border);
    box-shadow: 0 0 0 3px var(--amber);
  }
  .light.bad {
    background: var(--bad);
    box-shadow: 0 0 0 3px var(--bad-wash);
  }
  .light.checking {
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      opacity: 0.35;
    }
  }
  dialog {
    width: min(34rem, calc(100vw - 2rem));
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
    gap: 0.85rem;
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
  .headline {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 700;
  }
  .headline .light {
    margin-left: 0;
  }
  .steps {
    display: grid;
    gap: 0.55rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .steps li {
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
  }
  .steps li > :global(svg) {
    flex: none;
    margin-top: 0.1rem;
  }
  .steps :global(.ok) {
    color: var(--good);
  }
  .steps :global(.fail) {
    color: var(--bad);
  }
  .steps :global(.warn) {
    color: var(--amber-border);
  }
  .steps div {
    display: grid;
    min-width: 0;
  }
  .steps span {
    color: var(--ink-soft);
    font-size: 0.9rem;
    overflow-wrap: anywhere;
  }
  .advice {
    padding: 0.6rem 0.8rem;
    border-radius: 10px;
    background: var(--paper-low);
    font-size: 0.95rem;
  }
  .report {
    display: grid;
    gap: 0.5rem;
  }
  .report-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  pre {
    max-height: 12rem;
    overflow: auto;
    margin: 0;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    background: #fff;
    font-size: 0.75rem;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .hint {
    color: var(--muted);
    font-size: 0.85rem;
  }
  .copy {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.35rem 0.65rem;
    border: 0;
    border-radius: 7px;
    background: var(--accent-wash);
    color: var(--accent-dark);
    font: inherit;
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
  }
  .mail {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    justify-self: start;
    color: var(--accent-dark);
    font-weight: 700;
  }
  .again {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
  }
  .again :global(.spin) {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .light.checking,
    .again :global(.spin) {
      animation: none;
    }
  }
</style>
