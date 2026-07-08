// Vessel-collision engine for VesselImpact.
//
// Every equation, clause, table, and figure reference comes from Section 3.14
// (Vessel Collision: CV) of the AASHTO LRFD Bridge Design Specifications,
// 9th Edition (2020). Each result carries an ordered list of derivation steps;
// every step provides the symbolic equation in LaTeX (AASHTO notation), the
// same expression with the numeric values substituted, and the computed
// result, so the UI and the PDF report read as a full engineering calculation.

const { sqrt, exp, abs, PI, min, max } = Math

// step(ref, label, latex "LHS &= RHS", substituted-RHS, value, unit)
const S = (ref, label, latex, subs, value, unit) => ({ ref, label, latex, subs, value, unit })

// clean numeric formatting for substituted expressions
export const nf = (x) => {
  if (!Number.isFinite(x)) return '?'
  const a = abs(x)
  if (a !== 0 && (a < 1e-3 || a >= 1e5)) {
    const [m, e] = x.toExponential(2).split('e')
    return `${m}{\\times}10^{${Number(e)}}`
  }
  return String(Number(x.toPrecision(4)))
}

// Standard-normal CDF via the Abramowitz & Stegun 7.1.26 erf approximation
// (max error 1.5e-7), used for the geometric probability (Fig. 3.14.5.3-1).
export function normCdf(z) {
  const t = 1 / (1 + 0.3275911 * abs(z) / sqrt(2))
  const erf =
    1 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      exp((-z * z) / 2)
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf)
}

// ---------------------------------------------------------------------------
// Design collision velocity - triangular distribution (Fig. 3.14.6-1)
// ---------------------------------------------------------------------------
export function designVelocity({ VT, Vmin, x, xc, LOA }) {
  const steps = []
  const VTe = max(VT, Vmin)
  const xl = 3 * LOA
  steps.push(S('Fig. 3.14.6-1', 'distribution limit', 'x_L &= 3.0\\,LOA', `3.0 \\times ${nf(LOA)}`, xl, 'ft'))
  let V
  if (x <= xc) {
    V = VTe
    steps.push(S('Fig. 3.14.6-1', 'pier within channel limits: full transit velocity', 'V &= V_T', `${nf(VTe)}`, V, 'ft/s'))
  } else if (x < xl) {
    V = VTe - ((VTe - Vmin) * (x - xc)) / (xl - xc)
    steps.push(S('Fig. 3.14.6-1', 'linear reduction between channel edge and 3.0 LOA', 'V &= V_T-\\left(V_T-V_{MIN}\\right)\\dfrac{x-x_C}{x_L-x_C}', `${nf(VTe)}-(${nf(VTe)}-${nf(Vmin)})\\tfrac{${nf(x)}-${nf(xc)}}{${nf(xl)}-${nf(xc)}}`, V, 'ft/s'))
  } else {
    V = Vmin
    steps.push(S('Fig. 3.14.6-1', 'beyond 3.0 LOA: drifting at the yearly mean current', 'V &= V_{MIN}', `${nf(Vmin)}`, V, 'ft/s'))
  }
  return { V, xl, steps }
}

// ---------------------------------------------------------------------------
// Hydrodynamic mass coefficient (Eqs. 3.14.7-2, 3.14.7-3)
// ---------------------------------------------------------------------------
export function hydroMassCoeff({ ukc, draft }) {
  const steps = []
  const ratio = draft > 0 ? ukc / draft : 99
  steps.push(S('Art. 3.14.7', 'underkeel clearance ratio', '\\dfrac{UKC}{\\text{draft}} &= \\dfrac{UKC}{D_{draft}}', `\\tfrac{${nf(ukc)}}{${nf(draft)}}`, ratio, ''))
  let CH
  if (ratio >= 0.5) {
    CH = 1.05
    steps.push(S('Eq. 3.14.7-2', 'underkeel clearance > 0.5 × draft', 'C_H &= 1.05', '1.05', CH, ''))
  } else if (ratio <= 0.1) {
    CH = 1.25
    steps.push(S('Eq. 3.14.7-3', 'underkeel clearance < 0.1 × draft', 'C_H &= 1.25', '1.25', CH, ''))
  } else {
    CH = 1.25 - ((ratio - 0.1) / 0.4) * 0.2
    steps.push(S('Art. 3.14.7', 'linear interpolation between the limits', 'C_H &= 1.25-0.20\\,\\dfrac{UKC/D_{draft}-0.1}{0.4}', `1.25-0.20\\tfrac{${nf(ratio)}-0.1}{0.4}`, CH, ''))
  }
  return { CH, ratio, steps }
}

