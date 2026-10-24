<script lang="ts">
  // Peril!'s waiting room. In Teams, every Team is a banner students gather
  // under: drag a name (or tap it) to move them, rename a Team by typing on
  // its name, or shuffle everyone. On the Big Screen the Teams are just names:
  // nobody joins, and the class splits up in the room.
  import Avatar from '../components/Avatar.svelte';
  import { teamName } from '../game/peril/names';
  import { host } from '../host.svelte';
  import { Dices, Settings } from '@lucide/svelte';
  import JoinBanner from './JoinBanner.svelte';
  import PerilRulesDialog from './PerilRulesDialog.svelte';

  const s = $derived(host.peril!);
  const solo = $derived(!s.settings.teams);
  const unassigned = $derived(s.players.filter((p) => !solo && !p.teamId));
  let menuFor = $state('');
  let dragging = $state('');

  let rules: PerilRulesDialog;
  const start = () => s.draft && host.dealPeril(s.draft);

  function reroll(teamId: string) {
    const others = s.teams.filter((t) => t.id !== teamId).map((t) => t.name);
    host.runPeril((e) => e.renameTeam(teamId, teamName(others)));
  }

  function move(playerId: string, teamId: string) {
    host.runPeril((e) => e.moveToTeam(playerId, teamId));
    menuFor = '';
  }
</script>

