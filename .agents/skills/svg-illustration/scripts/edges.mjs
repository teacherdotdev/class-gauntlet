// Finds, and where it safely can fixes, the small misalignments a model makes
// because it writes coordinates without seeing them: a shadow half whose point
// stops short of (or runs past) the tip it shades, texture lines whose ends poke
// out of the fruit, a highlight that almost reaches the edge and leaves a thread
// of base colour, a hairline of background between two parts meant to touch.
// All of them are under a pixel at display size and plain to see at full size.
//
//   bun edges.mjs art/carrots.svg               # report, with zoomed crops
//   bun edges.mjs art/ --fix                    # also rewrite what it can fix
//
// Options:
//   --out DIR    where crops go (default: ./svg-review/edges)
//   --fix        move the offending points onto the edge they belong on, re-check,
//                and keep the change only if the defect went away
//   --dry        with --fix, write fixed copies to DIR instead of in place
//
// How it decides: every shape is rendered alone. A shape that sits mostly on
// top of one earlier shape is a detail *on* that shape (its "host") — shading,
// highlight, seam, texture. A detail should stay inside its host, and where it
// reaches the host's edge it should reach it exactly. Anything within a couple
// of units of that ideal is almost certainly meant to be on it.
//
// Needs Playwright, resolved from the current directory.

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, join, resolve } from 'node:path'

const argv = process.argv.slice(2)
const options = { out: 'svg-review/edges', fix: false, dry: false }
const inputs = []
for (let at = 0; at < argv.length; at += 1) {
  const arg = argv[at]
  if (arg === '--out') options.out = argv[(at += 1)]
  else if (arg === '--fix') options.fix = true
  else if (arg === '--dry') options.dry = true
  else inputs.push(arg)
}
if (!inputs.length) {
  console.error('usage: bun edges.mjs <file.svg | folder>... [--fix [--dry]] [--out dir]')
  process.exit(2)
}

const files = inputs.flatMap((path) =>
  statSync(path).isDirectory()
    ? readdirSync(path).filter((n) => n.endsWith('.svg')).sort().map((n) => join(path, n))
    : [path],
)

let chromium
try {
  ;({ chromium } = createRequire(resolve('noop.js'))('playwright'))
} catch {
  console.error('Playwright not found from this directory. Run from a project that has it.')
  process.exit(2)
}

