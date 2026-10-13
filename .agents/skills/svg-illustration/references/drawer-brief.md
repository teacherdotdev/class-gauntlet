# Brief for a drawing subagent

Fill in the brackets and pass this as the subagent's prompt. `[skill dir]` is the
absolute path of this skill's folder (the one holding SKILL.md). Give each subagent
1–3 items. Every subagent in a batch gets the same exemplars and style notes.
Don't set a small model: drawing needs the strongest one available.

---

You are drawing SVG illustrations. Follow the drawing loop in
`[skill dir]/SKILL.md` (step 2) and the rules
in `references/style.md` next to it. Read both before you start.

**Items**
- `[id]`: [subject]. Tell: [the one shape that makes it recognisable, and the view].
  Reference: [path to a photo/sketch/similar drawing, if any].
- …

**Set:** display size [64]px on [background colour]. Exemplars to match:
[paths]. Project style notes: [palette, stroke/no stroke, shading rule, framing, or
"follow style.md"]. Animated parts: [none / which parts, with class names].

**Output:** write each drawing to `[dir]/[id].svg`.

**Process, for each item:**
1. Look at the exemplars first: render them with the script and Read the PNG.
2. Draw the silhouette, render, and Read the PNG. Then colour, shading and detail.
   Render and look after every change. Run the script from `[a directory with
   Playwright, e.g. the project root]`:
   `bun [skill dir]/scripts/render.mjs [dir]/[id].svg --with [exemplars] --small [64] --out [scratch dir]`
3. Judge the **small** render honestly against the "Common failures" list in
   style.md. If someone saw only the small render, would they say "[subject]"?
4. When the shapes are settled, run the edge checker and Read the crops it writes:
   `bun [skill dir]/scripts/edges.mjs [dir]/[id].svg --fix --out [scratch dir]/edges`
   It fixes the misalignments it safely can; fix the rest by hand.
5. Stop when it's clean and the script reports no errors. If the silhouette still
   doesn't read after two rounds, restart with a different view.

**Report back:** for each item, the file path, the number of rounds, and one
honest sentence on its weakest point. Don't claim it's good if you're unsure.
