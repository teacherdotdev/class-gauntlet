# Judging a batch

The judge must be a **fresh subagent** that has not seen the brief, the file
names, or the drawer's reasoning. Render with `--blind` and give it only the sheet
(and the exemplars, which are labelled ★ on the sheet). Keep `key.json` to
yourself.

Use a strong model. A judge's job is to be hard to fool.

## Prompt

---

Read the image at `[sheet.png]`. It's a contact sheet of illustrations for
[context, e.g. "a grocery shop game for kids" — don't list the subjects]. Each
card shows one drawing large and again at its real display size (the small one).
Cards marked ★ are finished exemplars of the target style; the numbered cards are
under review.

For each numbered card, working from the **small** render first:

1. **Identify:** say what it is in a few words, before anything else. If you're
   unsure, give your top two guesses. Don't hedge toward something plausible; say
   what you actually see.
2. **Silhouette:** would the shape alone identify it? What's ambiguous?
3. **Style match:** does it match the ★ exemplars in palette logic, shading,
   outline treatment, level of detail, and framing? Name any mismatch.
4. **Defects:** clipping, floating parts, mush at small size, odd proportions,
   edges lost between similar colours.
5. **Fixes:** at most three concrete changes, phrased as geometry or colour (e.g.
   "make the lid 30% wider than the jar neck", "remove the stripe texture and use two
   highlights"). Don't write "make it more recognisable."

Then note any two numbered cards that could be confused with each other.

Return one block per card:
`#N | guess: … | reads: yes/partly/no | style: match/drift | fixes: …`

---

## Scoring (done by you, with the key)

- **Pass:** the guess names the right subject (a close synonym counts, e.g.
  "tomato sauce bottle" for ketchup), style is `match`, and nothing is clipped.
- **Fail:** a wrong or generic guess ("a box", "a bottle", "some food"), or style
  `drift`. Send the judge's fixes back to the drawer, not your own paraphrase.
- Items the judge confuses with each other both fail on distinctiveness.
- Re-judge redrawn items with a *new* fresh judge; the old one has seen the key's
  shape by now.
