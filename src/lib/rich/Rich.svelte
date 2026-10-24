<script lang="ts">
  // A question's words as they should look: Rich Text when there is some,
  // with math by KaTeX and pictures from wherever this device keeps them;
  // otherwise the plain text. One paragraph flows inline, like plain text.
  // A parent sizes pictures with --picture-max.
  import katex from 'katex';
  import 'katex/dist/katex.min.css';
  import { pictureUrl } from './pictures.svelte';
  import type { RichNode, RichText } from './text';

  let { rich, text = '' }: { rich?: RichText | null; text?: string } = $props();

  const math = (source: string, displayMode: boolean) =>
    katex.renderToString(source, { throwOnError: false, displayMode, output: 'htmlAndMathml' });

  function wrapped(node: RichNode): { tags: string[]; href?: string } {
    const tags: string[] = [];
    let href: string | undefined;
    for (const mark of node.marks ?? []) {
      if (mark.type === 'strong') tags.push('strong');
      else if (mark.type === 'emphasis') tags.push('em');
      else if (mark.type === 'strike') tags.push('s');
      else if (mark.type === 'inline-code') tags.push('code');
      else if (mark.type === 'subscript') tags.push('sub');
      else if (mark.type === 'superscript') tags.push('sup');
      else if (mark.type === 'link') href = mark.href;
    }
    return { tags, href };
  }
</script>

{#snippet marked(tags: string[], value: string)}
  {#if !tags.length}{value}{:else}<svelte:element this={tags[0]}>{@render marked(tags.slice(1), value)}</svelte:element>{/if}
{/snippet}

{#snippet nodes(list: RichNode[] | undefined)}
  {#each list ?? [] as node, i (i)}{@render one(node)}{/each}
{/snippet}

{#snippet one(node: RichNode)}
  {#if node.type === 'text'}
    {@const w = wrapped(node)}
    {#if w.href}<a href={w.href} target="_blank" rel="noopener noreferrer">{@render marked(w.tags, node.text ?? '')}</a>{:else}{@render marked(w.tags, node.text ?? '')}{/if}
  {:else if node.type === 'hard-break'}<br />
  {:else if node.type === 'inline-math'}<span class="math">{@html math(node.source ?? '', false)}</span>
  {:else if node.type === 'display-math'}<div class="math-block">{@html math(node.source ?? '', true)}</div>
  {:else if node.type === 'block-image'}
    {@const url = pictureUrl(node.asset ?? '')}
    {#if url}
      <img src={url} alt={node.alt ?? ''} style:max-width={node.ratio ? `${Math.round(node.ratio * 100)}%` : null} />
    {:else}<span class="loading" role="img" aria-label={node.alt || 'Picture'}></span>{/if}
  {:else if node.type === 'paragraph'}<p>{@render nodes(node.content)}</p>
  {:else if node.type === 'heading'}<svelte:element this={`h${Math.min(6, Math.max(3, (node.level ?? 1) + 2))}`}>{@render nodes(node.content)}</svelte:element>
  {:else if node.type === 'blockquote'}<blockquote>{@render nodes(node.content)}</blockquote>
  {:else if node.type === 'bullet-list'}<ul>{@render nodes(node.content)}</ul>
  {:else if node.type === 'ordered-list'}<ol start={node.start ?? 1}>{@render nodes(node.content)}</ol>
  {:else if node.type === 'list-item'}<li>{@render nodes(node.content)}</li>
  {:else if node.type === 'code-block'}<pre><code>{node.text ?? ''}</code></pre>
  {:else if node.type === 'rule'}<hr />
  {:else if node.type === 'table'}<table><tbody>{@render nodes(node.content)}</tbody></table>
  {:else if node.type === 'table-row'}<tr>{@render nodes(node.content)}</tr>
  {:else if node.type === 'table-cell'}
    {#if node.header}<th>{@render nodes(node.content)}</th>{:else}<td>{@render nodes(node.content)}</td>{/if}
  {:else if node.type === 'blank'}<span class="blank">_____</span>
  {:else}{@render nodes(node.content)}
  {/if}
{/snippet}

{#if rich?.length === 1 && rich[0].type === 'paragraph'}<span class="rich flow">{@render nodes(rich[0].content)}</span>
{:else if rich?.length}<span class="rich">{@render nodes(rich)}</span>
{:else}{text}{/if}

<style>
  .rich {
    display: block;
  }
  .rich.flow {
    display: inline;
  }
  .rich :global(p),
  .rich :global(ul),
  .rich :global(ol),
  .rich :global(blockquote),
  .rich :global(pre),
  .rich :global(table) {
    margin: 0 0 0.35em;
  }
  .rich :global(:last-child) {
    margin-bottom: 0;
  }
  .rich :global(ul),
  .rich :global(ol) {
    padding-left: 1.4em;
    text-align: left;
  }
  .rich :global(blockquote) {
    padding-left: 0.8em;
    border-left: 3px solid currentColor;
    opacity: 0.85;
  }
  .rich :global(pre) {
    padding: 0.4em 0.6em;
    border-radius: 6px;
    background: rgb(0 0 0 / 0.08);
    font-size: 0.85em;
    text-align: left;
    white-space: pre-wrap;
  }
  .rich :global(code) {
    font-size: 0.9em;
  }
  .rich :global(table) {
    border-collapse: collapse;
    margin-inline: auto;
    font-size: 0.85em;
  }
  .rich :global(th),
  .rich :global(td) {
    padding: 0.2em 0.6em;
    border: 1px solid currentColor;
  }
  .rich :global(th > p),
  .rich :global(td > p) {
    margin: 0;
  }
  .rich :global(a) {
    color: inherit;
  }
  /* Raised and lowered clearly, without opening up the line: an exponent has to read as one. */
  .rich :global(sup),
  .rich :global(sub) {
    position: relative;
    font-size: 0.68em;
    line-height: 0;
    vertical-align: baseline;
  }
  .rich :global(sup) {
    top: -0.55em;
  }
  .rich :global(sub) {
    bottom: -0.3em;
  }
  img,
  .loading {
    display: block;
    max-width: 100%;
    max-height: var(--picture-max, 16rem);
    margin: 0.3em auto;
    border-radius: 6px;
    object-fit: contain;
  }
  .loading {
    width: 6rem;
    height: 4rem;
    background: rgb(127 127 127 / 0.2);
  }
  .math-block {
    margin: 0.3em 0;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .math :global(.katex),
  .math-block :global(.katex) {
    font-size: 1.05em;
  }
</style>
