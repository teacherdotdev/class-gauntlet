// Renders SVGs so a drawing can be looked at, and checks what can be checked
// without eyes.
//
//   bun render.mjs art/eggs.svg art/soup.svg          # PNGs + contact sheet
//   bun render.mjs art/                               # every .svg in a folder
//   bun render.mjs art/ --with gold/                  # set exemplars beside them
//   bun render.mjs art/eggs.svg --blind               # unlabelled, for blind ID
//
// Options:
//   --out DIR     where PNGs go (default: ./svg-review)
//   --size N      large render size in px (default 256)
//   --small N     display-size render in px (default 64) — judge at this size too
//   --bg COLOR    background behind the art (default #f4f1ea)
//   --with PATH   exemplar SVGs (file or folder) shown first on the sheet, marked ★
//   --blind       sheet shows numbers, not names; the key goes to DIR/key.json
//
// Writes DIR/<name>.png for each drawing and DIR/sheet.png for all of them.
// Exits non-zero if any drawing has an error (not a warning).
//
// Needs Playwright. It is resolved from the current directory, so run this from
// a project that has it installed (or `bun add -d playwright` there first).

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, join, resolve } from 'node:path'

const argv = process.argv.slice(2)
const options = { out: 'svg-review', size: 256, small: 64, bg: '#f4f1ea', blind: false, with: [] }
const inputs = []
for (let at = 0; at < argv.length; at += 1) {
  const arg = argv[at]
  const value = () => argv[(at += 1)]
  if (arg === '--out') options.out = value()
  else if (arg === '--size') options.size = Number(value())
  else if (arg === '--small') options.small = Number(value())
  else if (arg === '--bg') options.bg = value()
  else if (arg === '--with') options.with.push(value())
  else if (arg === '--blind') options.blind = true
  else inputs.push(arg)
}

if (!inputs.length) {
  console.error('usage: bun render.mjs <file.svg | folder>... [--with exemplars] [--blind] [--out dir]')
  process.exit(2)
}

function expand(paths) {
  return paths.flatMap((path) => {
    if (!existsSync(path)) {
      console.error(`not found: ${path}`)
      process.exit(2)
    }
    if (statSync(path).isDirectory()) {
      return readdirSync(path)
        .filter((name) => name.endsWith('.svg'))
        .sort()
        .map((name) => join(path, name))
    }
    return [path]
  })
}

let chromium
try {
  const require = createRequire(resolve('noop.js'))
  ;({ chromium } = require('playwright'))
} catch {
  console.error('Playwright not found from this directory. Run from a project that has it, or `bun add -d playwright`.')
  process.exit(2)
}

const drawings = expand(inputs).map((path) => ({ path, name: basename(path, '.svg'), exemplar: false }))
const exemplars = expand(options.with).map((path) => ({ path, name: basename(path, '.svg'), exemplar: true }))
for (const item of [...exemplars, ...drawings]) item.source = readFileSync(item.path, 'utf8')

mkdirSync(options.out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })

