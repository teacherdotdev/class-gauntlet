# Craft rules for icon-scale SVG

These are the defaults. A project's own house style overrides them. They describe
the flat style of `examples/`, which reads well from about 48px up.

## Composition

- One subject per drawing, in the view that shows its tell best: side view for
  most animals and bottles, front with a slight top angle for boxes and cartons,
  top-down only when that's the recognisable view (a pizza, a starfish).
- Fill 85–95% of the frame on the long axis and centre it. Leave a small margin
  unless the set deliberately crops tight.
- Use a square-ish viewBox with round numbers, like `0 0 128 128`. Use integer or
  .5 coordinates; the extra precision just adds noise.
- Draw back to front: far limbs and shadows first, then the body, then the face and
  highlights.

## Shape

- **Silhouette test:** filled solid black, the drawing should still name itself.
  Exaggerate what makes it distinctive: the hammerhead's hammer, the crab's claws,
  the ketchup bottle's cone cap.
- Build from a few big shapes (ellipses, rounded rects, smooth cubic paths) rather
  than many small ones. 10–40 shapes is typical; past 60 is usually detail soup.
- Everything connects: limbs meet the body, lids sit on jars, and nothing floats
  unless it's meant to.
- Organic things get curves (`C`/`S`); manufactured things get clean geometry with
  rounded corners (`rx`). A package that's all sharp rectangles reads as a box,
  whatever the label says.

## Colour and shading

- 2–5 base hues per item; the whole set shares one palette logic.
- **Shade with one shared ink,** not new colours: the dark tone (e.g. `#2b2b3a`)
  at `opacity` 0.12–0.3 laid over the base shape for the shadow side, underside,
  or far limbs. Highlights: white at 0.2–0.4. This keeps a batch coherent.
- Two touching shapes need visibly different values, or the edge disappears at
  small sizes.
- No gradients, filters, or blurs unless the set already uses them.

## Detail budget

- One display pixel = viewBox width ÷ display size. At 64px in a 128 viewBox,
  1px = 2 units. **Nothing smaller than 2 display px**: thin lines, tiny dots, and
  small text vanish or turn into mush.
- Texture is a few suggestive marks (3 scales, 2 highlights), never a field of
  lines. Rows of thin stripes read as "barcode", not "bacon".
- Faces (characters): a dark eye circle with a small white glint up and to one
  side; an optional small mouth curve at low opacity. The eyes are the focal point.
- Strokes: either no strokes (flat style) or one consistent width across the set.
  Never mix.

## Products and packaging

- Show what's inside. The package shape plus a big, simple picture of the food
  on the label panel does the work; brand text does not.
- The label is a colour band plus that picture. Leave out fake text, tiny logos,
  nutrition boxes, and barcodes.
- The package format must be unmistakable: tin can = cylinder with ribbed rims
  seen slightly from above; carton = gabled top; bag = pillow with crimped ends;
  jar = shoulder, neck, and a lid wider than the neck.
- Loose food (fruit, meat, bread) is drawn as the food, 1–3 pieces, big.

## Technical

- `viewBox` only; no fixed `width`/`height`.
- No `<text>`, `<image>`, external `href`s, scripts, or fonts.
- If parts animate, wrap each in `<g class="part-…">` or give it an `id`, with a
  sensible `transform-origin` in the `style` (see `examples/crab.svg`).
- Gradient/clipPath ids must be unique per file (prefix with the item name), or
  inlined SVGs will clash on one page.

## Common failures (check for each)

- **Generic rectangle:** a package drawn as a plain box. Fix: exaggerate the format's
  tell (crimps, gable, shoulder, rims) and round it.
- **Detail soup:** it's lovely at 256px and a smudge at 64px. Fix: delete detail until
  the small render is clean.
- **Wrong view:** a side-on cup looks like a rectangle. Fix: tilt to show the opening.
- **Ambiguous twin:** two items in a set look alike (stingray and manta). Fix: push each
  one's distinguishing feature further apart.
- **Floating or detached parts,** accidental overlaps, parts poking outside the body.
- **Off-model scale:** limbs or features wildly out of proportion to the exemplars.
- **Clipped:** part of the drawing sits outside the viewBox. The render script flags it.
