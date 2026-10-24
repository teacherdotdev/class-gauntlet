<script lang="ts">
  // Writing Rich Text, the way Test Parrot does: Milkdown Crepe, with bold,
  // italic, subscript and superscript, lists, tables, math and pictures. The
  // buttons live in one toolbar above every field of a question (see
  // RichToolbar.svelte), which runs them here through `run`; the / menu,
  // shortcuts, and pasting or dropping a picture work too. Pictures are kept
  // in this browser (pictures.svelte.ts); one pasted from a web page is copied in.
  import { Crepe } from '@milkdown/crepe';
  import '@milkdown/crepe/theme/common/style.css';
  import '@milkdown/crepe/theme/frame.css';
  import { commandsCtx, editorViewCtx } from '@milkdown/kit/core';
  import type { Ctx } from '@milkdown/kit/ctx';
  import { Node as ProseNode } from '@milkdown/kit/prose/model';
  import { TextSelection } from '@milkdown/kit/prose/state';
  import type { EditorView } from '@milkdown/kit/prose/view';
  import { toggleEmphasisCommand, toggleStrongCommand } from '@milkdown/kit/preset/commonmark';
  import { everyChange, everySelection } from './changes';
  import { onMount, untrack } from 'svelte';
  import { pictureFrame } from './picture-frame';
  import { addPicture, pictureUrlNow, savePicture } from './pictures.svelte';
  import { isScriptActive, scriptKeymap, subscriptSchema, superscriptSchema, toggleScript } from './script-marks';
  import { leftArrowInputRule, rightArrowInputRule } from './text-arrows';
  import { fromProse, PICTURE_SCHEME, toProse, type ProseJSON, type RichText } from './text';
  import type { Formats, RichCommand } from './toolbar';

  let {
    value,
    onchange,
    label,
    placeholder = '',
    autofocus = false,
    onfocus,
    onformats,
    onproblem,
  }: {
    value: RichText;
    onchange: (rich: RichText) => void;
    label: string;
    placeholder?: string;
    autofocus?: boolean;
    /** When the teacher comes into this field, so the toolbar acts on it. */
    onfocus?: () => void;
    /** What the toolbar should show as on, after every change of selection. */
    onformats?: (formats: Formats) => void;
    /** Something the teacher should hear about, such as a picture too big to add. */
    onproblem?: (message: string) => void;
  } = $props();

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

  let editorCtx: Ctx | null = null;
  let picker: HTMLInputElement;

  const marked = (view: EditorView, name: string) => {
    const type = view.state.schema.marks[name];
    if (!type) return false;
    const selection = view.state.selection;
    return selection.empty
      ? !!type.isInSet(view.state.storedMarks ?? selection.$from.marks())
      : view.state.doc.rangeHasMark(selection.from, selection.to, type);
  };

  const formatsOf = (view: EditorView): Formats => ({
    bold: marked(view, 'strong'),
    italic: marked(view, 'emphasis'),
    superscript: !!editorCtx && isScriptActive(editorCtx, 'superscript'),
    subscript: !!editorCtx && isScriptActive(editorCtx, 'subscript'),
  });

  /** Runs a toolbar button on this field. */
  export function run(command: RichCommand) {
    const ctx = editorCtx;
    if (!ctx) return;
    const view = ctx.get(editorViewCtx);
    const commands = ctx.get(commandsCtx);
    if (command === 'bold') commands.call(toggleStrongCommand.key);
    else if (command === 'italic') commands.call(toggleEmphasisCommand.key);
    else if (command === 'superscript' || command === 'subscript') toggleScript(ctx, command);
    else if (command === 'math') {
      // Selected words become math. With nothing selected, an "x" does, since
      // Crepe opens its box for the LaTeX only on math that has some.
      const { empty, from } = view.state.selection;
      if (empty) {
        const tr = view.state.tr.insertText('x');
        view.dispatch(tr.setSelection(TextSelection.create(tr.doc, from, from + 1)));
      }
      commands.call('ToggleLatex');
      // Type straight into the box, over what's there.
      setTimeout(() => {
        const box = [...root.querySelectorAll<HTMLElement>('.milkdown-latex-inline-edit .ProseMirror')].find((el) => el.offsetParent);
        if (!box) return;
        box.focus();
        getSelection()?.selectAllChildren(box);
      }, 50);
      return;
    } else if (command === 'picture') return picker.click();
    view.focus();
    onformats?.(formatsOf(view));
  }

  async function insertPicture(file: File) {
    if (!editorCtx) return;
    let hash: string;
    try {
      hash = await addPicture(file);
    } catch (reason) {
      onproblem?.(reason instanceof Error ? reason.message : 'That picture couldn’t be added.');
      return;
    }
    const view = editorCtx.get(editorViewCtx);
    const block = view.state.schema.nodes['image-block'];
    if (!block) return;
    view.dispatch(view.state.tr.replaceSelectionWith(block.create({ src: PICTURE_SCHEME + hash })).scrollIntoView());
    view.focus();
  }

  onMount(() => {
    const crepe = new Crepe({
      root,
      defaultValue: '',
      features: {
        [Crepe.Feature.CodeMirror]: true,
        [Crepe.Feature.Latex]: true,
        [Crepe.Feature.TopBar]: false,
        [Crepe.Feature.Toolbar]: false,
        [Crepe.Feature.AI]: false,
      },
      featureConfigs: {
        [Crepe.Feature.Cursor]: { virtual: false },
        [Crepe.Feature.BlockEdit]: { advancedGroup: { codeBlock: null, image: { label: 'Picture' } } },
        [Crepe.Feature.ImageBlock]: {
          onUpload: async (file: File) => {
            try {
              return PICTURE_SCHEME + (await addPicture(file));
            } catch (reason) {
              onproblem?.(reason instanceof Error ? reason.message : 'That picture couldn’t be added.');
              return '';
            }
          },
          proxyDomURL: (url: string) => (url.startsWith(PICTURE_SCHEME) ? pictureUrlNow(url.slice(PICTURE_SCHEME.length)) : url),
          blockUploadPlaceholderText: 'or paste a picture’s link',
          blockCaptionPlaceholderText: 'Describe the picture (for screen readers)',
        },
        [Crepe.Feature.Placeholder]: { text: placeholder, mode: 'doc' },
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
      .use(report)
      .use(everySelection((view) => loaded && view.hasFocus() && onformats?.(formatsOf(view))));

    crepe.on((listener) => {
      listener.mounted((ctx) => {
        const view = ctx.get(editorViewCtx);
        editorCtx = ctx;
        const doc = ProseNode.fromJSON(view.state.schema, toProse(untrack(() => value)));
        view.dispatch(view.state.tr.replaceWith(0, view.state.doc.content.size, doc.content).setMeta('addToHistory', false));
        view.dom.setAttribute('aria-label', label);
        view.dom.addEventListener('focus', () => {
          onfocus?.();
          onformats?.(formatsOf(view));
        });
        loaded = true;
        if (autofocus) view.focus();
      });
    });
    const created = crepe.create();
    const unframe = pictureFrame(root, () => editorCtx?.get(editorViewCtx) ?? null);
    return () => {
      unframe();
      void created.then(() => crepe.destroy());
    };
  });
</script>

<div class="rich-editor" bind:this={root}></div>
<input
  bind:this={picker}
  type="file"
  accept="image/*"
  hidden
  onchange={(e) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (file) void insertPicture(file);
  }}
/>

<style>
  /* Borderless, as Test Parrot's question editor is: the question reads as a
     page, and the dialog around it draws what structure there is. */
  .rich-editor {
    position: relative;
    font-weight: 400;
  }
  /* A picture's corners, as Google Docs draws them (see picture-frame.ts). */
  .rich-editor :global(.milkdown .image-resize-handle) {
    display: none;
  }
  .rich-editor :global(.picture-frame) {
    position: absolute;
    z-index: 5;
    outline: 2px solid var(--accent);
    pointer-events: none;
  }
  .rich-editor :global(.picture-frame[hidden]) {
    display: none;
  }
  .rich-editor :global(.picture-handle) {
    position: absolute;
    width: 10px;
    height: 10px;
    border: 1.5px solid var(--accent);
    background: var(--paper);
    pointer-events: auto;
  }
  .rich-editor :global(.picture-handle.nw) {
    left: -6px;
    top: -6px;
    cursor: nwse-resize;
  }
  .rich-editor :global(.picture-handle.ne) {
    right: -6px;
    top: -6px;
    cursor: nesw-resize;
  }
  .rich-editor :global(.picture-handle.sw) {
    left: -6px;
    bottom: -6px;
    cursor: nesw-resize;
  }
  .rich-editor :global(.picture-handle.se) {
    right: -6px;
    bottom: -6px;
    cursor: nwse-resize;
  }
  /* Crepe's frame theme, in the house colours. */
  .rich-editor :global(.milkdown) {
    --crepe-color-background: var(--paper);
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
    padding: 0;
    min-height: 1.5rem;
  }
  .rich-editor :global(.milkdown .ProseMirror p) {
    font-size: 1rem;
    line-height: 1.45;
    padding: 0.1rem 0;
  }
  .rich-editor :global(.milkdown .ProseMirror sup),
  .rich-editor :global(.milkdown .ProseMirror sub) {
    position: relative;
    font-size: 0.68em;
    line-height: 0;
    vertical-align: baseline;
  }
  .rich-editor :global(.milkdown .ProseMirror sup) {
    top: -0.55em;
  }
  .rich-editor :global(.milkdown .ProseMirror sub) {
    bottom: -0.3em;
  }
  /* A shade lighter than muted words, so it reads as room to write, not as writing. */
  .rich-editor :global(.milkdown .ProseMirror .crepe-placeholder::before) {
    color: color-mix(in srgb, var(--muted) 55%, var(--paper));
  }
  /* The toolbar above and the / menu do what the margin's + and drag handle would. */
  .rich-editor :global(.milkdown .milkdown-block-handle) {
    display: none;
  }
</style>
