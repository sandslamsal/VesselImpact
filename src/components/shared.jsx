/* eslint-disable react-refresh/only-export-components */
// Shared UI helpers for the VesselImpact modules.
//
// Labels, hints, units, and descriptions all accept inline $...$ LaTeX so the
// interface reads in AASHTO notation (e.g. label="Transit velocity $V_T$").
// Units are rendered upright (roman) inside the input as an adornment.

import { TexText, Math as MathTex, unitTex } from './mathview.jsx'
import { fmt } from '../utils/format.js'
export { num, fmt } from '../utils/format.js'

function UnitBadge({ unit }) {
  if (!unit) return null
  return (
    <span className="input-unit" aria-hidden="true">
      <MathTex tex={`\\mathrm{${unitTex(unit)}}`} />
    </span>
  )
}

export function NumberField({ label, unit, value, onChange, step = 'any', min, disabled = false, hint }) {
  return (
    <label className="field">
      <span className="field-label">
        <TexText text={label} />
      </span>
      <span className="input-wrap">
        <input
          className={`field-input ${unit ? 'field-input-adorned' : ''}`}
          type="number"
          step={step}
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <UnitBadge unit={unit} />
      </span>
      {hint ? (
        <span className="field-hint">
          <TexText text={hint} />
        </span>
      ) : null}
    </label>
  )
}

// A number field with an "auto" toggle: when auto is on, the field shows a
// computed value and is read-only; turning it off lets the user override.
export function AutoNumberField({ label, unit, value, onChange, auto, onAuto, computed }) {
  return (
    <label className="field">
      <span className="field-label">
        <TexText text={label} />
        <label className="auto-toggle">
          <input type="checkbox" checked={auto} onChange={(e) => onAuto(e.target.checked)} />
          <span>auto</span>
        </label>
      </span>
      <span className="input-wrap">
        <input
          className={`field-input ${unit ? 'field-input-adorned' : ''}`}
          type="number"
          value={auto ? Number((computed || 0).toFixed(2)) : value}
          onChange={(e) => onChange(e.target.value)}
          disabled={auto}
        />
        <UnitBadge unit={unit} />
      </span>
    </label>
  )
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span className="field-label">
        <TexText text={label} />
      </span>
      <select
        className="field-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

// A headline result card: label (with LaTeX), value, unit, and the governing
// clause reference.
export function ResultCard({ label, value, unit, refText, accent, digits = 2 }) {
  return (
    <div className={`result-card ${accent ? 'result-card-accent' : ''}`}>
      <span className="result-card-label">
        <TexText text={label} />
      </span>
      <span className="result-card-value">
        {fmt(value, digits)}
        {unit ? (
          <span className="result-card-unit">
            {' '}
            <MathTex tex={`\\mathrm{${unitTex(unit)}}`} />
          </span>
        ) : null}
      </span>
      {refText ? <span className="result-card-ref">{refText}</span> : null}
    </div>
  )
}

// Pass/fail verdict chip for the risk-acceptance check.
export function Verdict({ pass, label }) {
  return (
    <span className={`verdict ${pass ? 'verdict-pass' : 'verdict-fail'}`}>
      <span className="verdict-mark">{pass ? '✓' : '✗'}</span>
      <TexText text={label} />
    </span>
  )
}