// ---------------------------------------------------------------------------
// Ship collision (Arts. 3.14.7 - 3.14.10)
// ---------------------------------------------------------------------------
export function shipImpact({ DWT, W, V, CH, DB, hExp }) {
  const steps = []

  const KE = (CH * W * V * V) / 29.2
  steps.push(S('Eq. 3.14.7-1', 'vessel collision energy', 'KE &= \\dfrac{C_H\\,W\\,V^2}{29.2}', `\\dfrac{${nf(CH)} \\times ${nf(W)} \\times ${nf(V)}^2}{29.2}`, KE, 'kip·ft'))

  const PS = 8.15 * V * sqrt(DWT)
  steps.push(S('Eq. 3.14.8-1', 'head-on ship collision force on pier', 'P_S &= 8.15\\,V\\sqrt{DWT}', `8.15 \\times ${nf(V)}\\sqrt{${nf(DWT)}}`, PS, 'kip'))

  const aS = 1.54 * (KE / PS)
  steps.push(S('Eq. 3.14.9-1', 'ship bow damage length', 'a_S &= 1.54\\left(\\dfrac{KE}{P_S}\\right)', `1.54\\left(\\tfrac{${nf(KE)}}{${nf(PS)}}\\right)`, aS, 'ft'))

  // superstructure forces
  const sup = []
  const RBH = DB > 0 ? min(hExp / DB, 1.0) : 0
  sup.push(S('Art. 3.14.10.1', 'exposure ratio (superstructure depth overlap / bow depth)', 'R_{BH} &= \\dfrac{h_{exp}}{D_B}\\le 1.0', `\\tfrac{${nf(hExp)}}{${nf(DB)}}`, RBH, ''))
  const PBH = RBH * PS
  sup.push(S('Eq. 3.14.10.1-1', 'bow collision force on superstructure', 'P_{BH} &= \\left(R_{BH}\\right)\\left(P_S\\right)', `${nf(RBH)} \\times ${nf(PS)}`, PBH, 'kip'))

  let RDH
  if (DWT >= 100000) {
    RDH = 0.1
    sup.push(S('Art. 3.14.10.2', 'deck house reduction factor (ship ≥ 100,000 tonne)', 'R_{DH} &= 0.10', '0.10', RDH, ''))
  } else {
    RDH = 0.2 - (DWT / 100000) * 0.1
    sup.push(S('Eq. 3.14.10.2-2', 'deck house reduction factor (ship < 100,000 tonne)', 'R_{DH} &= 0.2-\\left(\\dfrac{DWT}{100{,}000}\\right)(0.10)', `0.2-\\left(\\tfrac{${nf(DWT)}}{100{,}000}\\right)(0.10)`, RDH, ''))
  }
  const PDH = RDH * PS
  sup.push(S('Eq. 3.14.10.2-1', 'deck house collision force on superstructure', 'P_{DH} &= \\left(R_{DH}\\right)\\left(P_S\\right)', `${nf(RDH)} \\times ${nf(PS)}`, PDH, 'kip'))

  const PMT = 0.1 * PDH
  sup.push(S('Eq. 3.14.10.3-1', 'mast collision force on superstructure', 'P_{MT} &= 0.10\\,P_{DH}', `0.10 \\times ${nf(PDH)}`, PMT, 'kip'))

  // application (Art. 3.14.14.1)
  const app = []
  app.push(S('Art. 3.14.14.1', 'transverse case: force normal to channel centerline', 'P_{S,\\perp} &= 0.50\\,P_S', `0.50 \\times ${nf(PS)}`, 0.5 * PS, 'kip'))
  const lineLoad = DB > 0 ? PS / DB : 0
  app.push(S('Fig. 3.14.14.1-2', 'local collision line load over the bow depth', 'p_S &= \\dfrac{P_S}{D_B}', `\\tfrac{${nf(PS)}}{${nf(DB)}}`, lineLoad, 'kip/ft'))

  return { KE, PS, aS, RBH, PBH, RDH, PDH, PMT, lineLoad, steps, sup, app }
}

