// Premium engineering PDF report for VesselImpactX. Each derivation step is
// drawn with its reference, description, and the LaTeX equation rendered to a
// crisp image (symbolic = substituted = result), so the report reads as a full
// engineering calculation with every clause / equation / figure citation to
// AASHTO LRFD Bridge Design Specifications, 9th Edition, Section 3.14.

import { fmt } from '../components/shared.jsx'
import { stepChain } from '../components/mathview.jsx'
import { renderEquation, rasterizeSvg } from './tex2img.js'
import { shipImpactFigure, bargeImpactFigure, riskFigure } from './figures.js'

const C = {
  band: [16, 32, 51],
  bandAccent: [232, 69, 60],
  accent: [31, 95, 166],
  accentDeep: [22, 72, 127],
  ink: [17, 24, 39],
  sub: [75, 85, 99],
  faint: [156, 163, 175],
  line: [209, 214, 222],
  cardFill: [238, 242, 248],
  cardBorder: [214, 221, 232],
  white: [255, 255, 255],
  pass: [31, 122, 85],
  fail: [193, 71, 61],
}
const VERSION = '0.1'

const TITLES = {
  ship: 'Ship Collision Forces',
  barge: 'Barge Collision Forces',
  risk: 'Annual Frequency of Collapse',
}
const ARTS = {
  ship: 'Arts. 3.14.7–3.14.10',
  barge: 'Arts. 3.14.7, 3.14.11–3.14.12',
  risk: 'Art. 3.14.5 (Method II)',
}

