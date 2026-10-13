<script lang="ts">
  // Writing Rich Text, the way Test Parrot does: Milkdown Crepe, with
  // bold/italic/strike/code/links, subscript and superscript, lists, tables,
  // math (inline from the toolbar, a block from the / menu) and pictures
  // (the / menu, or paste or drop one in). Pictures are kept in this
  // browser (pictures.svelte.ts); one pasted from a web page is copied in.
  import { Crepe } from '@milkdown/crepe';
  import '@milkdown/crepe/theme/common/style.css';
  import '@milkdown/crepe/theme/frame.css';
  import { editorViewCtx } from '@milkdown/kit/core';
  import type { Ctx } from '@milkdown/kit/ctx';
  import { Node as ProseNode } from '@milkdown/kit/prose/model';
  import type { EditorView } from '@milkdown/kit/prose/view';
  import { keymapRef } from '@milkdown/crepe/feature/toolbar';
  import { everyChange } from './changes';
  import { onMount, untrack } from 'svelte';
  import { pictureUrlNow, savePicture } from './pictures.svelte';
  import { isScriptActive, scriptKeymap, subscriptIcon, subscriptSchema, superscriptIcon, superscriptSchema, toggleScript } from './script-marks';
  import { leftArrowInputRule, rightArrowInputRule } from './text-arrows';
  import { fromProse, PICTURE_SCHEME, toProse, type ProseJSON, type RichText } from './text';

  let {
    value,
    onchange,
    label,
    placeholder = '',
    autofocus = false,
  }: { value: RichText; onchange: (rich: RichText) => void; label: string; placeholder?: string; autofocus?: boolean } = $props();

  let root: HTMLDivElement;
  let capturing = false;

  /** A picture whose src isn't ours yet (pasted from a web page, or a link): copy it in, or say it couldn't be. */
  async function capture(view: EditorView) {
    const strays: { pos: number; src: string }[] = [];
    if (capturing) return;
    view.state.doc.descendants((node, pos) => {
      if ((node.type.name === 'image-block' || node.type.name === 'image') && node.attrs.src && !String(node.attrs.src).startsWith(PICTURE_SCHEME))
        strays.push({ pos, src: String(node.attrs.src) });
    });
    if (!strays.length) return;
    capturing = true;
    for (const { pos, src } of strays.reverse()) {
      let hash: string | null = null;
      try {
        const response = await fetch(src);
        hash = await savePicture(await response.blob());
      } catch {
        /* blocked by the other site, or not a picture */
      }
      const node = view.state.doc.nodeAt(pos);
      if (!node || node.attrs.src !== src) continue;
      view.dispatch(
        hash
          ? view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: PICTURE_SCHEME + hash })
          : view.state.tr.replaceWith(pos, pos + node.nodeSize, view.state.schema.text('[That picture couldn’t be copied. Save it, then drop it in.]')),
      );
    }
    capturing = false;
  }

  onMount(() => {
    const crepe = new Crepe({
      root,
      defaultValue: '',
      features: {
        [Crepe.Feature.CodeMirror]: true,
        [Crepe.Feature.Latex]: true,
        [Crepe.Feature.TopBar]: false,
        [Crepe.Feature.AI]: false,
      },
      featureConfigs: {
        [Crepe.Feature.Cursor]: { virtual: false },
        [Crepe.Feature.BlockEdit]: { advancedGroup: { codeBlock: null } },
        [Crepe.Feature.ImageBlock]: {
          onUpload: async (file: File) => PICTURE_SCHEME + (await savePicture(file)),
          proxyDomURL: (url: string) => (url.startsWith(PICTURE_SCHEME) ? pictureUrlNow(url.slice(PICTURE_SCHEME.length)) : url),
          blockUploadPlaceholderText: 'or paste a picture’s link',
          blockCaptionPlaceholderText: 'Describe the picture (for screen readers)',
        },
        [Crepe.Feature.Placeholder]: { text: placeholder, mode: 'doc' },
        [Crepe.Feature.Toolbar]: {
          buildToolbar: (builder) => {
            builder
              .getGroup('formatting')
              .addItem('subscript', {
                icon: subscriptIcon,
                label: 'Subscript',
                keymap: keymapRef<'ToggleSubscript' | 'ToggleSuperscript'>(scriptKeymap.key, 'ToggleSubscript'),
                active: (ctx: Ctx) => isScriptActive(ctx, 'subscript'),
                onRun: (ctx: Ctx) => toggleScript(ctx, 'subscript'),
              })
              .addItem('superscript', {
                icon: superscriptIcon,
                label: 'Superscript',
                keymap: keymapRef<'ToggleSubscript' | 'ToggleSuperscript'>(scriptKeymap.key, 'ToggleSuperscript'),
                active: (ctx: Ctx) => isScriptActive(ctx, 'superscript'),
                onRun: (ctx: Ctx) => toggleScript(ctx, 'superscript'),
              });
          },
        },
      },
    });
    let loaded = false;
    const report = everyChange((view) => {
      if (!loaded) return;
      onchange(fromProse(view.state.doc.toJSON() as ProseJSON));
      void capture(view);
    });
    crepe.editor
      .use(subscriptSchema)
      .use(superscriptSchema)
      .use(scriptKeymap)
      .use(rightArrowInputRule)
      .use(leftArrowInputRule)
      .use(report);

    crepe.on((listener) => {
      listener.mounted((ctx) => {
        const view = ctx.get(editorViewCtx);
        const doc = ProseNode.fromJSON(view.state.schema, toProse(untrack(() => value)));
        view.dispatch(view.state.tr.replaceWith(0, view.state.doc.content.size, doc.content).setMeta('addToHistory', false));
        view.dom.setAttribute('aria-label', label);
        loaded = true;
        if (autofocus) view.focus();
      });
    });
    const created = crepe.create();
    return () => void created.then(() => crepe.destroy());
  });