// ---------------------------------------------------------------------------
// Barge collision (Arts. 3.14.7, 3.14.11, 3.14.12)
// ---------------------------------------------------------------------------
// Standard hopper barge (Art. 3.14.11): 35 ft x 195 ft, depth 12 ft,
// empty draft 1.7 ft, loaded draft 8.7 ft, DWT 1,700 tons.
export function bargeImpact({ Wtons, V, CH, BB, headLog }) {
  const steps = []

  const W = 0.907 * Wtons
  steps.push(S('C3.14.1', 'displacement in metric tonnes (barges are rated in tons of 2,000 lb)', 'W &= 0.907\\,W_{tons}', `0.907 \\times ${nf(Wtons)}`, W, 'tonne'))

  const KE = (CH * W * V * V) / 29.2
  steps.push(S('Eq. 3.14.7-1', 'vessel collision energy', 'KE &= \\dfrac{C_H\\,W\\,V^2}{29.2}', `\\dfrac{${nf(CH)} \\times ${nf(W)} \\times ${nf(V)}^2}{29.2}`, KE, 'kip·ft'))

  // width modification for non-standard barges (AASHTO Guide Spec. 2009 practice;
  // reduces to Eqs. 3.14.11-1/-2 and 3.14.12-1 for the 35-ft standard hopper barge)
  const RB = BB / 35
  const nonStd = abs(BB - 35) > 1e-9
  if (nonStd) {
    steps.push(S('GS C3.14.11', 'barge width ratio for non-standard barge', 'R_B &= \\dfrac{B_B}{35}', `\\tfrac{${nf(BB)}}{35}`, RB, ''))
  }

  const aB = (10.2 / RB) * (sqrt(1 + KE / 5672) - 1)
  steps.push(S('Eq. 3.14.12-1', 'barge bow damage length', nonStd ? 'a_B &= \\dfrac{10.2}{R_B}\\left(\\sqrt{1+\\dfrac{KE}{5{,}672}}-1\\right)' : 'a_B &= 10.2\\left(\\sqrt{1+\\dfrac{KE}{5{,}672}}-1\\right)', `${nonStd ? `\\tfrac{10.2}{${nf(RB)}}` : '10.2'}\\left(\\sqrt{1+\\tfrac{${nf(KE)}}{5{,}672}}-1\\right)`, aB, 'ft'))

  let PBstd
  if (aB < 0.34) {
    PBstd = 4112 * aB
    steps.push(S('Eq. 3.14.11-1', 'barge collision force (aB < 0.34 ft)', 'P_B &= 4{,}112\\,a_B', `4{,}112 \\times ${nf(aB)}`, PBstd, 'kip'))
  } else {
    PBstd = 1349 + 110 * aB
    steps.push(S('Eq. 3.14.11-2', 'barge collision force (aB ≥ 0.34 ft)', 'P_B &= 1{,}349+110\\,a_B', `1{,}349+110 \\times ${nf(aB)}`, PBstd, 'kip'))
  }
  let PB = PBstd
  if (nonStd) {
    PB = PBstd * RB
    steps.push(S('GS C3.14.11', 'force scaled by the barge width ratio', 'P_B &= R_B\\,P_{B,std}', `${nf(RB)} \\times ${nf(PBstd)}`, PB, 'kip'))
  }
  if (headLog > 3.0) {
    const RHL = headLog / 3.0
    const PBhl = PB * RHL
    steps.push(S('C3.14.11', 'deep head log: force increased in proportion to head log height (standard 2.0-3.0 ft)', 'P_B &= \\dfrac{h_{HL}}{3.0}\\,P_B', `\\tfrac{${nf(headLog)}}{3.0} \\times ${nf(PB)}`, PBhl, 'kip'))
    PB = PBhl
  }

  const app = []
  app.push(S('Art. 3.14.14.1', 'transverse case: force normal to channel centerline', 'P_{B,\\perp} &= 0.50\\,P_B', `0.50 \\times ${nf(PB)}`, 0.5 * PB, 'kip'))
  const hHB = max(headLog, 2)
  const lineLoad = PB / hHB
  app.push(S('Fig. 3.14.14.1-3', 'local collision line load over the head block depth', 'p_B &= \\dfrac{P_B}{D_{HB}}', `\\tfrac{${nf(PB)}}{${nf(hHB)}}`, lineLoad, 'kip/ft'))

  return { W, KE, RB, aB, PB, lineLoad, steps, app }
}

