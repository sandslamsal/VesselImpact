import { useMemo, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { annualFrequency, designVelocity, DENSITY_OPTIONS, REGION_OPTIONS } from '../utils/vesselCollision.js'
import { num, NumberField, ResultCard, SelectField, Verdict, fmt } from './shared.jsx'
import { MathStepList, MathValues, mvtex } from './mathview.jsx'
import { Figure } from './figview.jsx'
import { riskFigure } from '../utils/figures.js'
import { generateVesselImpactPdf } from '../utils/vesselImpactPdf.js'
import { ReportCard } from './ReportCard.jsx'

export function RiskAnalysis() {
  // traffic
  const [vesselType, setVesselType] = useState('ship')
  const [N, setN] = useState('4000')
  // aberrancy
  const [region, setRegion] = useState('straight')
  const [theta, setTheta] = useState('0')
  const [Vc, setVc] = useState('1.5')
  const [Vxc, setVxc] = useState('0.2')
  const [density, setDensity] = useState('average')
  // geometry
  const [xDist, setXDist] = useState('250')
  const [LOA, setLOA] = useState('650')
  const [BM, setBM] = useState('90')
  const [BP, setBP] = useState('30')
  const [xc, setXc] = useState('400')
  // collapse + protection
  const [H, setH] = useState('3000')
  const [P, setP] = useState('4500')
  const [protectPct, setProtectPct] = useState('0')
  // velocity inset context
  const [VT, setVT] = useState('16.9')
  const [Vmin, setVmin] = useState('3.4')

  const inp = {
    vesselType, N: num(N), region, theta: num(theta), Vc: num(Vc),
    Vxc: num(Vxc), density, x: num(xDist), LOA: num(LOA), BM: num(BM),
    BP: num(BP), H: num(H), P: num(P), protectPct: num(protectPct),
    xc: num(xc), VT: num(VT), Vmin: num(Vmin),
  }
  const inpKey = JSON.stringify(inp)
  const res = useMemo(() => {
    try {
      if (!(inp.N > 0) || !(inp.LOA > 0)) return null
      return annualFrequency(inp)
    } catch {
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inpKey])

  const vel = useMemo(
    () => designVelocity({ VT: inp.VT, Vmin: inp.Vmin, x: inp.x, xc: inp.xc, LOA: inp.LOA }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inpKey],
  )

  const figData = res
    ? {
        x: inp.x, LOA: inp.LOA, BM: inp.BM, BP: inp.BP, xc: inp.xc,
        halfZone: res.halfZone, PG: res.PG, VT: inp.VT, Vmin: inp.Vmin, V: vel.V,
      }
    : null

  return (
    <>
      <section className="toolbar-card">
        <div className="results-head">
          <BarChart3 size={18} />
          <div>
            <h3>Annual Frequency of Collapse — Method II</h3>
            <p>
              Probability-based risk analysis per AASHTO LRFD Article 3.14.5:
              AF = N·PA·PG·PC·PF for one vessel classification striking one
              bridge component. Sum AF over all vessel classes and components
              and compare with 0.001 for typical bridges or 0.0001 for critical
              or essential bridges.
            </p>
          </div>
        </div>

        <div className="section-label">Vessel traffic</div>
        <div className="field-grid">
          <SelectField label="Vessel type" value={vesselType} onChange={setVesselType} options={['ship', 'barge']} />
          <NumberField label="Annual transits N (this class)" unit="/yr" value={N} onChange={setN} />
          <NumberField label="Length overall LOA" unit="ft" value={LOA} onChange={setLOA} hint="barge tows: total tow + tug (C3.14.5.3)" />
          <NumberField label="Vessel beam B_M" unit="ft" value={BM} onChange={setBM} />
        </div>

        <div className="section-label">Probability of aberrancy (Art. 3.14.5.2.3)</div>
        <div className="field-grid">
          <SelectField label="Waterway region at bridge" value={region} onChange={setRegion} options={REGION_OPTIONS} />
          {region !== 'straight' ? (
            <NumberField label="Turn / bend angle θ" unit="deg" value={theta} onChange={setTheta} />
          ) : null}
          <NumberField label="Parallel current V_C" unit="knots" value={Vc} onChange={setVc} />
          <NumberField label="Cross-current V_XC" unit="knots" value={Vxc} onChange={setVxc} />
          <SelectField label="Vessel traffic density" value={density} onChange={setDensity} options={DENSITY_OPTIONS} />
        </div>

        <div className="section-label">Geometry (Art. 3.14.5.3) & collapse (Art. 3.14.5.4)</div>
        <div className="field-grid">
          <NumberField label="Pier distance x from transit path ℄" unit="ft" value={xDist} onChange={setXDist} />
          <NumberField label="Pier width B_P" unit="ft" value={BP} onChange={setBP} />
          <NumberField label="Channel edge distance x_C" unit="ft" value={xc} onChange={setXc} hint="for the velocity-distribution inset" />
          <NumberField label="Lateral resistance H (pier or span)" unit="kip" value={H} onChange={setH} />
          <NumberField label="Vessel impact force P" unit="kip" value={P} onChange={setP} hint="P_S, P_BH, P_DH, or P_MT from the force tabs" />
          <NumberField label="Protection provided" unit="%" value={protectPct} onChange={setProtectPct} hint="dolphins, islands, land masses (Art. 3.14.5.5)" />
        </div>

        <div className="section-label">Velocity context for the diagram (Art. 3.14.6)</div>
        <div className="field-grid">
          <NumberField label="Transit velocity V_T" unit="ft/s" value={VT} onChange={setVT} />
          <NumberField label="Min. velocity V_MIN" unit="ft/s" value={Vmin} onChange={setVmin} />
        </div>
      </section>

      {res ? (
        <>
          <div className="result-grid">
            <ResultCard label="Annual frequency of collapse AF" value={res.AF} unit="/yr" refText="Eq. 3.14.5-1" accent digits={6} />
            <ResultCard label="Return period 1/AF" value={res.RP} unit="yr" refText="C3.14.5" digits={0} />
            <ResultCard label="Probability of aberrancy PA" value={res.PA} unit="" refText="Eq. 3.14.5.2.3-1" digits={6} />
            <ResultCard label="Geometric probability PG" value={res.PG} unit="" refText="Fig. 3.14.5.3-1" digits={4} />
            <ResultCard label="Probability of collapse PC" value={res.PC} unit="" refText="Art. 3.14.5.4" digits={4} />
          </div>

          <div className="status-banner verdict-banner">
            <Verdict pass={res.passTypical} label={`Typical bridge:  AF ${res.passTypical ? '≤' : '>'} 0.001  (AF = ${fmt(res.AF, 6)})`} />
            <Verdict pass={res.passCritical} label={`Critical / essential bridge:  AF ${res.passCritical ? '≤' : '>'} 0.0001`} />
            <span className="verdict-note">
              Acceptance applies to the AF summed over all vessel classes and
              exposed components (Art. 3.14.5) — this result is for one
              component and one vessel class.
            </span>
          </div>

          <section className="results-card">
            <div className="results-head">
              <BarChart3 size={18} />
              <div>
                <h3>Definition Diagram</h3>
                <p>
                  Normal distribution of the aberrant sailing path (σ = LOA)
                  with the geometric-probability area across the impact zone,
                  and the design collision velocity distribution.
                </p>
              </div>
            </div>
            <Figure svg={riskFigure(figData)} />
          </section>

          <section className="results-card">
            <div className="results-head">
              <div>
                <h3>Derivation (Art. 3.14.5)</h3>
                <p>Method II approximate procedure with all correction factors cited.</p>
              </div>
            </div>
            <MathValues
              items={[
                mvtex('PA', res.PA, ''),
                mvtex('PG', res.PG, ''),
                mvtex('PC', res.PC, ''),
                mvtex('PF', res.PF, ''),
                mvtex('AF', res.AF, '/yr'),
              ]}
            />
            <MathStepList steps={res.paSteps} title="Probability of aberrancy (Art. 3.14.5.2.3)" />
            <MathStepList steps={res.pgSteps} title="Geometric probability (Art. 3.14.5.3)" />
            <MathStepList steps={res.pcSteps} title="Probability of collapse (Art. 3.14.5.4)" />
            <MathStepList steps={res.pfSteps} title="Protection factor (Art. 3.14.5.5)" />
            <MathStepList steps={res.afSteps} title="Annual frequency of collapse (Eq. 3.14.5-1)" />
          </section>

          <ReportCard
            module="risk"
            onGenerate={(opts) =>
              generateVesselImpactPdf({ module: 'risk', inp, res: { ...res, V: vel.V }, ...opts })
            }
          />
        </>
      ) : (
        <div className="status-banner">Enter valid traffic and geometry (N and LOA greater than zero) to compute the annual frequency.</div>
      )}
    </>
  )
}
