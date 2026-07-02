// Publication-quality SVG definition figures for VesselImpact, drawn in the
// AASHTO engineering style: italic variable symbols with smaller italic
// subscripts, upright values and units, haloed labels over water/structure,
// and true dimension lines with extension lines and arrowheads. The same SVG
// string renders live in the app and is rasterized into the PDF report, so
// each figure is self-contained with an explicit viewBox.

const C = {
  ink: '#1b2733', txt: '#243040', gray: '#69747f', line: '#c3ccd6',
  dim: '#5b6673', waveLine: '#2b7fb0', bedLine: '#4d5a66',
  hullFill: '#eef2f6', hullLine: '#39434e',
  struct: '#dbe2ea', structLine: '#55616e',
  red: '#d63c2f', gold: '#b07714', goldArrow: '#d99a23', teal: '#0f766e',
}
const F = (v) => (Number.isFinite(v) ? Number(v.toPrecision(4)) : 0)
const num = (v) => {
  const f = F(v)
  return Math.abs(f) >= 1000 ? f.toLocaleString('en-US') : String(f)
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// Estimated glyph advance in px at a 9 px base size (UI sans stack).
const ew = (s) => s.length * 4.75
const it = (s) => `<tspan font-style="italic">${s}</tspan>`

// Math label: italic symbol, smaller italic subscript, upright "= value unit".
// Greek letters may be passed directly in `sym`. Returns { svg, w } with the
// width estimated at a 9 px base size.
function mlab(sym, subs, val, unit, o = {}) {
  let svg = o.upright ? sym : it(sym)
  let w = ew(sym) + 1
  if (subs) {
    svg += `<tspan font-style="italic" font-size="70%" dy="2.4">${subs}</tspan>`
    w += ew(subs) * 0.72
  }
  let rest = val != null ? ` = ${num(val)}` : ''
  if (unit) rest += ` ${unit}`
  if (rest) {
    svg += subs ? `<tspan dy="-2.4">${rest}</tspan>` : rest
    w += ew(rest)
  } else if (subs) {
    svg += '<tspan dy="-2.4">​</tspan>'
  }
  return { svg, w }
}

// Concatenate strings (upright) and { svg, w } fragments into one label.
function mcat(parts) {
  let svg = ''
  let w = 0
  for (const p of parts) {
    if (typeof p === 'string') {
      svg += p
      w += ew(p)
    } else {
      svg += p.svg
      w += p.w
    }
  }
  return { svg, w }
}

function txt(x, y, s, o = {}) {
  const {
    size = 9, col = C.txt, anchor = 'start', weight = '600',
    italic = false, halo = false, opacity = null,
  } = o
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="${col}" font-weight="${weight}"${italic ? ' font-style="italic"' : ''}${halo ? ' stroke="#ffffff" stroke-width="3.2" paint-order="stroke" stroke-linejoin="round"' : ''}${opacity != null ? ` opacity="${opacity}"` : ''}>${s}</text>`
}

function defs() {
  const head = (id, col) =>
    `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${col}"/></marker>`
  return `<defs>${head('ahd', C.dim)}${head('ahr', C.red)}${head('ahg', C.goldArrow)}${head('aht', C.teal)}` +
    '<linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe9f7"/><stop offset="1" stop-color="#a8cfe6"/></linearGradient>' +
    '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5f9fd"/><stop offset="1" stop-color="#e9f2f9"/></linearGradient>' +
    `<pattern id="chx" patternUnits="userSpaceOnUse" width="6" height="6"><path d="M0 6 L6 0" stroke="${C.red}" stroke-width="0.9" opacity="0.55"/></pattern></defs>`
}

// --- engineering dimension lines --------------------------------------------
const ARW = 34 // minimum span for arrowheads to fit inside the extension lines

const extLine = (x0, y0, x1, y1) =>
  `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${C.dim}" stroke-width="0.9"/>`

const dimText = (x, y, lab, o = {}) =>
  txt(x, y, lab.svg, { size: o.size ?? 9, col: o.col ?? C.txt, anchor: o.anchor ?? 'middle', weight: '700', halo: true })

// Horizontal dimension at height y between x0..x1. extY = [featureY at x0,
// featureY at x1] draws extension lines from the feature to just past the
// dimension line. Text goes above the line when it fits, otherwise beside it.
function dimH(y, x0, x1, lab, o = {}) {
  const { extY = null, col = C.txt, size = 9, side = 'left', smallStyle = 'outside' } = o
  let g = ''
  if (extY) {
    ;[[x0, extY[0]], [x1, extY[1]]].forEach(([xi, fy]) => {
      if (fy == null) return
      const dir = y > fy ? 1 : -1
      g += extLine(xi, fy + 2 * dir, xi, y + 3 * dir)
    })
  }
  const span = x1 - x0
  if (span >= ARW) {
    g += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${C.dim}" stroke-width="1" marker-start="url(#ahd)" marker-end="url(#ahd)"/>`
  } else if (smallStyle === 'ticks') {
    // oblique tick terminators: nothing protrudes past the extension lines
    g += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${C.dim}" stroke-width="1"/>`
    g += `<line x1="${x0 - 3}" y1="${y + 3.2}" x2="${x0 + 3}" y2="${y - 3.2}" stroke="${C.dim}" stroke-width="1.2"/>`
    g += `<line x1="${x1 - 3}" y1="${y + 3.2}" x2="${x1 + 3}" y2="${y - 3.2}" stroke="${C.dim}" stroke-width="1.2"/>`
  } else {
    g += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${C.dim}" stroke-width="1"/>`
    g += `<line x1="${x0 - 12}" y1="${y}" x2="${x0}" y2="${y}" stroke="${C.dim}" stroke-width="1" marker-end="url(#ahd)"/>`
    g += `<line x1="${x1 + 12}" y1="${y}" x2="${x1}" y2="${y}" stroke="${C.dim}" stroke-width="1" marker-end="url(#ahd)"/>`
  }
  const labW = lab.w * (size / 9)
  const pad = span >= ARW || smallStyle === 'ticks' ? 8 : 18
  if (labW + 10 <= span) g += dimText((x0 + x1) / 2, y - 4, lab, { size, col })
  else if (side === 'right') g += dimText(x1 + pad, y + 3, lab, { size, col, anchor: 'start' })
  else g += dimText(x0 - pad, y + 3, lab, { size, col, anchor: 'end' })
  return g
}

// Vertical dimension at x between y0..y1. extX = [featureX at y0, featureX at
// y1]. Text is rotated onto the line when it fits, otherwise horizontal beside.
function dimV(x, y0, y1, lab, o = {}) {
  const { extX = null, col = C.txt, size = 9, side = 'left' } = o
  let g = ''
  if (extX) {
    ;[[y0, extX[0]], [y1, extX[1]]].forEach(([yi, fx]) => {
      if (fx == null) return
      const dir = x > fx ? 1 : -1
      g += extLine(fx + 2 * dir, yi, x + 3 * dir, yi)
    })
  }
  const span = y1 - y0
  if (span >= ARW) {
    g += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="${C.dim}" stroke-width="1" marker-start="url(#ahd)" marker-end="url(#ahd)"/>`
  } else {
    g += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="${C.dim}" stroke-width="1"/>`
    g += `<line x1="${x}" y1="${y0 - 12}" x2="${x}" y2="${y0}" stroke="${C.dim}" stroke-width="1" marker-end="url(#ahd)"/>`
    g += `<line x1="${x}" y1="${y1 + 12}" x2="${x}" y2="${y1}" stroke="${C.dim}" stroke-width="1" marker-end="url(#ahd)"/>`
  }
  const labW = lab.w * (size / 9)
  const mid = (y0 + y1) / 2
  if (labW + 10 <= span) {
    g += `<g transform="translate(${x},${mid}) rotate(-90)">${dimText(0, 3, lab, { size, col })}</g>`
  } else if (side === 'right') {
    g += dimText(x + 8, mid + 3, lab, { size, col, anchor: 'start' })
  } else {
    g += dimText(x - 8, mid + 3, lab, { size, col, anchor: 'end' })
  }
  return g
}

const farrow = (x0, y0, x1, y1, col, mk, sw = 3.25) =>
  `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${col}" stroke-width="${sw}" marker-end="url(#${mk})"/>`

const flab = (x, y, lab, col, o = {}) =>
  txt(x, y, lab.svg, { size: o.size ?? 10, col, anchor: o.anchor ?? 'end', weight: '700', halo: true })

function waterBed(x0, x1, swlY, bedY) {
  let g = `<rect x="${x0}" y="${swlY}" width="${x1 - x0}" height="${bedY - swlY}" fill="url(#wg)" opacity="0.5"/>`
  g += `<line x1="${x0}" y1="${swlY}" x2="${x1}" y2="${swlY}" stroke="${C.waveLine}" stroke-width="1.4" stroke-dasharray="7 4"/>`
  g += `<line x1="${x0}" y1="${bedY}" x2="${x1}" y2="${bedY}" stroke="${C.bedLine}" stroke-width="1.8"/>`
  for (let gx = x0; gx < x1 - 8; gx += 14) {
    g += `<line x1="${gx}" y1="${bedY}" x2="${gx + 8}" y2="${bedY + 8}" stroke="${C.gray}" stroke-width="0.9"/>`
  }
  g += txt(x0 + 4, swlY - 6, 'MHW', { col: C.waveLine, weight: '700', halo: true })
  g += txt(x1 - 4, bedY + 14, 'bed', { col: C.bedLine, anchor: 'end', halo: true })
  return g
}

const panel = (x, y, w, h) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#ffffff" stroke="${C.line}" opacity="0.97"/>`

function wrap(w, h, inner, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" font-family="-apple-system, Segoe UI, Roboto, sans-serif"><rect x="0" y="0" width="${w}" height="${h}" fill="url(#sky)"/>${defs()}${txt(28, 18, title, { size: 11, col: C.ink, weight: '700' })}${inner}</svg>`
}

// Pier elevation shared by the ship and barge figures: footing, column, cap,
// and superstructure (girders + deck slab). Returns key coordinates.
function pierGroup(pierX, swlY, bedY) {
  const colW = 36
  const capY = swlY - 74
  const capH = 16
  const slabH = 10
  const girdH = 24
  const deckY = capY - girdH - slabH
  const cxp = pierX + colW / 2
  const ftgT = bedY - 20
  let g = ''
  g += `<rect x="${cxp - 34}" y="${ftgT}" width="68" height="${bedY - ftgT}" fill="${C.struct}" stroke="${C.structLine}" stroke-width="1.2"/>`
  g += `<rect x="${pierX}" y="${capY + capH}" width="${colW}" height="${ftgT - capY - capH}" fill="${C.struct}" stroke="${C.structLine}" stroke-width="1.3"/>`
  g += `<rect x="${pierX - 12}" y="${capY}" width="${colW + 24}" height="${capH}" fill="${C.struct}" stroke="${C.structLine}" stroke-width="1.2"/>`
  g += `<rect x="${cxp - 58}" y="${deckY + slabH}" width="116" height="${girdH}" fill="#c6d0dc" stroke="${C.structLine}" stroke-width="1"/>`
  g += `<line x1="${cxp - 20}" y1="${deckY + slabH}" x2="${cxp - 20}" y2="${capY}" stroke="${C.structLine}" stroke-width="0.7"/>`
  g += `<line x1="${cxp + 20}" y1="${deckY + slabH}" x2="${cxp + 20}" y2="${capY}" stroke="${C.structLine}" stroke-width="0.7"/>`
  g += `<rect x="${cxp - 72}" y="${deckY}" width="144" height="${slabH}" fill="${C.struct}" stroke="${C.structLine}" stroke-width="1.2"/>`
  g += txt(cxp, deckY - 6, 'Superstructure', { col: C.structLine, anchor: 'middle' })
  g += txt(pierX + colW + 24, swlY + 34, 'Pier', { col: C.structLine, halo: true })
  return { g, colW, capY, capB: capY + capH, deckY, girdL: cxp - 58, girdMidY: deckY + slabH + girdH / 2 }
}

// ---------------------------------------------------------------------------
// Ship collision on pier (Arts. 3.14.7-3.14.10, Figs. 3.14.14.1-1/-2)
// ---------------------------------------------------------------------------
export function shipImpactFigure(d) {
  const W = 780
  const x0 = 28, x1 = 752
  const swlY = 190
  const draftPx = clamp((d.draft || 20) * 1.9, 22, 58)
  const fb = clamp(((d.DB || 30) - (d.draft || 20)) * 2.2 + 22, 24, 40)
  const hullTop = swlY - fb
  const hullBot = swlY + draftPx
  const bedY = hullBot + clamp((d.ukc ?? 10) * 2.4, 14, 40)

  const pierX = 574
  const pier = pierGroup(pierX, swlY, bedY)
  const bowX = pierX - 1 // bow tip at deck level, in contact with the pier face
  const sternX = 218
  const stemDX = 46 // stem rake run from deck to the forefoot

  let g = waterBed(x0, x1, swlY, bedY)

  // hull: raked stem forward, counter stern aft
  g += `<path d="M ${sternX} ${hullTop} L ${bowX} ${hullTop} L ${bowX - stemDX} ${hullBot - 8} Q ${bowX - stemDX - 6} ${hullBot} ${bowX - stemDX - 16} ${hullBot} L ${sternX + 18} ${hullBot} Q ${sternX + 1} ${hullBot - 4} ${sternX} ${hullTop} Z" fill="${C.hullFill}" stroke="${C.hullLine}" stroke-width="1.6"/>`
  // deck house, windows, mast
  g += `<rect x="228" y="${hullTop - 30}" width="60" height="30" rx="2" fill="#e6ecf2" stroke="${C.structLine}" stroke-width="1.1"/>`
  for (let i = 0; i < 3; i++) g += `<rect x="${236 + i * 18}" y="${hullTop - 23}" width="11" height="7" fill="#9fc6dd"/>`
  g += `<line x1="258" y1="${hullTop - 30}" x2="258" y2="${hullTop - 58}" stroke="${C.structLine}" stroke-width="1.8"/>`
  g += `<line x1="258" y1="${hullTop - 52}" x2="274" y2="${hullTop - 44}" stroke="${C.structLine}" stroke-width="1"/>`
  // cargo hatch covers on the foredeck
  g += `<rect x="305" y="${hullTop - 8}" width="35" height="7" rx="1.5" fill="#c9b06a" stroke="${C.structLine}" stroke-width="0.8"/>`
  g += `<rect x="350" y="${hullTop - 8}" width="35" height="7" rx="1.5" fill="#c9b06a" stroke="${C.structLine}" stroke-width="0.8"/>`

  // crush wedge over the bow damage length a_S (hatched, with dashed extent)
  const asPx = clamp((d.aS || 4) * 1.7, 8, 84)
  const xw = bowX - asPx
  let wedge
  if (xw >= bowX - stemDX) {
    const tm = (bowX - xw) / stemDX
    wedge = `M ${xw} ${hullTop} L ${bowX} ${hullTop} L ${xw} ${hullTop + (hullBot - 8 - hullTop) * tm} Z`
  } else {
    wedge = `M ${xw} ${hullTop} L ${bowX} ${hullTop} L ${bowX - stemDX} ${hullBot - 8} L ${xw} ${hullBot - 2} Z`
  }
  g += `<path d="${wedge}" fill="url(#chx)" stroke="none"/>`
  const wedgeBot = xw >= bowX - stemDX ? hullTop + (hullBot - 8 - hullTop) * ((bowX - xw) / stemDX) : hullBot - 2
  g += `<line x1="${xw}" y1="${hullTop}" x2="${xw}" y2="${wedgeBot}" stroke="${C.red}" stroke-width="1.2" stroke-dasharray="4 3"/>`

  // a_S dimension above the deck, between the cap and the sheer line
  g += dimH(hullTop - 12, xw, bowX, mlab('a', 'S', d.aS, 'ft'), { extY: [hullTop, hullTop], col: C.red, smallStyle: 'ticks' })

  // velocity arrow over the foredeck
  g += farrow(300, hullTop - 21, 372, hullTop - 21, C.teal, 'aht', 3)
  g += flab(336, hullTop - 29, mlab('V', '', d.V, 'ft/s'), C.teal, { anchor: 'middle' })

  // draft (outer left) and bow depth D_B (inner left) dimensions off the stern
  g += dimV(150, swlY, hullBot, mlab('draft', null, d.draft, 'ft', { upright: true }), { extX: [null, 236] })
  g += dimV(196, hullTop, hullBot, mlab('D', 'B', d.DB, 'ft'), { extX: [216, 236] })
  // extend the keel extension line to reach the outer draft dimension
  g += extLine(147, hullBot, 193, hullBot)

  // water depth d_w on the right, clear of the pier
  const dw = d.ukc != null && d.draft != null ? d.ukc + d.draft : null
  g += dimV(736, swlY, bedY, mlab('d', 'w', dw, 'ft'))

  g += pier.g

  // concentrated impact force P_S at MHW (Fig. 3.14.14.1-1)
  g += farrow(xw - 12, swlY, pierX - 1.5, swlY, C.red, 'ahr', 3.5)
  g += flab(Math.min(xw - 10, 550), swlY - 8, mlab('P', 'S', d.PS, 'kip'), C.red, { size: 10.5 })
  g += txt(Math.min(xw - 10, 541), swlY + 13, 'at MHW · Fig. 3.14.14.1-1', { col: C.gray, anchor: 'end', halo: true })

  // line load P_S/D_B over the bow depth at the pier face (Fig. 3.14.14.1-2)
  let lastLL = swlY
  let ll = ''
  for (let fy = hullTop + 6; fy <= hullBot - 4; fy += 12) {
    if (Math.abs(fy - swlY) < 10) continue
    ll += `<line x1="546" y1="${fy}" x2="${pierX - 2}" y2="${fy}" stroke="${C.red}" stroke-width="1.3" marker-end="url(#ahr)"/>`
    lastLL = fy
  }
  g += `<g opacity="0.45">${ll}</g>`
  const noteY = Math.max(hullBot + 9, bedY - 9)
  g += txt(538, noteY, mcat(['line load ', mlab('P', 'S'), '/', mlab('D', 'B'), ' over bow depth · Fig. 3.14.14.1-2']).svg, { col: C.red, anchor: 'end', halo: true })
  g += `<line x1="541" y1="${noteY - 4}" x2="550" y2="${lastLL + 5}" stroke="${C.red}" stroke-width="0.9"/>`

  // superstructure force P_BH, only when a deck-house collision is computed
  if (d.PBH > 0) {
    g += farrow(472, pier.girdMidY, pier.girdL - 4, pier.girdMidY, C.goldArrow, 'ahg', 3)
    g += flab(464, pier.girdMidY + 3, mlab('P', 'BH', d.PBH, 'kip'), C.gold)
  }

  // legend: force swatch | symbol = value | citation, plus a parameters block
  const ly = bedY + 10
  const rows = [ly + 22, ly + 44, ly + 66]
  g += panel(40, ly, 690, 78)
  g += `<line x1="52" y1="${rows[0] - 3}" x2="80" y2="${rows[0] - 3}" stroke="${C.red}" stroke-width="3" marker-end="url(#ahr)"/>`
  g += txt(88, rows[0], mlab('P', 'S', d.PS, 'kip').svg, { weight: '700' })
  g += txt(396, rows[0], 'Eq. 3.14.8-1', { col: C.gray, weight: '500' })
  g += `<g opacity="0.5"><line x1="52" y1="${rows[1] - 3}" x2="80" y2="${rows[1] - 3}" stroke="${C.red}" stroke-width="1.4" marker-end="url(#ahr)"/></g>`
  g += txt(88, rows[1], mcat(['line load ', mlab('P', 'S'), '/', mlab('D', 'B'), ' over bow depth']).svg)
  g += txt(396, rows[1], 'Fig. 3.14.14.1-2', { col: C.gray, weight: '500' })
  g += `<line x1="52" y1="${rows[2] - 3}" x2="80" y2="${rows[2] - 3}" stroke="${C.goldArrow}" stroke-width="3" marker-end="url(#ahg)"/>`
  g += txt(88, rows[2], mcat([mlab('P', 'BH', d.PBH), ' · ', mlab('P', 'DH', d.PDH), ' · ', mlab('P', 'MT', d.PMT, 'kip')]).svg, { weight: '700' })
  g += txt(396, rows[2], 'Art. 3.14.10', { col: C.gray, weight: '500' })
  g += `<line x1="552" y1="${ly + 8}" x2="552" y2="${ly + 70}" stroke="${C.line}" stroke-width="1"/>`
  g += txt(564, rows[0], mlab('DWT', null, d.DWT, 'tonnes', { upright: true }).svg)
  g += txt(564, rows[1], mcat([mlab('W', '', d.W, 'tonnes'), ' · ', mlab('C', 'H', d.CH)]).svg)
  g += txt(564, rows[2], mlab('KE', '', d.KE, 'kip·ft').svg)

  return wrap(W, ly + 90, g, 'Ship collision with pier — elevation (Figs. 3.14.14.1-1, -2)')
}

// ---------------------------------------------------------------------------
// Barge collision on pier (Arts. 3.14.11-3.14.12, Fig. 3.14.14.1-3)
// ---------------------------------------------------------------------------
export function bargeImpactFigure(d) {
  const W = 780
  const x0 = 28, x1 = 752
  const swlY = 182
  const draftPx = clamp((d.draft || 8.7) * 4.5, 20, 55)
  const fb = clamp((12 - (d.draft || 8.7)) * 4.5, 12, 34) // 12 ft standard hull depth
  const hullTop = swlY - fb
  const hullBot = swlY + draftPx
  const bedY = hullBot + clamp((d.ukc ?? 5) * 4, 16, 44)

  const pierX = 574
  const pier = pierGroup(pierX, swlY, bedY)
  const bowX = pierX - 1 // head log face, in contact with the pier face
  const sternX = 238
  const rakeDX = 46 // bow rake run from the head log to the bottom
  const hlPx = clamp((d.headLog || 2.5) * 4.5, 8, Math.max(fb - 4, 8)) // head log above MHW

  let g = waterBed(x0, x1, swlY, bedY)

  // hopper barge: flat bottom, raked bow with vertical head log at the top
  g += `<path d="M ${sternX} ${hullTop} L ${bowX} ${hullTop} L ${bowX} ${hullTop + hlPx} L ${bowX - rakeDX} ${hullBot} L ${sternX + 6} ${hullBot} Z" fill="${C.hullFill}" stroke="${C.hullLine}" stroke-width="1.6"/>`
  // coaming and label
  g += `<rect x="254" y="${hullTop - 8}" width="176" height="8" fill="#c9b06a" stroke="${C.structLine}" stroke-width="0.8"/>`
  g += txt(335, (hullTop + hullBot) / 2 + 3, 'hopper barge 35 ft × 195 ft', { anchor: 'middle', halo: true })
  // pusher tug aft
  g += `<path d="M 232 ${hullTop - 2} L 232 ${hullBot - 7} Q 226 ${hullBot - 1} 214 ${hullBot - 1} L 152 ${hullBot - 1} Q 140 ${hullBot - 7} 142 ${hullTop + 1} Z" fill="#e6ecf2" stroke="${C.hullLine}" stroke-width="1.3"/>`
  g += `<rect x="156" y="${hullTop - 31}" width="40" height="29" rx="2" fill="#e6ecf2" stroke="${C.structLine}" stroke-width="1.1"/>`
  for (let i = 0; i < 2; i++) g += `<rect x="${163 + i * 15}" y="${hullTop - 24}" width="10" height="7" fill="#9fc6dd"/>`
  g += txt(176, hullTop - 37, 'tug', { col: C.structLine, anchor: 'middle', halo: true })

  // crush wedge over the bow damage depth a_B (hatched, with dashed extent)
  const aBpx = clamp((d.aB || 2) * 4.5, 8, 76)
  const xw = bowX - aBpx
  let wedge
  let wedgeBot
  if (xw >= bowX - rakeDX) {
    wedgeBot = hullTop + hlPx + (hullBot - hullTop - hlPx) * ((bowX - xw) / rakeDX)
    wedge = `M ${xw} ${hullTop} L ${bowX} ${hullTop} L ${bowX} ${hullTop + hlPx} L ${xw} ${wedgeBot} Z`
  } else {
    wedgeBot = hullBot
    wedge = `M ${xw} ${hullTop} L ${bowX} ${hullTop} L ${bowX} ${hullTop + hlPx} L ${bowX - rakeDX} ${hullBot} L ${xw} ${hullBot} Z`
  }
  g += `<path d="${wedge}" fill="url(#chx)" stroke="none"/>`
  g += `<line x1="${xw}" y1="${hullTop}" x2="${xw}" y2="${wedgeBot}" stroke="${C.red}" stroke-width="1.2" stroke-dasharray="4 3"/>`

  // a_B dimension above the deck
  g += dimH(hullTop - 12, xw, bowX, mlab('a', 'B', d.aB, 'ft'), { extY: [hullTop, hullTop], col: C.red, smallStyle: 'ticks' })

  // velocity arrow over the coaming
  g += farrow(300, hullTop - 21, 372, hullTop - 21, C.teal, 'aht', 3)
  g += flab(336, hullTop - 29, mlab('V', '', d.V, 'ft/s'), C.teal, { anchor: 'middle' })

  // draft dimension aft of the tow, water depth d_w on the right
  g += dimV(130, swlY, hullBot, mlab('draft', null, d.draft, 'ft', { upright: true }), { extX: [null, 240] })
  const dw = d.ukc != null && d.draft != null ? d.ukc + d.draft : null
  g += dimV(736, swlY, bedY, mlab('d', 'w', dw, 'ft'))

  g += pier.g

  // concentrated impact force P_B at MHW (Fig. 3.14.14.1-3)
  g += farrow(xw - 12, swlY, pierX - 1.5, swlY, C.red, 'ahr', 3.5)
  g += flab(Math.min(xw - 10, 504), swlY + 13, mlab('P', 'B', d.PB, 'kip'), C.red, { size: 10.5 })
  g += txt(Math.min(xw - 10, 504), swlY + 25, 'at MHW', { col: C.gray, anchor: 'end', halo: true })

  // line load over the head-log depth at the pier face
  let ll = ''
  const hlSteps = Math.max(2, Math.round(hlPx / 5))
  for (let i = 0; i <= hlSteps; i++) {
    const fy = hullTop + (hlPx * i) / hlSteps
    ll += `<line x1="546" y1="${fy}" x2="${pierX - 2}" y2="${fy}" stroke="${C.red}" stroke-width="1.3" marker-end="url(#ahr)"/>`
  }
  g += `<g opacity="0.45">${ll}</g>`
  g += txt(556, hullTop - 27, mcat(['line load over ', mlab('h', 'HL'), ' · Fig. 3.14.14.1-3']).svg, { col: C.red, anchor: 'end', halo: true })

  // legend: force swatch | symbol = value | citation, plus a parameters block
  const ly = bedY + 10
  const rows = [ly + 22, ly + 44, ly + 66]
  g += panel(40, ly, 690, 78)
  g += `<line x1="52" y1="${rows[0] - 3}" x2="80" y2="${rows[0] - 3}" stroke="${C.red}" stroke-width="3" marker-end="url(#ahr)"/>`
  g += txt(88, rows[0], mlab('P', 'B', d.PB, 'kip').svg, { weight: '700' })
  g += txt(396, rows[0], 'Eq. 3.14.11-1', { col: C.gray, weight: '500' })
  g += `<g opacity="0.5"><line x1="52" y1="${rows[1] - 3}" x2="80" y2="${rows[1] - 3}" stroke="${C.red}" stroke-width="1.4" marker-end="url(#ahr)"/></g>`
  g += txt(88, rows[1], mcat(['line load over head-log depth ', mlab('h', 'HL')]).svg)
  g += txt(396, rows[1], 'Fig. 3.14.14.1-3', { col: C.gray, weight: '500' })
  g += `<rect x="56" y="${rows[2] - 10}" width="20" height="10" fill="url(#chx)" stroke="${C.red}" stroke-width="0.8"/>`
  g += txt(88, rows[2], mcat([mlab('a', 'B', d.aB, 'ft'), '  bow crush depth']).svg, { weight: '700' })
  g += txt(396, rows[2], 'Eq. 3.14.12-1', { col: C.gray, weight: '500' })
  g += `<line x1="552" y1="${ly + 8}" x2="552" y2="${ly + 70}" stroke="${C.line}" stroke-width="1"/>`
  g += txt(564, rows[0], mlab('W', '', d.W, 'tonnes').svg)
  g += txt(564, rows[1], mcat([mlab('C', 'H', d.CH), ' · ', mlab('B', 'B', d.BB, 'ft')]).svg)
  g += txt(564, rows[2], mcat([mlab('h', 'HL', d.headLog, 'ft'), ' · ', mlab('KE', '', d.KE, 'kip·ft')]).svg)

  return wrap(W, ly + 90, g, 'Barge tow collision with pier — elevation (Fig. 3.14.14.1-3)')
}

// ---------------------------------------------------------------------------
// Geometric probability - plan view (Fig. 3.14.5.3-1) with the design impact
// velocity distribution (Fig. 3.14.6-1) as a sub-panel.
// ---------------------------------------------------------------------------
export function riskFigure(d) {
  const W = 780
  const x0 = 28, x1 = 752
  const H = 502
  const sig = d.LOA || 200
  const xVal = d.x || 0
  const hz = d.halfZone ?? ((d.BP || 0) + (d.BM || 0)) / 2

  // horizontal scale: always show ±3σ, and keep the pier + zone on canvas
  const Lft = 3.3 * sig
  const Rft = Math.max(3.3 * sig, xVal + hz + 0.35 * sig)
  const s = 700 / (Lft + Rft)
  const cx = 36 + Lft * s
  const sigPx = sig * s
  const xcPx = (d.xc || 0) * s
  const pierPx = cx + xVal * s
  const bpPx = Math.max((d.BP || 10) * s, 9)
  const zonePx = Math.max(2 * hz * s, 14)
  const zx0 = pierPx - zonePx / 2
  const zx1 = pierPx + zonePx / 2
  const base = 310
  const amp = 146
  const bell = (px) => base - amp * Math.exp(-((px - cx) * (px - cx)) / (2 * sigPx * sigPx))

  let g = ''

  // bridge deck strip across the top, water band below
  g += `<rect x="${x0}" y="34" width="${x1 - x0}" height="22" fill="${C.struct}" stroke="${C.structLine}" stroke-width="1"/>`
  g += txt(36, 48, 'bridge deck (plan)', { col: C.structLine, halo: true })
  g += `<rect x="${x0}" y="56" width="${x1 - x0}" height="284" fill="url(#wg)" opacity="0.28"/>`

  // channel edges and vessel transit path centerline
  if (xcPx > 0) {
    for (const ex of [cx - xcPx, cx + xcPx]) {
      g += `<line x1="${ex}" y1="56" x2="${ex}" y2="306" stroke="${C.gray}" stroke-width="1" stroke-dasharray="6 3 1.5 3"/>`
    }
    g += txt(cx - xcPx - 6, 70, 'channel edge', { col: C.gray, anchor: 'end', halo: true })
  }
  g += `<line x1="${cx}" y1="56" x2="${cx}" y2="342" stroke="${C.waveLine}" stroke-width="1.4" stroke-dasharray="8 4"/>`
  g += txt(cx, 350, 'vessel transit path ℄', { col: C.waveLine, anchor: 'middle', weight: '700', halo: true })

  // impact zone shading under the normal curve, projected up to the pier
  let area = `M ${zx0.toFixed(1)} ${base}`
  for (let px = zx0; px <= zx1; px += 1.5) area += ` L ${px.toFixed(1)} ${bell(px).toFixed(1)}`
  area += ` L ${zx1.toFixed(1)} ${base} Z`
  g += `<path d="${area}" fill="${C.red}" fill-opacity="0.28" stroke="none"/>`
  g += `<line x1="${zx0}" y1="${base}" x2="${zx0}" y2="64" stroke="${C.red}" stroke-width="1" stroke-dasharray="3 3"/>`
  g += `<line x1="${zx1}" y1="${base}" x2="${zx1}" y2="64" stroke="${C.red}" stroke-width="1" stroke-dasharray="3 3"/>`

  // normal distribution of transit paths, σ = LOA
  let path = `M ${x0 + 4} ${bell(x0 + 4).toFixed(1)}`
  for (let px = x0 + 8; px <= x1 - 4; px += 4) path += ` L ${px} ${bell(px).toFixed(1)}`
  g += `<line x1="${x0 + 4}" y1="${base}" x2="${x1 - 4}" y2="${base}" stroke="${C.gray}" stroke-width="1"/>`
  g += `<path d="${path}" fill="none" stroke="${C.ink}" stroke-width="1.8"/>`
  g += txt(cx - 24, 152, mcat(['normal distribution:  ', it('σ'), ' = ', it('LOA'), ` = ${num(sig)} ft`]).svg, { anchor: 'end', halo: true })

  // σ tick marks on the base line (labels above the base, inside the curve)
  for (let k = -3; k <= 3; k++) {
    if (k === 0) continue
    const tx = cx + k * sigPx
    if (tx < x0 + 8 || tx > x1 - 8) continue
    const major = Math.abs(k) === 3
    g += `<line x1="${tx}" y1="${major ? 302 : 306}" x2="${tx}" y2="${major ? 318 : 314}" stroke="${major ? C.ink : C.gray}" stroke-width="${major ? 1.4 : 1}"/>`
    if (sigPx > 20 || major) {
      g += txt(tx, 303 - (major ? 4 : 0), `${k < 0 ? '−' : ''}${Math.abs(k) === 1 ? '' : Math.abs(k)}σ`, { col: C.gray, anchor: 'middle', italic: true, halo: true })
    }
  }
  g += txt(Math.min(cx + 3 * sigPx + 58, 744), 337, mcat(['3·', it('LOA'), ' analysis limit']).svg, { col: C.ink, anchor: 'end', halo: true })

  // vessel silhouette on the transit path, sailing toward the bridge
  const bm = Math.max((d.BM || 20) * s / 2, 6)
  g += `<path d="M ${cx - bm} 298 L ${cx - bm} 262 Q ${cx - bm} 250 ${cx} 244 Q ${cx + bm} 250 ${cx + bm} 262 L ${cx + bm} 298 Q ${cx} 302 ${cx - bm} 298 Z" fill="${C.hullFill}" stroke="${C.hullLine}" stroke-width="1.3"/>`
  g += farrow(cx, 238, cx, 214, C.teal, 'aht', 2.6)
  g += flab(cx + 8, 226, mlab('V', ''), C.teal, { anchor: 'start' })

  // pier on the bridge line at distance x from the transit path
  g += `<rect x="${pierPx - bpPx / 2}" y="28" width="${bpPx}" height="34" rx="3" fill="${C.struct}" stroke="${C.structLine}" stroke-width="1.4"/>`
  const pierLab = mcat(['pier · ', mlab('B', 'P', d.BP, 'ft')])
  if (pierPx + bpPx / 2 + 8 + pierLab.w <= 748) {
    g += txt(pierPx + bpPx / 2 + 8, 48, pierLab.svg, { col: C.structLine, halo: true })
  } else {
    g += txt(pierPx - bpPx / 2 - 8, 48, pierLab.svg, { col: C.structLine, anchor: 'end', halo: true })
  }
  g += dimH(88, cx, pierPx, mlab('x', '', xVal, 'ft'), { extY: [null, 64], side: 'right' })

  // x_C dimension from the transit path to the channel edge
  if (xcPx > 0) {
    g += dimH(334, cx - xcPx, cx, mlab('x', 'C', d.xc, 'ft'), { extY: [308, null], side: 'left' })
  }

  // impact zone width B_P + B_M below the base line
  const zoneLab = mcat([mlab('B', 'P'), ' + ', mlab('B', 'M')])
  g += dimH(339, zx0, zx1, zoneLab, { col: C.red, side: zx1 + 18 + zoneLab.w <= 744 ? 'right' : 'left' })

  // PG callout with a leader into the shaded zone
  const bt = bell(pierPx)
  const pgLab = mlab('PG', null, d.PG)
  const leadY = Math.min(Math.max((bt + base) / 2, 170), base - 6)
  if (zx1 + 16 + pgLab.w * (10 / 9) <= 744) {
    g += flab(zx1 + 16, 286, pgLab, C.red, { anchor: 'start' })
    g += `<line x1="${zx1 + 12}" y1="282" x2="${zx1}" y2="${leadY}" stroke="${C.red}" stroke-width="0.9"/>`
  } else {
    g += flab(zx0 - 16, 286, pgLab, C.red)
    g += `<line x1="${zx0 - 12}" y1="282" x2="${zx0}" y2="${leadY}" stroke="${C.red}" stroke-width="0.9"/>`
  }

  // key panel (bottom left)
  const ky = 352
  g += panel(32, ky, 344, 138)
  const krows = [ky + 22, ky + 45, ky + 68, ky + 91, ky + 114]
  g += `<rect x="46" y="${krows[0] - 9}" width="24" height="10" fill="${C.red}" fill-opacity="0.28" stroke="${C.red}" stroke-width="0.8"/>`
  g += txt(80, krows[0], mcat([mlab('PG', null, d.PG), '  geometric probability']).svg, { weight: '700' })
  g += `<path d="M 46 ${krows[1]} Q 58 ${krows[1] - 12} 70 ${krows[1]}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`
  g += txt(80, krows[1], mcat(['normal distribution of transit paths, ', it('σ'), ' = ', it('LOA')]).svg)
  g += `<line x1="57" y1="${krows[2] - 10}" x2="57" y2="${krows[2] + 2}" stroke="${C.ink}" stroke-width="1.4"/>`
  g += txt(80, krows[2], mcat(['analysis limit at 3·', it('LOA'), ' from the transit path']).svg)
  g += txt(46, krows[3], mcat([mlab('LOA', null, sig, 'ft'), ' · ', mlab('B', 'M', d.BM, 'ft'), ' · ', mlab('B', 'P', d.BP, 'ft')]).svg)
  g += txt(46, krows[4], mcat([mlab('x', '', xVal, 'ft'), ' · ', mlab('x', 'C', d.xc, 'ft'), ' · ', mlab('V', '', d.V, 'ft/s')]).svg)
  g += txt(300, krows[0], 'Art. 3.14.5.3', { col: C.gray, weight: '500' })

  // velocity distribution sub-panel (Fig. 3.14.6-1, bottom right)
  const px0 = 388
  g += panel(px0, ky, 356, 138)
  g += txt(px0 + 8, ky + 17, 'Design impact velocity — Fig. 3.14.6-1', { col: C.ink, weight: '700' })
  const gx0 = px0 + 60, gx1 = px0 + 344, gy0 = ky + 106, gy1 = ky + 34
  const vT = d.VT || 10
  const vM = d.Vmin || 0
  const vDes = d.V ?? vM
  const xmax = Math.max(3 * sig * 1.15, xVal * 1.08, (d.xc || 0) * 1.4, 1)
  const vmax = Math.max(vT, vDes, 1e-6) * 1.12
  const gpx = (ft) => gx0 + ((gx1 - gx0) * ft) / xmax
  const gpy = (v) => gy0 - ((gy0 - gy1) * v) / vmax
  g += `<line x1="${gx0}" y1="${gy0}" x2="${gx1 + 4}" y2="${gy0}" stroke="${C.dim}" stroke-width="1" marker-end="url(#ahd)"/>`
  g += `<line x1="${gx0}" y1="${gy0}" x2="${gx0}" y2="${gy1 - 6}" stroke="${C.dim}" stroke-width="1" marker-end="url(#ahd)"/>`
  g += `<g transform="translate(${px0 + 20},${(gy0 + gy1) / 2}) rotate(-90)">${txt(0, 3, mcat([it('V'), ' (ft/s)']).svg, { anchor: 'middle', col: C.gray })}</g>`
  g += txt((gx0 + gx1) / 2, ky + 132, mcat(['distance from transit path, ', it('x'), ' (ft)']).svg, { anchor: 'middle', col: C.gray })
  // V_T plateau to x_C, linear falloff to V_MIN at 3·LOA
  const xcF = d.xc || 0
  g += `<path d="M ${gx0} ${gpy(vT)} L ${gpx(xcF)} ${gpy(vT)} L ${gpx(3 * sig)} ${gpy(vM)} L ${gx1} ${gpy(vM)}" fill="none" stroke="${C.teal}" stroke-width="2.2"/>`
  g += txt(gx0 - 5, gpy(vT) + 3, mlab('V', 'T').svg, { anchor: 'end', weight: '700' })
  g += txt(gx0 - 5, gpy(vM) + 3, mlab('V', 'MIN').svg, { anchor: 'end', weight: '700' })
  for (const [ft, lab] of [[xcF, mlab('x', 'C')], [3 * sig, mcat(['3·', it('LOA')])]]) {
    if (ft <= 0) continue
    g += `<line x1="${gpx(ft)}" y1="${gy0}" x2="${gpx(ft)}" y2="${gy0 + 4}" stroke="${C.dim}" stroke-width="1"/>`
    g += txt(gpx(ft), gy0 + 14, lab.svg, { anchor: 'middle', col: C.gray })
  }
  // design point (x, V)
  const dpx = gpx(Math.min(xVal, xmax * 0.98))
  const dpy = gpy(clamp(vDes, 0, vmax))
  g += `<line x1="${dpx}" y1="${dpy}" x2="${dpx}" y2="${gy0}" stroke="${C.red}" stroke-width="0.9" stroke-dasharray="2.5 2.5"/>`
  g += `<line x1="${gx0}" y1="${dpy}" x2="${dpx}" y2="${dpy}" stroke="${C.red}" stroke-width="0.9" stroke-dasharray="2.5 2.5"/>`
  g += `<circle cx="${dpx}" cy="${dpy}" r="3.4" fill="${C.red}"/>`
  const ptLab = mcat(['(', it('x'), ', ', it('V'), ')'])
  const ptY = dpy + 14 > gy0 - 3 ? dpy - 8 : dpy + 14
  if (dpx + 10 + ptLab.w <= gx1) {
    g += txt(dpx + 9, ptY, ptLab.svg, { col: C.red, weight: '700', halo: true })
  } else {
    g += txt(dpx - 9, ptY, ptLab.svg, { col: C.red, weight: '700', anchor: 'end', halo: true })
  }

  return wrap(W, H, g, 'Geometric probability of pier collision — plan (Fig. 3.14.5.3-1)')
}
