<script lang="ts">
  // The whole class in the dark; a spotlight wanders over the crowd and lands
  // on the new champion. Used when a round begins.
  import { untrack } from 'svelte';
  import Avatar from './Avatar.svelte';
  import type { CrowdMember } from './Crowd.svelte';

  let {
    people,
    targetId,
    onlanded,
    size = 64,
  }: { people: CrowdMember[]; targetId: string; onlanded?: () => void; size?: number } = $props();

  let box: HTMLDivElement;
  let x = $state(-400);
  let y = $state(-400);
  let landed = $state(false);

  function centre(id: string) {
    const el = box?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"] .face`);
    const outer = box?.getBoundingClientRect();
    if (!el || !outer) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left - outer.left + r.width / 2, y: r.top - outer.top + r.height / 2 };
  }

  // Restart only when the champion changes, not every time someone joins.
  $effect(() => {
    const target = targetId;
    return untrack(() => sweep(target));
  });

  function sweep(target: string) {
    landed = false;
    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      landed = true;
      const final = centre(target);
      if (final) ({ x, y } = final);
      onlanded?.();
    };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const others = people.filter((p) => p.id !== target).sort(() => Math.random() - 0.5).slice(0, 4);
    const stops = [...others.map((p) => p.id), target].map(centre).filter((p) => p !== null);
    if (stops.length === 0 || reduce) {
      land();
      return;
    }
    const legs = [{ x: box.clientWidth / 2, y: -80 }, ...stops];
    const legMs = 650;
    const totalMs = legMs * (legs.length - 1);
    const t0 = performance.now();
    let frame = 0;
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
    const step = (now: number) => {
      const elapsed = now - t0;
      if (elapsed >= totalMs) return land();
      const leg = Math.min(legs.length - 2, Math.floor(elapsed / legMs));
      const t = ease(Math.min(1, (elapsed - leg * legMs) / legMs));
      x = legs[leg].x + (legs[leg + 1].x - legs[leg].x) * t;
      y = legs[leg].y + (legs[leg + 1].y - legs[leg].y) * t;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    // A hidden or throttled tab may never draw a frame; land anyway.
    const fallback = setTimeout(land, totalMs + 300);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(fallback);
    };
  }
</script>

<div class="sweep" class:landed bind:this={box} style="--x: {x}px; --y: {y}px; --s: {size}px">
  <ul>
    {#each people as p (p.id)}
      <li data-id={p.id} class:chosen={landed && p.id === targetId}>
        <span class="face"><Avatar name={p.nickname} {size} /></span>
        <span class="name">{p.nickname}</span>
      </li>
    {/each}
  </ul>
  <div class="dark" aria-hidden="true"></div>
</div>

<style>
  .sweep {
    position: relative;
    padding: 2rem 1rem;
    border-radius: 18px;
    overflow: hidden;
  }
  ul {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem 0.8rem;
  }
  li {
    display: grid;
    justify-items: center;
    gap: 0.3rem;
    width: calc(var(--s) + 2rem);
    color: var(--paper);
    transition: transform 0.4s;
  }
  .name {
    font-weight: 700;
    font-size: 0.85rem;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  li.chosen {
    transform: scale(1.35);
    z-index: 2;
  }
  .dark {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      circle calc(var(--s) * 1.1) at var(--x) var(--y),
      rgb(255 236 180 / 0.18) 0,
      rgb(255 236 180 / 0.06) 60%,
      rgb(20 14 10 / 0.86) 100%
    );
    transition: background 0.3s;
  }
  .landed .dark {
    background: radial-gradient(
      circle calc(var(--s) * 1.5) at var(--x) var(--y),
      rgb(255 236 180 / 0.25) 0,
      rgb(255 236 180 / 0.08) 60%,
      rgb(20 14 10 / 0.9) 100%
    );
  }
</style>
