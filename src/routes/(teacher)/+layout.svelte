<script lang="ts">
  // The teacher's workspace: Games, Question banks and History up top,
  // Settings at the foot of the nav, the page full width beside it. Hosting a
  // game leaves the workspace for the projector screen.
  import { page } from '$app/state';
  import Brand from '#lib/components/Brand.svelte';
  import { CirclePlay, History, LibraryBig, Settings } from '@lucide/svelte';

  let { children } = $props();
  const at = (path: string) => page.url.pathname === path || page.url.pathname.startsWith(`${path}/`);
</script>

<div class="workspace">
  <aside class="sidebar">
    <div class="brand"><Brand /></div>
    <nav aria-label="Teacher pages">
      <a class:active={at('/games')} href="/games"><CirclePlay size={20} /> Games</a>
      <a class:active={at('/banks')} href="/banks"><LibraryBig size={20} /> Question banks</a>
      <a class:active={at('/history')} href="/history"><History size={20} /> History</a>
    </nav>
    <nav class="foot" aria-label="Settings">
      <a class:active={at('/settings')} href="/settings"><Settings size={20} /> Settings</a>
    </nav>
  </aside>
  <main class="content">{@render children()}</main>
</div>

<style>
  /* The workspace fills the window; each page scrolls inside its own area,
     so a page like the bank editor can fit the window exactly. */
  .workspace {
    display: grid;
    grid-template-columns: 17rem minmax(0, 1fr);
    height: 100dvh;
    background: var(--ground);
  }
  .sidebar {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.4rem 0.9rem;
    background: var(--paper);
    border-right: 1px solid var(--line);
  }
  .brand {
    padding: 0 0.5rem;
  }
  nav {
    display: grid;
    gap: 0.2rem;
  }
  nav.foot {
    margin-top: auto;
  }
  nav a {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.7rem 0.75rem;
    border-radius: 10px;
    color: var(--ink-soft);
    font-weight: 700;
    text-decoration: none;
  }
  nav a:hover {
    background: var(--paper-low);
    color: var(--ink);
  }
  nav a.active {
    background: var(--accent-wash);
    color: var(--accent-dark);
  }
  .content {
    min-width: 0;
    min-height: 0;
    overflow: auto;
    padding: 2rem clamp(1.25rem, 3vw, 2.75rem) 2rem;
  }
  @media (max-width: 64rem) {
    .workspace {
      display: flex;
      flex-direction: column;
    }
    .sidebar {
      height: auto;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 1rem;
      padding: 0.6rem 1rem;
      border-right: 0;
      border-bottom: 1px solid var(--line);
    }
    nav {
      display: flex;
      overflow-x: auto;
    }
    nav.foot {
      margin: 0 0 0 auto;
    }
    .content {
      flex: 1;
      padding: 1.25rem 1rem 1.5rem;
    }
  }
</style>
