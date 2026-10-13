import { Plugin } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import { $prose } from '@milkdown/kit/utils';

/**
 * Hears every change to the document as it happens. Crepe's own listener
 * waits 200ms, and a Save pressed right after typing would miss the last keys.
 */
export const everyChange = (onchange: (view: EditorView) => void) =>
  $prose(
    () =>
      new Plugin({
        view: () => ({
          update(view, previous) {
            if (!view.state.doc.eq(previous.doc)) onchange(view);
          },
        }),
      }),
  );