</script>

<div class="rich-editor" bind:this={root}></div>

<style>
  .rich-editor {
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    background: #fff;
    font-weight: 400;
  }
  .rich-editor:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-wash, rgb(160 82 45 / 0.15));
  }
  /* Crepe's frame theme, in the house colours and at the size of a form field. */
  .rich-editor :global(.milkdown) {
    --crepe-color-background: #fff;
    --crepe-color-on-background: var(--ink);
    --crepe-color-surface: var(--paper);
    --crepe-color-surface-low: var(--paper-low);
    --crepe-color-on-surface: var(--ink);
    --crepe-color-on-surface-variant: var(--muted);
    --crepe-color-outline: var(--line-strong);
    --crepe-color-primary: var(--accent);
    --crepe-color-secondary: var(--paper-low);
    --crepe-color-on-secondary: var(--ink);
    --crepe-color-inverse: var(--ink);
    --crepe-color-on-inverse: var(--paper);
    --crepe-color-inline-code: var(--accent);
    --crepe-color-error: var(--bad);
    --crepe-color-hover: var(--paper-low);
    --crepe-color-selected: var(--paper-low);
    --crepe-color-inline-area: var(--paper-low);
    --crepe-font-title: var(--serif);
    --crepe-font-default: inherit;
    --crepe-font-code: ui-monospace, monospace;
    background: transparent;
    border-radius: 8px;
  }
  .rich-editor :global(.milkdown .ProseMirror) {
    padding: 0.5rem 0.65rem 0.5rem 1.9rem;
    min-height: 2.4rem;
  }
  .rich-editor :global(.milkdown .ProseMirror p) {
    font-size: 1rem;
    line-height: 1.45;
    padding: 0.1rem 0;
  }
  .rich-editor :global(.milkdown .ProseMirror .crepe-placeholder::before) {
    color: var(--muted);
  }
  .rich-editor :global(.milkdown .milkdown-block-handle) {
    transform: scale(0.85);
  }
</style>
