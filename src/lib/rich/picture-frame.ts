import type { EditorView } from '@milkdown/kit/prose/view';

/**
 * Resizing a picture the way Google Docs does: click it for an outline with
 * a square handle at each corner, and drag any corner to make it bigger or
 * smaller, its shape kept. It replaces Crepe's own bar under the picture and
 * keeps what that bar kept: the picture's `ratio`, its height as a share of
 * the height it first fits at.
 */

const SMALLEST = 40;
const CORNERS = ['nw', 'ne', 'sw', 'se'] as const;

export function pictureFrame(root: HTMLElement, viewOf: () => EditorView | null): () => void {
  const frame = document.createElement('div');
  frame.className = 'picture-frame';
  frame.hidden = true;
  for (const corner of CORNERS) {
    const handle = document.createElement('span');
    handle.className = `picture-handle ${corner}`;
    handle.dataset.corner = corner;
    frame.append(handle);
  }
  root.append(frame);

  let picture: HTMLImageElement | null = null;

  const place = () => {
    if (!picture?.isConnected) return hide();
    const box = picture.getBoundingClientRect();
    const origin = root.getBoundingClientRect();
    Object.assign(frame.style, {
      left: `${box.left - origin.left}px`,
      top: `${box.top - origin.top}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
    });
    frame.hidden = false;
  };
  const hide = () => {
    picture = null;
    frame.hidden = true;
  };
  const resized = new ResizeObserver(place);

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as Element;
    if (frame.contains(target)) return;
    // Crepe wraps the picture, so a click lands on its wrapper rather than on it.
    const host = target.closest?.('.milkdown-image-block .image-wrapper');
    const clicked = host?.querySelector<HTMLImageElement>('img[data-type="image-block"]') ?? null;
    if (clicked && root.contains(clicked)) {
      picture = clicked;
      resized.disconnect();
      resized.observe(clicked);
      place();
    } else hide();
  };

  /** Saves the picture's new size into the document, as Crepe's bar would. */
  const keep = (image: HTMLImageElement, height: number) => {
    const view = viewOf();
    const host = image.closest('.milkdown-image-block');
    const origin = Number(image.dataset.origin);
    if (!view || !host || !origin) return;
    let at = -1;
    view.state.doc.descendants((node, pos) => {
      if (at < 0 && node.type.name === 'image-block' && view.nodeDOM(pos) === host) at = pos;
      return at < 0;
    });
    if (at >= 0) view.dispatch(view.state.tr.setNodeAttribute(at, 'ratio', Number((height / origin).toFixed(2))));
  };

  const onHandleDown = (event: PointerEvent) => {
    const corner = (event.target as HTMLElement).dataset.corner;
    const image = picture;
    if (!corner || !image) return;
    event.preventDefault();
    event.stopPropagation();
    const start = image.getBoundingClientRect();
    const widest = image.closest('.milkdown-image-block')?.getBoundingClientRect().width ?? Infinity;
    const shape = start.height / start.width;
    const sign = corner.endsWith('w') ? -1 : 1;
    let height = start.height;
    const move = (e: PointerEvent) => {
      const width = Math.min(widest, Math.max(SMALLEST, start.width + sign * (e.clientX - event.clientX)));
      height = width * shape;
      image.style.height = `${height.toFixed(2)}px`;
      image.dataset.height = height.toFixed(2);
      place();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      frame.classList.remove('dragging');
      keep(image, height);
    };
    frame.classList.add('dragging');
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && picture) hide();
  };

  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKey);
  frame.addEventListener('pointerdown', onHandleDown);
  window.addEventListener('resize', place);
  return () => {
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', place);
    resized.disconnect();
    frame.remove();
  };
}