// ---------------------------------------------------------------------------
// Minimum design impact - empty hopper barge drifting at the yearly mean
// current (Art. 3.14.1). This sets a floor on the substructure design force:
// the governing impact is the larger of the computed vessel force and this
// minimum. The design barge is the standard 35-ft hopper barge with a 200-ton
// empty displacement, evaluated with the barge-force equations (Eqs. 3.14.11,
// 3.14.12). The 1.7-ft empty draft leaves ample underkeel clearance, so
// C_H = 1.05 (Eq. 3.14.7-2).
// ---------------------------------------------------------------------------
export function minimumImpact({ Vmin, CH = 1.05 }) {
  const steps = []
  const Wtons = 200
  steps.push(S('Art. 3.14.1', 'empty standard hopper barge, 35 ft x 195 ft, 200-ton empty displacement', 'W_{tons} &= 200\\;\\text{tons (empty)}', null, Wtons, 'tons'))
  const W = 0.907 * Wtons
  steps.push(S('C3.14.1', 'empty displacement in metric tonnes', 'W &= 0.907\\,W_{tons}', `0.907 \\times ${nf(Wtons)}`, W, 'tonne'))
  steps.push(S('Art. 3.14.1', 'drifting at the yearly mean current velocity', 'V &= V_{MIN}', `${nf(Vmin)}`, Vmin, 'ft/s'))
  steps.push(S('Eq. 3.14.7-2', 'hydrodynamic mass coefficient (ample underkeel clearance for the 1.7-ft empty draft)', 'C_H &= 1.05', '1.05', CH, ''))
  const KE = (CH * W * Vmin * Vmin) / 29.2
  steps.push(S('Eq. 3.14.7-1', 'collision energy of the drifting empty barge', 'KE &= \\dfrac{C_H\\,W\\,V_{MIN}^2}{29.2}', `\\dfrac{${nf(CH)} \\times ${nf(W)} \\times ${nf(Vmin)}^2}{29.2}`, KE, 'kip·ft'))
  const aB = 10.2 * (sqrt(1 + KE / 5672) - 1)
  steps.push(S('Eq. 3.14.12-1', 'barge bow damage length (standard 35-ft barge)', 'a_B &= 10.2\\left(\\sqrt{1+\\dfrac{KE}{5{,}672}}-1\\right)', `10.2\\left(\\sqrt{1+\\tfrac{${nf(KE)}}{5{,}672}}-1\\right)`, aB, 'ft'))
  let PBmin
  if (aB < 0.34) {
    PBmin = 4112 * aB
    steps.push(S('Eq. 3.14.11-1', 'minimum design impact force (aB < 0.34 ft)', 'P_{min} &= 4{,}112\\,a_B', `4{,}112 \\times ${nf(aB)}`, PBmin, 'kip'))
  } else {
    PBmin = 1349 + 110 * aB
    steps.push(S('Eq. 3.14.11-2', 'minimum design impact force (aB ≥ 0.34 ft)', 'P_{min} &= 1{,}349+110\\,a_B', `1{,}349+110 \\times ${nf(aB)}`, PBmin, 'kip'))
  }
  return { PBmin, W, KE, aB, Wtons, CH, Vmin, steps }
}

