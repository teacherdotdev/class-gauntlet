<script lang="ts">
  // Every game this browser has finished: when, which game, and how everyone
  // placed. Click one to see its full standings.
  import { gameHistory } from '#lib/history/store.svelte.ts';
  import { plural } from '#lib/words.ts';

  let open = $state('');
  const when = (ms: number) =>
    new Date(ms).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const minutes = (ms: number) => `${Math.max(1, Math.round(ms / 60_000))} min`;
</script>

<svelte:head><title>History · Class Gauntlet</title></svelte:head>

<h1>History</h1>
<p class="lede">Games you’ve finished on this computer. Students appear under the names they joined with.</p>

{#if gameHistory.records.length}
  <ul class="records">
    {#each gameHistory.records as r (r.id)}
      {@const first = r.teams[0]?.name ?? r.players[0]?.nickname}
      <li class:open={open === r.id}>
        <button class="summary" onclick={() => (open = open === r.id ? '' : r.id)} aria-expanded={open === r.id}>
          <span class="mode {r.mode}">{r.mode === 'peril' ? 'Peril!' : r.mode === 'classic' ? 'Classic' : 'Champion'}</span>
          <span class="title">{r.title}</span>
          <span class="meta">{when(r.endedAt)} · {minutes(r.endedAt - r.startedAt)} · {plural(r.players.length, 'student')}</span>
          {#if first}<span class="winner">👑 {first}</span>{/if}
        </button>
        {#if open === r.id}
          <div class="detail">
            {#if r.teams.length}
              {#each r.teams as team (team.name)}
                <section>
                  <h3><span class="rank">{team.rank}</span> {team.name} <strong>{team.points}</strong></h3>
                  <p>{r.players.filter((p) => p.team === team.name).map((p) => p.nickname).join(', ') || 'Nobody'}</p>
                </section>
              {/each}
            {:else}
              <ol>
                {#each r.players as p (p.nickname)}
                  <li><span class="rank">{p.rank}</span> {p.nickname} <strong>{p.points}</strong></li>
                {/each}
              </ol>
            {/if}
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{:else}
  <p class="empty">No games yet. When you end a game, it shows up here.</p>
{/if}

<style>
  h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.4rem, 5vw, 3.2rem);
  }
  .lede,
  .empty {
    color: var(--muted);
    margin-bottom: 1.25rem;
  }
  .records {
    list-style: none;
    display: grid;
    gap: 0.6rem;
    max-width: 60rem;
  }
  .records > li {
    border-radius: 14px;
    background: var(--paper);
    border: 1px solid var(--line);
  }
  .summary {
    width: 100%;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.15rem 1rem;
    align-items: center;
    padding: 0.9rem 1.1rem;
    border: 0;
    background: none;
    font: inherit;
    text-align: left;
    cursor: pointer;
    color: var(--ink);
  }
  .mode {
    grid-row: span 2;
    font-family: var(--display);
    font-size: 1.3rem;
    padding: 0.2rem 0.7rem;
    border-radius: 8px;
    background: var(--amber);
  }
  .mode.classic {
    background: var(--a-wash);
    color: var(--azure);
  }
  .mode.peril {
    background: var(--bad-wash);
    color: var(--gules);
  }
  .title {
    font-family: var(--serif);
    font-weight: 700;
  }
  .meta {
    grid-column: 2;
    color: var(--muted);
    font-size: 0.85rem;
  }
  .winner {
    grid-row: 1 / span 2;
    grid-column: 3;
    font-weight: 700;
  }
  .detail {
    display: grid;
    gap: 0.6rem;
    padding: 0 1.1rem 1rem;
  }
  .detail ol {
    list-style: none;
    display: grid;
    gap: 0.3rem;
  }
  .detail li,
  .detail h3 {
    display: flex;
    gap: 0.6rem;
    align-items: baseline;
  }
  .detail h3 {
    font-size: 1rem;
  }
  .detail p {
    color: var(--muted);
    padding-left: 2rem;
  }
  .rank {
    font-family: var(--display);
    width: 1.4rem;
    color: var(--accent);
  }
  strong {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
  }
</style>
