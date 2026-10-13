/**
 * What is being dragged from the question browser: one question, or a whole
 * filtered list with the name it would give a Column. Drags stay inside this
 * page, so a module variable carries them; the DataTransfer just says one is
 * under way.
 */
export type Dragged = {
  ids: string[];
  title: string;
  /** Set when a Tile on the Board is dragged, so a drop can swap. */
  from?: { column: number; row: number };
};

let current: Dragged | null = null;

export function startDrag(event: DragEvent, dragged: Dragged) {
  current = dragged;
  event.dataTransfer?.setData('text/plain', dragged.title || dragged.ids.join(','));
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copyMove';
}

export function endDrag() {
  current = null;
}

export function dragged(): Dragged | null {
  return current;
}