// ---------------------------------------------------------------------------
// Annual frequency of collapse - Method II (Art. 3.14.5)
// ---------------------------------------------------------------------------
export const DENSITY_OPTIONS = ['low', 'average', 'high']
export const REGION_OPTIONS = ['straight', 'transition', 'turn/bend']

export function annualFrequency(inp) {
  const {
    vesselType, N, region, theta, Vc, Vxc, density,
    x, LOA, BM, BP, H, P, protectPct,
  } = inp

  // ---- PA (Art. 3.14.5.2.3) ----
  const pa = []
  const isBarge = vesselType === 'barge'
  const BR = isBarge ? 1.2e-4 : 0.6e-4
  pa.push(S('Art. 3.14.5.2.3', `aberrancy base rate (${isBarge ? 'barges' : 'ships'})`, `BR &= ${isBarge ? '1.2' : '0.6'}\\times10^{-4}`, null, BR, ''))

  let RBloc
  if (region === 'straight') {
    RBloc = 1
    pa.push(S('Eq. 3.14.5.2.3-2', 'bridge location: straight region', 'R_B &= 1.0', '1.0', RBloc, ''))
  } else if (region === 'transition') {
    RBloc = 1 + theta / 90
    pa.push(S('Eq. 3.14.5.2.3-3', 'bridge location: transition region', 'R_B &= 1+\\dfrac{\\theta}{90^{\\circ}}', `1+\\tfrac{${nf(theta)}}{90}`, RBloc, ''))
  } else {
    RBloc = 1 + theta / 45
    pa.push(S('Eq. 3.14.5.2.3-4', 'bridge location: turn/bend region', 'R_B &= 1+\\dfrac{\\theta}{45^{\\circ}}', `1+\\tfrac{${nf(theta)}}{45}`, RBloc, ''))
  }

  const RC = 1 + Vc / 10
  pa.push(S('Eq. 3.14.5.2.3-5', 'parallel-current correction', 'R_C &= 1+\\dfrac{V_C}{10}', `1+\\tfrac{${nf(Vc)}}{10}`, RC, ''))

  const RXC = 1 + Vxc
  pa.push(S('Eq. 3.14.5.2.3-6', 'cross-current correction', 'R_{XC} &= 1+V_{XC}', `1+${nf(Vxc)}`, RXC, ''))

  const RD = density === 'high' ? 1.6 : density === 'average' ? 1.3 : 1.0
  pa.push(S(`Eq. 3.14.5.2.3-${density === 'high' ? 9 : density === 'average' ? 8 : 7}`, `traffic density: ${density}`, `R_D &= ${nf(RD)}`, null, RD, ''))

  const PA = BR * RBloc * RC * RXC * RD
  pa.push(S('Eq. 3.14.5.2.3-1', 'probability of aberrancy', 'PA &= \\left(BR\\right)\\left(R_B\\right)\\left(R_C\\right)\\left(R_{XC}\\right)\\left(R_D\\right)', `(${nf(BR)})(${nf(RBloc)})(${nf(RC)})(${nf(RXC)})(${nf(RD)})`, PA, ''))

  // ---- PG (Art. 3.14.5.3) ----
  const pg = []
  const halfZone = (BP + BM) / 2
  pg.push(S('Fig. 3.14.5.3-1', 'impact zone half-width (pier width + vessel beam)', '\\dfrac{B_P+B_M}{2} &= \\dfrac{B_P+B_M}{2}', `\\tfrac{${nf(BP)}+${nf(BM)}}{2}`, halfZone, 'ft'))
  const sigma = LOA
  pg.push(S('Art. 3.14.5.3', 'standard deviation of the sailing path', '\\sigma &= LOA', `${nf(LOA)}`, sigma, 'ft'))
  const z1 = (x - halfZone) / sigma
  const z2 = (x + halfZone) / sigma
  const PG = normCdf(z2) - normCdf(z1)
  pg.push(S('Fig. 3.14.5.3-1', 'geometric probability: area under the normal curve across the impact zone', 'PG &= \\Phi\\!\\left(\\dfrac{x+\\tfrac{B_P+B_M}{2}}{\\sigma}\\right)-\\Phi\\!\\left(\\dfrac{x-\\tfrac{B_P+B_M}{2}}{\\sigma}\\right)', `\\Phi(${nf(z2)})-\\Phi(${nf(z1)})`, PG, ''))

  // ---- PC (Art. 3.14.5.4) ----
  const pc = []
  const HP = P > 0 ? H / P : 99
  pc.push(S('Art. 3.14.5.4', 'resistance-to-force ratio', '\\dfrac{H}{P} &= \\dfrac{H}{P}', `\\tfrac{${nf(H)}}{${nf(P)}}`, HP, ''))
  let PC
  if (HP >= 1) {
    PC = 0
    pc.push(S('Eq. 3.14.5.4-3', 'resistance exceeds the impact force', 'PC &= 0.0', '0.0', PC, ''))
  } else if (HP >= 0.1) {
    PC = 0.111 * (1 - HP)
    pc.push(S('Eq. 3.14.5.4-2', '0.1 ≤ H/P < 1.0', 'PC &= 0.111\\left(1-\\dfrac{H}{P}\\right)', `0.111\\left(1-${nf(HP)}\\right)`, PC, ''))
  } else {
    PC = 0.1 + 9 * (0.1 - HP)
    pc.push(S('Eq. 3.14.5.4-1', '0.0 ≤ H/P < 0.1', 'PC &= 0.1+9\\left(0.1-\\dfrac{H}{P}\\right)', `0.1+9\\left(0.1-${nf(HP)}\\right)`, PC, ''))
  }

  // ---- PF (Art. 3.14.5.5) ----
  const pf = []
  const PF = 1 - protectPct / 100
  pf.push(S('Eq. 3.14.5.5-1', 'protection factor', 'PF &= 1-\\dfrac{\\%\\,\\text{protection}}{100}', `1-\\tfrac{${nf(protectPct)}}{100}`, PF, ''))

  // ---- AF ----
  const af = []
  const AF = N * PA * PG * PC * PF
  af.push(S('Eq. 3.14.5-1', 'annual frequency of collapse', 'AF &= \\left(N\\right)\\left(PA\\right)\\left(PG\\right)\\left(PC\\right)\\left(PF\\right)', `(${nf(N)})(${nf(PA)})(${nf(PG)})(${nf(PC)})(${nf(PF)})`, AF, '/yr'))
  const RP = AF > 0 ? 1 / AF : Infinity
  if (Number.isFinite(RP)) af.push(S('C3.14.5', 'return period', 'T &= \\dfrac{1}{AF}', `\\tfrac{1}{${nf(AF)}}`, RP, 'yr'))

  const limitCritical = 0.0001
  const limitTypical = 0.001
  return {
    BR, RBloc, RC, RXC, RD, PA, sigma, halfZone, PG, HP, PC, PF, AF, RP,
    passCritical: AF <= limitCritical,
    passTypical: AF <= limitTypical,
    limitCritical, limitTypical,
    paSteps: pa, pgSteps: pg, pcSteps: pc, pfSteps: pf, afSteps: af,
  }
}
