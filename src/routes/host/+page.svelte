<script lang="ts">
  // The teacher's screen for the projector: the lobby, then the game itself.
  // Games are chosen and set up in the workspace (/games).
  import { onDestroy } from 'svelte';
  import { host } from '#lib/host.svelte.ts';
  import Arena from '#lib/host/Arena.svelte';
  import ClassicArena from '#lib/host/ClassicArena.svelte';
  import ClassicLobby from '#lib/host/ClassicLobby.svelte';
  import Lobby from '#lib/host/Lobby.svelte';
  import PerilArena from '#lib/host/PerilArena.svelte';
  import PerilLobby from '#lib/host/PerilLobby.svelte';
  import { goto } from '$app/navigation';
  import SettingsDialog from '#lib/host/SettingsDialog.svelte';
  import { spacedCode } from '#lib/protocol.ts';

  let settings = $state<SettingsDialog>();
  onDestroy(() => host.close());
  // Nothing hosted: choose a game first.
  $effect(() => {
    if (!host.active) void goto('/games', { replaceState: true });
  });

  // Closing this tab ends the game for everyone, so ask first.
  function beforeUnload(event: BeforeUnloadEvent) {
    const session = host.session ?? host.peril ?? host.classic;
    if (session && session.phase !== 'ENDED' && session.players.length > 0) event.preventDefault();
  }
</script>

<svelte:window onbeforeunload={beforeUnload} />
<svelte:head>
  <title>{host.active ? `PIN ${spacedCode((host.session ?? host.peril ?? host.classic)!.code)}` : 'Host a game'} · Class Gauntlet</title>
</svelte:head>

{#if host.classic}
  <div class="hall">
    {#if host.classic.phase === 'LOBBY'}
      <ClassicLobby />
    {:else if host.classicView}
      <ClassicArena />
    {/if}
  </div>
{:else if host.peril}
  <div class="hall">
    {#if host.peril.phase === 'LOBBY'}
      <PerilLobby />
    {:else if host.perilView}
      <PerilArena />
    {/if}
  </div>
{:else}
  <div class="hall">
    {#if host.session?.phase === 'LOBBY'}
      <Lobby onsettings={() => settings?.open()} />
    {:else if host.view}
      <Arena onsettings={() => settings?.open()} />
    {/if}
  </div>
  <SettingsDialog bind:this={settings} />
{/if}

<style>
  /* A torch-lit hall: dark stone with warm light from above. */
  .hall {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 70% 50% at 50% -10%, rgb(240 170 90 / 0.22), transparent 70%),
      radial-gradient(ellipse 40% 40% at 0% 100%, rgb(159 80 55 / 0.25), transparent 70%),
      radial-gradient(ellipse 40% 40% at 100% 100%, rgb(47 93 143 / 0.18), transparent 70%),
      var(--night);
  }
</style>
