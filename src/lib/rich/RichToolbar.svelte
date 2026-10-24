<script lang="ts">
  // The one toolbar above a question's fields: a row of ghost icon buttons
  // that act on whichever field the teacher is in. Anything more (lists,
  // tables, headings) is in the / menu.
  import { Bold, ImagePlus, Italic, Sigma, Subscript, Superscript } from '@lucide/svelte';
  import type { Component } from 'svelte';
  import type { Formats, RichCommand } from './toolbar';

  let { formats, onrun }: { formats: Formats; onrun: (command: RichCommand) => void } = $props();

  const mod = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';

  type Button = { command: RichCommand; label: string; keys: string; icon: Component<{ size?: number }>; on?: keyof Formats };
  const groups: Button[][] = [
    [
      { command: 'bold', label: 'Bold', keys: `${mod}B`, icon: Bold, on: 'bold' },
      { command: 'italic', label: 'Italic', keys: `${mod}I`, icon: Italic, on: 'italic' },
    ],
    [
      { command: 'superscript', label: 'Superscript', keys: `${mod}.`, icon: Superscript, on: 'superscript' },
      { command: 'subscript', label: 'Subscript', keys: `${mod},`, icon: Subscript, on: 'subscript' },
    ],
    [
      { command: 'math', label: 'Math', keys: 'or type $x^2$', icon: Sigma },
      { command: 'picture', label: 'Picture', keys: 'or paste one', icon: ImagePlus },
    ],
  ];
</script>

<div class="toolbar" role="toolbar" aria-label="Formatting">
  {#each groups as group, g (g)}
    {#if g}<span class="divider" aria-hidden="true"></span>{/if}
    {#each group as button (button.command)}
      {@const Icon = button.icon}
      <button
        type="button"
        class:on={button.on && formats[button.on]}
        aria-pressed={button.on ? formats[button.on] : undefined}
        aria-label={button.label}
        title="{button.label} ({button.keys})"
        onpointerdown={(e) => e.preventDefault()}
        onclick={() => onrun(button.command)}
      >
        <Icon size={17} />
      </button>
    {/each}
  {/each}
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.15rem;
  }
  button {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border: 0;
    border-radius: 7px;
    background: none;
    color: var(--ink-soft);
    cursor: pointer;
  }
  button:hover {
    background: var(--paper-low);
    color: var(--ink);
  }
  button.on {
    background: var(--accent-wash);
    color: var(--accent-dark);
  }
  .divider {
    width: 1px;
    height: 1.2rem;
    margin: 0 0.3rem;
    background: var(--line);
  }
</style>
