// Self-contained, fully-labeled SVG definition figures for VesselImpact.
// Every input is annotated with its symbol, value, and unit; computed force
// resultants are drawn as vectors. The same SVG string is rendered live in the
// app and rasterized into the PDF report. Drawings scale with the input
// dimensions and layouts are spaced so labels do not overlap.

const C = {
  ink: '#1c2530', water: '#3ba9d4', waveLine: '#2b7fb0', red: '#e8453c',
  gold: '#f4b740', gray: '#7c8794', line: '#c3ccd6', struct: '#cfd8e3',
  ss: '#5b6673', txt: '#243040', white: '#ffffff', hull: '#8f2f27',
  hullFill: '#b8443a', teal: '#1f7a6d',
}
const F = (v) => (Number.isFinite(v) ? Number(v.toPrecision(4)) : 0)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// math label: symbol + optional subscript + value + unit -> { svg, w }
function mlab(sym, subs, val, unit) {
  const rest = (val != null ? ` = ${F(val)}` : '') + (unit ? ` ${unit}` : '')
  const svg = subs
    ? `${sym}<tspan dy="2.2" font-size="72%">${subs}</tspan><tspan dy="-2.2">${rest}</tspan>`
    : `${sym}${rest}`
  return { svg, w: sym.length + (subs ? subs.length * 0.62 : 0) + rest.length }
}