// Inspect one drawing inlined on its own page, so ids never clash between files.
async function inspect(source) {
  await page.setContent(`<body>${source}</body>`)
  return page.evaluate(() => {
    const errors = []
    const warnings = []
    const svg = document.querySelector('body > svg')
    if (!svg) return { errors: ['no <svg> root — does it parse?'], warnings, stats: {} }

    const vb = svg.viewBox.baseVal
    const hasViewBox = svg.hasAttribute('viewBox') && vb.width > 0
    if (!hasViewBox) errors.push('no viewBox — it will not scale')
    if (svg.hasAttribute('width') || svg.hasAttribute('height')) {
      warnings.push('fixed width/height on <svg> — prefer viewBox only')
    }

    const all = [...svg.querySelectorAll('*')]
    const shapes = all.filter((el) => ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line'].includes(el.tagName))
    if (svg.querySelector('text')) warnings.push('<text> renders with whatever font the viewer has — outline it or drop it')
    if (svg.querySelector('image')) warnings.push('<image> embeds a raster — not a vector drawing')
    if (all.some((el) => /^(https?:)?\/\//.test(el.getAttribute('href') || el.getAttribute('xlink:href') || ''))) {
      errors.push('external reference — will not load in most places')
    }
    if (svg.querySelector('filter')) warnings.push('<filter> — heavy and often blurry at small sizes; flat shapes read better')

    const fills = new Set()
    for (const el of shapes) {
      const fill = getComputedStyle(el).fill
      if (fill && fill !== 'none' && !fill.startsWith('url')) fills.add(fill)
    }
    if (fills.size > 10) warnings.push(`${fills.size} distinct fill colours — a tight palette reads better`)
    if (shapes.length > 80) warnings.push(`${shapes.length} shapes — likely too much detail for an icon`)
    if (shapes.length < 3) warnings.push(`only ${shapes.length} shapes — is anything there?`)

    let bbox = null
    try {
      const box = svg.getBBox()
      bbox = { x: box.x, y: box.y, width: box.width, height: box.height }
    } catch {}

    const stats = { shapes: shapes.length, colours: fills.size }
    if (hasViewBox && bbox && bbox.width > 0) {
      const tol = Math.max(vb.width, vb.height) * 0.01
      const clipped = []
      if (bbox.x < vb.x - tol) clipped.push('left')
      if (bbox.y < vb.y - tol) clipped.push('top')
      if (bbox.x + bbox.width > vb.x + vb.width + tol) clipped.push('right')
      if (bbox.y + bbox.height > vb.y + vb.height + tol) clipped.push('bottom')
      if (clipped.length) errors.push(`drawing runs past the viewBox (${clipped.join(', ')}) and will be cut off`)
      const touching = []
      if (!clipped.includes('left') && bbox.x < vb.x + tol) touching.push('left')
      if (!clipped.includes('top') && bbox.y < vb.y + tol) touching.push('top')
      if (!clipped.includes('right') && bbox.x + bbox.width > vb.x + vb.width - tol) touching.push('right')
      if (!clipped.includes('bottom') && bbox.y + bbox.height > vb.y + vb.height - tol) touching.push('bottom')
      if (touching.length) warnings.push(`drawing touches the frame (${touching.join(', ')}) — edges get shaved; leave a small margin unless a tight crop is intended`)

      const fill = Math.max(bbox.width / vb.width, bbox.height / vb.height)
      stats.fill = Math.round(fill * 100)
      if (fill < 0.6) warnings.push(`drawing fills only ${stats.fill}% of its frame — tighten the viewBox or scale up`)

      const dx = (bbox.x + bbox.width / 2 - (vb.x + vb.width / 2)) / vb.width
      const dy = (bbox.y + bbox.height / 2 - (vb.y + vb.height / 2)) / vb.height
      if (Math.abs(dx) > 0.12 || Math.abs(dy) > 0.12) warnings.push('drawing is noticeably off-centre in its frame')
    }
    return { errors, warnings, stats }
  })
}

function dataUrl(source) {
  return `data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}`
}

async function snapshot(source, size, file) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<body style="margin:0;background:${options.bg}"><img src="${dataUrl(source)}" style="display:block;width:${size}px;height:${size}px;object-fit:contain"></body>`,
  )
  await page.waitForFunction(() => document.images[0].complete)
  await page.screenshot({ path: file })
}

let failed = 0
for (const item of drawings) {
  item.report = await inspect(item.source)
  await snapshot(item.source, options.size, join(options.out, `${item.name}.png`))
  const { errors, warnings, stats } = item.report
  if (errors.length) failed += 1
  const status = errors.length ? 'FAIL' : warnings.length ? 'warn' : 'ok'
  const summary = stats.shapes === undefined ? '' : `  (${stats.shapes} shapes, ${stats.colours} colours${stats.fill ? `, fills ${stats.fill}%` : ''})`
  console.log(`${status.padEnd(5)} ${item.name}${summary}`)
  for (const line of errors) console.log(`      error: ${line}`)
  for (const line of warnings) console.log(`      warn:  ${line}`)
}

// The sheet: each drawing large and at display size, exemplars first.
const key = {}
const cells = [...exemplars, ...drawings].map((item, index) => {
  let label = item.exemplar ? `★ ${item.name}` : item.name
  if (options.blind && !item.exemplar) {
    const number = String(Object.keys(key).length + 1)
    key[number] = item.name
    label = `#${number}`
  }
  const src = dataUrl(item.source)
  return `<figure style="margin:0;padding:10px;background:#fff;border-radius:8px;${item.exemplar ? 'outline:2px solid #e0b43a;' : ''}text-align:center">
    <div style="display:flex;align-items:flex-end;gap:10px;background:${options.bg};padding:8px;border-radius:4px">
      <img src="${src}" style="width:${options.size}px;height:${options.size}px;object-fit:contain">
      <img src="${src}" style="width:${options.small}px;height:${options.small}px;object-fit:contain">
    </div>
    <figcaption style="font:600 14px system-ui;margin-top:6px;color:#333">${label}</figcaption>
  </figure>`
})
const columns = Math.min(4, cells.length)
const cellWidth = options.size + options.small + 46
await page.setViewportSize({ width: columns * (cellWidth + 12) + 12, height: 400 })
await page.setContent(
  `<body style="margin:0;padding:12px;background:#ddd;display:grid;align-items:start;align-content:start;grid-template-columns:repeat(${columns},${cellWidth}px);gap:12px">${cells.join('')}</body>`,
)
await page.waitForFunction(() => [...document.images].every((image) => image.complete))
const sheet = join(options.out, 'sheet.png')
await page.screenshot({ path: sheet, fullPage: true })
if (options.blind) writeFileSync(join(options.out, 'key.json'), `${JSON.stringify(key, null, 2)}\n`)
await browser.close()

console.log(`\n${drawings.length - failed}/${drawings.length} without errors. PNGs in ${options.out}/, contact sheet: ${sheet}`)
if (options.blind) console.log(`Blind sheet — the answer key is in ${join(options.out, 'key.json')}; do not show it to the judge.`)
process.exit(failed ? 1 : 0)
