// Numeric parsing/formatting shared by the UI, math renderer, and PDF report.

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
