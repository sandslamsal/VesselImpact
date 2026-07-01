/* eslint-disable react-refresh/only-export-components */
// Shared UI helpers for the VesselImpactX modules.

export const num = (v, fallback = 0) => {
  const p = Number.parseFloat(v)
  return Number.isFinite(p) ? p : fallback
}

// Format a numeric value for display with sensible precision.
export function fmt(v, digits = 2) {
  if (!Number.isFinite(v)) return '—'
  const a = Math.abs(v)
  if (a !== 0 && (a < 0.001 || a >= 1e6)) return v.toExponential(2)
  return v.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function NumberField({ label, unit, value, onChange, step = 'any', min, disabled = false, hint }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {unit ? <span className="field-unit"> ({unit})</span> : null}
      </span>
      <input
        className="field-input"
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}

// A number field with an "auto" toggle: when auto is on, the field shows a
// computed value and is read-only; turning it off lets the user override.
export function AutoNumberField({ label, unit, value, onChange, auto, onAuto, computed }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {unit ? <span className="field-unit"> ({unit})</span> : null}
        <label className="auto-toggle">
          <input type="checkbox" checked={auto} onChange={(e) => onAuto(e.target.checked)} />
          <span>auto</span>
        </label>
      </span>
      <input
        className="field-input"
        type="number"
        value={auto ? Number((computed || 0).toFixed(2)) : value}
        onChange={(e) => onChange(e.target.value)}
        disabled={auto}
      />
    </label>
  )
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
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

// A headline result card: label, value, unit, and the governing reference.
export function ResultCard({ label, value, unit, refText, accent, digits = 2 }) {
  return (
    <div className={`result-card ${accent ? 'result-card-accent' : ''}`}>
      <span className="result-card-label">{label}</span>
      <span className="result-card-value">
        {fmt(value, digits)}
        {unit ? <span className="result-card-unit"> {unit}</span> : null}
      </span>
      {refText ? <span className="result-card-ref">{refText}</span> : null}
    </div>
  )
}

// Pass/fail verdict chip for the risk-acceptance check.
export function Verdict({ pass, label }) {
  return (
    <span className={`verdict ${pass ? 'verdict-pass' : 'verdict-fail'}`}>
      {pass ? '✓' : '✗'} {label}
    </span>
  )
}
