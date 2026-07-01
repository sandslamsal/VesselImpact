import { useMemo, useState } from 'react'
import { Container } from 'lucide-react'
import { bargeImpact, designVelocity, hydroMassCoeff } from '../utils/vesselCollision.js'
import { num, NumberField, ResultCard, SelectField } from './shared.jsx'
import { MathStepList, MathValues, mvtex } from './mathview.jsx'
import { Figure } from './figview.jsx'
import { bargeImpactFigure } from '../utils/figures.js'
import { generateVesselImpactPdf } from '../utils/vesselImpactPdf.js'
import { ReportCard } from './ReportCard.jsx'

export function BargeImpact() {
  // tow
  const [nBarges, setNBarges] = useState('3')
  const [Wbarge, setWbarge] = useState('1900')
  const [Wtug, setWtug] = useState('300')
  const [LOA, setLOA] = useState('700')
  const [BB, setBB] = useState('35')
  const [draft, setDraft] = useState('8.7')
  const [ukc, setUkc] = useState('5')
  const [headLog, setHeadLog] = useState('2.5')
  // velocity
  const [VT, setVT] = useState('9')
  const [Vmin, setVmin] = useState('3.4')
  const [xDist, setXDist] = useState('120')
  const [xc, setXc] = useState('300')
  const [vMode, setVMode] = useState('distribution (Fig. 3.14.6-1)')
  const [Vdirect, setVdirect] = useState('9')

  const Wtons = num(nBarges) * num(Wbarge) + num(Wtug)
  const inp = {
    nBarges: num(nBarges), Wbarge: num(Wbarge), Wtug: num(Wtug), Wtons,
    LOA: num(LOA), BB: num(BB), draft: num(draft), ukc: num(ukc),
    headLog: num(headLog), VT: num(VT), Vmin: num(Vmin), x: num(xDist),
    xc: num(xc), vMode, Vdirect: num(Vdirect),
  }
  const inpKey = JSON.stringify(inp)
  const res = useMemo(() => {
    try {
      if (!(inp.Wtons > 0) || !(inp.BB > 0)) return null
      const vel = vMode.startsWith('distribution')
        ? designVelocity({ VT: inp.VT, Vmin: inp.Vmin, x: inp.x, xc: inp.xc, LOA: inp.LOA })
        : { V: inp.Vdirect, steps: [] }
      if (!(vel.V > 0)) return null
      const ch = hydroMassCoeff({ ukc: inp.ukc, draft: inp.draft })
      const barge = bargeImpact({ Wtons: inp.Wtons, V: vel.V, CH: ch.CH, BB: inp.BB, headLog: inp.headLog })
      return { vel, ch, barge }
    } catch {
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inpKey])

  const figData = res
    ? {
        W: res.barge.W, V: res.vel.V, CH: res.ch.CH, KE: res.barge.KE,
        PB: res.barge.PB, aB: res.barge.aB, BB: inp.BB, draft: inp.draft,
        ukc: inp.ukc, headLog: inp.headLog,
      }
    : null

  return (
    <>
      <section className="toolbar-card">
        <div className="results-head">
          <Container size={18} />
          <div>
            <h3>Barge Collision Forces</h3>
            <p>
              Barge tow collision with a bridge pier, AASHTO LRFD Articles
              3.14.7, 3.14.11, and 3.14.12. The standard hopper barge is
              35 ft × 195 ft (12 ft depth, 1,700 tons DWT); the tow displacement
              is the tug plus one row of barges in the length of the tow
              (Art. 3.14.7). LOA of the tow includes the tug (Art. 3.14.6).
            </p>
          </div>
        </div>

        <div className="section-label">Barge tow</div>
        <div className="field-grid">
          <NumberField label="Barges in one row of the tow" unit="no." value={nBarges} onChange={setNBarges} min="1" step="1" />
          <NumberField label="Displacement per barge" unit="tons" value={Wbarge} onChange={setWbarge} hint="loaded standard hopper ≈ 1,900 tons; empty ≈ 200 tons" />
          <NumberField label="Tug displacement" unit="tons" value={Wtug} onChange={setWtug} />
          <NumberField label="Tow length overall LOA (incl. tug)" unit="ft" value={LOA} onChange={setLOA} />
          <NumberField label="Barge width B_B" unit="ft" value={BB} onChange={setBB} hint="35 ft = standard hopper barge" />
          <NumberField label="Head log height" unit="ft" value={headLog} onChange={setHeadLog} hint="standard rake head log 2.0–3.0 ft (C3.14.11)" />
          <NumberField label="Draft" unit="ft" value={draft} onChange={setDraft} hint="loaded 8.7 ft / empty 1.7 ft (standard hopper)" />
          <NumberField label="Underkeel clearance" unit="ft" value={ukc} onChange={setUkc} />
        </div>

        <div className="section-label">Impact velocity (Art. 3.14.6)</div>
        <div className="field-grid">
          <SelectField label="Velocity input" value={vMode} onChange={setVMode} options={['distribution (Fig. 3.14.6-1)', 'direct']} />
          {vMode === 'direct' ? (
            <NumberField label="Impact velocity V" unit="ft/s" value={Vdirect} onChange={setVdirect} />
          ) : (
            <>
              <NumberField label="Transit velocity V_T" unit="ft/s" value={VT} onChange={setVT} hint="1 knot = 1.688 ft/s" />
              <NumberField label="Min. velocity V_MIN" unit="ft/s" value={Vmin} onChange={setVmin} hint="≥ yearly mean current velocity" />
              <NumberField label="Pier distance x from transit path ℄" unit="ft" value={xDist} onChange={setXDist} />
              <NumberField label="Channel edge distance x_C" unit="ft" value={xc} onChange={setXc} />
            </>
          )}
        </div>
      </section>

      {res ? (
        <>
          <div className="result-grid">
            <ResultCard label="Barge impact force on pier" value={res.barge.PB} unit="kip" refText={res.barge.aB < 0.34 ? 'Eq. 3.14.11-1' : 'Eq. 3.14.11-2'} accent />
            <ResultCard label="Collision energy" value={res.barge.KE} unit="kip·ft" refText="Eq. 3.14.7-1" />
            <ResultCard label="Barge bow damage length" value={res.barge.aB} unit="ft" refText="Eq. 3.14.12-1" />
            <ResultCard label="Impact velocity" value={res.vel.V} unit="ft/s" refText="Fig. 3.14.6-1" />
          </div>

          <section className="results-card">
            <div className="results-head">
              <Container size={18} />
              <div>
                <h3>Definition Diagram</h3>
                <p>
                  The concentrated force acts at the mean high water level; the
                  local collision force is a line load distributed over the head
                  block depth (Fig. 3.14.14.1-3).
                </p>
              </div>
            </div>
            <Figure svg={bargeImpactFigure(figData)} />
          </section>

          <section className="results-card">
            <div className="results-head">
              <div>
                <h3>Pier Design Forces (Arts. 3.14.11–3.14.12, 3.14.14.1)</h3>
                <p>100% of P_B parallel to the channel centerline, or 50% normal to it, applied separately.</p>
              </div>
            </div>
            <MathValues
              items={[
                mvtex('P_B', res.barge.PB, 'kip'),
                mvtex('0.5\\,P_B', 0.5 * res.barge.PB, 'kip'),
                mvtex('KE', res.barge.KE, 'kip·ft'),
                mvtex('a_B', res.barge.aB, 'ft'),
              ]}
            />
            {res.vel.steps.length ? <MathStepList steps={res.vel.steps} title="Design collision velocity (Art. 3.14.6)" /> : null}
            <MathStepList steps={res.ch.steps} title="Hydrodynamic mass coefficient (Art. 3.14.7)" />
            <MathStepList steps={res.barge.steps} title="Collision energy, bow damage, and impact force" />
            <MathStepList steps={res.barge.app} title="Application of impact force (Art. 3.14.14.1)" />
          </section>

          <ReportCard
            module="barge"
            onGenerate={(opts) =>
              generateVesselImpactPdf({ module: 'barge', inp, res, ...opts })
            }
          />
        </>
      ) : (
        <div className="status-banner">Enter a valid tow (displacement, width, and velocity greater than zero) to compute forces.</div>
      )}
    </>
  )
}
