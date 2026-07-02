/* eslint-disable react-refresh/only-export-components */
// LaTeX math rendering for VesselImpact, powered by KaTeX.
import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { fmt } from '../utils/format.js'

export function Math({ tex, display = false }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: false })
    } catch {
      return `<span class="math-error">${tex}</span>`
    }
  }, [tex, display])
  return <span className={display ? 'math-block' : 'math-inline'} dangerouslySetInnerHTML={{ __html: html }} />
}

// Render a text string with inline $...$ LaTeX segments, so labels, hints,
// and descriptions can carry AASHTO notation (e.g. 'Transit velocity $V_T$').
export function TexText({ text }) {
  const parts = String(text).split(/\$([^$]+)\$/g)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <Math key={i} tex={p} /> : p ? <span key={i}>{p}</span> : null,
      )}
    </>
  )
}

// Format a value for LaTeX math (thousands separators, scientific notation).
// Small values keep 4 significant digits instead of rounding to 0.00.
export function numTex(v) {
  const a = v < 0 ? -v : v // the local Math component shadows globalThis.Math here
  if (Number.isFinite(v) && v !== 0 && a < 1 && a >= 0.001) {
    return String(Number(v.toPrecision(4)))
  }
  const s = fmt(v)
  if (s.includes('e')) {
    const [m, e] = s.split('e')
    return `${m}\\times10^{${Number(e)}}`
  }
  return s.replace(/,/g, '{,}')
}

export function unitTex(unit) {
  if (!unit) return ''
  return unit
    .replace(/·/g, '{\\cdot}')
    .replace(/²/g, '^{2}')
    .replace(/³/g, '^{3}')
    .replace(/\^2/g, '^{2}')
    .replace(/\^3/g, '^{3}')
    .replace(/%/g, '\\%')
    .replace(/°/g, '^{\\circ}')
}

// Build the full "symbol = formula = substituted = result" chain in LaTeX.
export function stepChain(step) {
  const u = unitTex(step.unit)
  const resultTex = `\\boxed{\\,${numTex(step.value)}${u ? `\\;\\mathrm{${u}}` : ''}\\,}`
  const lines = [step.latex]
  if (step.subs) lines.push(`&= ${step.subs}`)
  lines.push(`&= ${resultTex}`)
  return `\\begin{aligned}${lines.join('\\\\[2pt]')}\\end{aligned}`
}

// One derivation line: reference badge + description, then the aligned equation.
export function MathStep({ step, index }) {
  return (
    <li className="mathstep">
      <div className="mathstep-head">
        {index != null ? <span className="mathstep-num">{index}</span> : null}
        <span className="mathstep-ref">{step.ref}</span>
        <span className="mathstep-label">{step.label}</span>
      </div>
      <div className="mathstep-eq">
        <Math tex={stepChain(step)} display />
      </div>
    </li>
  )
}

// one "symbol = value unit" LaTeX string
export function mvtex(sym, val, unit) {
  const u = unitTex(unit)
  return `${sym} = ${numTex(val)}${u ? `\\;\\mathrm{${u}}` : ''}`
}

// line-by-line math values (engineering-calc style, no boxes)
export function MathValues({ items }) {
  return (
    <div className="mathvalues">
      {items.map((it, i) => (
        <span className="mathvalue" key={i}>
          <Math tex={it} />
        </span>
      ))}
    </div>
  )
}

export function MathStepList({ steps, title }) {
  if (!steps || steps.length === 0) return null
  return (
    <div className="mathsteps">
      {title ? <h4 className="mathsteps-title">{title}</h4> : null}
      <ol className="mathsteps-list">
        {steps.map((s, i) => (
          <MathStep key={`${s.ref}-${i}`} step={s} index={i + 1} />
        ))}
      </ol>
    </div>
  )
}