mkdirSync(options.out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()

// ---------------------------------------------------------------------------
// Everything below runs in the browser, which is the only thing that knows
// exactly where an SVG's pixels land.
// ---------------------------------------------------------------------------
const inPage = async ({ source, fix }) => {
  const P = 6 // raster pixels per viewBox unit
  const REACH = 1.5 // a detail this close outside its host's edge meant to be on it
  const SHORT = 0.5 // a detail this close inside its host's edge meant to reach it
  const MIN_PX = 6 // defects smaller than this many raster pixels are anti-alias noise

  document.body.innerHTML = source
  const svg = document.querySelector('body > svg')
  const vb = svg.viewBox.baseVal
  svg.setAttribute('width', vb.width)
  svg.setAttribute('height', vb.height)
  const W = Math.ceil(vb.width * P)
  const H = Math.ceil(vb.height * P)

  const inkTags = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line']
  const skip = (el) => el.closest('defs, clipPath, mask, pattern, symbol, marker')
  const shapes = [...svg.querySelectorAll(inkTags.join(','))].filter((el) => !skip(el))

  // Map a point between an element's own coordinates and the root viewBox.
  const rootInverse = svg.getScreenCTM().inverse()
  const toRootMatrix = (el) => rootInverse.multiply(el.getScreenCTM())
  const apply = (m, [x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]

  // --- rasterising -------------------------------------------------------
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  async function rasterise(markup) {
    const img = new Image()
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(markup)))}`
    await img.decode()
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(img, 0, 0, W, H)
    const data = ctx.getImageData(0, 0, W, H).data
    let max = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > max) max = data[i]
    const mask = new Uint8Array(W * H)
    if (!max) return mask
    for (let i = 0, p = 0; p < mask.length; i += 4, p += 1) mask[p] = data[i + 3] * 2 >= max ? 1 : 0
    return mask
  }

  // Render one shape alone, by hiding everything else.
  async function maskOf(el) {
    const clone = svg.cloneNode(true)
    clone.removeAttribute('width')
    clone.removeAttribute('height')
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('visibility', 'hidden')
    const twin = [...clone.querySelectorAll(inkTags.join(','))].filter((e) => !skip(e))[shapes.indexOf(el)]
    twin.setAttribute('visibility', 'visible')
    for (const def of clone.querySelectorAll('defs, clipPath, mask, pattern')) def.setAttribute('visibility', 'visible')
    return rasterise(new XMLSerializer().serializeToString(clone))
  }

  // --- bitmap helpers ----------------------------------------------------
  const count = (m) => m.reduce((s, v) => s + v, 0)
  function dilate(mask, r) {
    const tmp = new Uint8Array(W * H)
    const out = new Uint8Array(W * H)
    for (let y = 0; y < H; y += 1) {
      let last = -1e9
      for (let x = 0; x < W; x += 1) {
        if (mask[y * W + x]) last = x
        if (x - last <= r) tmp[y * W + x] = 1
      }
      last = 1e9
      for (let x = W - 1; x >= 0; x -= 1) {
        if (mask[y * W + x]) last = x
        if (last - x <= r) tmp[y * W + x] = 1
      }
    }
    for (let x = 0; x < W; x += 1) {
      let last = -1e9
      for (let y = 0; y < H; y += 1) {
        if (tmp[y * W + x]) last = y
        if (y - last <= r) out[y * W + x] = 1
      }
      last = 1e9
      for (let y = H - 1; y >= 0; y -= 1) {
        if (tmp[y * W + x]) last = y
        if (last - y <= r) out[y * W + x] = 1
      }
    }
    return out
  }
  // Connected pieces of a mask, each with its pixel count and root-space box.
  function components(mask) {
    const seen = new Uint8Array(W * H)
    const found = []
    for (let start = 0; start < mask.length; start += 1) {
      if (!mask[start] || seen[start]) continue
      const stack = [start]
      seen[start] = 1
      let n = 0, x0 = W, y0 = H, x1 = 0, y1 = 0
      while (stack.length) {
        const p = stack.pop()
        const x = p % W, y = (p - x) / W
        n += 1
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
        for (const q of [p - 1, p + 1, p - W, p + W]) {
          if (q < 0 || q >= mask.length || seen[q] || !mask[q]) continue
          if ((q === p - 1 && x === 0) || (q === p + 1 && x === W - 1)) continue
          seen[q] = 1
          stack.push(q)
        }
      }
      found.push({ n, box: [vb.x + x0 / P, vb.y + y0 / P, (x1 - x0 + 1) / P, (y1 - y0 + 1) / P] })
    }
    return found
  }

  // --- geometry helpers --------------------------------------------------
  // A host's outline, sampled finely, in root coordinates.
  function outline(el) {
    const m = toRootMatrix(el)
    const length = el.getTotalLength()
    const samples = []
    for (let s = 0; s <= length; s += 0.2) {
      const p = el.getPointAtLength(s)
      samples.push(apply(m, [p.x, p.y]))
    }
    return samples
  }
  const nearest = (samples, [x, y]) => {
    let best = null, bestD = Infinity
    for (const s of samples) {
      const d = (s[0] - x) ** 2 + (s[1] - y) ** 2
      if (d < bestD) { bestD = d; best = s }
    }
    return { point: best, distance: Math.sqrt(bestD) }
  }
  const inside = (el, root) => {
    const local = apply(toRootMatrix(el).inverse(), root)
    return el.isPointInFill(new DOMPoint(local[0], local[1]))
  }

  // Path data as absolute M/L/C/Q/A/Z, so any point can move without dragging
  // the rest of the path with it.
  function parsePath(d) {
    const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g) || []
    const out = []
    let i = 0, cmd = '', cx = 0, cy = 0, sx = 0, sy = 0, lastCtrl = null, lastType = ''
    const num = () => Number(tokens[i++])
    while (i < tokens.length) {
      if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++]
      const rel = cmd === cmd.toLowerCase()
      const C = cmd.toUpperCase()
      const ox = rel ? cx : 0, oy = rel ? cy : 0
      if (C === 'Z') { out.push({ c: 'Z', p: [] }); cx = sx; cy = sy; lastType = 'Z'; continue }
      if (C === 'M') {
        cx = ox + num(); cy = oy + num(); sx = cx; sy = cy
        out.push({ c: 'M', p: [[cx, cy]] }); cmd = rel ? 'l' : 'L'; lastType = 'M'; continue
      }
      if (C === 'L') { cx = ox + num(); cy = oy + num(); out.push({ c: 'L', p: [[cx, cy]] }) }
      else if (C === 'H') { cx = (rel ? cx : 0) + num(); out.push({ c: 'L', p: [[cx, cy]] }) }
      else if (C === 'V') { cy = (rel ? cy : 0) + num(); out.push({ c: 'L', p: [[cx, cy]] }) }
      else if (C === 'C' || C === 'S') {
        let c1
        if (C === 'C') c1 = [ox + num(), oy + num()]
        else c1 = lastType === 'C' && lastCtrl ? [2 * cx - lastCtrl[0], 2 * cy - lastCtrl[1]] : [cx, cy]
        const c2 = [ox + num(), oy + num()]
        cx = ox + num(); cy = oy + num()
        out.push({ c: 'C', p: [c1, c2, [cx, cy]] }); lastCtrl = c2; lastType = 'C'; continue
      } else if (C === 'Q' || C === 'T') {
        let c1
        if (C === 'Q') c1 = [ox + num(), oy + num()]
        else c1 = lastType === 'Q' && lastCtrl ? [2 * cx - lastCtrl[0], 2 * cy - lastCtrl[1]] : [cx, cy]
        cx = ox + num(); cy = oy + num()
        out.push({ c: 'Q', p: [c1, [cx, cy]] }); lastCtrl = c1; lastType = 'Q'; continue
      } else if (C === 'A') {
        const arc = [num(), num(), num(), num(), num()]
        cx = ox + num(); cy = oy + num()
        out.push({ c: 'A', arc, p: [[cx, cy]] })
      }
      lastType = C
    }
    return out
  }
  const fmt = (v) => String(Math.round(v * 10) / 10)
  const pair = ([x, y]) => `${fmt(x)} ${fmt(y)}`
  const writePath = (segs) =>
    segs.map((s) =>
      s.c === 'Z' ? 'Z' : s.c === 'A' ? `A${s.arc.join(' ')} ${pair(s.p[0])}` : s.c + s.p.map(pair).join(' '),
    ).join('')

  // --- the checks --------------------------------------------------------
  const masks = []
  for (const el of shapes) masks.push(await maskOf(el))

  // Topmost shape at each pixel, -1 for background.
  const owner = new Int16Array(W * H).fill(-1)
  masks.forEach((m, i) => { for (let p = 0; p < m.length; p += 1) if (m[p]) owner[p] = i })

  const describe = (el) => {
    const i = shapes.indexOf(el)
    const paint = el.getAttribute('fill') || el.getAttribute('stroke') || getComputedStyle(el).fill
    return `${el.tagName} #${i + 1} (${paint})`
  }
  const isStroked = (el) => {
    const cs = getComputedStyle(el)
    return cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0
  }
  const hasFill = (el) => getComputedStyle(el).fill !== 'none'

  function hostOf(i) {
    const m = masks[i]
    const area = count(m)
    if (!area) return null
    let best = -1, bestOverlap = 0
    for (let j = 0; j < i; j += 1) {
      if (!hasFill(shapes[j])) continue
      let overlap = 0
      const h = masks[j]
      for (let p = 0; p < m.length; p += 1) if (m[p] && h[p]) overlap += 1
      if (overlap > bestOverlap) { bestOverlap = overlap; best = j }
    }
    return best >= 0 && bestOverlap / area >= 0.6 ? best : null
  }

  // Pieces of a detail that run just past its host's edge, and threads of host
  // colour left between a detail and the edge it nearly reaches.
  function pairDefects(i, j, m = masks[i]) {
    const hostMask = masks[j]
    const nearHost = dilate(hostMask, 1)
    const band = dilate(hostMask, Math.round(REACH * P))
    const over = new Uint8Array(W * H)
    for (let p = 0; p < m.length; p += 1) if (m[p] && !nearHost[p] && (owner[p] === i || owner[p] < i)) over[p] = 1
    const found = []
    const deep = new Uint8Array(W * H)
    for (let p = 0; p < m.length; p += 1) if (over[p] && !band[p]) deep[p] = 1
    const deepParts = components(deep)
    for (const part of components(over)) {
      if (part.n < MIN_PX) continue
      // A piece that reaches far past the edge was drawn that way on purpose.
      const [x, y, w, h] = part.box
      if (deepParts.some((d) => d.box[0] >= x - 0.01 && d.box[1] >= y - 0.01 && d.box[0] <= x + w && d.box[1] <= y + h)) continue
      found.push({ kind: 'overhang', box: part.box, px: part.n })
    }
    if (hasFill(shapes[i])) {
      const nearDetail = dilate(m, Math.round(SHORT * P))
      const nearEdge = dilate(hostMask.map((v) => 1 - v), Math.round(SHORT * P))
      const thread = new Uint8Array(W * H)
      for (let p = 0; p < m.length; p += 1) if (owner[p] === j && !m[p] && nearDetail[p] && nearEdge[p]) thread[p] = 1
      for (const part of components(thread)) {
        const length = Math.max(part.box[2], part.box[3])
        // A long even rim is a style choice; a near-miss is local.
        if (part.n < MIN_PX * 3 || length < 1.5 || length > 10) continue
        found.push({ kind: 'short', box: part.box, px: part.n })
      }
    }
    return found
  }

  const defects = []
  const pairs = []
  for (let i = 0; i < shapes.length; i += 1) {
    const j = hostOf(i)
    if (j === null) continue
    const found = pairDefects(i, j)
    if (found.length) pairs.push({ i, j, found })
    for (const f of found) defects.push({ ...f, detail: describe(shapes[i]), host: describe(shapes[j]), i, j })
  }

  // Background showing through the drawing in pinholes or hairline cracks.
  {
    const background = new Uint8Array(W * H)
    for (let p = 0; p < owner.length; p += 1) if (owner[p] < 0) background[p] = 1
    const ink = background.map((v) => 1 - v)
    const closed = dilate(ink, Math.round(0.35 * P))
    // Background pixels that a slight thickening of the ink closes over, away
    // from the outside, are cracks rather than the gaps between parts.
    const crack = new Uint8Array(W * H)
    for (let p = 0; p < owner.length; p += 1) if (background[p] && closed[p]) crack[p] = 1
    const outside = new Uint8Array(W * H)
    const stack = []
    for (let x = 0; x < W; x += 1) stack.push(x, (H - 1) * W + x)
    for (let y = 0; y < H; y += 1) stack.push(y * W, y * W + W - 1)
    while (stack.length) {
      const p = stack.pop()
      if (p < 0 || p >= W * H || outside[p] || crack[p] || !background[p]) continue
      outside[p] = 1
      const x = p % W
      stack.push(p - W, p + W)
      if (x > 0) stack.push(p - 1)
      if (x < W - 1) stack.push(p + 1)
    }
    const holes = new Uint8Array(W * H)
    for (let p = 0; p < owner.length; p += 1) if (background[p] && !outside[p]) holes[p] = 1
    // Only holes that are thin all the way through: a wide notch between two
    // lobes, pinched shut at its mouth, is part of the shape.
    const holeParts = components(holes)
    for (const part of holeParts) {
      const length = Math.max(part.box[2], part.box[3])
      if (part.n < MIN_PX || length > 12) continue
      const [bx, by, bw, bh] = part.box
      let thin = 0, all = 0
      for (let y = Math.floor((by - vb.y) * P); y < Math.ceil((by - vb.y + bh) * P); y += 1)
        for (let x = Math.floor((bx - vb.x) * P); x < Math.ceil((bx - vb.x + bw) * P); x += 1) {
          const p = y * W + x
          if (!holes[p]) continue
          all += 1
          if (crack[p]) thin += 1
        }
      if (thin < all * 0.8) continue
      defects.push({ kind: 'crack', box: part.box, px: part.n, detail: 'background', host: 'showing between shapes' })
    }
  }

  // --- fixing ------------------------------------------------------------
  const fixes = []
  if (fix) {
    for (const { i, j, found } of pairs) {
      const el = shapes[i]
      const host = shapes[j]
      if (el.tagName !== 'path' && el.tagName !== 'polygon' && el.tagName !== 'polyline' && el.tagName !== 'line') continue
      if (!hasFill(host)) continue
      const before = found.reduce((s, f) => s + f.px, 0)
      const original = {}
      for (const a of ['d', 'points', 'x1', 'y1', 'x2', 'y2']) if (el.hasAttribute(a)) original[a] = el.getAttribute(a)

      // Everything as path segments, whatever the element was.
      let segs
      if (el.tagName === 'path') segs = parsePath(el.getAttribute('d'))
      else if (el.tagName === 'line') segs = parsePath(`M${original.x1} ${original.y1}L${original.x2} ${original.y2}`)
      else segs = parsePath(`M${original.points}${el.tagName === 'polygon' ? 'Z' : ''}`)

      const toRoot = toRootMatrix(el)
      const fromRoot = toRoot.inverse()
      const hostEdge = outline(host)
      const scale = Math.sqrt(Math.abs(toRoot.a * toRoot.d - toRoot.b * toRoot.c))
      const stroked = isStroked(el) && !hasFill(el)
      const margin = stroked ? (parseFloat(getComputedStyle(el).strokeWidth) * scale) / 2 + 0.1 : 0
      const nearDefect = (pt) =>
        found.some(({ box: [x, y, w, h] }) => pt[0] > x - 2 && pt[0] < x + w + 2 && pt[1] > y - 2 && pt[1] < y + h + 2)

      let moved = 0
      for (let s = 0; s < segs.length; s += 1) {
        const seg = segs[s]
        seg.p.forEach((pt, k) => {
          const root = apply(toRoot, pt)
          if (!nearDefect(root)) return
          const isEnd = k === seg.p.length - 1
          const { point, distance } = nearest(hostEdge, root)
          const isIn = inside(host, root)
          let target = null
          if (stroked && isEnd) {
            // Pull a line's end back along the line until its cap is inside.
            if (isIn && distance >= margin) return
            const other = s > 0 && seg.c !== 'M' ? segs[s - 1].p.at(-1) : segs[s + 1]?.p.at(-1)
            if (!other) return
            const toward = apply(toRoot, other)
            for (let t = 0; t <= 1; t += 0.01) {
              const q = [root[0] + (toward[0] - root[0]) * t, root[1] + (toward[1] - root[1]) * t]
              if (inside(host, q) && nearest(hostEdge, q).distance >= margin) { target = q; break }
            }
            if (target && Math.hypot(target[0] - root[0], target[1] - root[1]) > REACH + margin) target = null
          } else if (!isIn && distance <= REACH) {
            target = point // outside, but meant to be on the edge
          } else if (isIn && isEnd && distance <= SHORT && !stroked) {
            target = point // just inside, stopping short of the edge
          }
          if (!target) return
          seg.p[k] = apply(fromRoot, target)
          moved += 1
        })
      }
      if (!moved) continue

      // Keep the change only if it actually cured the defect.
      const write = () => {
        if (el.tagName === 'path') el.setAttribute('d', writePath(segs))
        else if (el.tagName === 'line') {
          const [a, b] = [segs[0].p[0], segs[1].p[0]]
          el.setAttribute('x1', fmt(a[0])); el.setAttribute('y1', fmt(a[1]))
          el.setAttribute('x2', fmt(b[0])); el.setAttribute('y2', fmt(b[1]))
        } else el.setAttribute('points', segs.filter((g) => g.p.length).map((g) => pair(g.p[0]).replace(' ', ',')).join(' '))
      }
      write()
      let after = pairDefects(i, j, await maskOf(el))
      // Curves can still bulge past the edge through their control points;
      // ease those toward the chord a few times.
      for (let round = 0; round < 4 && after.some((f) => f.kind === 'overhang'); round += 1) {
        for (let s = 1; s < segs.length; s += 1) {
          const seg = segs[s]
          if (seg.c !== 'C' && seg.c !== 'Q') continue
          const start = segs[s - 1].p.at(-1)
          const end = seg.p.at(-1)
          for (let k = 0; k < seg.p.length - 1; k += 1) {
            const root = apply(toRoot, seg.p[k])
            if (!nearDefect(root) || inside(host, root)) continue
            const chord = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
            seg.p[k] = [seg.p[k][0] + (chord[0] - seg.p[k][0]) * 0.35, seg.p[k][1] + (chord[1] - seg.p[k][1]) * 0.35]
          }
        }
        write()
        after = pairDefects(i, j, await maskOf(el))
      }
      const remaining = after.reduce((s, f) => s + f.px, 0)
      const changed = Math.abs(count(await maskOf(el)) - count(masks[i])) / Math.max(1, count(masks[i]))
      if (remaining <= before * 0.2 && changed < 0.15) {
        const attrs = {}
        for (const a of Object.keys(original)) attrs[a] = el.getAttribute(a)
        const tag = [...svg.querySelectorAll(inkTags.join(','))].indexOf(el)
        fixes.push({ detail: describe(el), host: describe(host), points: moved, before, remaining, tag, attrs })
        masks[i] = await maskOf(el)
        for (const d of defects) if (d.i === i && d.j === j) d.fixed = true
      } else {
        for (const [a, v] of Object.entries(original)) el.setAttribute(a, v)
      }
    }
  }

  return { defects: defects.map(({ i, j, ...d }) => d), fixes }
}

