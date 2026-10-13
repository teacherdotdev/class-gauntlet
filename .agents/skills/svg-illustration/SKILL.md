---
name: svg-illustration
description: Draw, redraw, or review SVG illustrations — icons, product tiles, characters, animals, sprites, scene pieces, clip art — so they actually read as the thing at their real display size and match the rest of the set. Use whenever you are asked to create or generate an SVG drawing, fix one that "doesn't look right", make a batch of matching artwork, or judge whether generated art is good enough. Not for charts or diagrams.
---

# SVG illustration

Models draw SVG blind: they write coordinates and never see the result unless you
make them look. Nearly every bad drawing comes from one of three causes, and this
workflow exists to remove them:

1. **The drawer never looked at its render.** → Render every attempt and look at it.
2. **Too much detail for the size.** → Design for the display size, not for 512px.
3. **Nobody checked it reads as the thing.** → A fresh judge identifies it blind.

Also: a model handed something to copy (a photo, a sketch, an existing drawing in
the target style) does far better than one handed a written description. Always
give the drawer something to look at.

## 0. Before drawing anything

- **Is generation the right call?** For common objects (foods, animals, everyday
  items) an open-licensed set may already have it: Microsoft Fluent Emoji (MIT),
  Twemoji (CC-BY 4.0), OpenMoji (CC-BY-SA 4.0). Suggest this to the user if the
  subjects are generic; generate what the sets lack or when a custom style matters.
- **Does the project already have a pipeline or house style?** Look for one (for
  example a `house-style.md`, an `art/` folder, or an art-checking script). If it
  exists, follow it and use this skill as the method inside it.
- **Pin down the brief:** subjects, display size in px, background colour, where it
  sits (tile, scene, button), whether parts animate (then group them with an id or
  class and a `transform-origin`), and file location/naming.
- **Find exemplars.** 2–4 finished SVGs in the target style. Prefer ones from the
  project itself; otherwise use `examples/` in this skill (flat reef creatures:
  a good default style). Every drawer gets the same exemplars, which is what keeps
  a batch consistent.
- **Write each subject's *tell*:** the one shape that makes it recognisable at a
  glance, and the view that shows it. "Egg carton: an open lid above a row of
  domed cups with eggs sitting in them, seen from the front at a slight angle."
  "Potato chips: a puffy pillow bag with crimped top and bottom edges, a window
  of chips." If you can't write the tell, the drawer can't draw it.

## 1. Who draws

- Use the **strongest available model** to draw. Drawing is the hard part;
  never hand it to a small model to save money — an icon costs a few thousand
  tokens.
- **One item:** draw it yourself, following step 2.
- **Several items:** spawn one subagent per 1–3 items, in parallel, using the
  brief in `references/drawer-brief.md`. Don't pass a small `model` override. You
  stay as art director: you hold the brief, look at sheets, and send back fixes.
  This keeps dozens of images out of your context.

## 2. The drawing loop (draw → render → look → fix)

1. Read `references/style.md` and look at the exemplars (render them if you have
   only their source).
2. Draw the **silhouette first**: the few big shapes that carry the tell. Render.
   If it doesn't read as the thing as a flat blob, detail won't save it.
3. Add colour, one shadow tone, one highlight, and only the details that survive
   at display size. Render again.
4. Render with the script and **Read the PNG** (the image, not just the text):
   ```sh
   bun <skill-dir>/scripts/render.mjs \
     path/to/item.svg --with path/to/exemplars/ --small 64 --out <scratchpad>/review
   ```
   `<skill-dir>` is the absolute path of the folder this SKILL.md is in. Run it
   from a project with Playwright installed. It prints mechanical problems
   (cut off by the viewBox, touching the frame, off-centre, too many colours or
   shapes, `<text>`, filters, external refs) and writes a contact sheet showing each
   drawing at large and at display size next to the exemplars.
5. Critique against the checklist in `references/style.md`, especially at the
   small size. Fix and repeat. 2–4 rounds is normal.
6. **Check the edges.** Once the shapes are settled, run the edge checker:
   ```sh
   bun <skill-dir>/scripts/edges.mjs \
     path/to/item.svg --fix --out <scratchpad>/edges
   ```
   You can't see sub-pixel slips at 256px, but they show at full size: a shadow
   half whose point stops short of or runs past the tip it shades, texture lines
   that poke out of the fruit, a highlight that almost reaches the edge and leaves
   a thread of base colour, a crack of background between parts meant to touch.
   `--fix` moves the offending points onto the edge they belong on and keeps the
   change only if a re-render shows the defect gone. It edits only the attributes
   it fixed. **Read the crops** it writes (`<name>-N.png` before,
   `<name>-fixed-N.png` after). Fix whatever is left by hand from the crop and
   the coordinates it prints. It can't move circles, ellipses or rects, and a
   long, even rim of base colour round a highlight can be deliberate, so judge
   those rather than obeying them.
7. If the silhouette is wrong after two rounds, **start over** with a different
   view or construction rather than patching.

## 3. Review

Don't mark a drawing done because it was drawn — make it pass a review:

1. **Mechanical:** the render script reports no errors, and `edges.mjs` reports
   nothing you haven't looked at and accepted. Fix any warning unless it's
   deliberate (a tight crop that touches the frame is fine if the set does it).
2. **Blind identification:** render the batch with `--blind` and give the sheet
   to a **fresh subagent** that has never seen the brief or the file names, with the
   prompt in `references/judging.md`. If it can't name an item from the small
   render, the item fails, whatever else is right about it. A judge that knows the
   answer will always see it.
3. **Style match:** that judge (or you) compares the batch with the exemplars:
   same palette logic, shading, line treatment, level of detail, framing.
4. Send failures back to the drawer with the judge's specific geometry fixes, and
   repeat. After three failed rounds, report it as unsolved rather than shipping it.
5. **Human sign-off:** show the user the final contact sheet (give the PNG path, or
   publish it as an artifact) and call out anything you're unsure of. Their
   eye is the last gate — say plainly which items are weakest.