function defs() {
  const head = (id, col) =>
    `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${col}"/></marker>`
  return `<defs>${head('ah', C.gray)}${head('ahr', C.red)}${head('ahb', C.water)}${head('ahg', C.gold)}${head('aht', C.teal)}<linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3e4f4"/><stop offset="1" stop-color="#7dbcdd"/></linearGradient><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f8fd"/><stop offset="1" stop-color="#e4f0f9"/></linearGradient></defs>`
}
// dimension labels are transparent text with a soft white halo (no box)
function vdim(x, y0, y1, lab, col = C.txt) {
  const m = (y0 + y1) / 2
  return `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="${C.gray}" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/><g transform="translate(${x},${m}) rotate(-90)"><text x="0" y="3.4" font-size="9" text-anchor="middle" fill="${col}" font-weight="700" stroke="#ffffff" stroke-width="3.4" paint-order="stroke" stroke-linejoin="round">${lab.svg}</text></g>`
}
function hdim(y, x0, x1, lab, col = C.txt) {
  const m = (x0 + x1) / 2
  return `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${C.gray}" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="${m}" y="${y - 4}" font-size="9" text-anchor="middle" fill="${col}" font-weight="700" stroke="#ffffff" stroke-width="3.4" paint-order="stroke" stroke-linejoin="round">${lab.svg}</text>`
}
function txt(x, y, s, o = {}) {
  const { size = 9, col = C.txt, anchor = 'start', weight = '600', italic = '' } = o
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="${col}" font-weight="${weight}"${italic ? ' font-style="italic"' : ''}>${s}</text>`
}
function waterBed(x0, x1, swlY, bedY, swlLabel = 'MHW') {
  let hatch = ''
  for (let gx = x0; gx < x1; gx += 13) hatch += `<line x1="${gx}" y1="${bedY}" x2="${gx + 7}" y2="${bedY + 7}" stroke="${C.gray}" stroke-width="0.8"/>`
  return `<rect x="${x0}" y="${swlY}" width="${x1 - x0}" height="${bedY - swlY}" fill="url(#wg)" opacity="0.5"/><line x1="${x0}" y1="${swlY}" x2="${x1}" y2="${swlY}" stroke="${C.waveLine}" stroke-width="1.4" stroke-dasharray="6 3"/><line x1="${x0}" y1="${bedY}" x2="${x1}" y2="${bedY}" stroke="${C.ss}" stroke-width="1.6"/>${txt(x1 - 3, bedY + 11, 'bed', { size: 7.5, col: C.ss, anchor: 'end' })}${txt(x0 + 3, swlY - 4, swlLabel, { size: 7.5, col: C.waveLine })}${hatch}`
}
function panel(x, y, w, h) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#ffffff" stroke="${C.line}" opacity="0.96"/>`
}
function legendRow(lx, ly, i, col, mk, svg) {
  return `<line x1="${lx + 12}" y1="${ly + 15 + i * 16}" x2="${lx + 28}" y2="${ly + 15 + i * 16}" stroke="${col}" stroke-width="2.6" marker-end="url(#${mk})"/><text x="${lx + 34}" y="${ly + 18 + i * 16}" font-size="8.6" fill="${C.txt}" font-weight="700">${svg}</text>`
}
function sub(symbol, subscript, rest = '') {
  return `${symbol}<tspan dy="2" font-size="70%">${subscript}</tspan><tspan dy="-2">${rest}</tspan>`
}
function wrap(w, h, inner, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" font-family="-apple-system, Segoe UI, Roboto, sans-serif"><rect x="0" y="0" width="${w}" height="${h}" fill="url(#sky)"/>${defs()}${title ? txt(14, 17, title, { size: 10, col: C.ink, weight: '700' }) : ''}</svg>`.replace('</svg>', `${inner}</svg>`)
}

// pier + superstructure shared by both elevation figures.
// Returns drawing code plus key coordinates.
function pierGroup(pierX, swlY, bedY) {
  const colW = 30
  const capY = swlY - 58
  const capH = 16
  const deckY = capY - 26
  const ftgH = 18
  let g = ''
  // footing
  g += `<rect x="${pierX - 14}" y="${bedY - ftgH}" width="${colW + 28}" height="${ftgH}" fill="${C.struct}" stroke="${C.ss}" stroke-width="1.2"/>`
  // column
  g += `<rect x="${pierX}" y="${capY}" width="${colW}" height="${bedY - ftgH - capY}" fill="${C.struct}" stroke="${C.ss}" stroke-width="1.3"/>`
  // cap
  g += `<rect x="${pierX - 10}" y="${capY}" width="${colW + 20}" height="${capH}" fill="${C.struct}" stroke="${C.ss}" stroke-width="1.2"/>`
  // superstructure: girders + deck
  const gW = 96
  g += `<rect x="${pierX + colW / 2 - gW / 2}" y="${deckY + 8}" width="${gW}" height="${capY - deckY - 8}" fill="#b7c2d0" stroke="${C.ss}" stroke-width="1"/>`
  g += `<rect x="${pierX + colW / 2 - gW / 2 - 10}" y="${deckY}" width="${gW + 20}" height="9" fill="${C.struct}" stroke="${C.ss}" stroke-width="1.2"/>`
  g += txt(pierX + colW / 2, deckY - 6, 'Superstructure', { size: 7.5, col: C.ss, anchor: 'middle' })
  g += txt(pierX + colW + 14, (capY + bedY) / 2, 'Pier', { size: 8, col: C.ss })
  return { g, colW, capY, deckY }
}

// ---------------------------------------------------------------------------
// Ship collision on pier (Arts. 3.14.7-3.14.10, Figs. 3.14.14.1-1/-2)
// ---------------------------------------------------------------------------
export function shipImpactFigure(d) {
  const W = 660
  const x0 = 30, x1 = 630
  const swlY = 168
  const draftPx = clamp((d.draft || 20) * 2.6, 26, 62)
  const bedY = swlY + draftPx + clamp((d.ukc ?? 10) * 2.2, 10, 46)
  const H = bedY + 78
  const pierX = 470
  const { g: pg, colW } = pierGroup(pierX, swlY, bedY)
  let g = waterBed(x0, x1, swlY, bedY)

  // --- ship elevation, sailing right toward the pier ---
  const bowX = pierX - 26 // bow tip near pier face
  const DBpx = clamp((d.DB || 30) * 2.0, 34, 72) // bow depth above keel... drawn above waterline portion
  const freeboard = clamp(DBpx - draftPx * 0.55, 20, 54)
  const hullTop = swlY - freeboard
  const hullBot = swlY + draftPx
  const sternX = bowX - 320
  // hull with raked bow (rake forward above waterline)
  const rake = 42
  g += `<path d="M ${sternX} ${hullTop} L ${bowX - rake} ${hullTop} L ${bowX} ${swlY - 4} L ${bowX - 14} ${hullBot - 6} Q ${bowX - 30} ${hullBot} ${bowX - 60} ${hullBot} L ${sternX + 16} ${hullBot} Q ${sternX - 6} ${hullBot - 10} ${sternX} ${hullTop - 2} Z" fill="${C.hullFill}" stroke="${C.hull}" stroke-width="1.6"/>`
  // deck house + mast
  const dhX = sternX + 42, dhW = 64, dhH = 34
  g += `<rect x="${dhX}" y="${hullTop - dhH}" width="${dhW}" height="${dhH}" rx="2" fill="#e9eef4" stroke="${C.ss}" stroke-width="1.2"/>`
  g += `<rect x="${dhX + 8}" y="${hullTop - dhH + 7}" width="12" height="8" fill="${C.water}" opacity="0.7"/><rect x="${dhX + 26}" y="${hullTop - dhH + 7}" width="12" height="8" fill="${C.water}" opacity="0.7"/><rect x="${dhX + 44}" y="${hullTop - dhH + 7}" width="12" height="8" fill="${C.water}" opacity="0.7"/>`
  g += `<line x1="${dhX + dhW / 2}" y1="${hullTop - dhH}" x2="${dhX + dhW / 2}" y2="${hullTop - dhH - 30}" stroke="${C.ss}" stroke-width="2"/>`
  g += `<line x1="${dhX + dhW / 2}" y1="${hullTop - dhH - 30}" x2="${dhX + dhW / 2 + 22}" y2="${hullTop - dhH - 18}" stroke="${C.ss}" stroke-width="1.2"/>`
  g += txt(dhX + dhW / 2, hullTop - dhH - 36, 'mast', { size: 7.5, col: C.ss, anchor: 'middle' })
  g += txt(dhX + dhW / 2, hullTop - dhH + 26, 'deck house', { size: 7.5, col: C.ss, anchor: 'middle' })
  // cargo hatches
  for (let i = 0; i < 3; i++) g += `<rect x="${dhX + dhW + 22 + i * 52}" y="${hullTop - 10}" width="36" height="10" rx="1.5" fill="${C.gold}" stroke="${C.ss}" stroke-width="0.9"/>`

  // velocity arrow (clear of the legend panel at top-left)
  g += `<line x1="${sternX + 168}" y1="${hullTop - 52}" x2="${sternX + 252}" y2="${hullTop - 52}" stroke="${C.teal}" stroke-width="2.8" marker-end="url(#aht)"/>`
  g += txt(sternX + 210, hullTop - 60, mlab('V', '', d.V, 'ft/s').svg, { size: 9.5, col: C.teal, anchor: 'middle', weight: '700' })

  // bow crush length a_S, dimensioned below the bow in the water
  const asPx = clamp((d.aS || 5) * 1.6, 12, 60)
  g += `<path d="M ${bowX - rake} ${hullTop} L ${bowX} ${swlY - 4} L ${bowX - 14} ${hullBot - 6}" fill="none" stroke="${C.gold}" stroke-width="2" stroke-dasharray="4 3"/>`
  g += `<line x1="${bowX - rake - asPx}" y1="${hullBot + 4}" x2="${bowX - rake - asPx}" y2="${hullBot + 22}" stroke="${C.gray}" stroke-width="0.9"/>`
  g += `<line x1="${bowX - rake}" y1="${hullBot + 4}" x2="${bowX - rake}" y2="${hullBot + 22}" stroke="${C.gray}" stroke-width="0.9"/>`
  g += hdim(hullBot + 16, bowX - rake - asPx, bowX - rake, mlab('a', 'S', d.aS, 'ft'))
  // draft + bow depth + water depth dims
  g += vdim(sternX - 18, swlY, hullBot, mlab('draft', '', d.draft, 'ft'))
  g += vdim(x1 - 10, swlY, bedY, mlab('d', 'w', d.ukc != null && d.draft != null ? d.ukc + d.draft : null, 'ft'))
  g += vdim(bowX - rake - 64, hullTop, hullBot, mlab('D', 'B', d.DB, 'ft'))

  // pier + superstructure (drawn after ship so the pier face reads on top)
  g += pg

  // impact forces: PS at waterline (concentrated, Fig. 3.14.14.1-1)
  g += `<line x1="${bowX + 2}" y1="${swlY - 2}" x2="${pierX - 2}" y2="${swlY - 2}" stroke="${C.red}" stroke-width="3" marker-end="url(#ahr)"/>`
  g += `<text x="${pierX + colW + 44}" y="${swlY + 22}" font-size="9.5" fill="${C.red}" font-weight="700" stroke="#ffffff" stroke-width="3.4" paint-order="stroke" stroke-linejoin="round">${sub('P', 'S', ` = ${F(d.PS)} kip @ MHW`)}</text>`
  g += `<line x1="${pierX + colW + 40}" y1="${swlY + 18}" x2="${pierX + colW - 6}" y2="${swlY + 2}" stroke="${C.red}" stroke-width="0.9"/>`
  // line load over bow depth (Fig. 3.14.14.1-2)
  for (let i = 0; i < 4; i++) {
    const fy = swlY - 12 - i * 12
    if (fy > swlY - freeboard - 4) g += `<line x1="${pierX - 26}" y1="${fy}" x2="${pierX - 4}" y2="${fy}" stroke="${C.red}" stroke-width="1.4" opacity="0.55" marker-end="url(#ahr)"/>`
  }
  // superstructure force PBH (deck sits 84 px above MHW in pierGroup)
  if (d.PBH > 0) {
    const deckY = swlY - 84
    g += `<line x1="${pierX - 66}" y1="${deckY + 14}" x2="${pierX + colW / 2 - 48 - 2}" y2="${deckY + 14}" stroke="${C.gold}" stroke-width="2.6" marker-end="url(#ahg)"/>`
    g += `<text x="${pierX - 70}" y="${deckY + 17}" font-size="8.6" fill="#b9591a" text-anchor="end" font-weight="700" stroke="#ffffff" stroke-width="3.2" paint-order="stroke" stroke-linejoin="round">${sub('P', 'BH', ` = ${F(d.PBH)} kip`)}</text>`
  }

  // legend panel (below the bed line so it never hides the vessel)
  const lx = x0 + 6, ly = bedY + 6
  g += panel(lx, ly, 300, 66)
  g += legendRow(lx, ly, 0, C.red, 'ahr', sub('P', 'S', ` = ${F(d.PS)} kip  (Eq. 3.14.8-1)   ·   KE = ${F(d.KE)} kip·ft`))
  g += legendRow(lx, ly, 1, C.gold, 'ahg', `${sub('P', 'BH', ` = ${F(d.PBH)}`)}  ·  ${sub('P', 'DH', ` = ${F(d.PDH)}`)}  ·  ${sub('P', 'MT', ` = ${F(d.PMT)} kip`)}`)
  g += `<text x="${lx + 12}" y="${ly + 56}" font-size="7.6" fill="${C.gray}">DWT = ${F(d.DWT)} tonne · W = ${F(d.W)} tonne · C<tspan dy="2" font-size="70%">H</tspan><tspan dy="-2"> = ${F(d.CH)}</tspan></text>`
  return wrap(W, H, g, 'Ship collision with pier  ·  elevation  ·  Fig. 3.14.14.1-1/-2')
}

// ---------------------------------------------------------------------------
// Barge collision on pier (Arts. 3.14.11-3.14.12, Fig. 3.14.14.1-3)
// ---------------------------------------------------------------------------
export function bargeImpactFigure(d) {
  const W = 660
  const x0 = 30, x1 = 630
  const swlY = 148
  const draftPx = clamp((d.draft || 8.7) * 5.5, 24, 60)
  const bedY = swlY + draftPx + clamp((d.ukc ?? 5) * 3.2, 12, 44)
  const H = bedY + 78
  const pierX = 486
  const { g: pg } = pierGroup(pierX, swlY, bedY)
  let g = waterBed(x0, x1, swlY, bedY)

  // --- barge tow: tug + hopper barge ---
  const bowX = pierX - 24
  const freeboard = clamp((12 - (d.draft || 8.7)) * 5.5, 10, 40) // hull depth 12 ft standard
  const hullTop = swlY - freeboard
  const hullBot = swlY + draftPx
  const bargeLen = 300
  const sternX = bowX - bargeLen
  // barge hull: long, low, raked bow
  const rake = 34
  g += `<path d="M ${sternX} ${hullTop} L ${bowX - rake} ${hullTop} L ${bowX} ${swlY + draftPx * 0.35} L ${bowX} ${hullBot - 4} L ${sternX} ${hullBot - 4} Z" fill="${C.hullFill}" stroke="${C.hull}" stroke-width="1.6"/>`
  // coaming / cargo
  g += `<rect x="${sternX + 18}" y="${hullTop - 9}" width="${bargeLen - 70}" height="9" fill="${C.gold}" stroke="${C.ss}" stroke-width="0.9"/>`
  g += txt(sternX + bargeLen / 2, hullTop + 16, 'hopper barge 35 ft × 195 ft', { size: 7.6, col: '#fff', anchor: 'middle' })
  // head log (vertical face at bow, above waterline)
  const hlPx = clamp((d.headLog || 2.5) * 6, 10, 26)
  g += `<line x1="${bowX - rake}" y1="${hullTop}" x2="${bowX}" y2="${swlY + draftPx * 0.35}" stroke="${C.hull}" stroke-width="1.6"/>`
  // tug behind
  const tugX = sternX - 78
  g += `<path d="M ${tugX} ${hullTop - 2} L ${sternX - 8} ${hullTop - 2} L ${sternX - 8} ${hullBot - 6} Q ${sternX - 30} ${hullBot} ${tugX + 12} ${hullBot - 8} Z" fill="#5b6673" stroke="#39434e" stroke-width="1.4"/>`
  g += `<rect x="${tugX + 14}" y="${hullTop - 26}" width="34" height="24" rx="2" fill="#e9eef4" stroke="${C.ss}" stroke-width="1.1"/>`
  g += txt(tugX + 31, hullTop - 32, 'tug', { size: 7.5, col: C.ss, anchor: 'middle' })

  // velocity arrow (clear of the legend panel at top-left)
  g += `<line x1="${sternX + 130}" y1="${hullTop - 40}" x2="${sternX + 214}" y2="${hullTop - 40}" stroke="${C.teal}" stroke-width="2.8" marker-end="url(#aht)"/>`
  g += txt(sternX + 172, hullTop - 48, mlab('V', '', d.V, 'ft/s').svg, { size: 9.5, col: C.teal, anchor: 'middle', weight: '700' })

  // crush depth a_B at the bow
  const aBpx = clamp((d.aB || 2) * 7, 10, 56)
  g += hdim(hullTop - 14, bowX - rake - aBpx, bowX - rake, mlab('a', 'B', d.aB, 'ft'))
  g += `<path d="M ${bowX - rake} ${hullTop} L ${bowX} ${swlY + draftPx * 0.35}" fill="none" stroke="${C.gold}" stroke-width="2" stroke-dasharray="4 3"/>`

  // dims (draft measured left of the tug so it stays clear of both hulls)
  g += vdim(tugX - 18, swlY, hullBot, mlab('draft', '', d.draft, 'ft'))
  g += vdim(x1 - 10, swlY, bedY, mlab('d', 'w', d.ukc != null && d.draft != null ? d.ukc + d.draft : null, 'ft'))

  g += pg

  // PB force at head log level (Fig. 3.14.14.1-3: line load over head block depth)
  g += `<line x1="${bowX + 2}" y1="${swlY - 4}" x2="${pierX - 2}" y2="${swlY - 4}" stroke="${C.red}" stroke-width="3" marker-end="url(#ahr)"/>`
  g += `<text x="${pierX + 44}" y="${swlY + 22}" font-size="9.5" fill="${C.red}" font-weight="700" stroke="#ffffff" stroke-width="3.4" paint-order="stroke" stroke-linejoin="round">${sub('P', 'B', ` = ${F(d.PB)} kip @ MHW`)}</text>`
  g += `<line x1="${pierX + 40}" y1="${swlY + 18}" x2="${pierX + 26}" y2="${swlY + 2}" stroke="${C.red}" stroke-width="0.9"/>`
  for (let i = 1; i <= 3; i++) {
    const fy = swlY - 4 - i * (hlPx / 2)
    g += `<line x1="${pierX - 24}" y1="${fy}" x2="${pierX - 4}" y2="${fy}" stroke="${C.red}" stroke-width="1.4" opacity="0.55" marker-end="url(#ahr)"/>`
  }

  // legend panel (below the bed line so it never hides the tow)
  const lx = x0 + 6, ly = bedY + 6
  g += panel(lx, ly, 320, 66)
  g += legendRow(lx, ly, 0, C.red, 'ahr', sub('P', 'B', ` = ${F(d.PB)} kip  (Eq. 3.14.11)   ·   KE = ${F(d.KE)} kip·ft`))
  g += legendRow(lx, ly, 1, C.gold, 'ahg', `${sub('a', 'B', ` = ${F(d.aB)} ft   (Eq. 3.14.12-1)`)}`)
  g += `<text x="${lx + 12}" y="${ly + 56}" font-size="7.6" fill="${C.gray}">W = ${F(d.W)} tonne · C<tspan dy="2" font-size="70%">H</tspan><tspan dy="-2"> = ${F(d.CH)} · B</tspan><tspan dy="2" font-size="70%">B</tspan><tspan dy="-2"> = ${F(d.BB)} ft · h</tspan><tspan dy="2" font-size="70%">HL</tspan><tspan dy="-2"> = ${F(d.headLog)} ft</tspan></text>`
  return wrap(W, H, g, 'Barge tow collision with pier  ·  elevation  ·  Fig. 3.14.14.1-3')
}

// ---------------------------------------------------------------------------
// Geometric probability - plan view (Fig. 3.14.5.3-1) with the collision
// velocity distribution (Fig. 3.14.6-1) as an inset.
// ---------------------------------------------------------------------------
export function riskFigure(d) {
  const W = 660
  const x0 = 40, x1 = 620
  const H = 388
  let g = ''

  // ---- plan strip: waterway with channel + piers ----
  const deckY = 66
  const cx = 240 // transit path centerline (px)
  const pxPerFt = clamp(170 / Math.max(d.x + d.halfZone, 3 * d.LOA * 0.45), 0.02, 3)
  const chHalf = clamp((d.xc || 150) * pxPerFt, 22, 150)

  // bridge deck band across the top
  g += `<rect x="${x0}" y="${deckY - 20}" width="${x1 - x0}" height="14" fill="${C.struct}" stroke="${C.ss}" stroke-width="1"/>`
  g += txt(x0 + 6, deckY - 9, 'bridge deck (plan)', { size: 7.4, col: C.ss })

  // water band
  const waterY0 = deckY, waterY1 = 320
  g += `<rect x="${x0}" y="${waterY0}" width="${x1 - x0}" height="${waterY1 - waterY0}" fill="url(#wg)" opacity="0.28"/>`

  // channel edges + centerline
  g += `<line x1="${cx}" y1="${waterY0}" x2="${cx}" y2="${waterY1}" stroke="${C.waveLine}" stroke-width="1.4" stroke-dasharray="8 4"/>`
  g += txt(cx, waterY1 + 12, 'vessel transit path ℄', { size: 8, col: C.waveLine, anchor: 'middle', weight: '700' })
  g += `<line x1="${cx - chHalf}" y1="${waterY0}" x2="${cx - chHalf}" y2="${waterY1 - 40}" stroke="${C.gray}" stroke-width="1" stroke-dasharray="3 3"/>`
  g += `<line x1="${cx + chHalf}" y1="${waterY0}" x2="${cx + chHalf}" y2="${waterY1 - 40}" stroke="${C.gray}" stroke-width="1" stroke-dasharray="3 3"/>`
  g += txt(cx + chHalf + 4, waterY0 + 12, 'channel edge', { size: 7.2, col: C.gray })

  // vessel silhouette (plan) sailing along the path
  const vy = 232
  g += `<path d="M ${cx - 9} ${vy + 44} L ${cx - 9} ${vy - 18} Q ${cx - 9} ${vy - 34} ${cx} ${vy - 44} Q ${cx + 9} ${vy - 34} ${cx + 9} ${vy - 18} L ${cx + 9} ${vy + 44} Z" fill="${C.hullFill}" stroke="${C.hull}" stroke-width="1.3"/>`
  g += `<line x1="${cx}" y1="${vy - 52}" x2="${cx}" y2="${vy - 78}" stroke="${C.teal}" stroke-width="2.4" marker-end="url(#aht)"/>`

  // pier at distance x
  const pierPx = cx + clamp(d.x * pxPerFt, 26, 330)
  const bpPx = Math.max(d.BP * pxPerFt, 10)
  const pierY = deckY + 22
  g += `<rect x="${pierPx - bpPx / 2}" y="${pierY - 12}" width="${bpPx}" height="30" rx="4" fill="${C.struct}" stroke="${C.ss}" stroke-width="1.4"/>`
  g += txt(pierPx, pierY - 18, `pier (B<tspan dy="2" font-size="70%">P</tspan><tspan dy="-2"> = ${F(d.BP)} ft)</tspan>`, { size: 8, col: C.ss, anchor: 'middle' })

  // x dimension from centerline to pier
  g += hdim(pierY + 38, cx, pierPx, mlab('x', '', d.x, 'ft'))

  // impact zone (BP + BM wide, centered on pier)
  const zonePx = Math.max((d.halfZone * 2) * pxPerFt, 16)
  const zx0 = pierPx - zonePx / 2, zx1 = pierPx + zonePx / 2

  // ---- normal distribution across the waterway ----
  const base = 300
  const amp = 132
  const sigPx = Math.max(d.LOA * pxPerFt, 30)
  const bell = (px) => base - amp * Math.exp(-((px - cx) * (px - cx)) / (2 * sigPx * sigPx))
  let path = `M ${x0} ${bell(x0).toFixed(1)}`
  for (let px = x0 + 4; px <= x1; px += 4) path += ` L ${px} ${bell(px).toFixed(1)}`
  // shaded PG area under the curve over the impact zone
  let area = `M ${zx0.toFixed(1)} ${base}`
  for (let px = zx0; px <= zx1; px += 2) area += ` L ${px.toFixed(1)} ${bell(px).toFixed(1)}`
  area += ` L ${zx1.toFixed(1)} ${base} Z`
  g += `<line x1="${x0}" y1="${base}" x2="${x1}" y2="${base}" stroke="${C.gray}" stroke-width="1"/>`
  g += `<path d="${area}" fill="${C.red}" fill-opacity="0.3" stroke="none"/>`
  g += `<path d="${path}" fill="none" stroke="${C.ink}" stroke-width="1.8"/>`
  g += `<line x1="${zx0}" y1="${base}" x2="${zx0}" y2="${pierY + 6}" stroke="${C.red}" stroke-width="1" stroke-dasharray="3 3"/>`
  g += `<line x1="${zx1}" y1="${base}" x2="${zx1}" y2="${pierY + 6}" stroke="${C.red}" stroke-width="1" stroke-dasharray="3 3"/>`
  g += hdim(base + 14, zx0, zx1, mlab('B', 'P', null, ' + B<tspan dy="2" font-size="72%">M</tspan>'), C.red)
  g += txt(pierPx, bell(pierPx) - 10, `PG = ${F(d.PG)}`, { size: 9.5, col: C.red, anchor: 'middle', weight: '700' })
  g += txt(cx - sigPx / 2, bell(cx) - 10, `normal distribution, σ = LOA = ${F(d.LOA)} ft`, { size: 8, col: C.ink, anchor: 'middle' })

  // ---- inset: design collision velocity distribution (Fig. 3.14.6-1) ----
  const ix = x1 - 208, iy = 26, iw = 200, ih = 104
  g += panel(ix, iy, iw, ih)
  g += txt(ix + 8, iy + 13, 'Impact velocity  ·  Fig. 3.14.6-1', { size: 7.6, col: C.ink, weight: '700' })
  const gx0 = ix + 30, gx1 = ix + iw - 12, gy0 = iy + ih - 20, gy1 = iy + 30
  const xcF = d.xc || 150
  const xlF = 3 * d.LOA
  const gpx = (ft) => gx0 + ((gx1 - gx0) * ft) / Math.max(xlF * 1.15, 1)
  const vT = d.VT || 10, vM = d.Vmin || 2
  const gpy = (v) => gy0 - ((gy0 - gy1) * v) / Math.max(vT, 1e-6)
  g += `<line x1="${gx0}" y1="${gy0}" x2="${gx1}" y2="${gy0}" stroke="${C.gray}" stroke-width="1"/>`
  g += `<line x1="${gx0}" y1="${gy0}" x2="${gx0}" y2="${gy1 - 4}" stroke="${C.gray}" stroke-width="1"/>`
  g += `<path d="M ${gx0} ${gpy(vT)} L ${gpx(xcF)} ${gpy(vT)} L ${gpx(xlF)} ${gpy(vM)} L ${gx1} ${gpy(vM)}" fill="none" stroke="${C.teal}" stroke-width="2"/>`
  // design point
  const xClamped = Math.min(d.x, xlF * 1.1)
  g += `<circle cx="${gpx(xClamped)}" cy="${gpy(d.V ?? vM)}" r="3.2" fill="${C.red}"/>`
  g += `<line x1="${gpx(xClamped)}" y1="${gpy(d.V ?? vM)}" x2="${gpx(xClamped)}" y2="${gy0}" stroke="${C.red}" stroke-width="0.9" stroke-dasharray="2 2"/>`
  g += txt(gx0 - 4, gpy(vT) + 3, sub('V', 'T', ''), { size: 7.4, col: C.txt, anchor: 'end' })
  g += txt(gx0 - 4, gpy(vM) + 3, sub('V', 'MIN', ''), { size: 7.4, col: C.txt, anchor: 'end' })
  g += txt(gpx(xcF), gy0 + 10, sub('x', 'C', ''), { size: 7.4, col: C.txt, anchor: 'middle' })
  g += txt(gpx(xlF), gy0 + 10, '3·LOA', { size: 7.4, col: C.txt, anchor: 'middle' })

  return wrap(W, H, g, 'Geometric probability of pier collision  ·  plan  ·  Fig. 3.14.5.3-1')
}
