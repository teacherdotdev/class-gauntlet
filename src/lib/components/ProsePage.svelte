<script lang="ts">
  // The frame for About and Privacy: the brand, a heading, then cards.
  import type { Snippet } from 'svelte';
  import Brand from './Brand.svelte';
  import Footer from './Footer.svelte';
  let { eyebrow, title, lede, children }: { eyebrow: string; title: string; lede: string; children: Snippet } = $props();
</script>

<div class="frame">
  <header class="nav">
    <Brand />
    <a class="host" href="/games">Host a game →</a>
  </header>
  <main class="prose">
    <header>
      <p class="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p class="lede">{lede}</p>
    </header>
    {@render children()}
  </main>
  <Footer />
</div>

<style>
  .frame {
    min-height: 100vh;
    background:
      radial-gradient(circle at 85% 4%, rgb(217 169 58 / 0.18), transparent 26rem),
      linear-gradient(180deg, #fbf4e8 0%, var(--ground) 60%);
  }
  .nav {
    width: min(760px, calc(100% - 32px));
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.1rem 0;
  }
  .host {
    color: var(--accent);
    font-weight: 700;
    text-decoration: none;
  }
  .prose {
    width: min(760px, calc(100% - 32px));
    margin: 0 auto;
    padding: 1.5rem 0 2rem;
    display: grid;
    gap: 1.1rem;
  }
  .prose > header {
    display: grid;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
  }
  .eyebrow {
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
  }
  h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.6rem, 6vw, 3.6rem);
    line-height: 1;
  }
  .lede {
    color: var(--muted);
    font-size: 1.1rem;
    line-height: 1.55;
  }
  .prose :global(.card) {
    display: grid;
    gap: 0.75rem;
    padding: 1.4rem 1.5rem;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    box-shadow: var(--shadow-rest);
  }
  .prose :global(.card h2) {
    font-size: 1.25rem;
  }
  .prose :global(.card p),
  .prose :global(.card li) {
    font-size: 0.98rem;
    line-height: 1.65;
    color: var(--ink-soft);
  }
  .prose :global(.card ul) {
    padding-left: 1.25rem;
    display: grid;
    gap: 0.2rem;
  }
  .prose :global(.card a:not(.btn-primary)) {
    color: var(--accent);
    font-weight: 700;
    text-underline-offset: 4px;
  }
</style>