// ---------------------------------------------------------------------------

async function crop(source, box, file) {
  const [x, y, w, h] = box
  const size = Math.max(14, w + 8, h + 8)
  const cx = x + w / 2, cy = y + h / 2
  const view = `${cx - size / 2} ${cy - size / 2} ${size} ${size}`
  const ring = `<svg viewBox="${view}" style="position:absolute;inset:0;width:100%;height:100%"><rect x="${x - 1}" y="${y - 1}" width="${w + 2}" height="${h + 2}" rx="1" fill="none" stroke="#e11d48" stroke-width="${size / 150}" stroke-dasharray="${size / 60}"/></svg>`
  const art = source.replace(/viewBox="[^"]*"/, `viewBox="${view}"`).replace('<svg', '<svg style="position:absolute;inset:0;width:100%;height:100%"')
  await page.setViewportSize({ width: 360, height: 360 })
  await page.setContent(`<body style="margin:0;background:#f4f1ea"><div style="position:relative;width:360px;height:360px">${art}${ring}</div></body>`)
  await page.screenshot({ path: file })
}

let open = 0
for (const path of files) {
  const name = basename(path, '.svg')
  const source = readFileSync(path, 'utf8')
  const result = await page.evaluate(inPage, { source, fix: options.fix })
  const remaining = result.defects.filter((d) => !d.fixed)
  open += remaining.length
  console.log(`${remaining.length ? 'edges' : 'ok   '} ${name}${result.fixes.length ? `  (fixed ${result.fixes.length})` : ''}`)
  let n = 0
  for (const d of result.defects) {
    n += 1
    const [x, y, w, h] = d.box.map((v) => Math.round(v * 10) / 10)
    const what =
      d.kind === 'overhang' ? `${d.detail} runs past the edge of ${d.host}`
      : d.kind === 'short' ? `${d.detail} stops just short of the edge of ${d.host}, leaving a thread of it`
      : 'a crack of background shows through between shapes'
    const file = join(options.out, `${name}-${n}.png`)
    await crop(source, d.box, file)
    console.log(`      ${d.fixed ? 'fixed' : d.kind.padEnd(5)} ${what} at x ${x}–${x + w}, y ${y}–${y + h}  → ${file}`)
  }
  if (result.fixes.length) {
    const target = options.dry ? join(options.out, `${name}.svg`) : path
    // Edit only the attribute values that moved, so the file keeps its own
    // formatting and the diff shows exactly what changed.
    let tag = -1
    const edited = source.replace(/<(path|rect|circle|ellipse|polygon|polyline|line)\b[^>]*>/g, (markup) => {
      tag += 1
      const fix = result.fixes.find((f) => f.tag === tag)
      if (!fix) return markup
      for (const [a, v] of Object.entries(fix.attrs)) markup = markup.replace(new RegExp(`(\\s${a}=")[^"]*"`), `$1${v}"`)
      return markup
    })
    writeFileSync(target, edited)
    for (const [k, f] of result.fixes.entries()) {
      const again = join(options.out, `${name}-fixed-${k + 1}.png`)
      const d = result.defects.find((x) => x.fixed && x.detail === f.detail)
      if (d) await crop(readFileSync(target, 'utf8'), d.box, again)
    }
    console.log(`      wrote ${target}`)
  }
}
await browser.close()
console.log(`\n${open} edge problem${open === 1 ? '' : 's'} left. Crops in ${options.out}/ — Read them; a fix moves points, so look before keeping it.`)
process.exit(open ? 1 : 0)