export async function generateVesselImpactPdf(data) {
  const { jsPDF } = await import('jspdf')
  const { module, inp, res, project = {}, pageSize = 'letter', dateStr = '', includeLogo = true } = data
  const doc = new jsPDF({ unit: 'pt', format: pageSize, compress: true })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 42
  const innerW = W - 2 * M
  const contentBottom = H - 40
  let y = 78

  const setFill = (c) => doc.setFillColor(c[0], c[1], c[2])
  const setText = (c) => doc.setTextColor(c[0], c[1], c[2])
  const setDraw = (c) => doc.setDrawColor(c[0], c[1], c[2])
  const font = (style = 'normal', size = 10) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
  }

  const drawHeader = () => {
    setFill(C.band)
    doc.rect(0, 0, W, 58, 'F')
    setFill(C.bandAccent)
    doc.rect(0, 58, W, 3, 'F')
    if (includeLogo) {
      setFill(C.white)
      doc.roundedRect(M, 16, 26, 26, 5, 5, 'F')
      // mini mark: pier bar + hull wedge
      setFill([195, 205, 217])
      doc.rect(M + 17, 20, 4.5, 18, 'F')
      setFill(C.bandAccent)
      doc.triangle(M + 4, 33, M + 14, 27, M + 14, 38, 'F')
      setText(C.white)
      font('bold', 17)
      doc.text('VesselImpactX', M + 36, 28, { baseline: 'middle' })
      font('normal', 8.5)
      doc.setTextColor(206, 219, 245)
      doc.text('Vessel Collision Design Forces', M + 36, 42, { baseline: 'middle' })
      setText(C.white)
      font('bold', 11)
      doc.text(TITLES[module].toUpperCase(), W - M, 24, { align: 'right', baseline: 'middle' })
      font('normal', 8.5)
      doc.setTextColor(206, 219, 245)
      doc.text(`AASHTO LRFD 9th Ed.  ·  ${ARTS[module]}`, W - M, 39, { align: 'right', baseline: 'middle' })
    } else {
      setText(C.white)
      font('bold', 13)
      doc.text(TITLES[module].toUpperCase(), M, 26, { baseline: 'middle' })
      font('normal', 8.5)
      doc.setTextColor(206, 219, 245)
      doc.text(`AASHTO LRFD 9th Ed.  ·  ${ARTS[module]}`, M, 41, { baseline: 'middle' })
    }
  }

  const stampFooters = () => {
    const total = doc.getNumberOfPages()
    for (let p = 1; p <= total; p += 1) {
      doc.setPage(p)
      setDraw(C.line)
      doc.setLineWidth(0.6)
      doc.line(M, H - 30, W - M, H - 30)
      font('normal', 7.5)
      setText(C.faint)
      doc.text('VesselImpactX  ·  AASHTO LRFD Section 3.14 Vessel Collision', M, H - 20, { baseline: 'middle' })
      if (dateStr) doc.text(dateStr, W / 2 + 60, H - 20, { align: 'center', baseline: 'middle' })
      doc.text(`Page ${p} of ${total}  ·  v${VERSION}`, W - M, H - 20, { align: 'right', baseline: 'middle' })
    }
  }

  const newPage = () => {
    doc.addPage()
    drawHeader()
    y = 78
  }
  const ensure = (space) => {
    if (y + space > contentBottom) newPage()
  }

  const sectionTitle = (text, keep = 0) => {
    ensure(24 + keep)
    font('bold', 11.5)
    setText(C.accentDeep)
    doc.text(text.toUpperCase(), M, y, { baseline: 'middle' })
    const tw = doc.getTextWidth(text.toUpperCase())
    setDraw(C.accent)
    doc.setLineWidth(1.2)
    doc.line(M, y + 9, M + tw, y + 9)
    setDraw(C.line)
    doc.setLineWidth(0.6)
    doc.line(M + tw + 8, y + 9, W - M, y + 9)
    y += 22
  }

  // draw one derivation step: reference chip + label, then the rendered equation
  const drawStep = async (step, idx) => {
    const eq = await renderEquation(stepChain(step))
    const exPt = 4.8
    let ew = eq.wEx * exPt
    let eh = eq.hEx * exPt
    const maxW = innerW - 18
    if (ew > maxW) {
      const s = maxW / ew
      ew *= s
      eh *= s
    }
    const headH = 15
    ensure(headH + eh + 12)
    font('bold', 7.6)
    const refW = doc.getTextWidth(step.ref) + 10
    setFill([238, 245, 251])
    setDraw([214, 228, 242])
    doc.setLineWidth(0.6)
    doc.roundedRect(M, y, refW, 12, 3, 3, 'FD')
    setText(C.accentDeep)
    doc.text(step.ref, M + 5, y + 6.4, { baseline: 'middle' })
    font('normal', 8.4)
    setText(C.sub)
    doc.text(`${idx}.  ${step.label}`, M + refW + 8, y + 6.4, { baseline: 'middle' })
    y += headH
    doc.addImage(eq.dataURL, 'PNG', M + 14, y, ew, eh)
    y += eh + 12
  }

  const drawSteps = async (steps) => {
    for (let i = 0; i < steps.length; i += 1) await drawStep(steps[i], i + 1)
    y += 6
  }

  // Notes accept either a plain string or { text, latex: [ ...display equations ] }.
  const notesBlock = async (notes) => {
    for (let i = 0; i < notes.length; i += 1) {
      const n = notes[i]
      const text = typeof n === 'string' ? n : n.text
      const eqs = typeof n === 'object' && n.latex ? n.latex : []
      font('normal', 8.5)
      const lines = doc.splitTextToSize(text, innerW - 24)
      ensure(lines.length * 11 + 6)
      font('bold', 8.5)
      setText(C.accent)
      doc.text(`${i + 1}.`, M + 4, y + 4, { baseline: 'middle' })
      font('normal', 8.5)
      setText(C.sub)
      doc.text(lines, M + 20, y + 4, { baseline: 'middle' })
      y += lines.length * 11 + 5
      const exPt = 4.4
      for (const lx of eqs) {
        const eq = await renderEquation(lx)
        let ew = eq.wEx * exPt
        let eh = eq.hEx * exPt
        const maxW = innerW - 44
        if (ew > maxW) {
          const s = maxW / ew
          ew *= s
          eh *= s
        }
        ensure(eh + 6)
        doc.addImage(eq.dataURL, 'PNG', M + 24, y, ew, eh)
        y += eh + 5
      }
      if (eqs.length) y += 3
    }
  }

  // one "symbol = value unit" LaTeX line
  const uTex = (u) => (u || '').replace(/·/g, '{\\cdot}').replace(/²/g, '^{2}').replace(/³/g, '^{3}').replace(/\^2/g, '^{2}')
  const mv = (sym, val, unit, digits = 2) => `${sym} = ${fmt(val, digits).replace(/,/g, '{,}')}${unit ? `\\;\\mathrm{${uTex(unit)}}` : ''}`
  const mtext = (s) => `\\text{${s}}`

  // render a list of LaTeX value-lines, laid out in columns (no boxes)
  const drawMathRows = async (items, cols = 3) => {
    const colW = innerW / cols
    const exPt = 4.5
    const lineH = 20
    for (let i = 0; i < items.length; i += cols) {
      ensure(lineH + 2)
      const rowY = y
      for (let c = 0; c < cols && i + c < items.length; c += 1) {
        const eq = await renderEquation(items[i + c])
        let ew = eq.wEx * exPt
        let eh = eq.hEx * exPt
        const maxW = colW - 12
        if (ew > maxW) {
          const s = maxW / ew
          ew *= s
          eh *= s
        }
        doc.addImage(eq.dataURL, 'PNG', M + c * colW + 2, rowY + (lineH - eh) / 2 + 1, ew, eh)
      }
      y = rowY + lineH
    }
    y += 8
  }

  const drawFigure = async (svgString) => {
    const fig = await rasterizeSvg(svgString)
    const imgW = innerW - 8
    const imgH = (imgW * fig.h) / fig.w
    ensure(imgH + 18)
    setFill(C.white)
    setDraw(C.cardBorder)
    doc.setLineWidth(0.8)
    doc.roundedRect(M, y, innerW, imgH + 8, 6, 6, 'FD')
    doc.addImage(fig.dataURL, 'PNG', M + 4, y + 4, imgW, imgH)
    y += imgH + 8 + 12
  }

  const verdictLine = (pass, text) => {
    ensure(20)
    setFill(pass ? [232, 245, 238] : [251, 236, 234])
    setDraw(pass ? [191, 227, 207] : [239, 201, 196])
    doc.setLineWidth(0.7)
    font('bold', 9)
    const tw = doc.getTextWidth(text) + 26
    doc.roundedRect(M, y - 6, tw, 17, 4, 4, 'FD')
    setText(pass ? C.pass : C.fail)
    doc.text(`${pass ? '✓' : '✗'}  ${text}`, M + 8, y + 2.5, { baseline: 'middle' })
    y += 21
  }

  // ---- build ----
  drawHeader()
  sectionTitle('Project Information')
  {
    font('normal', 9.5)
    setText(C.ink)
    const pinfo = `Project:  ${project.name || '—'}          Prepared by:  ${project.engineer || '—'}          Date:  ${dateStr || '—'}`
    const lines = doc.splitTextToSize(pinfo, innerW)
    doc.text(lines, M, y + 2, { baseline: 'middle' })
    y += lines.length * 13 + 10
  }

  if (module === 'ship') {
    const s = res.ship
    sectionTitle('Given')
    await drawMathRows([
      mv('DWT', inp.DWT, 'tonne', 0),
      mv('W', inp.W, 'tonne', 0),
      mv('LOA', inp.LOA, 'ft', 0),
      mv('D_B', inp.DB, 'ft'),
      mv('\\text{draft}', inp.draft, 'ft'),
      mv('UKC', inp.ukc, 'ft'),
      mv('V_T', inp.VT, 'ft/s'),
      mv('V_{MIN}', inp.Vmin, 'ft/s'),
      mv('x', inp.x, 'ft', 0),
      mv('x_C', inp.xc, 'ft', 0),
      mv('h_{exp}', inp.hExp, 'ft'),
    ])
    sectionTitle('Results')
    await drawMathRows([
      mv('V', res.vel.V, 'ft/s'),
      mv('C_H', res.ch.CH, ''),
      mv('KE', s.KE, 'kip{\\cdot}ft', 0),
      mv('P_S', s.PS, 'kip', 0),
      mv('a_S', s.aS, 'ft'),
      mv('P_{BH}', s.PBH, 'kip', 0),
      mv('P_{DH}', s.PDH, 'kip', 0),
      mv('P_{MT}', s.PMT, 'kip', 0),
    ])
    sectionTitle('Definition Diagram', 300)
    await drawFigure(
      shipImpactFigure({
        DWT: inp.DWT, W: inp.W, V: res.vel.V, CH: res.ch.CH, KE: s.KE,
        PS: s.PS, aS: s.aS, DB: inp.DB, draft: inp.draft, ukc: inp.ukc,
        PBH: s.PBH, PDH: s.PDH, PMT: s.PMT,
      }),
    )
    if (res.vel.steps.length) {
      sectionTitle('Design Collision Velocity (Art. 3.14.6)', 90)
      await drawSteps(res.vel.steps)
    }
    sectionTitle('Hydrodynamic Mass Coefficient (Art. 3.14.7)', 90)
    await drawSteps(res.ch.steps)
    sectionTitle('Collision Energy, Impact Force, and Bow Damage', 90)
    await drawSteps(s.steps)
    sectionTitle('Superstructure Forces (Art. 3.14.10)', 90)
    await drawSteps(s.sup)
    sectionTitle('Application of Impact Force (Art. 3.14.14.1)', 90)
    await drawSteps(s.app)
    sectionTitle('Notes')
    await notesBlock([
      'The equivalent static impact force represents a probabilistically based, worst-case, head-on collision with the vessel moving forward at relatively high velocity (C3.14.1). Requirements apply to steel-hulled merchant ships larger than 1,000 DWT.',
      'For substructure design, 100 percent of the impact force is applied parallel to the channel centerline, or 50 percent normal to it, as separate load cases (Art. 3.14.14.1). For overall stability the force is applied as a concentrated force at the mean high water level; for local checks it is a line load over the bow depth (Figs. 3.14.14.1-1, -2).',
      'The vessel collision load is combined at the Extreme Event II limit state (Table 3.4.1-1) and applies to the design of the pier, its foundation, and connections. Bow overhang (rake/flair) may extend over fenders and strike columns above the waterline; setback contact should be considered (C3.14.14.1).',
      {
        text: 'The minimum design impact for substructures is an empty 35 ft × 195 ft hopper barge drifting at the yearly mean current; for deep-draft spans without adequate clearance the minimum superstructure impact is the mast collision force (Art. 3.14.1):',
        latex: ['P_{MT} = 0.10\\,P_{DH}'],
      },
      'Verify all results against the governing edition of the AASHTO LRFD Bridge Design Specifications for design use.',
    ])
  } else if (module === 'barge') {
    const b = res.barge
    sectionTitle('Given')
    await drawMathRows([
      mtext(`tow: ${inp.nBarges} barge(s) + tug`),
      mv('W_{tow}', inp.Wtons, 'tons', 0),
      mv('LOA', inp.LOA, 'ft', 0),
      mv('B_B', inp.BB, 'ft'),
      mv('h_{HL}', inp.headLog, 'ft'),
      mv('\\text{draft}', inp.draft, 'ft'),
      mv('UKC', inp.ukc, 'ft'),
      mv('V_T', inp.VT, 'ft/s'),
      mv('V_{MIN}', inp.Vmin, 'ft/s'),
      mv('x', inp.x, 'ft', 0),
      mv('x_C', inp.xc, 'ft', 0),
    ])
    sectionTitle('Results')
    await drawMathRows([
      mv('V', res.vel.V, 'ft/s'),
      mv('C_H', res.ch.CH, ''),
      mv('W', b.W, 'tonne', 0),
      mv('KE', b.KE, 'kip{\\cdot}ft', 0),
      mv('a_B', b.aB, 'ft'),
      mv('P_B', b.PB, 'kip', 0),
    ])
    sectionTitle('Definition Diagram', 300)
    await drawFigure(
      bargeImpactFigure({
        W: b.W, V: res.vel.V, CH: res.ch.CH, KE: b.KE, PB: b.PB, aB: b.aB,
        BB: inp.BB, draft: inp.draft, ukc: inp.ukc, headLog: inp.headLog,
      }),
    )
    if (res.vel.steps.length) {
      sectionTitle('Design Collision Velocity (Art. 3.14.6)', 90)
      await drawSteps(res.vel.steps)
    }
    sectionTitle('Hydrodynamic Mass Coefficient (Art. 3.14.7)', 90)
    await drawSteps(res.ch.steps)
    sectionTitle('Collision Energy, Bow Damage, and Impact Force', 90)
    await drawSteps(b.steps)
    sectionTitle('Application of Impact Force (Art. 3.14.14.1)', 90)
    await drawSteps(b.app)
    sectionTitle('Notes')
    await notesBlock([
      'The standard hopper barge is 35.0 ft × 195.0 ft with 12.0 ft depth, 1.7 ft empty draft, 8.7 ft loaded draft, and 1,700 tons DWT (Art. 3.14.11). Eqs. 3.14.11-1/-2 and 3.14.12-1 were developed from Meir-Dornberg (1983) collision research (C3.14.11).',
      'Displacement tonnage of a barge tow is the tug/tow vessel plus the combined displacement of one row of barges in the length of the tow (Art. 3.14.7). LOA of the tow includes the tug (Art. 3.14.6). Barges are rated in tons (2,000 lb); Eq. 3.14.7-1 uses metric tonnes (2,205 lb).',
      'The barge collision load formulation is for a standard rake head log height of 2.0 to 3.0 ft; for deeper head logs (tanker or deck barges), the force may be increased in proportion to the head log height (C3.14.11). The width modification RB = BB/35 follows the AASHTO Guide Specifications for Vessel Collision Design of Highway Bridges (2009).',
      'The minimum design impact load for substructures is an empty standard hopper barge drifting at the yearly mean current velocity (Art. 3.14.1). Local collision forces are applied as a line load over the head block depth (Fig. 3.14.14.1-3).',
      'Verify all results against the governing edition of the AASHTO LRFD Bridge Design Specifications for design use.',
    ])
  } else {
    sectionTitle('Given')
    await drawMathRows([
      mtext(`vessel: ${inp.vesselType}`),
      mv('N', inp.N, '/yr', 0),
      mv('LOA', inp.LOA, 'ft', 0),
      mv('B_M', inp.BM, 'ft'),
      mv('B_P', inp.BP, 'ft'),
      mv('x', inp.x, 'ft', 0),
      mtext(`region: ${inp.region}${inp.region !== 'straight' ? ` (θ=${inp.theta}°)` : ''}`),
      mv('V_C', inp.Vc, 'knots'),
      mv('V_{XC}', inp.Vxc, 'knots'),
      mtext(`density: ${inp.density}`),
      mv('H', inp.H, 'kip', 0),
      mv('P', inp.P, 'kip', 0),
      mv('\\%\\,\\text{prot.}', inp.protectPct, '', 0),
    ])
    sectionTitle('Results')
    await drawMathRows([
      mv('PA', res.PA, '', 6),
      mv('PG', res.PG, '', 4),
      mv('PC', res.PC, '', 4),
      mv('PF', res.PF, ''),
      mv('AF', res.AF, '/yr', 6),
      Number.isFinite(res.RP) ? mv('1/AF', res.RP, 'yr', 0) : mtext('1/AF = ∞'),
    ])
    verdictLine(res.passTypical, `Typical bridge acceptance:  AF = ${fmt(res.AF, 6)}  ${res.passTypical ? '≤' : '>'}  0.001`)
    verdictLine(res.passCritical, `Critical / essential bridge acceptance:  AF = ${fmt(res.AF, 6)}  ${res.passCritical ? '≤' : '>'}  0.0001`)
    y += 4
    sectionTitle('Definition Diagram', 300)
    await drawFigure(
      riskFigure({
        x: inp.x, LOA: inp.LOA, BM: inp.BM, BP: inp.BP, xc: inp.xc,
        halfZone: res.halfZone, PG: res.PG, VT: inp.VT, Vmin: inp.Vmin, V: res.V,
      }),
    )
    sectionTitle('Probability of Aberrancy (Art. 3.14.5.2.3)', 90)
    await drawSteps(res.paSteps)
    sectionTitle('Geometric Probability (Art. 3.14.5.3)', 90)
    await drawSteps(res.pgSteps)
    sectionTitle('Probability of Collapse (Art. 3.14.5.4)', 90)
    await drawSteps(res.pcSteps)
    sectionTitle('Protection Factor (Art. 3.14.5.5)', 90)
    await drawSteps(res.pfSteps)
    sectionTitle('Annual Frequency of Collapse (Eq. 3.14.5-1)', 90)
    await drawSteps(res.afSteps)
    sectionTitle('Notes')
    await notesBlock([
      'AF is computed for each bridge component and vessel classification; the annual frequency of collapse for the total bridge is the sum of all component AFs (Art. 3.14.5). The acceptance criterion is distributed over the exposed pier and span components within 3.0 × LOA of the transit path (Art. 3.14.5).',
      'The approximate method for PA is an empirical relationship based on historical accident data; influences such as wind, visibility, navigation aids, and pilotage are included only indirectly (C3.14.5.2.3).',
      'The geometric probability uses a normal distribution with the mean at the vessel transit path centerline and σ = LOA; components beyond 3σ need not be included, other than the minimum impact requirement of Art. 3.14.1 (C3.14.5.3). For barge tows, LOA is the total tow length including the towboat.',
      'The probability of collapse is based on the ratio of the ultimate lateral resistance of the pier (HP) or span (Hs) to the vessel impact force (PS, PBH, PDH, or PMT) per Art. 3.14.5.4.',
      'Verify all results against the governing edition of the AASHTO LRFD Bridge Design Specifications for design use.',
    ])
  }

  stampFooters()
  const safe = (project.name || `vesselimpactx-${module}`).replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  doc.save(`${safe}-report.pdf`)
  return doc
}