{#snippet chip(p: (typeof s.players)[number])}
  <li
    class:away={!p.connected}
    draggable={!solo}
    ondragstart={() => (dragging = p.id)}
    ondragend={() => (dragging = '')}
  >
    <button
      class="chip"
      onclick={() => (menuFor = menuFor === p.id ? '' : p.id)}
      aria-expanded={menuFor === p.id}
    >
      <Avatar name={p.nickname} size={30} />
      <span>{p.nickname}</span>
    </button>
    {#if menuFor === p.id}
      <div class="menu">
        {#each s.teams.filter((t) => t.id !== p.teamId) as team (team.id)}
          <button onclick={() => move(p.id, team.id)}>Move to {team.name}</button>
        {/each}
        <button
          class="danger"
          onclick={() => {
            host.kick(p.id);
            menuFor = '';
          }}>Remove</button
        >
      </div>
    {/if}
  </li>
{/snippet}

<div class="lobby">
  {#if !s.bigScreen}<JoinBanner />{/if}

  <div class="bar">
    <button class="icon-btn" onclick={() => rules.open()} aria-label="Rules" title="Rules"><Settings size={22} /></button>
    {#if !s.bigScreen}<span class="count"
      ><strong>{s.players.length}</strong> {s.players.length === 1 ? 'player' : 'players'}</span
    >{/if}
    <span class="title">Peril! · {solo ? 'Solo' : `${s.teams.length} teams`}</span>
    {#if !solo && !s.bigScreen}<button
        class="ghost"
        disabled={!s.players.length}
        onclick={() => host.runPeril((e) => e.shuffleTeams())}>Shuffle teams</button
      >{/if}
    <button class="start" disabled={!s.players.length && !s.bigScreen} onclick={start}>Start</button>
  </div>
  {#if host.notice}<p class="notice" role="alert">{host.notice}</p>{/if}

  {#if solo}
    <ul class="players">
      {#each s.players as p (p.id)}{@render chip(p)}{/each}
    </ul>
    {#if !s.players.length}<p class="waiting">Waiting for players…</p>{/if}
  {:else}
    {#if s.bigScreen}
      <p class="split">Split the class into these teams. When a team buzzes (a hand, a bell, a shout), you tap who was first.</p>
    {/if}
    {#if unassigned.length}
      <section class="unassigned">
        <h2>Choosing a team</h2>
        <ul class="players">
          {#each unassigned as p (p.id)}{@render chip(p)}{/each}
        </ul>
      </section>
    {/if}
    <div class="teams">
      {#each s.teams as team, i (team.id)}
        <section
          class="team"
          style="--hue: {i * 47}"
          class:target={!!dragging}
          ondragover={(e) => e.preventDefault()}
          ondrop={() => dragging && move(dragging, team.id)}
          role="group"
          aria-label={team.name}
        >
          <div class="name-row">
            <input
              class="name"
              value={team.name}
              aria-label="Team name"
              onchange={(e) => host.runPeril((en) => en.renameTeam(team.id, e.currentTarget.value))}
            />
            <button class="dice" title="Another name" aria-label="Another name for {team.name}" onclick={() => reroll(team.id)}><Dices size={20} /></button>
          </div>
          <ul class="players">
            {#each s.players.filter((p) => p.teamId === team.id) as p (p.id)}{@render chip(
                p,
              )}{/each}
          </ul>
        </section>
      {/each}
    </div>
  {/if}
</div>
<PerilRulesDialog bind:this={rules} />

<style>
  .lobby {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem clamp(1rem, 3vw, 2.5rem) 2rem;
    color: var(--paper);
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .count {
    font-size: 1.2rem;
    background: rgb(255 250 243 / 0.1);
    padding: 0.5rem 1rem;
    border-radius: 999px;
  }
  .count strong {
    font-family: var(--display);
    font-weight: 400;
    font-size: 1.6rem;
  }
  .title {
    flex: 1;
    text-align: center;
    color: rgb(255 250 243 / 0.6);
    font-family: var(--serif);
    font-style: italic;
  }
  .ghost,
  .start {
    font: inherit;
    font-weight: 800;
    padding: 0.8rem 1.4rem;
    border-radius: 12px;
    cursor: pointer;
  }
  .ghost {
    border: 1px solid rgb(255 250 243 / 0.35);
    background: transparent;
    color: var(--paper);
  }
  .start {
    font-size: 1.3rem;
    padding: 0.8rem 2.4rem;
    border: none;
    background: var(--paper);
    color: var(--ink);
    box-shadow: inset 0 -5px 0 rgb(0 0 0 / 0.18);
  }
  .ghost:disabled,
  .start:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .notice {
    text-align: center;
    color: var(--amber-strong);
  }
  .split {
    text-align: center;
    font-size: 1.3rem;
    color: rgb(255 250 243 / 0.8);
  }
  .waiting {
    text-align: center;
    font-family: var(--display);
    font-size: 2.2rem;
    opacity: 0.85;
  }
  .unassigned h2 {
    font-family: var(--serif);
    font-size: 1rem;
    color: rgb(255 250 243 / 0.7);
    margin-bottom: 0.5rem;
  }
  .teams {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 1rem;
  }
  .team {
    display: grid;
    align-content: start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 16px;
    background: hsl(calc(10 + var(--hue)) 40% 30% / 0.55);
    border: 2px solid hsl(calc(10 + var(--hue)) 50% 60% / 0.6);
    min-height: 9rem;
  }
  .team.target {
    outline: 2px dashed rgb(255 250 243 / 0.5);
  }
  .name-row {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .dice {
    border: 0;
    background: none;
    font-size: 1.3rem;
    cursor: pointer;
  }
  .icon-btn {
    display: grid;
    place-items: center;
    width: 3rem;
    height: 3rem;
    border-radius: 12px;
    border: 1px solid rgb(255 250 243 / 0.25);
    background: rgb(255 250 243 / 0.08);
    color: var(--paper);
    font-size: 1.4rem;
    cursor: pointer;
  }
  .name {
    font-family: var(--display);
    font-size: 1.8rem;
    background: transparent;
    border: 0;
    border-bottom: 1px dashed rgb(255 250 243 / 0.3);
    color: var(--paper);
    width: 100%;
  }
  .players {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .lobby > .players {
    justify-content: center;
  }
  li {
    position: relative;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.9rem 0.3rem 0.3rem;
    border-radius: 999px;
    border: 0;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }
  .away {
    opacity: 0.5;
  }
  .menu {
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 0;
    z-index: 5;
    display: grid;
    min-width: 13rem;
    padding: 0.35rem;
    background: var(--paper);
    border-radius: 10px;
    box-shadow: var(--shadow-dialog);
  }
  .menu button {
    text-align: left;
    background: none;
    border: none;
    padding: 0.55rem 0.75rem;
    border-radius: 6px;
    font: inherit;
    color: var(--ink);
    cursor: pointer;
  }
  .menu button:hover {
    background: var(--paper-low);
  }
  .menu .danger {
    color: var(--bad);
  }
</style>
