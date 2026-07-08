import { useMemo, useState } from 'react'
import { Ship } from 'lucide-react'
import { shipImpact, designVelocity, hydroMassCoeff, minimumImpact } from '../utils/vesselCollision.js'
import { num, NumberField, ResultCard, SelectField, Verdict, fmt } from './shared.jsx'
import { MathStepList, MathValues, mvtex, TexText } from './mathview.jsx'
import { Figure } from './figview.jsx'
import { shipImpactFigure } from '../utils/figures.js'
import { generateVesselImpactPdf } from '../utils/vesselImpactPdf.js'
import { ReportCard } from './ReportCard.jsx'

export function ShipImpact() {
  // vessel
  const [DWT, setDWT] = useState('35000')
  const [Wship, setWship] = useState('47000')
  const [LOA, setLOA] = useState('650')
  const [DB, setDB] = useState('35')
  const [draft, setDraft] = useState('30')
  const [ukc, setUkc] = useState('10')
  // velocity distribution
  const [VT, setVT] = useState('16.9')
  const [Vmin, setVmin] = useState('3.4')
  const [xDist, setXDist] = useState('120')
  const [xc, setXc] = useState('400')
  const [vMode, setVMode] = useState('distribution (Fig. 3.14.6-1)')
  const [Vdirect, setVdirect] = useState('16.9')
  // superstructure exposure
  const [hExp, setHExp] = useState('0')

  const inp = {
    DWT: num(DWT), W: num(Wship), LOA: num(LOA), DB: num(DB),
    draft: num(draft), ukc: num(ukc), VT: num(VT), Vmin: num(Vmin),
    x: num(xDist), xc: num(xc), hExp: num(hExp),
    vMode, Vdirect: num(Vdirect),
  }
  const inpKey = JSON.stringify(inp)
  const res = useMemo(() => {
    try {
      if (!(inp.DWT > 0) || !(inp.W > 0)) return null
      const vel = vMode.startsWith('distribution')
        ? designVelocity({ VT: inp.VT, Vmin: inp.Vmin, x: inp.x, xc: inp.xc, LOA: inp.LOA })
        : { V: inp.Vdirect, steps: [] }
      if (!(vel.V > 0)) return null
      const ch = hydroMassCoeff({ ukc: inp.ukc, draft: inp.draft })
      const ship = shipImpact({ DWT: inp.DWT, W: inp.W, V: vel.V, CH: ch.CH, DB: inp.DB, hExp: inp.hExp })
      const min = minimumImpact({ Vmin: inp.Vmin })
      return { vel, ch, ship, min }
    } catch {
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inpKey])

  const figData = res
    ? {
        DWT: inp.DWT, W: inp.W, V: res.vel.V, CH: res.ch.CH, KE: res.ship.KE,
        PS: res.ship.PS, aS: res.ship.aS, DB: inp.DB, draft: inp.draft,
        ukc: inp.ukc, PBH: res.ship.PBH, PDH: res.ship.PDH, PMT: res.ship.PMT,
      }
    : null

  return (
    <>
      <section className="toolbar-card">
        <div className="results-head">
          <Ship size={18} />
          <div>
            <h3>Ship Collision Forces</h3>
            <p>
              Head-on ship collision with a bridge pier and superstructure,
              AASHTO LRFD Articles 3.14.7 through 3.14.10. Enter the design
              vessel from the vessel-frequency analysis (Art. 3.14.4), the
              transit geometry for the impact-velocity distribution, and the
              underkeel clearance for the hydrodynamic mass coefficient.
            </p>
          </div>
        </div>

        <div className="section-label">Design vessel</div>
        <div className="field-grid">
          <NumberField label="Deadweight tonnage $DWT$" unit="tonne" value={DWT} onChange={setDWT} />
          <NumberField label="Displacement tonnage $W$" unit="tonne" value={Wship} onChange={setWship} hint="empty weight + cargo / ballast (Art. 3.14.7)" />
          <NumberField label="Length overall $LOA$" unit="ft" value={LOA} onChange={setLOA} />
          <NumberField label="Bow depth $D_B$" unit="ft" value={DB} onChange={setDB} />
          <NumberField label="Draft" unit="ft" value={draft} onChange={setDraft} />
          <NumberField label="Underkeel clearance" unit="ft" value={ukc} onChange={setUkc} hint="bottom of vessel to bottom of waterway" />
        </div>

        <div className="section-label">Impact velocity (Art. 3.14.6)</div>
        <div className="field-grid">
          <SelectField label="Velocity input" value={vMode} onChange={setVMode} options={['distribution (Fig. 3.14.6-1)', 'direct']} />
          {vMode === 'direct' ? (
            <NumberField label="Impact velocity $V$" unit="ft/s" value={Vdirect} onChange={setVdirect} />
          ) : (
            <>
              <NumberField label="Transit velocity $V_T$" unit="ft/s" value={VT} onChange={setVT} hint="1 knot = 1.688 ft/s" />
              <NumberField label="Min. velocity $V_{MIN}$" unit="ft/s" value={Vmin} onChange={setVmin} hint="$\ge$ yearly mean current velocity" />
              <NumberField label="Pier distance $x$ from transit path ℄" unit="ft" value={xDist} onChange={setXDist} />
              <NumberField label="Channel edge distance $x_C$" unit="ft" value={xc} onChange={setXc} />
            </>
          )}
        </div>

        <div className="section-label">Superstructure exposure (Art. 3.14.10)</div>
        <div className="field-grid">
          <NumberField label="Exposed superstructure depth $h_{exp}$" unit="ft" value={hExp} onChange={setHExp} hint="vertical overlap of bow and superstructure; 0 if clear" />
        </div>
      </section>

      {res ? (
        <>
          <div className="result-grid">
            <ResultCard label="Ship impact force on pier $P_S$" value={res.ship.PS} unit="kip" refText="Eq. 3.14.8-1" accent />
            <ResultCard label="Collision energy $KE$" value={res.ship.KE} unit="kip·ft" refText="Eq. 3.14.7-1" />
            <ResultCard label="Bow damage length $a_S$" value={res.ship.aS} unit="ft" refText="Eq. 3.14.9-1" />
            <ResultCard label="Impact velocity $V$" value={res.vel.V} unit="ft/s" refText="Fig. 3.14.6-1" />
          </div>

          <section className="results-card">
            <div className="results-head">
              <Ship size={18} />
              <div>
                <h3>Definition Diagram</h3>
                <p>
                  The concentrated force acts at the mean high water level for
                  overall stability; the local force is a line load over the bow
                  depth (Figs. 3.14.14.1-1 and 3.14.14.1-2).
                </p>
              </div>
            </div>
            <Figure svg={shipImpactFigure(figData)} />
          </section>

          <section className="results-card">
            <div className="results-head">
              <div>
                <h3>Pier Design Forces (Arts. 3.14.7–3.14.9, 3.14.14.1)</h3>
                <p><TexText text="100% of $P_S$ parallel to the channel centerline, or 50% normal to it, applied separately." /></p>
              </div>
            </div>
            <MathValues
              items={[
                mvtex('P_S', res.ship.PS, 'kip'),
                mvtex('0.5\\,P_S', 0.5 * res.ship.PS, 'kip'),
                mvtex('KE', res.ship.KE, 'kip·ft'),
                mvtex('a_S', res.ship.aS, 'ft'),
              ]}
            />
            {res.vel.steps.length ? <MathStepList steps={res.vel.steps} title="Design collision velocity (Art. 3.14.6)" /> : null}
            <MathStepList steps={res.ch.steps} title="Hydrodynamic mass coefficient (Art. 3.14.7)" />
            <MathStepList steps={res.ship.steps} title="Collision energy, impact force, and bow damage" />
            <MathStepList steps={res.ship.app} title="Application of impact force (Art. 3.14.14.1)" />
          </section>

          <section className="results-card">
            <div className="results-head">
              <div>
                <h3>Superstructure Design Forces (Art. 3.14.10)</h3>
                <p>Bow, deck house, and mast collision on exposed superstructure components.</p>
              </div>
            </div>
            <MathValues
              items={[
                mvtex('P_{BH}', res.ship.PBH, 'kip'),
                mvtex('P_{DH}', res.ship.PDH, 'kip'),
                mvtex('P_{MT}', res.ship.PMT, 'kip'),
              ]}
            />
            <MathStepList steps={res.ship.sup} title="Derivation" />
          </section>

          <section className="results-card">
            <div className="results-head">
              <div>
                <h3>Minimum Design Impact (Art. 3.14.1)</h3>
                <p><TexText text="An empty hopper barge drifting at the yearly mean current ($V_{MIN}$) sets a floor on the substructure design force. The governing force is the larger of the computed ship impact and this minimum. Where a deep-draft span has insufficient clearance, the minimum superstructure impact is the mast collision force $P_{MT}$ (Art. 3.14.10.3)." />
                </p>
              </div>
            </div>
            <MathValues
              items={[
                mvtex('P_{min}', res.min.PBmin, 'kip'),
                mvtex('P_{design}=\\max(P_S,P_{min})', Math.max(res.ship.PS, res.min.PBmin), 'kip'),
              ]}
            />
            <Verdict
              pass={res.ship.PS >= res.min.PBmin}
              label={res.ship.PS >= res.min.PBmin
                ? `Computed impact governs:  $P_S = ${fmt(res.ship.PS)}$ kip $\\ge P_{min} = ${fmt(res.min.PBmin)}$ kip`
                : `Minimum governs, design for  $P_{min} = ${fmt(res.min.PBmin)}$ kip $> P_S = ${fmt(res.ship.PS)}$ kip`}
            />
            <MathStepList steps={res.min.steps} title="Minimum drifting-barge impact (Art. 3.14.1)" />
          </section>

          <ReportCard
            module="ship"
            onGenerate={(opts) =>
              generateVesselImpactPdf({ module: 'ship', inp, res, ...opts })
            }
          />
        </>
      ) : (
        <div className="status-banner"><TexText text="Enter a valid vessel ($DWT$, $W$ and velocity greater than zero) to compute forces." /></div>
      )}
    </>
  )
}
